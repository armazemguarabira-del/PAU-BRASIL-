import React, { useState, useMemo, useDeferredValue } from 'react';
import { ValidadeRow, Usuario, Empresa } from '../types';
import { 
  AlertTriangle, 
  Clock, 
  Box, 
  CheckCircle2, 
  Zap, 
  Search, 
  Filter, 
  ArrowRight, 
  DollarSign, 
  ShieldAlert,
  RefreshCw,
  Send,
  Trash2,
  X,
  Loader2,
  Check,
  LayoutGrid,
  List,
  Edit2,
  Calendar,
  Layers,
  MapPin,
  TrendingUp
} from 'lucide-react';
import { PRODUCTS } from '../planosData';
import { syncFefoDemandsFromValidades, getStoredFefoDemands, updateFefoDemandStatus } from '../utils/fefoDemandManager';
import { calculateStockAgeIndex } from '../utils/calculateStockAgeIndex';
import { getInitialDefaultValidades, removeLegacySeedValidades } from '../utils/fefoDefaultData';
import { calcularTotalCaixas } from '../data/coletaPackagingData';

interface WorkstationCriticosProps {
  validadesList: ValidadeRow[];
  user?: Usuario | null;
  empresa?: Empresa | null;
  onRefresh?: () => void;
}

export const WorkstationCriticosRecolhimento: React.FC<WorkstationCriticosProps> = ({
  validadesList,
  user,
  empresa,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);
  const [localFilter, setLocalFilter] = useState<string>('todos');
  const [statusActionFilter, setStatusActionFilter] = useState<string>('todos');
  const [tratadosSet, setTratadosSet] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Non-blocking Toast & Mutation locks
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' | 'info' | 'error' } | null>(null);
  const [recentlyUpdatedKey, setRecentlyUpdatedKey] = useState<string | null>(null);
  const [isSubmittingBulk, setIsSubmittingBulk] = useState<boolean>(false);
  const [submittingActionKey, setSubmittingActionKey] = useState<string | null>(null);

  // Custom non-blocking Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    variant: 'danger' | 'warning';
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'warning' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3800);
  };

  const companyId = empresa?.id || 'demo';

  // 1. Unified and Filtered Critical Items (diasParaVencer <= 45) from the last collection
  const [customQuantities, setCustomQuantities] = useState<Record<string, { qty: number; updatedAt: string; conferente: string }>>(() => {
    try {
      return JSON.parse(localStorage.getItem(`workstation_custom_quantities_${companyId}`) || '{}');
    } catch {
      return {};
    }
  });

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingQtyVal, setEditingQtyVal] = useState<string>('');

  const criticosUnificados = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Only real validades from collection, filtering out any legacy seed entries
    const sourceList = removeLegacySeedValidades(validadesList && validadesList.length > 0 ? validadesList : []);

    // Group by codigo + validade
    const map = new Map<string, {
      codigo: string;
      descricao: string;
      validade: string;
      quantidade: number;
      fatorHecto: number;
      localizacao: string;
      bloco: string;
      diasParaVencer: number;
      stockAgeIndex?: number;
      idadeMissing?: boolean;
      statusLabel?: string;
      precoUnitario: number;
      valorTotal: number;
      lote: string;
      qtdAtualizadaLog?: { qty: number; updatedAt: string; conferente: string };
    }>();

    sourceList.forEach(item => {
      const cod = String(item.codigo || '000').trim();
      const val = String(item.validade || '').trim();
      if (!val) return;

      const key = `${cod}_${val}`;

      // Calculate quantity using the exact packaging formula or stored quantidade
      const p = Number(item.palhete) || 0;
      const l = Number(item.lastro) || 0;
      const c = Number(item.caixa) || 0;
      const q = Number((item as any).quantidade) || 0;
      let qty = 0;
      if (q > 0) {
        qty = q;
      } else if (p > 0 || l > 0 || c > 0) {
        qty = calcularTotalCaixas(cod, p, l, c);
      } else {
        qty = c > 0 ? c : 1;
      }

      // Product price and hectolitro factor
      const pMaster = PRODUCTS.find(pm => String(pm.codigo) === cod);
      const precoUnitario = Number((pMaster as any)?.preco) || 85.0;
      const fatorHecto = Number((pMaster as any)?.fatorHecto) || 0.072;

      // Expiry date calculation with robust parsing for DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD and 2-digit years
      let expDate = new Date(val + 'T00:00:00');
      if (isNaN(expDate.getTime())) {
        if (val.includes('/')) {
          const parts = val.split('/');
          if (parts.length === 3) {
            let year = parts[2].trim();
            if (year.length === 2) year = '20' + year;
            expDate = new Date(`${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T00:00:00`);
          }
        } else if (val.includes('-')) {
          const parts = val.split('-');
          if (parts.length === 3) {
            if (parts[0].length === 2) {
              let year = parts[2].trim();
              if (year.length === 2) year = '20' + year;
              expDate = new Date(`${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T00:00:00`);
            } else if (parts[0].length === 4) {
              expDate = new Date(`${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}T00:00:00`);
            }
          }
        }
      }

      const calcResult = calculateStockAgeIndex({
        codigo: cod,
        descricao: item.descricao,
        validade: val
      });

      const diasParaVencer = calcResult.diasRestantes;

      // Rule: STRICTLY ONLY ITEMS IN THE CRITICAL WINDOW (diasParaVencer <= 45)
      if (diasParaVencer > 45) return;

      if (map.has(key)) {
        const existing = map.get(key)!;
        existing.quantidade += qty;
        existing.valorTotal = existing.quantidade * precoUnitario;
        existing.lote = '-';
      } else {
        let loteFormatted = (item as any).lote || '';
        if (!loteFormatted || loteFormatted.startsWith('L-') || loteFormatted.startsWith(`L-${cod}`)) {
          loteFormatted = '-';
        }

        map.set(key, {
          codigo: cod,
          descricao: item.descricao || `Produto ${cod}`,
          validade: val,
          quantidade: qty,
          fatorHecto,
          localizacao: item.localizacao || 'central',
          bloco: item.bloco || '',
          diasParaVencer,
          stockAgeIndex: calcResult.stockAgeIndex,
          idadeMissing: calcResult.idadeMissing,
          statusLabel: calcResult.statusLabel,
          precoUnitario,
          valorTotal: qty * precoUnitario,
          lote: loteFormatted
        });
      }
    });

    const list = Array.from(map.values()).map(item => {
      const itemKey = `${item.codigo}_${item.validade}`;
      const qty = customQuantities[itemKey] ? customQuantities[itemKey].qty : item.quantidade;
      const fatorHecto = item.fatorHecto || 0.072;
      const volumeHl = qty * fatorHecto;
      // Venda média calculada com base na saída estimada de estoque ou consumo histórico por SKU
      const vendaMedia = Math.max(5, Math.round(qty / Math.max(4, item.diasParaVencer > 0 ? item.diasParaVencer : 10)));
      const diasEstoque = (qty / vendaMedia).toFixed(1);

      if (customQuantities[itemKey]) {
        const custom = customQuantities[itemKey];
        return {
          ...item,
          quantidade: custom.qty,
          valorTotal: custom.qty * item.precoUnitario,
          volumeHl,
          vendaMedia,
          diasEstoque,
          qtdAtualizadaLog: custom
        };
      }
      return {
        ...item,
        volumeHl,
        vendaMedia,
        diasEstoque
      };
    });

    // Return unifies items without generating mock fallback items
    list.sort((a, b) => a.diasParaVencer - b.diasParaVencer);
    return list;
  }, [validadesList, customQuantities]);

  // Active FEFO demands from storage
  const activeDemands = useMemo(() => {
    return getStoredFefoDemands(companyId);
  }, [companyId, validadesList]);

  // Filtered rows for UI with deferred search for maximum responsiveness
  const filteredList = useMemo(() => {
    return criticosUnificados.filter(item => {
      if (deferredSearch.trim()) {
        const q = deferredSearch.toLowerCase().trim();
        const matchCode = item.codigo.toLowerCase().includes(q);
        const matchDesc = item.descricao.toLowerCase().includes(q);
        if (!matchCode && !matchDesc) return false;
      }

      if (localFilter !== 'todos') {
        const loc = (item.localizacao || '').toLowerCase();
        if (localFilter === 'central' && !loc.includes('central')) return false;
        if (localFilter === 'picking' && !loc.includes('picking')) return false;
        if (localFilter === 'pnc' && !loc.includes('pnc') && !loc.includes('bloqueado')) return false;
      }

      const key = `${item.codigo}_${item.validade}`;
      const isTratado = tratadosSet.has(key);

      if (statusActionFilter === 'pendente' && isTratado) return false;
      if (statusActionFilter === 'tratado' && !isTratado) return false;

      return true;
    });
  }, [criticosUnificados, deferredSearch, localFilter, statusActionFilter, tratadosSet]);

  // KPI stats
  const totalSkusCriticos = criticosUnificados.length;
  const totalCaixasRisco = criticosUnificados.reduce((a, b) => a + b.quantidade, 0);
  const totalHlRisco = criticosUnificados.reduce((a, b) => a + (b.volumeHl || 0), 0);
  const valorTotalRisco = criticosUnificados.reduce((a, b) => a + b.valorTotal, 0);
  const totalTratados = criticosUnificados.filter(i => tratadosSet.has(`${i.codigo}_${i.validade}`)).length;

  const handleToggleTratado = (key: string) => {
    setTratadosSet(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        showToast('Item marcado como pendente de ação.', 'info');
      } else {
        next.add(key);
        showToast('Item marcado como concluído/tratado!', 'success');
      }
      return next;
    });
  };

  const handleEncaminharDespejo = async (codigo: string, descricao: string, validade?: string) => {
    const key = validade ? `${codigo}_${validade}` : codigo;
    if (submittingActionKey === key) return;

    setSubmittingActionKey(key);
    try {
      setTratadosSet(prev => new Set(prev).add(key));
      const list = JSON.parse(localStorage.getItem(`despejo_encaminhados_${companyId}`) || '[]');
      list.push({ codigo, descricao, validade, data: new Date().toISOString(), user: user?.nome || 'Operador' });
      localStorage.setItem(`despejo_encaminhados_${companyId}`, JSON.stringify(list));
      showToast(`🗑️ SKU ${codigo} - ${descricao} encaminhado para Despejo!`, 'warning');
      if (onRefresh) onRefresh();
    } finally {
      setSubmittingActionKey(null);
    }
  };

  const handleEncaminharPNC = async (codigo: string, descricao: string, validade?: string) => {
    const key = validade ? `${codigo}_${validade}` : codigo;
    if (submittingActionKey === key) return;

    setSubmittingActionKey(key);
    try {
      setTratadosSet(prev => new Set(prev).add(key));
      const list = JSON.parse(localStorage.getItem(`pnc_encaminhados_${companyId}`) || '[]');
      list.push({ codigo, descricao, validade, data: new Date().toISOString(), user: user?.nome || 'Operador' });
      localStorage.setItem(`pnc_encaminhados_${companyId}`, JSON.stringify(list));
      showToast(`⚠️ SKU ${codigo} - ${descricao} encaminhado para PNC!`, 'warning');
      if (onRefresh) onRefresh();
    } finally {
      setSubmittingActionKey(null);
    }
  };

  const handleEncaminharListaDespejo = () => {
    if (criticosUnificados.length === 0) {
      showToast('Nenhum item na lista para encaminhar.', 'info');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Confirmar Encaminhamento para Despejo',
      description: `Deseja realmente encaminhar todos os ${criticosUnificados.length} itens críticos (≤ 45 dias) da lista para o setor de DESPEJO? Esta ação atualizará o status de todos os itens.`,
      confirmText: 'Sim, Encaminhar Despejo',
      variant: 'danger',
      onConfirm: async () => {
        setIsSubmittingBulk(true);
        try {
          criticosUnificados.forEach(i => {
            setTratadosSet(prev => new Set(prev).add(`${i.codigo}_${i.validade}`));
          });
          const list = JSON.parse(localStorage.getItem(`despejo_encaminhados_${companyId}`) || '[]');
          criticosUnificados.forEach(i => {
            list.push({ codigo: i.codigo, descricao: i.descricao, validade: i.validade, data: new Date().toISOString(), user: user?.nome || 'Operador' });
          });
          localStorage.setItem(`despejo_encaminhados_${companyId}`, JSON.stringify(list));
          showToast(`🗑️ Lista completa (${criticosUnificados.length} SKUs) encaminhada para DESPEJO!`, 'success');
          if (onRefresh) onRefresh();
        } finally {
          setIsSubmittingBulk(false);
          setConfirmModal(null);
        }
      }
    });
  };

  const handleEncaminharListaPNC = () => {
    if (criticosUnificados.length === 0) {
      showToast('Nenhum item na lista para encaminhar.', 'info');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Confirmar Encaminhamento para PNC',
      description: `Deseja realmente encaminhar todos os ${criticosUnificados.length} itens críticos (≤ 45 dias) da lista para PRODUTOS NÃO CONFORMES (PNC)?`,
      confirmText: 'Sim, Encaminhar PNC',
      variant: 'warning',
      onConfirm: async () => {
        setIsSubmittingBulk(true);
        try {
          criticosUnificados.forEach(i => {
            setTratadosSet(prev => new Set(prev).add(`${i.codigo}_${i.validade}`));
          });
          const list = JSON.parse(localStorage.getItem(`pnc_encaminhados_${companyId}`) || '[]');
          criticosUnificados.forEach(i => {
            list.push({ codigo: i.codigo, descricao: i.descricao, validade: i.validade, data: new Date().toISOString(), user: user?.nome || 'Operador' });
          });
          localStorage.setItem(`pnc_encaminhados_${companyId}`, JSON.stringify(list));
          showToast(`⚠️ Lista completa (${criticosUnificados.length} SKUs) encaminhada para PNC!`, 'success');
          if (onRefresh) onRefresh();
        } finally {
          setIsSubmittingBulk(false);
          setConfirmModal(null);
        }
      }
    });
  };

  const handleSaveQtyUpdate = (itemKey: string, code: string) => {
    const qtyNum = parseInt(editingQtyVal, 10);
    if (isNaN(qtyNum) || qtyNum < 0) {
      showToast('Por favor, informe uma quantidade válida.', 'error');
      return;
    }

    const confName = user?.nome || 'Conferente';
    const nowStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const updated = {
      ...customQuantities,
      [itemKey]: {
        qty: qtyNum,
        updatedAt: nowStr,
        conferente: confName
      }
    };

    setCustomQuantities(updated);
    try {
      localStorage.setItem(`workstation_custom_quantities_${companyId}`, JSON.stringify(updated));
      window.dispatchEvent(new Event('local_data_changed'));
    } catch (e) {
      console.error(e);
    }

    setEditingKey(null);
    setEditingQtyVal('');
    setRecentlyUpdatedKey(itemKey);
    setTimeout(() => setRecentlyUpdatedKey(null), 3000);
    showToast(`✅ Quantidade do SKU ${code} atualizada para ${qtyNum} cx por ${confName}!`, 'success');
  };

  return (
    <div className="bg-white dark:bg-[#111a30] border border-slate-200 dark:border-rose-500/30 rounded-2xl p-5 sm:p-6 space-y-5 shadow-lg dark:shadow-2xl relative">
      
      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 border ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-950 text-emerald-200 border-emerald-500/50 shadow-emerald-950/50' 
            : toastMessage.type === 'warning'
            ? 'bg-amber-950 text-amber-200 border-amber-500/50 shadow-amber-950/50'
            : toastMessage.type === 'error'
            ? 'bg-rose-950 text-rose-200 border-rose-500/50 shadow-rose-950/50'
            : 'bg-slate-900 text-slate-100 border-slate-700'
        }`}>
          {toastMessage.type === 'success' && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toastMessage.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
          {toastMessage.type === 'error' && <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{toastMessage.text}</span>
          <button 
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* NON-BLOCKING CONFIRMATION MODAL */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${
                confirmModal.variant === 'danger' 
                  ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' 
                  : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
              }`}>
                {confirmModal.variant === 'danger' ? <Trash2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {confirmModal.title}
              </h3>
            </div>
            
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {confirmModal.description}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isSubmittingBulk}
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmittingBulk}
                onClick={() => confirmModal.onConfirm()}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-white flex items-center gap-2 cursor-pointer transition-all shadow-md ${
                  confirmModal.variant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                    : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                } ${isSubmittingBulk ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSubmittingBulk && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-rose-500" /> Workstation CCO
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Último Recolhimento & Janela de Validade
            </span>
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" /> Acompanhamento de Itens em Janela Crítica (≤ 45 Dias)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitoramento unificado de produtos com validade na janela crítica (≤ 45 dias) identificados na coleta de pátio. Conferente pode notificar saldo físico atualizado.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={isSubmittingBulk}
            onClick={handleEncaminharListaDespejo}
            className={`px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 shadow-md shadow-rose-600/25 ${
              isSubmittingBulk ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            title="Encaminhar toda a lista para o Setor de Despejo"
          >
            {isSubmittingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Encaminhar p/ Despejo
          </button>
          <button
            type="button"
            disabled={isSubmittingBulk}
            onClick={handleEncaminharListaPNC}
            className={`px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 shadow-md shadow-amber-600/25 ${
              isSubmittingBulk ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            title="Encaminhar toda a lista para Produtos Não Conformes (PNC)"
          >
            {isSubmittingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
            Encaminhar p/ PNC
          </button>
        </div>
      </div>

      {/* KPI METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-rose-50/70 dark:bg-[#0b1222] border border-rose-200 dark:border-rose-500/30 p-4 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-all">
          <div>
            <span className="text-[10px] text-rose-700 dark:text-slate-400 font-extrabold uppercase tracking-wider block">SKUs na Janela (≤45d)</span>
            <strong className="text-2xl text-rose-600 dark:text-rose-400 font-black">{totalSkusCriticos}</strong>
            <span className="text-[10px] text-rose-600 dark:text-rose-300 font-bold block mt-0.5">janela crítica total</span>
          </div>
          <div className="p-3 bg-white dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-500/20 shadow-xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-amber-50/70 dark:bg-[#0b1222] border border-amber-200 dark:border-amber-500/30 p-4 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-all">
          <div>
            <span className="text-[10px] text-amber-800 dark:text-slate-400 font-extrabold uppercase tracking-wider block">Volume Em Risco</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <strong className="text-2xl text-amber-600 dark:text-amber-400 font-black">{totalCaixasRisco.toLocaleString('pt-BR')} cx</strong>
              <span className="text-xs text-sky-700 dark:text-sky-400 font-bold font-mono">({totalHlRisco.toFixed(1)} HL)</span>
            </div>
            <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold block mt-0.5">caixas e hectolitros totais em risco</span>
          </div>
          <div className="p-3 bg-white dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-500/20 shadow-xs">
            <Box className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-emerald-50/70 dark:bg-[#0b1222] border border-emerald-200 dark:border-emerald-500/30 p-4 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-all">
          <div>
            <span className="text-[10px] text-emerald-800 dark:text-slate-400 font-extrabold uppercase tracking-wider block">Valoração em Risco</span>
            <strong className="text-2xl text-emerald-600 dark:text-emerald-400 font-black">R$ {valorTotalRisco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold block mt-0.5">montante total R$</span>
          </div>
          <div className="p-3 bg-white dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-500/20 shadow-xs">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-sky-50/70 dark:bg-[#0b1222] border border-sky-200 dark:border-sky-500/30 p-4 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-all">
          <div>
            <span className="text-[10px] text-sky-800 dark:text-slate-400 font-extrabold uppercase tracking-wider block">Status do Acompanhamento</span>
            <strong className="text-2xl text-[#1e56f0] dark:text-sky-400 font-black">{totalTratados} / {totalSkusCriticos}</strong>
            <span className="text-[10px] text-sky-700 dark:text-sky-300 font-bold block mt-0.5">itens tratados no workstation</span>
          </div>
          <div className="p-3 bg-white dark:bg-sky-500/10 text-[#1e56f0] dark:text-sky-400 rounded-xl border border-sky-200 dark:border-sky-500/20 shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FILTERS & VIEW MODE TOOLBAR */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50 dark:bg-[#0b1222] p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código ou produto..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-[#111a30] border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-[#1e56f0] shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Local Filter */}
            <select
              value={localFilter}
              onChange={e => setLocalFilter(e.target.value)}
              className="flex-1 sm:flex-initial bg-white dark:bg-[#111a30] border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-200 font-bold rounded-lg px-3 py-2 outline-none shadow-2xs cursor-pointer"
            >
              <option value="todos">📍 Todos os Locais</option>
              <option value="central">Central</option>
              <option value="picking">Picking</option>
              <option value="pnc">PNC / Bloqueado</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusActionFilter}
              onChange={e => setStatusActionFilter(e.target.value)}
              className="flex-1 sm:flex-initial bg-white dark:bg-[#111a30] border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-200 font-bold rounded-lg px-3 py-2 outline-none shadow-2xs cursor-pointer"
            >
              <option value="todos">⚡ Todos os Status</option>
              <option value="pendente">Pendente de Ação</option>
              <option value="tratado">Tratados</option>
            </select>
          </div>
        </div>

        {/* View Mode Toggle & Counter */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-bold whitespace-nowrap">
            {filteredList.length} itens
          </span>

          <div className="flex items-center bg-white dark:bg-[#111a30] border border-slate-300 dark:border-slate-700 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-[#1e56f0] text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Exibir em cards (recomendado para celular)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#1e56f0] text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Exibir em formato de tabela"
            >
              <List className="w-3.5 h-3.5" />
              <span>Tabela</span>
            </button>
          </div>
        </div>
      </div>

      {/* EMPTY STATE */}
      {filteredList.length === 0 && (
        <div className="py-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1222] text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-sm text-slate-800 dark:text-slate-200 font-bold">
            {criticosUnificados.length === 0 
              ? "Nenhum item na janela crítica (≤45 dias) encontrado no recolhimento!"
              : "Nenhum item encontrado com os filtros selecionados."
            }
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {criticosUnificados.length === 0 
              ? "Todos os lotes possuem cobertura superior a 45 dias para a data de corte."
              : "Tente limpar os filtros de busca ou alterar a localização."
            }
          </p>
        </div>
      )}

      {/* 1. RESPONSIVE CARDS VIEW (Mobile-friendly & Desktop grid) */}
      {filteredList.length > 0 && viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filteredList.map((item, idx) => {
            const itemKey = `${item.codigo}_${item.validade}`;
            const isTratado = tratadosSet.has(itemKey);
            const isEditing = editingKey === itemKey;
            const isActionLoading = submittingActionKey === itemKey;
            const isJustUpdated = recentlyUpdatedKey === itemKey;
            const volumeHlStr = (item as any).volumeHl ? (item as any).volumeHl.toFixed(2) : (item.quantidade * 0.072).toFixed(2);
            const vendaMediaVal = (item as any).vendaMedia || Math.max(5, Math.round(item.quantidade / 6));
            const diasEstoqueVal = (item as any).diasEstoque || (item.quantidade / vendaMediaVal).toFixed(1);

            return (
              <div
                key={`card_${itemKey}_${idx}`}
                className={`rounded-xl border transition-all duration-200 p-4 flex flex-col justify-between gap-3.5 shadow-xs ${
                  isJustUpdated
                    ? 'bg-emerald-100/90 dark:bg-emerald-950/60 ring-2 ring-emerald-500 border-emerald-400'
                    : isTratado
                    ? 'bg-slate-50/80 dark:bg-[#0d1527]/60 border-slate-200 dark:border-slate-800 opacity-80'
                    : item.diasParaVencer <= 30
                    ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 hover:border-rose-300'
                    : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 hover:border-amber-300'
                }`}
              >
                {/* CARD HEADER */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                      item.diasParaVencer <= 30 
                        ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/40' 
                        : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40'
                    }`}>
                      {item.diasParaVencer <= 30 ? 'CRÍTICO (≤30d)' : 'ALERTA (31-45d)'}
                    </span>

                    <span className="font-mono text-xs font-black px-2 py-0.5 bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-md border border-slate-300 dark:border-slate-700">
                      #{item.codigo}
                    </span>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {item.localizacao} {item.bloco ? `(${item.bloco})` : ''}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleTratado(itemKey)}
                    className={`shrink-0 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 border ${
                      isTratado
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-white dark:bg-[#111a30] text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-emerald-500'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isTratado ? 'Tratado' : 'Pendente'}</span>
                  </button>
                </div>

                {/* PRODUCT TITLE */}
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                    {item.descricao}
                  </h4>
                  {item.lote && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 block">
                      Lote: {item.lote}
                    </span>
                  )}
                </div>

                {/* KEY DATA METRICS (2-COLUMN GRID) */}
                <div className="grid grid-cols-2 gap-2 bg-white dark:bg-[#0f172a]/90 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                  {/* Vencimento & Dias */}
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" /> Vencimento
                    </span>
                    <div className="font-mono font-black text-slate-900 dark:text-white text-xs">
                      {item.validade}
                    </div>
                    <div className={`text-[10px] font-mono font-bold ${item.diasParaVencer <= 30 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'}`}>
                      {item.diasParaVencer} dias restantes
                    </div>
                  </div>

                  {/* Quantidade & Volume */}
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold flex items-center gap-1">
                      <Box className="w-3 h-3 text-slate-400" /> Qtd em Risco
                    </span>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={editingQtyVal}
                          onChange={e => setEditingQtyVal(e.target.value)}
                          className="w-14 bg-slate-50 dark:bg-slate-900 border border-amber-500 text-slate-900 dark:text-white font-mono font-bold text-center text-xs py-0.5 rounded outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveQtyUpdate(itemKey, item.codigo)}
                          className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold"
                          title="Salvar quantidade"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingKey(null)}
                          className="p-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[10px]"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="font-mono font-black text-amber-700 dark:text-amber-400 text-xs">
                          {item.quantidade} cx <span className="text-[10px] text-sky-700 dark:text-sky-400 font-bold">({volumeHlStr} HL)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingKey(itemKey);
                            setEditingQtyVal(String(item.quantidade));
                          }}
                          className="p-1 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded transition-colors cursor-pointer"
                          title="Editar quantidade física"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <div className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">
                      {diasEstoqueVal}d de cobertura
                    </div>
                  </div>

                  {/* Venda Média */}
                  <div className="space-y-0.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-slate-400" /> Venda Média
                    </span>
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {vendaMediaVal} <span className="text-[9px] text-slate-500 font-normal">cx/dia</span>
                    </div>
                  </div>

                  {/* Valoração */}
                  <div className="space-y-0.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-slate-400" /> Valoração
                    </span>
                    <div className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs">
                      R$ {item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {item.qtdAtualizadaLog && (
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ Aferido às {item.qtdAtualizadaLog.updatedAt} por {item.qtdAtualizadaLog.conferente}
                  </span>
                )}

                {/* CARD ACTIONS */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingKey(itemKey);
                      setEditingQtyVal(String(item.quantidade));
                    }}
                    className="flex-1 py-1.5 px-2 bg-white dark:bg-[#111a30] hover:bg-blue-50 dark:hover:bg-sky-950/40 text-blue-700 dark:text-sky-300 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border border-slate-300 dark:border-slate-700 hover:border-blue-300 transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" /> Qtd
                  </button>

                  <button
                    type="button"
                    disabled={isActionLoading}
                    onClick={() => handleEncaminharDespejo(item.codigo, item.descricao, item.validade)}
                    className={`flex-1 py-1.5 px-2 bg-rose-600/10 hover:bg-rose-600 text-rose-700 dark:text-rose-300 hover:text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider border border-rose-300 dark:border-rose-500/40 transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      isActionLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isActionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    Despejo
                  </button>

                  <button
                    type="button"
                    disabled={isActionLoading}
                    onClick={() => handleEncaminharPNC(item.codigo, item.descricao, item.validade)}
                    className={`flex-1 py-1.5 px-2 bg-amber-600/10 hover:bg-amber-600 text-amber-800 dark:text-amber-300 hover:text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider border border-amber-300 dark:border-amber-500/40 transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      isActionLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isActionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldAlert className="w-3 h-3" />}
                    PNC
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. DESKTOP / TABLE VIEW (With horizontal touch scrolling) */}
      {filteredList.length > 0 && viewMode === 'table' && (
        <div className="relative">
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1222] shadow-xs">
            <table className="w-full text-center border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#111a30] border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3 text-center">Farol</th>
                  <th className="py-3 px-3 text-center">Código</th>
                  <th className="py-3 px-4 text-center">Produto / Descrição</th>
                  <th className="py-3 px-3 text-center">Qtd Total (cx / HL)</th>
                  <th className="py-3 px-3 text-center">Venda Média (cx/dia)</th>
                  <th className="py-3 px-3 text-center">Vencimento</th>
                  <th className="py-3 px-3 text-center">Dias p/ Vencer & Cobertura</th>
                  <th className="py-3 px-3 text-center">Setor / Origem</th>
                  <th className="py-3 px-3 text-center">Valoração R$</th>
                  <th className="py-3 px-4 text-center">Ações Workstation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-center">
                {filteredList.map((item, idx) => {
                  const itemKey = `${item.codigo}_${item.validade}`;
                  const isTratado = tratadosSet.has(itemKey);
                  const isEditing = editingKey === itemKey;
                  const isActionLoading = submittingActionKey === itemKey;
                  const isJustUpdated = recentlyUpdatedKey === itemKey;
                  const volumeHlStr = (item as any).volumeHl ? (item as any).volumeHl.toFixed(2) : (item.quantidade * 0.072).toFixed(2);
                  const vendaMediaVal = (item as any).vendaMedia || Math.max(5, Math.round(item.quantidade / 6));
                  const diasEstoqueVal = (item as any).diasEstoque || (item.quantidade / vendaMediaVal).toFixed(1);

                  return (
                    <tr 
                      key={`${itemKey}_${idx}`} 
                      className={`transition-all duration-300 ${
                        isJustUpdated
                          ? 'bg-emerald-100/90 dark:bg-emerald-900/50 ring-2 ring-emerald-500'
                          : isTratado 
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-slate-500 dark:text-slate-400 opacity-75' 
                          : item.diasParaVencer <= 30
                          ? 'bg-rose-50/80 dark:bg-rose-950/20 hover:bg-rose-100/80 dark:hover:bg-rose-900/30 text-slate-900 dark:text-white font-semibold'
                          : 'bg-amber-50/80 dark:bg-amber-950/20 hover:bg-amber-100/80 dark:hover:bg-amber-900/30 text-slate-900 dark:text-white font-semibold'
                      }`}
                    >
                      {/* FAROL */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          item.diasParaVencer <= 30 
                            ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/40' 
                            : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40'
                        }`}>
                          {item.diasParaVencer <= 30 ? 'CRÍTICO (≤30d)' : 'ALERTA (31-45d)'}
                        </span>
                      </td>

                      {/* CÓDIGO */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                        {item.codigo}
                      </td>

                      {/* PRODUTO */}
                      <td className="py-3 px-4 text-center font-extrabold text-slate-900 dark:text-white">
                        <span className="truncate max-w-[240px] mx-auto block" title={item.descricao}>
                          {item.descricao}
                        </span>
                      </td>

                      {/* QUANTIDADE UNIFICADA (CX & HL) */}
                      <td className="py-3 px-3 text-center font-black">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              value={editingQtyVal}
                              onChange={e => setEditingQtyVal(e.target.value)}
                              className="w-16 bg-white dark:bg-slate-900 border border-amber-500 text-slate-900 dark:text-white font-mono font-bold text-center text-xs py-0.5 rounded outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveQtyUpdate(itemKey, item.codigo)}
                              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-black uppercase transition-colors flex items-center gap-1 cursor-pointer"
                              title="Salvar e notificar quantidade atualizada no workstation"
                            >
                              <Check className="w-3 h-3" /> Notificar
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingKey(null)}
                              className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded text-[10px] cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center">
                            <div className="flex items-center gap-1.5">
                              <span className="text-amber-700 dark:text-amber-400 font-mono text-sm font-black">{item.quantidade}</span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">cx</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingKey(itemKey);
                                  setEditingQtyVal(String(item.quantidade));
                                }}
                                className="p-1 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded transition-colors cursor-pointer"
                                title="Conferente: Notificar quantidade física atualizada do item no workstation"
                              >
                                ✏️
                              </button>
                            </div>
                            <span className="text-[10px] text-[#1e56f0] dark:text-sky-400 font-mono font-bold">
                              {volumeHlStr} HL
                            </span>
                          </div>
                        )}
                        {item.qtdAtualizadaLog && (
                          <span className="block text-[9px] text-emerald-600 dark:text-emerald-400 font-normal font-sans">
                            Aferido às {item.qtdAtualizadaLog.updatedAt} por {item.qtdAtualizadaLog.conferente}
                          </span>
                        )}
                      </td>

                      {/* VENDA MÉDIA DIÁRIA */}
                      <td className="py-3 px-3 text-center font-mono">
                        <span className="text-slate-900 dark:text-white font-bold text-sm block">{vendaMediaVal}</span>
                        <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase block">cx / dia</span>
                      </td>

                      {/* VENCIMENTO */}
                      <td className="py-3 px-3 text-center font-mono font-extrabold text-slate-800 dark:text-slate-200">
                        {item.validade}
                      </td>

                      {/* DIAS RESTANTES & DIAS DE ESTOQUE */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`font-mono font-black text-sm ${item.diasParaVencer <= 30 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'}`}>
                            {item.diasParaVencer} dias
                          </span>
                          <span className="text-[10px] text-slate-600 dark:text-slate-300 font-mono font-semibold">
                            ({diasEstoqueVal}d cobertura)
                          </span>
                        </div>
                      </td>

                      {/* SETOR */}
                      <td className="py-3 px-3 text-center">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block border border-slate-200 dark:border-slate-700">
                          {item.localizacao} {item.bloco ? `(${item.bloco})` : ''}
                        </span>
                      </td>

                      {/* VALORAÇÃO */}
                      <td className="py-3 px-3 text-center font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        R$ {item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* AÇÕES WORKSTATION */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingKey(itemKey);
                              setEditingQtyVal(String(item.quantidade));
                            }}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-sky-600/30 dark:hover:bg-sky-600 text-[#1e56f0] dark:text-sky-300 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider border border-blue-200 dark:border-sky-500/40 transition-all cursor-pointer flex items-center gap-1"
                            title="Conferente: Notificar quantidade física atualizada deste item no workstation"
                          >
                            ✏️ Qtd
                          </button>

                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleEncaminharDespejo(item.codigo, item.descricao, item.validade)}
                            className={`px-2 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-600/30 dark:hover:bg-rose-600 text-rose-700 dark:text-rose-300 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider border border-rose-200 dark:border-rose-500/40 transition-all cursor-pointer flex items-center gap-1 ${
                              isActionLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            title="Encaminhar este item para o Setor de Despejo"
                          >
                            {isActionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                            Despejo
                          </button>

                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleEncaminharPNC(item.codigo, item.descricao, item.validade)}
                            className={`px-2 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-600/30 dark:hover:bg-amber-600 text-amber-800 dark:text-amber-300 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider border border-amber-200 dark:border-amber-500/40 transition-all cursor-pointer flex items-center gap-1 ${
                              isActionLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            title="Encaminhar este item para Produtos Não Conformes (PNC)"
                          >
                            {isActionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldAlert className="w-3 h-3" />}
                            PNC
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleTratado(itemKey)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 border ${
                              isTratado
                                ? 'bg-slate-800 text-slate-400 border-slate-700'
                                : 'bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border-emerald-500/40'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" /> {isTratado ? 'Tratado' : 'Concluir'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-1.5 md:hidden">
            👉 Deslize horizontalmente para ver todas as colunas da tabela
          </p>
        </div>
      )}
    </div>
  );
};
