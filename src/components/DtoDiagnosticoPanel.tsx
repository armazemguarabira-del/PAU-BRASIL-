import React, { useState, useEffect, useMemo } from 'react';
import { Usuario, Empresa } from '../types';
import { 
  DtoOperacaoId, 
  DtoRegistro, 
  DtoItemResposta, 
  DtoPlanoAcao,
  DtoOperacaoConfig 
} from '../types/dto';
import { DTO_OPERACOES_CONFIG } from '../data/dtoOperacoesData';
import { DtoService } from '../services/dtoService';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  User, 
  Building2, 
  Search, 
  Filter, 
  PlusCircle, 
  Calendar, 
  History, 
  Award, 
  BarChart3, 
  Printer, 
  Download, 
  Upload, 
  Trash2, 
  ChevronRight, 
  ChevronDown, 
  Package, 
  Droplets, 
  Truck, 
  Container, 
  Layers, 
  CalendarCheck, 
  ShieldCheck, 
  Trash, 
  Check, 
  X, 
  AlertCircle,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  Zap,
  Eye,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';

interface DtoDiagnosticoPanelProps {
  user: Usuario | null;
  empresa?: Empresa | null;
  theme?: 'light' | 'dark';
  initialOperacaoId?: DtoOperacaoId;
  onNavigate?: (panel: string) => void;
}

