import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Usuario, Empresa } from '../types';
import { PadraoOperacionalModal } from './PadraoOperacionalModal';
import { Checklist5SModal } from './Checklist5SModal';
import { IndicatorActionModal } from './IndicatorActionModal';
import { ActionDetailModal } from './ActionDetailModal';
import { openModalAcaoDesvio, openModalAcaoMelhoria } from '../utils/actionsEvents';
import { 
  AcaoCorretiva, 
  getAcoesAll, 
  saveAcoes, 
  MODULES_LIST 
} from '../utils/simulacaoAcoesUtils';
import { ACOES_OFICIAIS_MONTAGEM_CARREGAMENTO_40 } from '../data/acoesMontagemCarregamentoOficiais40';
import { 
  Truck, 
  CheckCircle2, 
  ArrowLeft, 
  Search, 
  Layers, 
  AlertCircle,
  Sparkles,
  RefreshCw,
  Eye,
  Info,
  BookOpen,
  ShieldCheck,
  ClipboardCheck,
  ExternalLink,
  Copy,
  Check,
  Filter,
  Users,
  Plus,
  Clock,
  Calendar,
  AlertTriangle,
  FileText,
  Trash2,
  ListFilter,
  CheckSquare,
  Square,
  ArrowUpRight,
  TrendingDown,
  LayoutGrid,
  Table as TableIcon,
  HelpCircle,
  Tag
} from 'lucide-react';

interface MontagemCarregamentoDashboardProps {
  user: Usuario;
  empresa: Empresa | null;
  onBack?: () => void;
  theme?: 'light' | 'dark';
}

const FAST_PICKING_URL = 'https://new.fastpicking.com.br/pickings/dashboards';

