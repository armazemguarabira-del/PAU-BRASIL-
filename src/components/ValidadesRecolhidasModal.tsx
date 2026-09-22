import React, { useState, useMemo } from 'react';
import { ValidadeRow } from '../types';
import { 
  CheckSquare, 
  Square, 
  ChevronDown, 
  Search, 
  Calendar, 
  FileSpreadsheet, 
  Check, 
  X,
  Layers,
  Sparkles
} from 'lucide-react';
import { calculateStockAgeIndex } from '../utils/calculateStockAgeIndex';
import { isValidadeDeleted, getValidadeQty, formatDateToBR } from '../utils/fefoDefaultData';

export interface ValidadesRecolhidasModalProps {
  isOpen: boolean;
  onClose: () => void;
  validades: ValidadeRow[];
  selectedKeys: Set<string>;
  onToggleKey: (key: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSelectDate: (dateKey: string, select: boolean) => void;
  onSelectLatestOnly: () => void;
  onSelectOnlyThisDate: (dateKey: string) => void;
  onSelectOnlyThisKey: (key: string) => void;
  onOpenImport030519: () => void;
  empresaProdutos?: any[];
}

export function getValidadeUniqueId(item: any, index?: number): string {
  if (item._uniqueKey) return String(item._uniqueKey);
  if (item._docId) return String(item._docId);
  if (item.id !== undefined && item.id !== null && String(item.id).trim() !== '') return String(item.id);
  const cod = String(item.codigo || '').trim();
  const val = String(item.validade || '').trim();
  const blo = String(item.bloco || '').trim();
  const loc = String(item.localizacao || '').trim();
  const lot = String(item.lote || '').trim();
  const dt = String(item.dataColeta || item.cadastradoEm || item.criadoEm || '').trim();
  const idxStr = index !== undefined ? `_${index}` : '';
  return `val_${cod}_${val}_${blo}_${loc}_${lot}_${dt}${idxStr}`;
}

export function getValidadeDateInfo(item: any): { isoDate: string; displayDate: string; dayOfWeek: string } {
  let iso = '';
  if (item.dataColeta) {
    const s = String(item.dataColeta).trim();
    if (s.includes('/')) {
      const parts = s.split('/');
      if (parts.length === 3) {
        const d = parts[0].padStart(2, '0');
        const m = parts[1].padStart(2, '0');
        const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        iso = `${y}-${m}-${d}`;
      }
    } else if (s.includes('-')) {
      iso = s.slice(0, 10);
    }
  }

  if (!iso) {
    const raw = item.cadastradoEm || (item as any).dataISO || (item as any).dataRegistro || (item as any).criadoEm || (item as any).createdAt || (item as any).data;
    if (raw) {
      const s = String(raw).trim();
      if (s.includes('T')) iso = s.split('T')[0];
      else if (s.includes('-') && s.length >= 10) iso = s.slice(0, 10);
      else if (s.includes('/')) {
        const parts = s.split('/');
        if (parts.length === 3) {
          const d = parts[0].padStart(2, '0');
          const m = parts[1].padStart(2, '0');
          const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
          iso = `${y}-${m}-${d}`;
        }
      }
    }
  }

  if (!iso) {
    iso = new Date().toISOString().split('T')[0];
  }

  let displayDate = iso;
  let dayOfWeek = '';
  try {
    const [y, m, d] = iso.split('-');
    displayDate = `${d}/${m}/${y}`;
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    dayOfWeek = daysOfWeek[dt.getDay()] || '';
  } catch (e) {}

  return { isoDate: iso, displayDate, dayOfWeek };
}

export const ValidadesRecolhidasModal: React.FC<ValidadesRecolhidasModalProps> = ({
  isOpen,
  onClose,
  validades,
  selectedKeys,
  onToggleKey,
  onSelectAll,
  onDeselectAll,
  onSelectDate,
  onSelectLatestOnly,
  onSelectOnlyThisDate,
  onSelectOnlyThisKey,
  onOpenImport030519,
  empresaProdutos = []
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('todas');
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  // Group items by collection date
  const { dateGroups, sortedDateKeys, totalBoxesSelected, totalBoxesAll } = useMemo(() => {
    const groups: Record<string, {
      dateInfo: { isoDate: string; displayDate: string; dayOfWeek: string };
      items: { item: ValidadeRow; key: string; index: number; diasRestantes: number; faixa: 'critico' | 'atencao' | 'ok'; isSelected: boolean; totalCx: number }[];
    }> = {};

    let selCx = 0;
    let totCx = 0;

    validades.forEach((item, idx) => {
      if (isValidadeDeleted(item, (item as any).empresaId || 'demo')) return;
      const qty = getValidadeQty(item);
      if (qty <= 0) return; // Quantidades zeradas não entram na lista

      const key = getValidadeUniqueId(item, idx);
      const isSelected = selectedKeys.has(key);
      const dateInfo = getValidadeDateInfo(item);

      totCx += qty;
      if (isSelected) selCx += qty;

      const calc = calculateStockAgeIndex({
        codigo: item.codigo,
        descricao: item.descricao,
        validade: item.validade
      }, empresaProdutos);

      const diasRestantes = calc.diasRestantes;
      // Regras estritas:
      // VERMELHO: 30 dias ou menos (<= 30)
      const isVermelho = diasRestantes <= 30;
      // AMARELO: 31 a 60 dias (31 a 60)
      const isAmarelo = diasRestantes >= 31 && diasRestantes <= 60;
      // VERDE: o resto (> 60 dias)
      const faixa: 'critico' | 'atencao' | 'ok' = isVermelho ? 'critico' : (isAmarelo ? 'atencao' : 'ok');

      if (!groups[dateInfo.isoDate]) {
        groups[dateInfo.isoDate] = {
          dateInfo,
          items: []
        };
      }

      groups[dateInfo.isoDate].items.push({
        item,
        key,
        index: idx,
        diasRestantes,
        faixa,
        isSelected,
        totalCx: qty
      });
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

    return {
      dateGroups: groups,
      sortedDateKeys: sortedKeys,
      totalBoxesSelected: selCx,
      totalBoxesAll: totCx
    };
  }, [validades, selectedKeys, empresaProdutos]);

  // Filtered groups based on search & date dropdown
  const filteredGroups = useMemo(() => {
    const result: typeof dateGroups = {};
    const q = searchFilter.toLowerCase().trim();

    sortedDateKeys.forEach(dKey => {
      if (dateFilter !== 'todas' && dKey !== dateFilter) return;

      const g = dateGroups[dKey];
      const matchingItems = g.items.filter(entry => {
        if (!q) return true;
        const cod = String(entry.item.codigo || '').toLowerCase();
        const desc = String(entry.item.descricao || '').toLowerCase();
        const blo = String(entry.item.bloco || '').toLowerCase();
        const loc = String(entry.item.localizacao || '').toLowerCase();
        const resp = String(entry.item.responsavel || entry.item.cadastradoPor || '').toLowerCase();
        return cod.includes(q) || desc.includes(q) || blo.includes(q) || loc.includes(q) || resp.includes(q);
      });

      if (matchingItems.length > 0) {
        result[dKey] = {
          dateInfo: g.dateInfo,
          items: matchingItems
        };
      }
    });

    return result;
  }, [dateGroups, sortedDateKeys, searchFilter, dateFilter]);

  const filteredDateKeys = Object.keys(filteredGroups).sort((a, b) => b.localeCompare(a));
  const selectedCount = selectedKeys.size;
  const totalCount = validades.length;

  const toggleDateGroupOpen = (dateKey: string) => {
    setExpandedDates(prev => ({
      ...prev,
      [dateKey]: prev[dateKey] === undefined ? false : !prev[dateKey]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-6xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 font-sans"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#032b5e] to-[#04408c] text-white p-4 sm:p-5 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-400/20 border border-sky-300/30 flex items-center justify-center text-sky-200 shadow-inner">
              <Layers className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="font-black text-sm sm:text-base tracking-wide text-white uppercase">
                  Selecionar Validades Recolhidas para o Dashboard
                </h2>
                <span className="text-[11px] font-black uppercase bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-xs">
                  {selectedCount} de {totalCount} Lotes Ativos
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-sky-200/90 font-medium mt-0.5">
                Marque ou desmarque os lotes e coletas do conferente que devem compor os cálculos e a lista do seu Dashboard.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/20 cursor-pointer ml-2"
            title="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Toolbar */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 shrink-0 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={onSelectAll}
                className="px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg bg-[#032b5e] hover:bg-[#021d40] text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                title="Selecionar todos os lotes"
              >
                <CheckSquare className="w-3.5 h-3.5 text-sky-300" />
                <span>Selecionar Todas ({totalCount})</span>
              </button>

              <button
                type="button"
                onClick={onDeselectAll}
                className="px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                title="Desmarcar todos os lotes"
              >
                <Square className="w-3.5 h-3.5 text-slate-400" />
                <span>Desmarcar Todas</span>
              </button>

              <button
                type="button"
                onClick={onSelectLatestOnly}
                className="px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                title="Selecionar apenas os lotes da coleta mais recente"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Apenas Última Coleta</span>
              </button>

              <button
                type="button"
                onClick={onOpenImport030519}
                className="px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                title="Importar planilha 03.05.19 para atualizar Venda Média e Dias de Estoque"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                <span>Importar 03.05.19</span>
              </button>
            </div>

            {/* Selection volume pill */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600">
                Volume Selecionado:
              </span>
              <span className="text-xs font-black text-[#032b5e] bg-sky-100 border border-sky-300 px-3 py-1 rounded-lg">
                {totalBoxesSelected.toLocaleString('pt-BR')} cx / {totalBoxesAll.toLocaleString('pt-BR')} cx
              </span>
            </div>
          </div>

          {/* Search & Date Filter Row */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                placeholder="Filtrar por SKU, produto, rua/bloco ou conferente..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-sans shadow-2xs"
              />
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <Calendar className="w-4 h-4 text-slate-500" />
              <select
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="text-xs bg-white py-2 px-3 rounded-lg border border-slate-300 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
              >
                <option value="todas">Todas as Coletas ({sortedDateKeys.length} datas)</option>
                {sortedDateKeys.map(k => {
                  const g = dateGroups[k];
                  return (
                    <option key={k} value={k}>
                      {g.dateInfo.displayDate} ({g.items.length} lotes)
                    </option>
                  );
                })}
              </select>

              {dateFilter !== 'todas' && (
                <button
                  type="button"
                  onClick={() => onSelectOnlyThisDate(dateFilter)}
                  className="px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg bg-sky-700 hover:bg-sky-800 text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  title="Selecionar apenas os lotes desta coleta para o Dashboard"
                >
                  <Check className="w-3.5 h-3.5 text-sky-200" />
                  <span>Carregar Esta Coleta</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Groups & Lots Table */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3 bg-slate-100/60">
          {filteredDateKeys.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs font-bold shadow-2xs">
              Nenhum lote de validade encontrado com os filtros atuais.
            </div>
          ) : (
            filteredDateKeys.map(dateKey => {
              const group = filteredGroups[dateKey];
              const allDateSelected = group.items.every(it => it.isSelected);
              const someDateSelected = group.items.some(it => it.isSelected);
              const isGroupExpanded = expandedDates[dateKey] !== false;

              return (
                <div key={dateKey} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  {/* Date Group Header */}
                  <div className="bg-slate-100/90 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={allDateSelected}
                          ref={el => {
                            if (el) el.indeterminate = someDateSelected && !allDateSelected;
                          }}
                          onChange={e => onSelectDate(dateKey, e.target.checked)}
                          className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                        />
                        <span className="font-sans font-black text-xs text-[#032b5e] uppercase tracking-wider flex items-center gap-1.5">
                          📅 Coleta de {group.dateInfo.displayDate} — {group.dateInfo.dayOfWeek}
                        </span>
                      </label>

                      <span className="text-[10px] font-black bg-sky-100 text-sky-900 border border-sky-300 px-2.5 py-0.5 rounded-full">
                        {group.items.filter(it => it.isSelected).length} de {group.items.length} lotes
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectOnlyThisDate(dateKey);
                        }}
                        className="px-2.5 py-1 text-[11px] font-black uppercase tracking-wider rounded-md bg-sky-700 hover:bg-sky-800 text-white flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                        title="Exibir somente as validades desta coleta no Dashboard"
                      >
                        <Check className="w-3 h-3 text-sky-200" />
                        <span>Apenas Esta Coleta</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleDateGroupOpen(dateKey)}
                        className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 p-1 cursor-pointer"
                      >
                        <span className="text-[10px] hidden xs:inline">{isGroupExpanded ? 'Recolher' : 'Expandir'}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isGroupExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Lots Table under Date */}
                  {isGroupExpanded && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[850px]">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 font-extrabold text-[10px] uppercase tracking-wider border-b border-slate-200">
                            <th className="p-2.5 text-center w-10">Sel.</th>
                            <th className="p-2.5 text-center w-28">Ação Direta</th>
                            <th className="p-2.5 w-20">SKU</th>
                            <th className="p-2.5">Descrição do Produto</th>
                            <th className="p-2.5 text-center w-28">Validade</th>
                            <th className="p-2.5 text-center w-28">Status Venc.</th>
                            <th className="p-2.5 text-right w-24">Qtd. (cx)</th>
                            <th className="p-2.5 w-32">Localização</th>
                            <th className="p-2.5 w-36">Conferente</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-mono">
                          {group.items.map(({ item, key, diasRestantes, faixa, isSelected, totalCx }) => {
                            let badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                            let badgeText = `${diasRestantes}d (Seguro)`;
                            if (faixa === 'critico') {
                              badgeStyle = 'bg-rose-100 text-rose-800 border-rose-300 font-black';
                              badgeText = diasRestantes <= 0 ? '⛔ Vencido' : `🔴 ${diasRestantes}d (<=30d)`;
                            } else if (faixa === 'atencao') {
                              badgeStyle = 'bg-amber-100 text-amber-900 border-amber-300 font-black';
                              badgeText = `🟡 ${diasRestantes}d (Alerta)`;
                            }

                            return (
                              <tr 
                                key={key} 
                                onClick={() => onToggleKey(key)}
                                className={`cursor-pointer transition-colors ${
                                  isSelected ? 'bg-sky-50/50 hover:bg-sky-100/60' : 'bg-white hover:bg-slate-50 opacity-60'
                                }`}
                              >
                                <td 
                                  className="p-2.5 text-center cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleKey(key);
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    readOnly
                                    className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer pointer-events-none"
                                  />
                                </td>
                                <td className="p-2 text-center" onClick={e => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={() => onSelectOnlyThisKey(key)}
                                    className="px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded bg-sky-100 hover:bg-sky-200 text-[#032b5e] border border-sky-300 transition-colors cursor-pointer whitespace-nowrap"
                                    title="Exibir somente este lote no Dashboard"
                                  >
                                    Apenas Este
                                  </button>
                                </td>
                                <td className="p-2.5 font-black text-slate-800">{item.codigo}</td>
                                <td className="p-2.5 font-sans font-bold text-slate-800">{item.descricao}</td>
                                <td className="p-2.5 text-center font-bold text-slate-700 font-mono">{formatDateToBR(item.validade)}</td>
                                <td className="p-2.5 text-center">
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${badgeStyle}`}>
                                    {badgeText}
                                  </span>
                                </td>
                                <td className="p-2.5 text-right font-black text-slate-900">{totalCx.toLocaleString('pt-BR')}</td>
                                <td className="p-2.5 font-sans text-[11px] text-slate-600">
                                  {item.localizacao === 'picking' ? 'Picking' : `Central - ${item.bloco || 'Geral'}`}
                                </td>
                                <td className="p-2.5 font-sans text-[11px] text-slate-500 truncate max-w-[140px]">
                                  {item.responsavel || item.cadastradoPor || 'Conferente'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white px-5 py-3.5 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs font-bold text-slate-600">
            <span className="font-extrabold text-[#032b5e]">{selectedCount}</span> de <span className="font-extrabold">{totalCount}</span> lotes selecionados ({totalBoxesSelected.toLocaleString('pt-BR')} cx)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors cursor-pointer"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-extrabold text-white bg-[#032b5e] hover:bg-[#021d40] rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Concluir e Atualizar Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