export default function DtoDiagnosticoPanel({
  user,
  empresa,
  theme = 'light',
  initialOperacaoId = 'repack',
  onNavigate
}: DtoDiagnosticoPanelProps) {
  const [activeTab, setActiveTab] = useState<'formulario' | 'historico' | 'estatisticas'>('formulario');
  const [selectedOperacaoId, setSelectedOperacaoId] = useState<DtoOperacaoId>(initialOperacaoId);

  // Sincroniza quando initialOperacaoId mudar
  useEffect(() => {
    if (initialOperacaoId) {
      setSelectedOperacaoId(initialOperacaoId);
      setActiveTab('formulario');
    }
  }, [initialOperacaoId]);

  // Listener para eventos customizados de troca de operação
  useEffect(() => {
    const handleOpenDto = (e: any) => {
      const op = e.detail?.operacao || e.detail;
      if (op && DTO_OPERACOES_CONFIG.some(o => o.id === op)) {
        setSelectedOperacaoId(op as DtoOperacaoId);
        setActiveTab('formulario');
      }
    };
    window.addEventListener('open_dto_operacao', handleOpenDto);
    return () => window.removeEventListener('open_dto_operacao', handleOpenDto);
  }, []);
  
  // Storage state
  const [historico, setHistorico] = useState<DtoRegistro[]>([]);
  const [selectedRegistroVisualizar, setSelectedRegistroVisualizar] = useState<DtoRegistro | null>(null);

  // Form State
  const [dataDto, setDataDto] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [horaDto, setHoraDto] = useState<string>(() => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  const [motivoDto, setMotivoDto] = useState<DtoRegistro['motivoDto']>('meta_nao_batida');
  const [metaEsperada, setMetaEsperada] = useState<string>('');
  const [resultadoRealizado, setResultadoRealizado] = useState<string>('');
  const [indicadorOfensor, setIndicadorOfensor] = useState<string>('');
  const [avaliadorNome, setAvaliadorNome] = useState<string>(user?.nome || 'Supervisor DPO');
  const [avaliadorCargo, setAvaliadorCargo] = useState<string>(user?.cargo || 'Supervisor de Armazém');
  const [colaboradorNome, setColaboradorNome] = useState<string>('');
  const [turno, setTurno] = useState<DtoRegistro['turno']>('1º Turno');
  const [linhaOuBox, setLinhaOuBox] = useState<string>('');
  const [observacaoGeral, setObservacaoGeral] = useState<string>('');
  
  // Respostas do formulário
  const [respostas, setRespostas] = useState<Record<string, DtoItemResposta>>({});
  
  // Plano de Ação
  const [planoAcao, setPlanoAcao] = useState<DtoPlanoAcao>({
    oQueFazer: '',
    responsavel: '',
    prazo: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    comoFazer: '',
    status: 'pendente'
  });

  // Filtros do Histórico
  const [filtroOperacao, setFiltroOperacao] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroMotivo, setFiltroMotivo] = useState<string>('todos');
  const [buscaTexto, setBuscaTexto] = useState<string>('');
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>('');
  const [filtroDataFim, setFiltroDataFim] = useState<string>('');

  // Feedback toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Carrega histórico
  useEffect(() => {
    const loadData = () => {
      const data = DtoService.getHistorico(empresa?.id);
      setHistorico(data);
    };
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('dto_historico_updated', handleUpdate);
    return () => window.removeEventListener('dto_historico_updated', handleUpdate);
  }, [empresa?.id]);

  // Configuração da operação ativa
  const operacaoConfig = useMemo(() => {
    return DTO_OPERACOES_CONFIG.find(op => op.id === selectedOperacaoId) || DTO_OPERACOES_CONFIG[0];
  }, [selectedOperacaoId]);

  // Limpa/inicializa respostas ao trocar de operação
  const handleSelectOperacao = (opId: DtoOperacaoId) => {
    setSelectedOperacaoId(opId);
    setRespostas({});
  };

  // Responde item
  const handleRespostaChange = (itemId: string, conforme: boolean) => {
    setRespostas(prev => ({
      ...prev,
      [itemId]: {
        itemId,
        conforme,
        observacao: prev[itemId]?.observacao || ''
      }
    }));
  };

  const handleObservacaoItemChange = (itemId: string, obs: string) => {
    setRespostas(prev => ({
      ...prev,
      [itemId]: {
        itemId,
        conforme: prev[itemId]?.conforme ?? false,
        observacao: obs
      }
    }));
  };

  // Marcar todos como SIM
  const handleMarcarTodosSim = () => {
    const newRespostas: Record<string, DtoItemResposta> = {};
    operacaoConfig.itens.forEach(item => {
      newRespostas[item.id] = {
        itemId: item.id,
        conforme: true,
        observacao: respostas[item.id]?.observacao || ''
      };
    });
    setRespostas(newRespostas);
    showToast('Todos os itens foram marcados como CONFORME (SIM).', 'info');
  };

  // Limpar formulário
  const handleLimparFormulario = () => {
    setRespostas({});
    setColaboradorNome('');
    setMetaEsperada('');
    setResultadoRealizado('');
    setIndicadorOfensor('');
    setLinhaOuBox('');
    setObservacaoGeral('');
    setPlanoAcao({
      oQueFazer: '',
      responsavel: '',
      prazo: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      comoFazer: '',
      status: 'pendente'
    });
    showToast('Formulário redefinido com sucesso.', 'info');
  };

  // Estatísticas do formulário atual
  const formStats = useMemo(() => {
    const totalItens = operacaoConfig.itens.length;
    let conformes = 0;
    let naoConformes = 0;
    let respondidos = 0;

    operacaoConfig.itens.forEach(item => {
      const resp = respostas[item.id];
      if (resp && resp.conforme !== null && resp.conforme !== undefined) {
        respondidos++;
        if (resp.conforme === true) {
          conformes++;
        } else {
          naoConformes++;
        }
      }
    });

    const percentual = respondidos > 0 ? Number(((conformes / totalItens) * 100).toFixed(1)) : 0;
    
    let classificacao: 'conforme' | 'atencao' | 'critico' = 'critico';
    if (percentual >= 90) {
      classificacao = 'conforme';
    } else if (percentual >= 75) {
      classificacao = 'atencao';
    } else {
      classificacao = 'critico';
    }

    return {
      totalItens,
      respondidos,
      conformes,
      naoConformes,
      percentual,
      classificacao,
      pendentes: totalItens - respondidos
    };
  }, [operacaoConfig, respostas]);

  // Salvar Registro de DTO
  const handleSalvarDto = (e: React.FormEvent) => {
    e.preventDefault();

    if (!colaboradorNome.trim()) {
      showToast('Por favor, informe o nome do colaborador ou equipe avaliada.', 'error');
      return;
    }

    if (formStats.respondidos === 0) {
      showToast('Preencha ao menos um item de checklist do DTO antes de salvar.', 'error');
      return;
    }

    const novoRegistro: DtoRegistro = {
      id: `dto-reg-${Date.now()}`,
      empresaId: empresa?.id,
      data: dataDto,
      hora: horaDto,
      dataHoraISO: new Date(`${dataDto}T${horaDto}:00`).toISOString(),
      operacaoId: selectedOperacaoId,
      operacaoNome: operacaoConfig.nome,
      motivoDto,
      metaEsperada: metaEsperada || undefined,
      resultadoRealizado: resultadoRealizado || undefined,
      indicadorOfensor: indicadorOfensor || undefined,
      avaliadorNome: avaliadorNome || user?.nome || 'Supervisor DPO',
      avaliadorCargo: avaliadorCargo || undefined,
      colaboradorNome,
      turno,
      linhaOuBox: linhaOuBox || undefined,
      respostas,
      totalItens: formStats.totalItens,
      itensConformes: formStats.conformes,
      itensNaoConformes: formStats.naoConformes,
      percentualConformidade: formStats.percentual,
      classificacao: formStats.classificacao,
      observacaoGeral: observacaoGeral || undefined,
      planoAcao: formStats.naoConformes > 0 && planoAcao.oQueFazer.trim() ? planoAcao : undefined,
      criadoEm: new Date().toISOString()
    };

    const sucesso = DtoService.saveRegistro(novoRegistro, empresa?.id);
    if (sucesso) {
      showToast(`DTO de ${operacaoConfig.tituloCurto} registrado com sucesso! (${formStats.percentual}% de aderência)`, 'success');
      // Redefine campos parciais
      setRespostas({});
      setColaboradorNome('');
      setMetaEsperada('');
      setResultadoRealizado('');
      setIndicadorOfensor('');
      setObservacaoGeral('');
      setPlanoAcao({
        oQueFazer: '',
        responsavel: '',
        prazo: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        comoFazer: '',
        status: 'pendente'
      });
      // Abre histórico
      setActiveTab('historico');
    } else {
      showToast('Erro ao gravar DTO. Tente novamente.', 'error');
    }
  };

  // Excluir DTO do histórico
  const handleExcluirRegistro = (id: string, operacao: string) => {
    if (window.confirm(`Deseja realmente excluir o registro de DTO da operação ${operacao}?`)) {
      DtoService.deleteRegistro(id, empresa?.id);
      showToast('Registro excluído com sucesso.', 'info');
      if (selectedRegistroVisualizar?.id === id) {
        setSelectedRegistroVisualizar(null);
      }
    }
  };

  // Alternar status de plano de ação
  const handleToggleStatusPlano = (registro: DtoRegistro) => {
    if (!registro.planoAcao) return;
    const nextStatus = registro.planoAcao.status === 'concluido' ? 'em_andamento' : 'concluido';
    const updated: DtoRegistro = {
      ...registro,
      planoAcao: {
        ...registro.planoAcao,
        status: nextStatus
      }
    };
    DtoService.saveRegistro(updated, empresa?.id);
    showToast(`Status do plano de ação alterado para ${nextStatus.toUpperCase()}.`, 'info');
  };

  // Histórico filtrado
  const historicoFiltrado = useMemo(() => {
    return historico.filter(reg => {
      // Filtro Operacao
      if (filtroOperacao !== 'todos' && reg.operacaoId !== filtroOperacao) {
        return false;
      }
      // Filtro Status / Classificacao
      if (filtroStatus !== 'todos' && reg.classificacao !== filtroStatus) {
        return false;
      }
      // Filtro Motivo
      if (filtroMotivo !== 'todos' && reg.motivoDto !== filtroMotivo) {
        return false;
      }
      // Filtro Data Inicio
      if (filtroDataInicio && reg.data < filtroDataInicio) {
        return false;
      }
      // Filtro Data Fim
      if (filtroDataFim && reg.data > filtroDataFim) {
        return false;
      }
      // Busca texto
      if (buscaTexto.trim()) {
        const q = buscaTexto.toLowerCase();
        const matchColab = reg.colaboradorNome.toLowerCase().includes(q);
        const matchAvaliador = reg.avaliadorNome.toLowerCase().includes(q);
        const matchOp = reg.operacaoNome.toLowerCase().includes(q);
        const matchObs = reg.observacaoGeral?.toLowerCase().includes(q);
        const matchPlano = reg.planoAcao?.oQueFazer.toLowerCase().includes(q);
        return matchColab || matchAvaliador || matchOp || matchObs || matchPlano;
      }
      return true;
    });
  }, [historico, filtroOperacao, filtroStatus, filtroMotivo, filtroDataInicio, filtroDataFim, buscaTexto]);

  // Estatísticas gerais
  const estatisticasGerais = useMemo(() => {
    return DtoService.getEstatisticas(empresa?.id);
  }, [historico, empresa?.id]);

  // Ícone por operação
  const getOpIcon = (opId: DtoOperacaoId) => {
    switch (opId) {
      case 'repack': return <Package className="w-4 h-4" />;
      case 'despejo': return <Droplets className="w-4 h-4" />;
      case 'quebras': return <AlertTriangle className="w-4 h-4" />;
      case 'efc': return <Truck className="w-4 h-4" />;
      case 'efd': return <Container className="w-4 h-4" />;
      case 'montagem': return <Layers className="w-4 h-4" />;
      case 'validades': return <CalendarCheck className="w-4 h-4" />;
      case 'blitz-puxada': return <ShieldCheck className="w-4 h-4" />;
      case 'blitz-refugo': return <Trash className="w-4 h-4" />;
      default: return <ClipboardCheck className="w-4 h-4" />;
    }
  };

  return (
    <div className={`space-y-6 pb-12 transition-colors duration-200 ${
      theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
    }`}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-xs sm:text-sm font-semibold transition-all animate-bounce ${
          toastMessage.type === 'success'
            ? 'bg-emerald-950 text-emerald-100 border-emerald-500/50'
            : toastMessage.type === 'error'
            ? 'bg-rose-950 text-rose-100 border-rose-500/50'
            : 'bg-blue-950 text-blue-100 border-blue-500/50'
        }`}>
          {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toastMessage.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
          {toastMessage.type === 'info' && <Info className="w-5 h-5 text-blue-400 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* HEADER PRINCIPAL */}
      <div className={`rounded-2xl p-4 sm:p-6 mb-6 border shadow-sm relative overflow-hidden backdrop-blur-md ${
        theme === 'dark'
          ? 'bg-[#11151c]/90 border-[#1c2530] text-slate-100'
          : 'bg-white/90 border-blue-200/80 shadow-[0_4px_25px_rgba(30,86,240,0.05)]'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-xs">
                DPO • Ferramentas de Gestão
              </span>
              <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Padrão Ambev / DPO Armazém
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-2.5">
              <ClipboardCheck className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
              DTO - Diagnóstico do Trabalho Operacional
            </h1>
            <p className={`text-xs sm:text-sm mt-1 max-w-3xl ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Instrumento técnico aplicado prioritariamente <strong className="text-rose-500">quando a operação não bate a meta</strong> ou para auditoria de rotina, abrangendo as 9 frentes operacionais do armazém com cálculo automático de aderência e registro de auditoria permanente.
            </p>
          </div>

          {/* Quick Tabs */}
          <div className="flex items-center gap-2 self-start lg:self-center">
            <button
              type="button"
              onClick={() => setActiveTab('formulario')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all ${
                activeTab === 'formulario'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : theme === 'dark'
                  ? 'bg-[#151b23] text-slate-300 hover:bg-[#1c2530]'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Aplicar Novo DTO</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('historico')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all relative ${
                activeTab === 'historico'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : theme === 'dark'
                  ? 'bg-[#151b23] text-slate-300 hover:bg-[#1c2530]'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Histórico Registrado</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-blue-500 text-white">
                {historico.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('estatisticas')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all ${
                activeTab === 'estatisticas'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : theme === 'dark'
                  ? 'bg-[#151b23] text-slate-300 hover:bg-[#1c2530]'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Indicadores & BI</span>
            </button>
          </div>
        </div>

        {/* Mini KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
          <div className={`p-2.5 rounded-xl border flex items-center justify-between backdrop-blur-xs ${
            theme === 'dark' ? 'bg-[#151b23]/80 border-[#222d3a]' : 'bg-white/70 border-slate-200/90 shadow-2xs'
          }`}>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">DTOs Realizados</span>
              <span className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400">
                {estatisticasGerais.total}
              </span>
            </div>
            <ClipboardCheck className="w-5 h-5 text-blue-500 opacity-60" />
          </div>

          <div className={`p-2.5 rounded-xl border flex items-center justify-between backdrop-blur-xs ${
            theme === 'dark' ? 'bg-[#151b23]/80 border-[#222d3a]' : 'bg-white/70 border-slate-200/90 shadow-2xs'
          }`}>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Média de Aderência</span>
              <span className={`text-base sm:text-lg font-black ${
                estatisticasGerais.mediaConformidade >= 90
                  ? 'text-emerald-500'
                  : estatisticasGerais.mediaConformidade >= 75
                  ? 'text-amber-500'
                  : 'text-rose-500'
              }`}>
                {estatisticasGerais.mediaConformidade}%
              </span>
            </div>
            <Award className="w-5 h-5 text-emerald-500 opacity-60" />
          </div>

          <div className={`p-2.5 rounded-xl border flex items-center justify-between backdrop-blur-xs ${
            theme === 'dark' ? 'bg-[#151b23]/80 border-[#222d3a]' : 'bg-white/70 border-slate-200/90 shadow-2xs'
          }`}>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Gatilhos (Meta Não Batida)</span>
              <span className="text-base sm:text-lg font-black text-rose-500">
                {estatisticasGerais.metaNaoBatidaCount}
              </span>
            </div>
            <AlertTriangle className="w-5 h-5 text-rose-500 opacity-60" />
          </div>

          <div className={`p-2.5 rounded-xl border flex items-center justify-between backdrop-blur-xs ${
            theme === 'dark' ? 'bg-[#151b23]/80 border-[#222d3a]' : 'bg-white/70 border-slate-200/90 shadow-2xs'
          }`}>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Planos de Ação Pendentes</span>
              <span className="text-base sm:text-lg font-black text-amber-500">
                {estatisticasGerais.planosAcaoAbertos}
              </span>
            </div>
            <Sliders className="w-5 h-5 text-amber-500 opacity-60" />
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════
          ABA 1: FORMULÁRIO DE APLICAÇÃO DE DTO
          ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'formulario' && (
        <div className="space-y-6">
          
          {/* SELETOR DAS 9 OPERAÇÕES (CARD BRANCO) */}
          <div className={`rounded-2xl p-4 sm:p-5 border shadow-sm relative overflow-hidden backdrop-blur-md space-y-3 ${
            theme === 'dark'
              ? 'bg-[#11151c]/90 border-[#1c2530] text-slate-100'
              : 'bg-white/90 border-blue-200/80 shadow-[0_4px_25px_rgba(30,86,240,0.05)]'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span>1. Selecione a Operação para o DTO:</span>
                <span className="text-blue-600 dark:text-blue-400 font-black">({DTO_OPERACOES_CONFIG.length} Operações Mapeadas)</span>
              </label>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Operação selecionada: <strong className="text-blue-600 dark:text-blue-400">{operacaoConfig.nome}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-2">
              {DTO_OPERACOES_CONFIG.map(op => {
                const isSelected = op.id === selectedOperacaoId;
                const opCount = historico.filter(h => h.operacaoId === op.id).length;
                return (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => handleSelectOperacao(op.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20 ring-2 ring-blue-400/50'
                        : theme === 'dark'
                        ? 'bg-[#151b23] border-[#222d3a] text-slate-300 hover:border-blue-500/40 hover:bg-[#1c2530]'
                        : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/60 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      }`}>
                        {getOpIcon(op.id)}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {op.sigla}
                      </span>
                    </div>
                    <div className="font-extrabold text-xs leading-tight line-clamp-1">
                      {op.tituloCurto}
                    </div>
                    <div className={`text-[10px] mt-1 flex items-center justify-between ${
                      isSelected ? 'text-blue-100' : 'text-slate-400'
                    }`}>
                      <span>{op.itens.length} itens</span>
                      <span>{opCount} DTOs</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CARD DO FORMULÁRIO */}
          <form onSubmit={handleSalvarDto} className={`rounded-2xl border p-4 sm:p-6 space-y-6 backdrop-blur-md ${
            theme === 'dark' ? 'bg-[#11151c]/90 border-[#1c2530]' : 'bg-white/90 border-slate-200/90 shadow-sm'
          }`}>
            
            {/* CABEÇALHO DO DIAGNÓSTICO */}
            <div className="border-b border-slate-200/80 dark:border-slate-800 pb-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Cabeçalho da Auditoria • {operacaoConfig.badge}
                  </span>
                  <h2 className="text-lg font-black">
                    Formulário de Diagnóstico Operacional: {operacaoConfig.nome}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {operacaoConfig.descricao}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleMarcarTodosSim}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 cursor-pointer flex items-center gap-1.5 transition-all"
                    title="Preenche todos os itens com SIM de forma rápida"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Marcar Todos SIM (100%)
                  </button>
                  <button
                    type="button"
                    onClick={handleLimparFormulario}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Limpar
                  </button>
                </div>
              </div>

              {/* CAMPOS DO CABEÇALHO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-2">
                {/* Data e Hora */}
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                    Data da Aplicação *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={dataDto}
                      onChange={e => setDataDto(e.target.value)}
                      required
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none ${
                        theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    />
                    <input
                      type="time"
                      value={horaDto}
                      onChange={e => setHoraDto(e.target.value)}
                      required
                      className={`w-28 px-2 py-2 rounded-xl border text-xs font-bold outline-none text-center ${
                        theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>
                </div>

                {/* Motivo do DTO */}
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                    Gatilho / Motivo do DTO *
                  </label>
                  <select
                    value={motivoDto}
                    onChange={e => setMotivoDto(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none cursor-pointer ${
                      motivoDto === 'meta_nao_batida'
                        ? 'border-rose-500/60 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        : theme === 'dark'
                        ? 'bg-[#151b23] border-[#222d3a] text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="meta_nao_batida">🔴 Meta Não Batida (Gatilho DPO)</option>
                    <option value="aumento_perdas">🟡 Aumento de Avarias / Perdas</option>
                    <option value="auditoria_rotina">🔵 Auditoria de Rotina DPO</option>
                    <option value="reciclagem_treinamento">🟣 Treinamento / Reciclagem</option>
                    <option value="solicitacao_gestao">⚪ Solicitação da Gestão</option>
                  </select>
                </div>

                {/* Colaborador / Equipe */}
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                    Colaborador / Equipe Avaliada *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: João da Silva / Operador Doca 02"
                    value={colaboradorNome}
                    onChange={e => setColaboradorNome(e.target.value)}
                    required
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none ${
                      theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                {/* Avaliador / Responsável */}
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                    Avaliador (Supervisor / Monitor)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Carlos Eduardo (Supervisor)"
                    value={avaliadorNome}
                    onChange={e => setAvaliadorNome(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none ${
                      theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              {/* CAMPOS ADICIONAIS: Turno, Local e Indicador de Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 pt-1">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                    Turno
                  </label>
                  <select
                    value={turno}
                    onChange={e => setTurno(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none cursor-pointer ${
                      theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="1º Turno">1º Turno (Manhã)</option>
                    <option value="2º Turno">2º Turno (Tarde/Noite)</option>
                    <option value="3º Turno">3º Turno (Madrugada)</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Geral">Geral / Misto</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                    Posto / Box / Linha
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Bancada 01 / Doca 04 / Rua 06"
                    value={linhaOuBox}
                    onChange={e => setLinhaOuBox(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none ${
                      theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                {motivoDto === 'meta_nao_batida' && (
                  <>
                    <div>
                      <label className="text-[11px] font-bold uppercase text-rose-500 block mb-1">
                        Meta Esperada
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 28 cx/h ou < 40 min"
                        value={metaEsperada}
                        onChange={e => setMetaEsperada(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl border border-rose-400/40 text-xs font-bold outline-none ${
                          theme === 'dark' ? 'bg-[#151b23] text-white' : 'bg-rose-50/50 text-slate-800'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold uppercase text-rose-500 block mb-1">
                        Resultado Realizado (Desvio)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 18 cx/h (-35%)"
                        value={resultadoRealizado}
                        onChange={e => setResultadoRealizado(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl border border-rose-400/40 text-xs font-bold outline-none ${
                          theme === 'dark' ? 'bg-[#151b23] text-white' : 'bg-rose-50/50 text-slate-800'
                        }`}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* CHECKLIST DE ITENS DA OPERAÇÃO */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-black flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-600" />
                    Checklist de Verificação Operacional ({operacaoConfig.itens.length} Itens Técnicos)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Avalie cada critério marcando <strong className="text-emerald-500">SIM</strong> (Conforme) ou <strong className="text-rose-500">NÃO</strong> (Não Conforme).
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-400 block">Progresso da Avaliação</span>
                  <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                    {formStats.respondidos} de {formStats.totalItens} respondidos ({Math.round((formStats.respondidos / formStats.totalItens) * 100)}%)
                  </span>
                </div>
              </div>

              {/* LISTA DOS ITENS */}
              <div className="space-y-3">
                {operacaoConfig.itens.map((item, index) => {
                  const resposta = respostas[item.id];
                  const isSim = resposta?.conforme === true;
                  const isNao = resposta?.conforme === false;
                  const isUnset = resposta?.conforme === null || resposta?.conforme === undefined;

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                        isSim
                          ? 'border-emerald-500/40 bg-emerald-500/5'
                          : isNao
                          ? 'border-rose-500/40 bg-rose-500/5 ring-1 ring-rose-500/20'
                          : theme === 'dark'
                          ? 'bg-[#151b23]/50 border-[#222d3a]'
                          : 'bg-slate-50/70 border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-black text-xs shrink-0 mt-0.5 ${
                            isSim
                              ? 'bg-emerald-500 text-white'
                              : isNao
                              ? 'bg-rose-500 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}>
                            {item.numero}
                          </span>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-bold">
                                {item.pergunta}
                              </span>
                              <span className="text-[9px] px-2 py-0.2 rounded-full font-bold bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {item.categoria}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {item.descricaoTecnica}
                            </p>
                          </div>
                        </div>

                        {/* BOTÕES SIM / NÃO */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() => handleRespostaChange(item.id, true)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
                              isSim
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>SIM</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRespostaChange(item.id, false)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
                              isNao
                                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-400'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                            }`}
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>NÃO</span>
                          </button>
                        </div>
                      </div>

                      {/* CAMPO DE OBSERVAÇÃO QUANDO NÃO CONFORME */}
                      {isNao && (
                        <div className="mt-3 pt-2.5 border-t border-rose-200/60 dark:border-rose-900/40">
                          <label className="text-[10px] font-black uppercase text-rose-500 flex items-center gap-1 mb-1">
                            <AlertCircle className="w-3 h-3" />
                            Evidência / Motivo da Não Conformidade:
                          </label>
                          <input
                            type="text"
                            placeholder="Descreva o que foi observado fora do padrão técnico..."
                            value={resposta.observacao || ''}
                            onChange={e => handleObservacaoItemChange(item.id, e.target.value)}
                            className={`w-full px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 text-xs font-medium outline-none ${
                              theme === 'dark' ? 'bg-[#151b23] text-white' : 'bg-white text-slate-800'
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SEÇÃO DO SCORE & ADERÊNCIA EM TEMPO REAL */}
            <div className={`p-4 sm:p-5 rounded-2xl border ${
              formStats.classificacao === 'conforme'
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : formStats.classificacao === 'atencao'
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-rose-500/10 border-rose-500/30'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                    Resultado da Auditoria
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className={`text-3xl sm:text-4xl font-black ${
                      formStats.classificacao === 'conforme'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : formStats.classificacao === 'atencao'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {formStats.percentual}%
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      formStats.classificacao === 'conforme'
                        ? 'bg-emerald-500 text-white'
                        : formStats.classificacao === 'atencao'
                        ? 'bg-amber-500 text-white'
                        : 'bg-rose-600 text-white'
                    }`}>
                      {formStats.classificacao === 'conforme'
                        ? '🟢 Conforme (≥ 90%)'
                        : formStats.classificacao === 'atencao'
                        ? '🟡 Atenção (75% a 89%)'
                        : '🔴 Crítico (< 75%)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {formStats.conformes} conformes • {formStats.naoConformes} não conformes • {formStats.pendentes} pendentes de preenchimento.
                  </p>
                </div>

                {/* Barra de Progresso Visual */}
                <div className="w-full sm:w-64 space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold text-slate-400">
                    <span>Aderência DTO</span>
                    <span>{formStats.percentual}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        formStats.classificacao === 'conforme'
                          ? 'bg-emerald-500'
                          : formStats.classificacao === 'atencao'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${formStats.percentual}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO DO PLANO DE AÇÃO IMEDIATO (Quando houver Não Conformes) */}
            {formStats.naoConformes > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  <h4 className="text-sm font-black text-rose-600 dark:text-rose-400">
                    Plano de Ação Corretivo 5W2H (Obrigatório devido a {formStats.naoConformes} item(ns) Não Conforme(s))
                  </h4>
                </div>
                <p className="text-xs text-slate-500">
                  Registre a ação imediata combinada com o colaborador para sanar o desvio e evitar nova quebra de meta.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                      O que fazer? (Ação Corretiva Imediata) *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Reciclagem técnica no POP e conferência prévia da bancada..."
                      value={planoAcao.oQueFazer}
                      onChange={e => setPlanoAcao(prev => ({ ...prev, oQueFazer: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none ${
                        theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                      Quem é o Responsável?
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Carlos (Supervisor) / João (Operador)"
                      value={planoAcao.responsavel}
                      onChange={e => setPlanoAcao(prev => ({ ...prev, responsavel: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none ${
                        theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                      Prazo Limite
                    </label>
                    <input
                      type="date"
                      value={planoAcao.prazo}
                      onChange={e => setPlanoAcao(prev => ({ ...prev, prazo: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none ${
                        theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                      Como fazer? (Método)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Checklist diário de 5S e abastecimento de fitas antes de iniciar o turno..."
                      value={planoAcao.comoFazer}
                      onChange={e => setPlanoAcao(prev => ({ ...prev, comoFazer: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none ${
                        theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* OBSERVAÇÃO GERAL */}
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                Parecer Final / Observação do Avaliador
              </label>
              <textarea
                rows={2}
                placeholder="Observações complementares, elogios ou fatores externos que impactaram a operação..."
                value={observacaoGeral}
                onChange={e => setObservacaoGeral(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-medium outline-none ${
                  theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
            </div>

            {/* BOTÃO DE SALVAR & REGISTRAR */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-800">
              <div className="text-xs text-slate-400">
                Ao clicar em salvar, o DTO será gravado no histórico oficial com carimbo de data, hora e responsável.
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleLimparFormulario}
                  className="px-4 py-2.5 rounded-xl border text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all"
                >
                  Cancelar / Limpar
                </button>

                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>Gravar e Registrar DTO ({formStats.percentual}%)</span>
                </button>
              </div>
            </div>

          </form>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          ABA 2: HISTÓRICO DE DTOS REGISTRADOS
          ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'historico' && (
        <div className="space-y-5">
          
          {/* BARRA DE FILTROS & BUSCA */}
          <div className={`p-4 rounded-2xl border space-y-3 backdrop-blur-md ${
            theme === 'dark' ? 'bg-[#11151c]/90 border-[#1c2530]' : 'bg-white/90 border-slate-200/90 shadow-sm'
          }`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Campo de Busca */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por colaborador, avaliador, posto ou palavra-chave..."
                  value={buscaTexto}
                  onChange={e => setBuscaTexto(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-medium outline-none ${
                    theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-white/80 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              {/* Botões de Ação Rápida */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => DtoService.exportToJson(empresa?.id)}
                  className="px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all"
                  title="Exportar todos os DTOs em formato JSON"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Exportar JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Deseja restaurar os registros de demonstração padrão do DTO?')) {
                      DtoService.resetToDefault(empresa?.id);
                      showToast('Histórico restaurado para os dados padrão.', 'info');
                    }
                  }}
                  className="px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all text-slate-400"
                  title="Restaurar dados mock"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Restaurar Base</span>
                </button>
              </div>
            </div>

            {/* Linha de Filtros Dropdowns */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Operação</label>
                <select
                  value={filtroOperacao}
                  onChange={e => setFiltroOperacao(e.target.value)}
                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold outline-none cursor-pointer ${
                    theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-white/80 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="todos">Todas as 9 Operações</option>
                  {DTO_OPERACOES_CONFIG.map(op => (
                    <option key={op.id} value={op.id}>{op.tituloCurto} ({op.sigla})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Classificação (%)</label>
                <select
                  value={filtroStatus}
                  onChange={e => setFiltroStatus(e.target.value)}
                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold outline-none cursor-pointer ${
                    theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-white/80 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="todos">Todas as Faixas</option>
                  <option value="conforme">🟢 Conforme (≥ 90%)</option>
                  <option value="atencao">🟡 Atenção (75% a 89%)</option>
                  <option value="critico">🔴 Crítico (&lt; 75%)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Motivo do DTO</label>
                <select
                  value={filtroMotivo}
                  onChange={e => setFiltroMotivo(e.target.value)}
                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold outline-none cursor-pointer ${
                    theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-white/80 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="todos">Todos os Motivos</option>
                  <option value="meta_nao_batida">Meta Não Batida</option>
                  <option value="aumento_perdas">Aumento de Perdas</option>
                  <option value="auditoria_rotina">Auditoria de Rotina</option>
                  <option value="reciclagem_treinamento">Treinamento</option>
                  <option value="solicitacao_gestao">Solicitação Gestão</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Data Específica</label>
                <input
                  type="date"
                  value={filtroDataInicio}
                  onChange={e => setFiltroDataInicio(e.target.value)}
                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold outline-none ${
                    theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-white/80 border-slate-200 text-slate-800'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* LISTA DOS DTOS REGISTRADOS */}
          {historicoFiltrado.length === 0 ? (
            <div className={`p-8 rounded-2xl border text-center space-y-3 backdrop-blur-md ${
              theme === 'dark' ? 'bg-[#11151c]/90 border-[#1c2530]' : 'bg-white/90 border-slate-200'
            }`}>
              <ClipboardCheck className="w-12 h-12 text-slate-400 mx-auto opacity-40" />
              <h3 className="text-base font-bold text-slate-400">Nenhum DTO encontrado com os filtros selecionados</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Aplique um novo diagnóstico na aba "Aplicar Novo DTO" ou limpe os filtros para visualizar os registros.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {historicoFiltrado.map(reg => {
                const isCritico = reg.classificacao === 'critico';
                const isAtencao = reg.classificacao === 'atencao';
                const isConforme = reg.classificacao === 'conforme';

                return (
                  <div
                    key={reg.id}
                    className={`rounded-2xl border p-4 sm:p-5 transition-all relative overflow-hidden group backdrop-blur-md ${
                      theme === 'dark'
                        ? 'bg-[#11151c]/90 border-[#1c2530] hover:border-blue-500/40'
                        : 'bg-white/90 border-slate-200/90 hover:border-blue-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      
                      {/* Lado Esquerdo: Identificação & Operação */}
                      <div className="flex items-start gap-3.5">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                          isConforme
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : isAtencao
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                        }`}>
                          {getOpIcon(reg.operacaoId)}
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-black tracking-tight">
                              {reg.operacaoNome}
                            </span>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              {reg.turno}
                            </span>
                            {reg.linhaOuBox && (
                              <span className="text-[10px] font-bold text-slate-400">
                                • {reg.linhaOuBox}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <strong>{new Date(reg.data + 'T12:00:00').toLocaleDateString('pt-BR')}</strong> às {reg.hora}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              Colaborador: <strong className="text-slate-700 dark:text-slate-300">{reg.colaboradorNome}</strong>
                            </span>
                            <span className="text-slate-400">
                              Avaliador: {reg.avaliadorNome}
                            </span>
                          </div>

                          {/* Motivo do DTO */}
                          <div className="pt-1 flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              reg.motivoDto === 'meta_nao_batida'
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                              {reg.motivoDto === 'meta_nao_batida' ? '🔴 Meta Não Batida' : '🔵 Auditoria DPO'}
                            </span>
                            {reg.resultadoRealizado && (
                              <span className="text-[11px] text-rose-500 font-bold">
                                Desvio: {reg.resultadoRealizado}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Lado Direito: Score e Ações */}
                      <div className="flex items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Aderência</span>
                          <span className={`text-2xl font-black ${
                            isConforme ? 'text-emerald-500' : isAtencao ? 'text-amber-500' : 'text-rose-500'
                          }`}>
                            {reg.percentualConformidade}%
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {reg.itensConformes} de {reg.totalItens} SIM
                          </span>
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedRegistroVisualizar(reg)}
                            className="p-2 rounded-xl border text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 cursor-pointer transition-all"
                            title="Visualizar Espelho Completo do DTO"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExcluirRegistro(reg.id, reg.operacaoNome)}
                            className="p-2 rounded-xl border text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-all"
                            title="Excluir Registro de DTO"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* Resumo do Plano de Ação se Houver */}
                    {reg.planoAcao && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-rose-500 shrink-0">Plano de Ação:</span>
                          <span className="text-slate-600 dark:text-slate-400 truncate max-w-xl">
                            {reg.planoAcao.oQueFazer}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleStatusPlano(reg)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider self-start sm:self-center cursor-pointer transition-all ${
                            reg.planoAcao.status === 'concluido'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse'
                          }`}
                        >
                          {reg.planoAcao.status === 'concluido' ? '✓ Concluído' : '⏳ Em Andamento'}
                        </button>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          ABA 3: ESTATÍSTICAS & INDICADORES BI DO DTO
          ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'estatisticas' && (
        <div className="space-y-6">
          <div className={`p-4 sm:p-6 rounded-2xl border backdrop-blur-md ${
            theme === 'dark' ? 'bg-[#11151c]/90 border-[#1c2530]' : 'bg-white/90 border-slate-200/90 shadow-sm'
          }`}>
            <h3 className="text-base font-black flex items-center gap-2 mb-1">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Painel de Aderência DPO por Operação
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Média consolidada da % de conformidade calculada em cada um dos 9 postos de trabalho do armazém.
            </p>

            {/* Gráfico / Barras por Operação */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {DTO_OPERACOES_CONFIG.map(op => {
                const opStats = estatisticasGerais.porOperacao[op.id] || { count: 0, media: 0 };
                const temDados = opStats.count > 0;

                return (
                  <div
                    key={op.id}
                    className={`p-4 rounded-xl border space-y-3 backdrop-blur-xs ${
                      theme === 'dark' ? 'bg-[#151b23]/80 border-[#222d3a]' : 'bg-white/75 border-slate-200/80 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                          {getOpIcon(op.id)}
                        </span>
                        <div>
                          <span className="text-xs font-bold block">{op.nome}</span>
                          <span className="text-[10px] text-slate-400">{opStats.count} DTOs aplicados</span>
                        </div>
                      </div>
                      <span className={`text-lg font-black ${
                        !temDados
                          ? 'text-slate-400'
                          : opStats.media >= 90
                          ? 'text-emerald-500'
                          : opStats.media >= 75
                          ? 'text-amber-500'
                          : 'text-rose-500'
                      }`}>
                        {temDados ? `${opStats.media}%` : 'S/ DADOS'}
                      </span>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          !temDados
                            ? 'bg-slate-300'
                            : opStats.media >= 90
                            ? 'bg-emerald-500'
                            : opStats.media >= 75
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${temDados ? opStats.media : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          MODAL DE VISUALIZAÇÃO DETALHADA / ESPELHO DO DTO
          ═════════════════════════════════════════════════════════════════════ */}
      {selectedRegistroVisualizar && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className={`w-full max-w-3xl rounded-2xl border shadow-2xl p-5 sm:p-6 space-y-5 my-8 relative max-h-[90vh] overflow-y-auto ${
            theme === 'dark' ? 'bg-[#11151c] border-[#1c2530] text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            {/* Botão Fechar */}
            <button
              type="button"
              onClick={() => setSelectedRegistroVisualizar(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabeçalho do Modal */}
            <div className="border-b border-slate-200/80 dark:border-slate-800 pb-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Registro Oficial de DTO • ID: {selectedRegistroVisualizar.id}
              </span>
              <h2 className="text-xl font-black mt-0.5">
                Espelho da Auditoria: {selectedRegistroVisualizar.operacaoNome}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                <span>Data: <strong>{new Date(selectedRegistroVisualizar.data + 'T12:00:00').toLocaleDateString('pt-BR')}</strong> às {selectedRegistroVisualizar.hora}</span>
                <span>Colaborador: <strong>{selectedRegistroVisualizar.colaboradorNome}</strong></span>
                <span>Avaliador: <strong>{selectedRegistroVisualizar.avaliadorNome}</strong></span>
              </div>
            </div>

            {/* Placar de Aderência */}
            <div className={`p-4 rounded-xl flex items-center justify-between border ${
              selectedRegistroVisualizar.classificacao === 'conforme'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : selectedRegistroVisualizar.classificacao === 'atencao'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
            }`}>
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider block">Percentual de Conformidade</span>
                <span className="text-3xl font-black">{selectedRegistroVisualizar.percentualConformidade}%</span>
              </div>
              <div className="text-right text-xs">
                <span className="font-bold block">{selectedRegistroVisualizar.itensConformes} Conformes</span>
                <span>{selectedRegistroVisualizar.itensNaoConformes} Não Conformes</span>
              </div>
            </div>

            {/* Detalhes dos Itens Avaliados */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Itens Verificados na Operação:
              </h4>
              <div className="space-y-2">
                {Object.entries(selectedRegistroVisualizar.respostas).map(([itemId, resp], idx) => {
                  return (
                    <div
                      key={itemId}
                      className={`p-3 rounded-lg border flex items-start justify-between gap-3 text-xs ${
                        resp.conforme
                          ? 'border-emerald-500/20 bg-emerald-500/5'
                          : 'border-rose-500/30 bg-rose-500/5'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold block text-slate-700 dark:text-slate-300">
                          Item #{idx + 1}
                        </span>
                        {resp.observacao && (
                          <p className="text-[11px] text-rose-500 font-medium">
                            Obs: {resp.observacao}
                          </p>
                        )}
                      </div>
                      <span className={`px-2.5 py-0.5 rounded font-black text-[10px] uppercase ${
                        resp.conforme ? 'bg-emerald-500 text-white' : 'bg-rose-600 text-white'
                      }`}>
                        {resp.conforme ? 'SIM' : 'NÃO'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Plano de Ação */}
            {selectedRegistroVisualizar.planoAcao && (
              <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-2">
                <span className="text-xs font-black text-blue-600 dark:text-blue-400 block">
                  Plano de Ação 5W2H Registrado:
                </span>
                <p className="text-xs font-semibold">
                  {selectedRegistroVisualizar.planoAcao.oQueFazer}
                </p>
                <div className="flex gap-4 text-[11px] text-slate-500 pt-1">
                  <span>Responsável: {selectedRegistroVisualizar.planoAcao.responsavel}</span>
                  <span>Prazo: {selectedRegistroVisualizar.planoAcao.prazo}</span>
                  <span>Status: <strong className="uppercase text-blue-600">{selectedRegistroVisualizar.planoAcao.status}</strong></span>
                </div>
              </div>
            )}

            {/* Botões do Modal */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Relatório
              </button>
              <button
                type="button"
                onClick={() => setSelectedRegistroVisualizar(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