function MontagemHeaderClock({ theme }: { theme: 'light' | 'dark' }) {
  const [timeStr, setTimeStr] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTimeStr(now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour12: false }));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!timeStr) return null;

  return (
    <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold shadow-xs ${
      theme === 'dark' ? 'bg-[#131d38] border-slate-700/80 text-blue-300' : 'bg-white border-slate-200 text-slate-700'
    }`}>
      <Clock className="w-3.5 h-3.5 text-blue-500" />
      <span>{timeStr}</span>
    </div>
  );
}

export default function MontagemCarregamentoDashboard({
  user,
  empresa,
  onBack,
  theme = 'light'
}: MontagemCarregamentoDashboardProps) {
  const isDark = theme === 'dark';

  // Modals state
  const [isPopModalOpen, setIsPopModalOpen] = useState(false);
  const [is5SModalOpen, setIs5SModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedActionDetail, setSelectedActionDetail] = useState<AcaoCorretiva | null>(null);
  
  // Fast Picking URL Copy State
  const [copiedLink, setCopiedLink] = useState(false);

  // Actions list & filters
  const [acoes, setAcoes] = useState<AcaoCorretiva[]>([]);
  const [isLoadingAcoes, setIsLoadingAcoes] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [filterTipo, setFilterTipo] = useState<string>('TODOS');
  const [filterPrioridade, setFilterPrioridade] = useState<string>('TODOS');
  const [viewLayout, setViewLayout] = useState<'cards' | 'table'>('cards');

  // Load actions specifically for Montagem, Carregamento, EFM, EFC, Erros de Montagem e Melhorias de Movimentação no Picking
  const carregarAcoes = useCallback(() => {
    setIsLoadingAcoes(true);
    try {
      const all = getAcoesAll();

      // Collect user-created actions that match Montagem/Carregamento/EFM/EFC/Picking
      const userCreatedRelevant = all.filter(a => {
        if (a.id && a.id.startsWith('ACAO_MC_')) return false; // will be included from official dataset
        const proc = (a.processo || '').toLowerCase();
        const ind = (a.indicador || '').toLowerCase();
        const setor = (a.setor || '').toLowerCase();
        const desvio = (a.desvioEncontrado || '').toLowerCase();
        const text = `${proc} ${ind} ${setor} ${desvio}`;

        // Exclude other domains explicitly
        if (text.includes('repack') || text.includes('despejo') || text.includes('quebra') || text.includes('avaria garrafa') || text.includes('temperatura') || text.includes('fefo')) {
          return false;
        }

        return (
          text.includes('carregamento') ||
          text.includes('montagem') ||
          text.includes('efm') ||
          text.includes('efc') ||
          text.includes('movimentação no picking') ||
          text.includes('picking') ||
          text.includes('coluna') ||
          text.includes('doca') ||
          text.includes('lastro') ||
          text.includes('fast picking')
        );
      });

      // Combine official 40+ Montagem & Carregamento actions with user-created relevant ones
      const combined: AcaoCorretiva[] = [
        ...ACOES_OFICIAIS_MONTAGEM_CARREGAMENTO_40,
        ...userCreatedRelevant
      ];

      setAcoes(combined);
    } catch (err) {
      console.error('Erro ao carregar ações de montagem e carregamento:', err);
      setAcoes(ACOES_OFICIAIS_MONTAGEM_CARREGAMENTO_40);
    } finally {
      setIsLoadingAcoes(false);
    }
  }, []);

  useEffect(() => {
    carregarAcoes();

    const handleAcoesUpdate = () => {
      carregarAcoes();
    };

    window.addEventListener('acoes_updated', handleAcoesUpdate);
    window.addEventListener('storage', handleAcoesUpdate);

    return () => {
      window.removeEventListener('acoes_updated', handleAcoesUpdate);
      window.removeEventListener('storage', handleAcoesUpdate);
    };
  }, [carregarAcoes]);

  // Copy link handler
  const handleCopyLink = () => {
    navigator.clipboard.writeText(FAST_PICKING_URL);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleOpenExternal = () => {
    window.open(FAST_PICKING_URL, '_blank', 'noopener,noreferrer');
  };

  // Toggle status of an action
  const handleToggleStatus = (id: string, currentStatus: string) => {
    const nextStatusMap: Record<string, AcaoCorretiva['status']> = {
      'Pendente': 'Em Andamento',
      'Em Andamento': 'Concluído',
      'Concluído': 'Pendente',
      'Atrasado': 'Em Andamento',
      'Reaberto': 'Em Andamento'
    };

    const nextStatus = nextStatusMap[currentStatus] || 'Pendente';
    const all = getAcoesAll();
    const updated = all.map(a => {
      if (a.id === id) {
        return {
          ...a,
          status: nextStatus,
          historicoAlteracoes: [
            ...(a.historicoAlteracoes || []),
            {
              dataHora: new Date().toLocaleString('pt-BR'),
              usuario: user.nome || 'Supervisor DPO',
              alteracao: `Status alterado de ${currentStatus} para ${nextStatus}`
            }
          ]
        };
      }
      return a;
    });

    saveAcoes(updated);
    carregarAcoes();
  };

  // Delete an action
  const handleDeleteAction = (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este plano de ação?')) return;
    const all = getAcoesAll();
    const updated = all.filter(a => a.id !== id);
    saveAcoes(updated);
    carregarAcoes();
    setSelectedActionDetail(null);
  };

  // Filtered actions list
  const filteredAcoes = useMemo(() => {
    return acoes.filter(a => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = 
          (a.id || '').toLowerCase().includes(q) ||
          (a.indicador || '').toLowerCase().includes(q) ||
          (a.desvioEncontrado || '').toLowerCase().includes(q) ||
          (a.contramedida || '').toLowerCase().includes(q) ||
          (a.colaboradorResponsavel || '').toLowerCase().includes(q) ||
          (a.responsavelTratativa || '').toLowerCase().includes(q) ||
          (a.setor || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      // Status filter
      if (filterStatus !== 'TODOS') {
        if (filterStatus === 'ATRASADO') {
          const isAtrasado = a.status !== 'Concluído' && new Date(a.prazo) < new Date(new Date().setHours(0,0,0,0));
          if (!isAtrasado) return false;
        } else if (a.status !== filterStatus) {
          return false;
        }
      }

      // Tipo filter
      if (filterTipo !== 'TODOS') {
        if (filterTipo === 'CORRETIVA' && a.tipoAcao !== 'Corretiva') return false;
        if (filterTipo === 'MELHORIA' && a.tipoAcao !== 'Melhoria') return false;
      }

      // Prioridade filter
      if (filterPrioridade !== 'TODOS') {
        if (a.prioridade !== filterPrioridade) return false;
      }

      return true;
    });
  }, [acoes, searchQuery, filterStatus, filterTipo, filterPrioridade]);

  // Summary Metrics of Actions
  const actionStats = useMemo(() => {
    const total = acoes.length;
    const pendentes = acoes.filter(a => a.status === 'Pendente').length;
    const emAndamento = acoes.filter(a => a.status === 'Em Andamento').length;
    const concluidas = acoes.filter(a => a.status === 'Concluído').length;
    const atrasadas = acoes.filter(a => a.status !== 'Concluído' && new Date(a.prazo) < new Date(new Date().setHours(0,0,0,0))).length;
    const taxaConclusao = total > 0 ? Math.round((concluidas / total) * 100) : 0;

    return {
      total,
      pendentes,
      emAndamento,
      concluidas,
      atrasadas,
      taxaConclusao
    };
  }, [acoes]);

  // Action creation shortcuts
  const handleOpenNovoPlanoAcao = () => {
    setIsActionModalOpen(true);
  };

  const handleOpenAcaoDesvio = () => {
    openModalAcaoDesvio({
      processo: 'Carregamento',
      indicador: 'SLA de Carregamento & Fast Picking',
      meta: '≤ 4.5 min/palete | EFC ≥ 96%',
      setor: 'Expedição / Baias Fast Picking',
      tipoGatilho: 'Desvio Operacional'
    });
  };

  const handleOpenAcaoMelhoria = () => {
    openModalAcaoMelhoria({
      processo: 'Carregamento',
      reuniaoTOR: 'Reunião Diária de Operações (TOR)',
      pilarDPO: 'Produtividade & Armazém',
      oportunidade: 'Otimização do fluxo de montagem por coluna e redução de filas no Fast Picking',
      metaMelhoria: 'Reduzir tempo de montagem por coluna e atingir 100% de acuracidade',
      indicadorBeneficiado: 'TMR & SLA de Carregamento'
    });
  };

  return (
    <div id="montagem-carregamento-dashboard-wrapper" className={`flex flex-col gap-4 p-3 md:p-5 rounded-2xl shadow-sm border transition-colors duration-300 ${
      isDark ? 'bg-[#0b1329] text-slate-100 border-slate-800' : 'bg-[#f8fafc] text-[#0f172a] border-gray-200/80'
    }`}>
      
      {/* ── HEADER PRINCIPAL ── */}
      <div className={`flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 border-b pb-4 transition-colors ${
        isDark ? 'border-slate-800' : 'border-gray-200'
      }`}>
        
        {/* Left: Title & Info */}
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className={`p-2 rounded-xl transition-colors cursor-pointer border-none ${
                isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-200/80 text-gray-500'
              }`}
              title="Voltar para a Visão Geral"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20 flex-shrink-0">
            <Truck className="w-6 h-6 text-white" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className={`font-sans font-black text-xl sm:text-2xl tracking-tight uppercase ${
                isDark ? 'text-blue-300' : 'text-[#032b5e]'
              }`}>
                MONTAGEM E CARREGAMENTO
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                FAST PICKING OFICIAL
              </span>
            </div>
            <p className={`text-[11px] tracking-wider font-bold uppercase mt-0.5 ${
              isDark ? 'text-slate-400' : 'text-gray-500'
            }`}>
              Plataforma Oficial Fast Picking & Gestão de Planos de Ação 5W2H / DPO
            </p>
          </div>
        </div>

        {/* Right: Actions, Modals & Clock */}
        <div className="flex flex-wrap items-center gap-2">
          
          <MontagemHeaderClock theme={theme} />

          {/* ATALHO DTO DIAGNÓSTICO OPERACIONAL */}
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open_dto_operacao', { detail: { operacao: 'carregamento' } }));
              window.dispatchEvent(new CustomEvent('app_navigate', { detail: { panel: 'dto-diagnostico', operacao: 'carregamento' } }));
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-xs uppercase tracking-wider flex items-center gap-1.5 transition-all border border-purple-400/40 hover:scale-[1.02] active:scale-95 cursor-pointer"
            title="Abrir Diagnóstico DTO Operacional de Montagem e Carregamento"
          >
            <ClipboardCheck className="w-4 h-4 text-purple-200" />
            <span>DTO Carregamento</span>
          </button>

          {/* BOTÃO PADRÃO OPERACIONAL (POP) */}
          <button 
            onClick={() => setIsPopModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs uppercase tracking-wider hover:scale-[1.02] active:scale-95 border-none"
            title="Visualizar Procedimento Operacional Padrão (POP) de Montagem e Carregamento"
          >
            <BookOpen className="w-4 h-4 text-blue-200" />
            <span>Padrão Operacional (POP)</span>
          </button>

          {/* BOTÃO CHECKLIST 5S */}
          <button 
            onClick={() => setIs5SModalOpen(true)}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs uppercase tracking-wider hover:scale-[1.02] active:scale-95 border-none"
            title="Realizar Auditoria e Checklist 5S no Pátio e Baias de Montagem"
          >
            <ShieldCheck className="w-4 h-4 text-slate-950" />
            <span>Checklist 5S</span>
          </button>

          {/* BOTÃO INSERIR PLANO DE AÇÃO */}
          <button 
            onClick={handleOpenNovoPlanoAcao}
            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs uppercase tracking-wider border border-blue-400/30 hover:scale-[1.02] active:scale-95"
            title="Inserir e Acompanhar Planos de Ação 5W2H para Montagem e Carregamento"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>+ Inserir Plano de Ação</span>
          </button>

        </div>
      </div>

      {/* ── BARRA FIXA FAST PICKING (LINK OFICIAL PARA ANÁLISE DE INDICADORES) ── */}
      <div className={`p-4 rounded-xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs ${
        isDark 
          ? 'bg-gradient-to-r from-blue-950/50 via-indigo-950/40 to-slate-900 border-blue-800/60 shadow-blue-950/20' 
          : 'bg-gradient-to-r from-blue-50 via-indigo-50/70 to-sky-50 border-blue-200/90 shadow-blue-500/5'
      }`}>
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0 shadow-xs">
            <ExternalLink className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase text-blue-700 dark:text-blue-400 tracking-wider">
                Portal Fast Picking Oficial (Indicadores & Separação):
              </span>
              <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 select-all underline decoration-blue-500/40">
                {FAST_PICKING_URL}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Link Fixo Ativo
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
              Acesse o ambiente oficial para analisar em tempo real os indicadores de SLA de carregamento, mapas de montagem por coluna e produtividade de separadores.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            onClick={handleCopyLink}
            className={`px-3.5 py-2 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              copiedLink 
                ? 'bg-emerald-600 text-white border-emerald-500' 
                : (isDark ? 'bg-[#151b23] border-[#222d3a] text-slate-300 hover:text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50')
            }`}
            title="Copiar link fixo para a área de transferência"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link'}</span>
          </button>

          <button
            onClick={handleOpenExternal}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-md uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
            title="Abrir portal do Fast Picking em nova aba do navegador"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Abrir Indicadores Fast Picking ↗</span>
          </button>
        </div>
      </div>

      {/* ── PAINEL EXCLUSIVO DE AÇÕES (5W2H / DPO) ── */}
      <div className="space-y-4">
        
        {/* KPI CARDS: CONTADORES DO PLANO DE AÇÃO */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          
          <div className={`p-3.5 rounded-xl border shadow-xs transition-all ${
            isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200/90'
          }`}>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider">Total de Ações</span>
              <Layers className="w-4 h-4 text-blue-500" />
            </div>
            <div className="my-1.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {actionStats.total}
              </span>
              <span className="text-xs text-slate-400 font-bold ml-1">planos</span>
            </div>
            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              Montagem & Carregamento
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border shadow-xs transition-all ${
            isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200/90'
          }`}>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider">Pendentes</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="my-1.5">
              <span className="text-xl sm:text-2xl font-black text-amber-500">
                {actionStats.pendentes}
              </span>
              <span className="text-xs text-slate-400 font-bold ml-1">ações</span>
            </div>
            <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
              Aguardando início
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border shadow-xs transition-all ${
            isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200/90'
          }`}>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider">Em Andamento</span>
              <RefreshCw className="w-4 h-4 text-blue-500" />
            </div>
            <div className="my-1.5">
              <span className="text-xl sm:text-2xl font-black text-blue-500">
                {actionStats.emAndamento}
              </span>
              <span className="text-xs text-slate-400 font-bold ml-1">em tratativa</span>
            </div>
            <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
              Contramedida em execução
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border shadow-xs transition-all ${
            isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200/90'
          }`}>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider">Concluídas</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="my-1.5">
              <span className="text-xl sm:text-2xl font-black text-emerald-500">
                {actionStats.concluidas}
              </span>
              <span className="text-xs text-slate-400 font-bold ml-1">resolvidas</span>
            </div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              Eficácia confirmada
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border shadow-xs transition-all ${
            isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200/90'
          }`}>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider">Atrasadas / Risco</span>
              <AlertCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="my-1.5">
              <span className="text-xl sm:text-2xl font-black text-rose-500">
                {actionStats.atrasadas}
              </span>
              <span className="text-xs text-slate-400 font-bold ml-1">fora do prazo</span>
            </div>
            <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
              Necessita reavaliação
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border shadow-xs transition-all ${
            isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200/90'
          }`}>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider">Taxa de Resolução</span>
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="my-1.5">
              <span className="text-xl sm:text-2xl font-black text-indigo-500">
                {actionStats.taxaConclusao}%
              </span>
            </div>
            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              Meta DPO: ≥ 85%
            </div>
          </div>

        </div>

        {/* ── BARRA DE FERRAMENTAS & FILTROS DO PAINEL DE AÇÕES ── */}
        <div className={`p-4 rounded-xl border shadow-xs space-y-3 ${
          isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
                Painel de Planos de Ação 5W2H & Desvios Operacionais
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Acompanhamento e tratativa de desvios de SLA, acuracidade, tempo de montagem e eficiência de carregamento.
              </p>
            </div>

            {/* Ações Rápidas */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleOpenAcaoDesvio}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                title="Cadastrar Ação Rápida de Desvio Operacional"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>+ Ação de Desvio</span>
              </button>

              <button
                onClick={handleOpenAcaoMelhoria}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                title="Cadastrar Ação de Melhoria Contínua (TOR)"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+ Ação de Melhoria (TOR)</span>
              </button>

              <button
                onClick={handleOpenNovoPlanoAcao}
                className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-xs border border-blue-400/30"
                title="Criar Novo Plano de Ação Completo 5W2H"
              >
                <Plus className="w-4 h-4" />
                <span>+ Novo Plano 5W2H</span>
              </button>
            </div>
          </div>

          {/* Filtros em Linha */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por desvio, 5W2H, responsável..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-3 py-1.5 rounded-lg text-xs font-medium border transition-colors outline-hidden ${
                  isDark 
                    ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-blue-500' 
                    : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400 focus:border-blue-500'
                }`}
              />
            </div>

            {/* Selects & View Mode */}
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
              
              {/* Status Select */}
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border cursor-pointer outline-hidden ${
                  isDark 
                    ? 'bg-slate-900 border-slate-700 text-slate-200' 
                    : 'bg-slate-50 border-slate-300 text-slate-700'
                }`}
              >
                <option value="TODOS">Todos os Status</option>
                <option value="Pendente">Pendentes</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Concluído">Concluídos</option>
                <option value="ATRASADO">Atrasados / Em Risco</option>
              </select>

              {/* Tipo Select */}
              <select
                value={filterTipo}
                onChange={e => setFilterTipo(e.target.value)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border cursor-pointer outline-hidden ${
                  isDark 
                    ? 'bg-slate-900 border-slate-700 text-slate-200' 
                    : 'bg-slate-50 border-slate-300 text-slate-700'
                }`}
              >
                <option value="TODOS">Todos os Tipos</option>
                <option value="CORRETIVA">Ação Corretiva (Desvio)</option>
                <option value="MELHORIA">Ação de Melhoria (TOR)</option>
              </select>

              {/* Prioridade Select */}
              <select
                value={filterPrioridade}
                onChange={e => setFilterPrioridade(e.target.value)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border cursor-pointer outline-hidden ${
                  isDark 
                    ? 'bg-slate-900 border-slate-700 text-slate-200' 
                    : 'bg-slate-50 border-slate-300 text-slate-700'
                }`}
              >
                <option value="TODOS">Todas as Prioridades</option>
                <option value="Alta">Prioridade Alta</option>
                <option value="Média">Prioridade Média</option>
                <option value="Baixa">Prioridade Baixa</option>
              </select>

              {/* View Toggle */}
              <div className={`flex items-center p-0.5 rounded-lg border ${
                isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'
              }`}>
                <button
                  onClick={() => setViewLayout('cards')}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${
                    viewLayout === 'cards' 
                      ? (isDark ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 shadow-xs') 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Visualização em Cards 5W2H"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewLayout('table')}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${
                    viewLayout === 'table' 
                      ? (isDark ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 shadow-xs') 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Visualização em Tabela Detalhada"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Refresh */}
              <button
                onClick={carregarAcoes}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
                title="Recarregar Ações"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAcoes ? 'animate-spin text-blue-500' : ''}`} />
              </button>

            </div>

          </div>

        </div>

        {/* ── LISTA / CARDS DE AÇÕES ── */}
        {filteredAcoes.length === 0 ? (
          <div className={`p-12 text-center rounded-2xl border flex flex-col items-center justify-center ${
            isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Nenhum plano de ação encontrado com os filtros aplicados
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
              Você pode criar um novo plano de ação 5W2H clicando no botão "+ Inserir Plano de Ação" ou limpar os filtros de busca.
            </p>
            <button
              onClick={handleOpenNovoPlanoAcao}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Inserir Primeiro Plano de Ação</span>
            </button>
          </div>
        ) : viewLayout === 'cards' ? (
          
          /* VISUALIZAÇÃO EM CARDS 5W2H */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAcoes.map(acao => {
              const isAtrasado = acao.status !== 'Concluído' && new Date(acao.prazo) < new Date(new Date().setHours(0,0,0,0));

              return (
                <div 
                  key={acao.id} 
                  className={`p-4 rounded-2xl border flex flex-col justify-between transition-all hover:shadow-md ${
                    isDark 
                      ? 'bg-[#111827] border-slate-800 hover:border-slate-700' 
                      : 'bg-white border-slate-200/90 hover:border-blue-300'
                  }`}
                >
                  
                  {/* Card Header: Badges & ID */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-[10px] font-black text-slate-400 dark:text-slate-500">
                        {acao.id}
                      </span>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {/* Tipo Badge */}
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          acao.tipoAcao === 'Melhoria'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                        }`}>
                          {acao.tipoAcao === 'Melhoria' ? 'MELHORIA TOR' : 'CORRETIVA 5W2H'}
                        </span>

                        {/* Prioridade Badge */}
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          acao.prioridade === 'Alta'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                            : acao.prioridade === 'Média'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30'
                        }`}>
                          {acao.prioridade}
                        </span>
                      </div>
                    </div>

                    {/* Título / Indicador */}
                    <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                      {acao.indicador || acao.desvioEncontrado}
                    </h3>

                    {/* Setor & Processo */}
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold mt-1">
                      <Truck className="w-3 h-3 text-blue-500" />
                      <span>{acao.setor || 'Expedição / Montagem'}</span>
                      <span>•</span>
                      <span>{acao.data}</span>
                    </div>

                    {/* 5W2H Box Details */}
                    <div className={`mt-3 p-3 rounded-xl border text-xs space-y-2 ${
                      isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200/80'
                    }`}>
                      
                      {/* What / Desvio */}
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-500 block">
                          [O quê / Desvio Encontrado]:
                        </span>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium line-clamp-2 mt-0.5">
                          {acao.desvioEncontrado}
                        </p>
                      </div>

                      {/* How / Contramedida */}
                      {acao.contramedida && (
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                            [Como / Contramedida 5W2H]:
                          </span>
                          <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium line-clamp-2 mt-0.5">
                            {acao.contramedida}
                          </p>
                        </div>
                      )}

                      {/* Who & When */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-800 text-[10px]">
                        <div>
                          <span className="font-bold text-slate-400 block uppercase">[Quem]:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                            {acao.responsavelTratativa || acao.colaboradorResponsavel || 'Supervisor'}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-400 block uppercase">[Quando / Prazo]:</span>
                          <span className={`font-mono font-bold block ${
                            isAtrasado ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'
                          }`}>
                            {acao.prazo} {isAtrasado && '(Atrasado)'}
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Card Footer: Status Controls & Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    
                    {/* Interactive Status Switcher */}
                    <button
                      onClick={() => handleToggleStatus(acao.id, acao.status)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border ${
                        acao.status === 'Concluído'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          : acao.status === 'Em Andamento'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20'
                          : isAtrasado
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                      }`}
                      title="Clique para alternar o status da ação"
                    >
                      {acao.status === 'Concluído' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      <span>{acao.status}</span>
                    </button>

                    {/* Quick Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedActionDetail(acao)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer text-xs flex items-center gap-1 font-bold ${
                          isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                        }`}
                        title="Ver Detalhes e 5 Porquês"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[10px]">Detalhes</span>
                      </button>

                      <button
                        onClick={() => handleDeleteAction(acao.id)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer text-slate-400 hover:text-rose-500 ${
                          isDark ? 'border-slate-800 hover:bg-rose-950/30' : 'border-slate-200 hover:bg-rose-50'
                        }`}
                        title="Excluir Plano de Ação"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>

        ) : (

          /* VISUALIZAÇÃO EM TABELA DETALHADA */
          <div className={`rounded-2xl border overflow-hidden shadow-xs ${
            isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b text-[10px] font-black uppercase tracking-wider ${
                    isDark ? 'border-slate-800 text-slate-400 bg-slate-900/60' : 'border-slate-200 text-slate-500 bg-slate-50'
                  }`}>
                    <th className="py-3 px-3">Código</th>
                    <th className="py-3 px-3">Tipo / Prioridade</th>
                    <th className="py-3 px-3">Indicador / Desvio</th>
                    <th className="py-3 px-3">Contramedida 5W2H</th>
                    <th className="py-3 px-3">Responsável</th>
                    <th className="py-3 px-3">Prazo</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAcoes.map(acao => {
                    const isAtrasado = acao.status !== 'Concluído' && new Date(acao.prazo) < new Date(new Date().setHours(0,0,0,0));

                    return (
                      <tr key={acao.id} className={`transition-colors ${
                        isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                      }`}>
                        <td className="py-3 px-3 font-mono font-bold text-slate-400 text-[11px]">
                          {acao.id}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              acao.tipoAcao === 'Melhoria'
                                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                            }`}>
                              {acao.tipoAcao}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                              acao.prioridade === 'Alta'
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                : 'bg-slate-500/10 text-slate-500'
                            }`}>
                              {acao.prioridade}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 max-w-[260px]">
                          <span className="font-bold text-slate-900 dark:text-slate-100 block truncate">
                            {acao.indicador}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                            {acao.desvioEncontrado}
                          </span>
                        </td>
                        <td className="py-3 px-3 max-w-[280px]">
                          <span className="text-[11px] text-slate-700 dark:text-slate-300 line-clamp-2">
                            {acao.contramedida || 'Sem contramedida detalhada'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                          {acao.responsavelTratativa || acao.colaboradorResponsavel || 'Supervisor'}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px]">
                          <span className={isAtrasado ? 'text-rose-500 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                            {acao.prazo}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleToggleStatus(acao.id, acao.status)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase cursor-pointer border ${
                              acao.status === 'Concluído'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                : acao.status === 'Em Andamento'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {acao.status}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedActionDetail(acao)}
                              className="p-1 rounded text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
                              title="Ver Detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAction(acao.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        )}

      </div>

      {/* ── MODAIS PADRONIZADOS ── */}
      
      {/* 1. Modal Padrão Operacional (POP) */}
      <PadraoOperacionalModal
        isOpen={isPopModalOpen}
        onClose={() => setIsPopModalOpen(false)}
        moduleKey="carregamento"
        moduleName="Montagem e Carregamento"
        user={user}
      />

      {/* 2. Modal Checklist 5S */}
      <Checklist5SModal
        isOpen={is5SModalOpen}
        onClose={() => setIs5SModalOpen(false)}
        user={user}
        empresaId={empresa?.id || 'demo'}
        defaultSetor="CARREGAMENTO"
      />

      {/* 3. Modal Inserir Plano de Ação 5W2H */}
      <IndicatorActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        indicatorTitle="Montagem e Carregamento"
        indicatorSubtitle="Gestão e tratativa de planos de ação 5W2H para SLA de carregamento, montagem de paletes e Fast Picking."
        indicatorBadge="CARREGAMENTO DPO"
        allowedProcessos={['Carregamento', 'EFC', 'Picking', 'EFD']}
        defaultProcesso="Carregamento"
        defaultIndicador="SLA de Montagem & Fast Picking"
        defaultMeta="≤ 4.5 min/palete | EFC ≥ 96%"
        user={user}
      />

      {/* 4. Modal Detalhes da Ação */}
      <ActionDetailModal
        acao={selectedActionDetail}
        isOpen={!!selectedActionDetail}
        onClose={() => setSelectedActionDetail(null)}
        onToggleStatus={handleToggleStatus}
        onDeleteAction={handleDeleteAction}
        userName={user.nome}
        theme={theme}
      />

    </div>
  );
}
