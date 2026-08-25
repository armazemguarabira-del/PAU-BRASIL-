import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  Layers, 
  User, 
  Calendar, 
  HelpCircle, 
  Target, 
  FileText, 
  ShieldCheck, 
  Sparkles, 
  Edit3, 
  ExternalLink,
  CheckSquare,
  Square,
  Trash2,
  Share2,
  Info,
  Zap,
  Tag
} from 'lucide-react';
import { AcaoCorretiva, getDashboardForProcessOrIndicator } from '../utils/simulacaoAcoesUtils';

export interface ActionDetailModalProps {
  acao: AcaoCorretiva | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleStatus?: (id: string, currentStatus: string) => void;
  onSaveAction?: (updated: AcaoCorretiva) => void;
  onDeleteAction?: (id: string) => void;
  onOpenJustifyModal?: (acao: AcaoCorretiva) => void;
  userName?: string;
  theme?: 'light' | 'dark';
}

export const ActionDetailModal: React.FC<ActionDetailModalProps> = ({
  acao,
  isOpen,
  onClose,
  onToggleStatus,
  onSaveAction,
  onDeleteAction,
  onOpenJustifyModal,
  userName = 'Supervisor DPO',
  theme = 'light'
}) => {
  if (!isOpen || !acao) return null;

  const isDark = theme === 'dark';
  const dashboardInfo = getDashboardForProcessOrIndicator(acao.processo, acao.indicador);

  const handleNavigateToDashboard = () => {
    if (typeof window !== 'undefined' && dashboardInfo.id) {
      window.dispatchEvent(new CustomEvent('app_navigate', { detail: dashboardInfo.id }));
      onClose();
    }
  };

  const isConcluido = acao.status === 'Concluído';
  const isAtrasado = acao.status === 'Atrasado';

  const resolvedClassificacao = acao.classificacao || (
    acao.tipoAcao === 'Melhoria' 
      ? 'Ação de Melhoria' 
      : (acao.indicador?.toLowerCase().includes('rotina') || acao.desvioEncontrado?.toLowerCase().includes('rotina')) 
      ? 'Ação de Rotina' 
      : 'Ação de Desvio'
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div 
        id="action-detail-modal-container"
        className={`w-full max-w-3xl rounded-2xl shadow-2xl border overflow-hidden my-auto flex flex-col max-h-[92vh] ${
          isDark ? 'bg-[#0f172a] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* HEADER MODAL */}
        <div className={`p-4 sm:p-5 border-b flex items-start justify-between gap-3 ${
          isDark ? 'border-slate-800 bg-[#111c33]' : 'border-slate-200 bg-slate-50/80'
        }`}>
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* BADGE DE CLASSIFICAÇÃO */}
              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${
                resolvedClassificacao === 'Ação de Desvio'
                  ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30'
                  : resolvedClassificacao === 'Ação de Rotina'
                  ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/30'
                  : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
              }`}>
                <Tag className="w-3 h-3" />
                {resolvedClassificacao}
              </span>

              {/* PROCESSO */}
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                {acao.processo}
              </span>

              {/* STATUS */}
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                isConcluido
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  : isAtrasado
                  ? 'bg-rose-600 text-white animate-pulse'
                  : acao.status === 'Em Andamento'
                  ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30'
                  : 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30'
              }`}>
                {isConcluido ? <CheckCircle2 className="w-3 h-3" /> : isAtrasado ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                <span>{isAtrasado ? 'ATRASADO / VENCIDO' : acao.status}</span>
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white truncate">
              {acao.desvioEncontrado || acao.indicador}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              ID: {acao.id} • Cadastrado em: {acao.data} {acao.hora || '08:00'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer shrink-0"
            title="Fechar Detalhes"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CORPO DE DETALHES ROLÁVEL */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* BANNER DE DIRECIONAMENTO AO DASHBOARD */}
          <div className="p-3.5 bg-gradient-to-r from-indigo-500/10 via-sky-500/10 to-transparent border border-indigo-500/30 dark:border-indigo-500/40 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-black uppercase text-[10px]">
                <Zap className="w-3.5 h-3.5 text-indigo-500" />
                <span>Indicador Associado na Plataforma:</span>
              </div>
              <strong className="text-sm font-black text-slate-900 dark:text-white block">
                {acao.indicador}
              </strong>
              <span className="text-[11px] text-slate-600 dark:text-slate-300">
                Dashboard Correspondente: <strong>{dashboardInfo.label}</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={handleNavigateToDashboard}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs transition-all cursor-pointer shadow-md flex items-center gap-2 shrink-0 w-full sm:w-auto justify-center"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ir para o Dashboard</span>
            </button>
          </div>

          {/* GRID METAS E RESULTADOS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 dark:bg-[#111a30] rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Meta Diária</span>
              <strong className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">{acao.meta || '100% Padrão'}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Resultado Obtido</span>
              <strong className="text-xs font-black text-rose-600 dark:text-rose-400 font-mono">{acao.resultadoObtido || 'Desvio'}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Setor / Área</span>
              <strong className="text-xs font-black text-slate-700 dark:text-slate-200 truncate block">{acao.setor || acao.area || 'Armazém'}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Prazo Estipulado</span>
              <strong className={`text-xs font-black font-mono ${isAtrasado ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                {acao.prazo}
              </strong>
            </div>
          </div>

          {/* O QUE FAZER & CONTRAMEDIDA EXECUTADA */}
          <div className="space-y-3">
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5">
              <span className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Desvio Identificado / O que Fazer:
              </span>
              <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                {acao.desvioEncontrado || acao.indicador}
              </p>
            </div>

            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1.5">
              <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Contramedida Estipulada / O que Foi Feito para Corrigir:
              </span>
              <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold leading-relaxed">
                {acao.contramedida || 'Ajuste operacional executado e conferido no padrão DPO.'}
              </p>
            </div>
          </div>

          {/* 5 PORQUÊS & CAUSA RAIZ */}
          {acao.cincoPorques && (
            <div className="p-4 bg-slate-50 dark:bg-[#111a30] rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                  Análise de Causa Raiz (4M: {acao.causaRaiz || 'Método'})
                </span>
                <span className="text-[10px] text-slate-500 font-mono">5 Porquês Estruturados</span>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                {acao.cincoPorques.porque1 && <p><strong className="text-indigo-600 dark:text-indigo-400 font-mono">1º Por quê:</strong> {acao.cincoPorques.porque1}</p>}
                {acao.cincoPorques.porque2 && <p><strong className="text-indigo-600 dark:text-indigo-400 font-mono">2º Por quê:</strong> {acao.cincoPorques.porque2}</p>}
                {acao.cincoPorques.porque3 && <p><strong className="text-indigo-600 dark:text-indigo-400 font-mono">3º Por quê:</strong> {acao.cincoPorques.porque3}</p>}
                {acao.cincoPorques.porque4 && <p><strong className="text-indigo-600 dark:text-indigo-400 font-mono">4º Por quê:</strong> {acao.cincoPorques.porque4}</p>}
                {acao.cincoPorques.porque5 && <p><strong className="text-rose-600 dark:text-rose-400 font-mono font-bold">5º Por quê (Raiz):</strong> {acao.cincoPorques.porque5}</p>}
              </div>
            </div>
          )}

          {/* AUDITORIA: ABERTURA, FECHAMENTO & GOVERNANÇA */}
          <div className="p-4 bg-slate-50 dark:bg-[#111a30] rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 block border-b border-slate-200 dark:border-slate-800 pb-1.5">
              Auditoria de Governança e Rastreabilidade
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">🔓 ABERTO POR:</span>
                <strong className="text-indigo-600 dark:text-indigo-300">{acao.abertoPor || acao.responsavelTratativa || 'Supervisor DPO'}</strong>
                <span className="text-slate-500 font-mono block text-[10px]">{acao.dataAbertura || `${acao.data} 08:00`}</span>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">🏁 FECHADO POR:</span>
                {isConcluido ? (
                  <>
                    <strong className="text-emerald-600 dark:text-emerald-300">{acao.fechadoPor || acao.colaboradorResponsavel || userName}</strong>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono block text-[10px]">{acao.dataFechamento || `${acao.data} 17:00`}</span>
                  </>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">Aguardando Conclusão</span>
                )}
              </div>
            </div>

            {/* APROVAÇÃO DO GESTOR & ACEITE */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500">Aprovação do Gestor:</span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                  acao.aprovacaoGestor === 'Aprovado'
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                }`}>
                  {acao.aprovacaoGestor || 'Aprovado'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Termo "Li e estou de acordo" assinado</span>
              </div>
            </div>
          </div>

        </div>

        {/* BARRA INFERIOR DE AÇÕES */}
        <div className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
          isDark ? 'border-slate-800 bg-[#111c33]' : 'border-slate-200 bg-slate-50/80'
        }`}>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-start">
            {onDeleteAction && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Deseja realmente excluir a ação ${acao.id}?`)) {
                    onDeleteAction(acao.id);
                    onClose();
                  }
                }}
                className="px-3 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border border-rose-500/30 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                title="Excluir Ação"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            )}

            {isAtrasado && onOpenJustifyModal && (
              <button
                type="button"
                onClick={() => {
                  onOpenJustifyModal(acao);
                  onClose();
                }}
                className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black text-xs transition-all cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Reagendar Prazo</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleNavigateToDashboard}
              className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border border-indigo-500/40 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver no Dashboard</span>
            </button>

            {onToggleStatus && (
              <button
                type="button"
                onClick={() => {
                  onToggleStatus(acao.id, acao.status);
                  onClose();
                }}
                className={`px-4 py-2 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-md ${
                  isConcluido
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isConcluido ? 'Reabrir Ação' : 'Concluir Ação Agora'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
