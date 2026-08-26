import React, { useState, useEffect, useMemo } from 'react';
import { Usuario, Empresa } from '../types';
import { 
  Zap, 
  ExternalLink, 
  Plus, 
  Search, 
  Filter, 
  Maximize2, 
  Minimize2, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  AlertOctagon, 
  ShieldAlert, 
  Calendar, 
  ArrowRight, 
  Edit3, 
  Trash2, 
  Layers, 
  Sparkles, 
  FileText, 
  Printer, 
  Activity, 
  TrendingUp, 
  CheckSquare, 
  HelpCircle,
  ArrowLeft,
  ChevronRight,
  User,
  MapPin,
  RefreshCw,
  Compass,
  Download,
  Upload,
  Check,
  Building2,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LISTA_COLABORADORES_OFICIAIS } from './RankingModule';

export interface AcaoDpoItem {
  id: string;
  processo: string; // 'Montagem' | 'Picking' | 'Repack' | 'Despejo' | 'Quebras' | 'TMR' | 'WLP' | 'FEFO' | 'Capacidade' | 'Geral'
  indicador: string;
  criticidade: 'Alta' | 'Média' | 'Baixa';
  tipo: 'Corretiva' | 'Rotina' | 'Melhoria';
  oQueFazer: string;
  resolucao: string;
  dataInicio: string; // YYYY-MM-DD
  dataTermino: string; // YYYY-MM-DD
  status: 'Pendente' | 'Em Andamento' | 'Concluído';
  responsavel?: string;
  local?: string;
  observacaoCampo?: string;
  etapasVerificacao?: { id: string; texto: string; concluida: boolean }[];
}

export interface QuadroAcoesDpoProps {
  user: Usuario;
  empresa?: Empresa | null;
  theme?: 'light' | 'dark';
  processoFilter?: string; // e.g. 'Montagem' | 'Picking' | 'Repack' | 'Despejo' | 'Quebras' | 'TMR' | 'WLP' | 'FEFO' | 'Capacidade' | 'all'
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  externalLink?: { label: string; url: string; badge?: string };
}

export const UNIFIED_ACOES_STORAGE_KEY = 'af_acoes_dpo_unificadas_2026';

// Sugestões de indicadores por processo operacional
export const INDICADORES_POR_PROCESSO: Record<string, string[]> = {
  Montagem: [
    'Eficiência de Montagem (EFM)',
    'Erro de Montagem (Falta / Excesso)',
    'Precisão do Picking',
    'Ritmo de Separação de Linha',
    'Curva ABC / Endereçamento',
    'Ressuprimento do Picking',
    'FEFO / Validade na Separação',
    'Divergência no Fast Picking',
    'Quebras / Avarias na Montagem',
    'Tempo de Ciclo de Montagem'
  ],
  Picking: [
    'Precisão do Picking (Acuracidade)',
    'Produtividade de Separação (CX/H)',
    'SLA de Reabastecimento / Ressuprimento',
    'Ruptura de Posição de Picking',
    'Eficiência de Carregamento (EFC)',
    'Eficiência de Descarga (EFD)',
    'Slotting / Curva ABC no Picking',
    'Tempo de Ciclo de Separação'
  ],
  Repack: [
    'Tempo de Ciclo por Embalagem (Meta Sec)',
    'Eficiência de Reembalagem (REP %)',
    'Rendimento de Insumos & Fita',
    'Organização de Bancada 5S',
    'Retrabalho de Embalagens Avariadas',
    'Produtividade de Turno Repack'
  ],
  Despejo: [
    'Rendimento de Escoamento na Bombona',
    'Tempo de Ciclo de Despejo',
    'Despejo Fora do Padrão / Perda HL',
    'Controle de Validade / Shelf Life',
    'Conformidade de Descarte DPO',
    'Produtividade de Registros / Hora'
  ],
  Quebras: [
    'Índice de Quebras Internas (% Caixas)',
    'Estouro de Teto de Quebra (> 0.08%)',
    'Avaria de Carga no Descarregamento',
    'Manuseio e Acondicionamento de Vidro',
    'Paletes Tombados / Movimentação',
    'Quebras no Picking / Separação'
  ],
  TMR: [
    'TMR Carretas Fábrica (> 70 min)',
    'TMR Recargas / Puxada (> 40 min)',
    'Janela de Recebimento Concentrada',
    'Permanência em Pátio de Carretas',
    'Tempo de Liberação de Portaria',
    'Gargalo de Doca / Descarregamento'
  ],
  WLP: [
    'Produtividade Real WLP (HL / Hora Homem)',
    'Gestão de Jornadas & Horas Extras',
    'Eficiência da Escala Operacional',
    'Absenteísmo / Falta de Colaboradores',
    'Tempo Produtivo vs. Tempo Ocioso',
    'Aderência ao Quadro Padrão DPO'
  ],
  FEFO: [
    'Alerta Crítico FEFO (Semáforo Vermelho < 30 dias)',
    'Giro de Lotes por Antiguidade',
    'Prioridade de Saída de Rota',
    'Auditoria Semanal de Validades',
    'Risco de Vencimento em Estoque'
  ],
  Capacidade: [
    'Taxa de Ocupação de Posições Palete',
    'Slotting e Balanceamento de Ruas',
    'Ruptura de Estoque Aéreo x Picking',
    'Capacidade Estática x Dinâmica',
    'Área de Contingência e Blocado'
  ],
  Geral: [
    'Eficiência Operacional DPO',
    'Auditoria de Padrão 5S',
    'Aderência a Procedimentos SOP',
    'Gestão de Não Conformidades',
    'Treinamento e Capacitação de Turno'
  ]
};

// Seed dataset representativo
const SEED_ACOES_DPO: AcaoDpoItem[] = [
  {
    id: 'acao-montagem-1',
    processo: 'Montagem',
    indicador: 'Precisão do Picking',
    criticidade: 'Alta',
    tipo: 'Corretiva',
    oQueFazer: 'Corrigir divergência de saldo físico x Armazém Fácil/Fast Picking antes da liberação da onda.',
    resolucao: 'Conferir contagem física na posição, ajustar saldo no sistema e orientar equipe para verificação obrigatória de código de barras.',
    dataInicio: '2026-08-26',
    dataTermino: '2026-08-28',
    status: 'Em Andamento',
    responsavel: 'Djeanderson Soares',
    local: 'Picking / Rua 04 - Posições Críticas',
    observacaoCampo: 'Divergência tratada na onda matutina do Fast Picking.',
    etapasVerificacao: [
      { id: '1', texto: 'Auditar saldo físico na posição de picking', concluida: true },
      { id: '2', texto: 'Confrontar divergência no Fast Picking / Armazém Fácil', concluida: true },
      { id: '3', texto: 'Realizar ajuste de estoque e validar com conferência', concluida: false },
      { id: '4', texto: 'Acompanhar montagem da próxima rota', concluida: false }
    ]
  },
  {
    id: 'acao-picking-1',
    processo: 'Picking',
    indicador: 'SLA de Reabastecimento / Ressuprimento',
    criticidade: 'Alta',
    tipo: 'Corretiva',
    oQueFazer: 'Reduzir o tempo de espera do separador por falta de palete no nível 0 do picking.',
    resolucao: 'Configurar alarme de ponto de pedido automático no WMS quando a posição atingir 30% da capacidade.',
    dataInicio: '2026-08-25',
    dataTermino: '2026-08-29',
    status: 'Em Andamento',
    responsavel: 'Matheus Barbosa',
    local: 'Ressuprimento / Ruas 01 a 05',
    observacaoCampo: 'Operador de empilhadeira dedicado nos horários de pico (14h-18h).',
    etapasVerificacao: [
      { id: '1', texto: 'Mapear curvas de consumo do turno da tarde', concluida: true },
      { id: '2', texto: 'Alocar empilhador exclusivo para abastecimento preventivo', concluida: true },
      { id: '3', texto: 'Medir SLA de tempo de resposta em campo', concluida: false }
    ]
  },
  {
    id: 'acao-repack-1',
    processo: 'Repack',
    indicador: 'Tempo de Ciclo por Embalagem (Meta Sec)',
    criticidade: 'Média',
    tipo: 'Rotina',
    oQueFazer: 'Adequar layout da bancada de repack de Latas para eliminar deslocamentos desnecessários.',
    resolucao: 'Aproximar caixas novas e fita gomada a menos de 1 metro da bancada e padronizar gabarito de dobra.',
    dataInicio: '2026-08-24',
    dataTermino: '2026-08-27',
    status: 'Concluído',
    responsavel: 'Ozenildo Silva',
    local: 'Bancada 02 - Repack Latas',
    observacaoCampo: 'Tempo médio reduzido de 04:30 para 03:50 por caixa.',
    etapasVerificacao: [
      { id: '1', texto: 'Instalar suporte ergonômico de fita adesiva', concluida: true },
      { id: '2', texto: 'Treinar ajudantes na montagem rápida de divisórias', concluida: true },
      { id: '3', texto: 'Validar cronometragem no padrão DPO', concluida: true }
    ]
  },
  {
    id: 'acao-quebras-1',
    processo: 'Quebras',
    indicador: 'Estouro de Teto de Quebra (> 0.08%)',
    criticidade: 'Alta',
    tipo: 'Corretiva',
    oQueFazer: 'Eliminar avarias durante a manobra de paletes de Long Neck nas curvas do armazém.',
    resolucao: 'Instalar cantoneiras de proteção nas esquinas das ruas e reforçar amarração com filme stretch.',
    dataInicio: '2026-08-26',
    dataTermino: '2026-08-30',
    status: 'Em Andamento',
    responsavel: 'Paulo Pereira',
    local: 'Corredor Central / Rua 02',
    observacaoCampo: 'Redução imediata de tombamentos no turno da noite.',
    etapasVerificacao: [
      { id: '1', texto: 'Auditar velocidade dos operadores de empilhadeira', concluida: true },
      { id: '2', texto: 'Fixar cantoneiras de borracha nas colunas', concluida: false },
      { id: '3', texto: 'Acompanhar relatório diário de avarias', concluida: false }
    ]
  },
  {
    id: 'acao-fefo-1',
    processo: 'FEFO',
    indicador: 'Alerta Crítico FEFO (Semáforo Vermelho < 30 dias)',
    criticidade: 'Alta',
    tipo: 'Corretiva',
    oQueFazer: 'Agilizar escoamento de lote com validade inferior a 30 dias na rota urbana.',
    resolucao: 'Bloquear saída de lotes mais novos no sistema e priorizar carregamento imediato do lote crítico.',
    dataInicio: '2026-08-25',
    dataTermino: '2026-08-27',
    status: 'Concluído',
    responsavel: 'Lucas Gabriel',
    local: 'Posição 03-A-12',
    observacaoCampo: '100% do lote escoado sem perda de validade.',
    etapasVerificacao: [
      { id: '1', texto: 'Identificar lote crítico com etiqueta vermelha', concluida: true },
      { id: '2', texto: 'Alinhar com equipe comercial prioridade de venda', concluida: true },
      { id: '3', texto: 'Conferir expedição no manifesto de carga', concluida: true }
    ]
  }
];

export const QuadroAcoesDpo: React.FC<QuadroAcoesDpoProps> = ({
  user,
  empresa,
  theme = 'light',
  processoFilter = 'all',
  title,
  subtitle,
  onBack,
  externalLink
}) => {
  const isDark = theme === 'dark';
  const empresaId = empresa?.id || 'demo';

  // State: Ações list
  const [acoes, setAcoes] = useState<AcaoDpoItem[]>(() => {
    try {
      const saved = localStorage.getItem(UNIFIED_ACOES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Erro ao carregar ações do localStorage:', e);
    }
    return SEED_ACOES_DPO;
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(UNIFIED_ACOES_STORAGE_KEY, JSON.stringify(acoes));
      window.dispatchEvent(new CustomEvent('af_acoes_dpo_updated'));
      window.dispatchEvent(new CustomEvent('af_acoes_updated'));
    } catch (e) {
      console.error('Erro ao salvar ações:', e);
    }
  }, [acoes]);

  // Listen to external updates
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem(UNIFIED_ACOES_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setAcoes(parsed);
        }
      } catch (e) {}
    };
    window.addEventListener('af_acoes_dpo_updated', handleUpdate);
    return () => window.removeEventListener('af_acoes_dpo_updated', handleUpdate);
  }, []);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCriticidade, setFilterCriticidade] = useState<'all' | 'Alta' | 'Média' | 'Baixa'>('all');
  const [filterTipo, setFilterTipo] = useState<'all' | 'Corretiva' | 'Rotina' | 'Melhoria'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Pendente' | 'Em Andamento' | 'Concluído'>('all');
  const [filterProcessoInterno, setFilterProcessoInterno] = useState<string>(processoFilter === 'all' ? 'all' : processoFilter);

  // Sync initial prop filter
  useEffect(() => {
    if (processoFilter !== 'all') {
      setFilterProcessoInterno(processoFilter);
    }
  }, [processoFilter]);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAcao, setEditingAcao] = useState<AcaoDpoItem | null>(null);
  const [maximizedAction, setMaximizedAction] = useState<AcaoDpoItem | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Form State
  const [formProcesso, setFormProcesso] = useState<string>(processoFilter !== 'all' ? processoFilter : 'Montagem');
  const [formIndicador, setFormIndicador] = useState<string>('');
  const [formIndicadorCustom, setFormIndicadorCustom] = useState<string>('');
  const [formCriticidade, setFormCriticidade] = useState<AcaoDpoItem['criticidade']>('Alta');
  const [formTipo, setFormTipo] = useState<AcaoDpoItem['tipo']>('Corretiva');
  const [formOQueFazer, setFormOQueFazer] = useState<string>('');
  const [formResolucao, setFormResolucao] = useState<string>('');
  const [formDataInicio, setFormDataInicio] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [formDataTermino, setFormDataTermino] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [formResponsavel, setFormResponsavel] = useState<string>(user?.nome || 'Operador Responsável');
  const [formLocal, setFormLocal] = useState<string>('Armazém / Operações');
  const [formStatus, setFormStatus] = useState<AcaoDpoItem['status']>('Pendente');

  // Suggested indicators based on selected process
  const currentSuggestedIndicadores = useMemo(() => {
    return INDICADORES_POR_PROCESSO[formProcesso] || INDICADORES_POR_PROCESSO.Geral;
  }, [formProcesso]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingAcao(null);
    const defaultProc = processoFilter !== 'all' ? processoFilter : 'Montagem';
    const suggestions = INDICADORES_POR_PROCESSO[defaultProc] || INDICADORES_POR_PROCESSO.Geral;
    setFormProcesso(defaultProc);
    setFormIndicador(suggestions[0] || '');
    setFormIndicadorCustom('');
    setFormCriticidade('Alta');
    setFormTipo('Corretiva');
    setFormOQueFazer('');
    setFormResolucao('');
    const today = new Date().toISOString().split('T')[0];
    const end = new Date();
    end.setDate(end.getDate() + 3);
    setFormDataInicio(today);
    setFormDataTermino(end.toISOString().split('T')[0]);
    setFormResponsavel(user?.nome || 'Operador Responsável');
    setFormLocal(`${defaultProc} / Posição Operacional`);
    setFormStatus('Pendente');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (acao: AcaoDpoItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingAcao(acao);
    setFormProcesso(acao.processo || 'Montagem');
    const suggestions = INDICADORES_POR_PROCESSO[acao.processo] || INDICADORES_POR_PROCESSO.Geral;
    if (suggestions.includes(acao.indicador)) {
      setFormIndicador(acao.indicador);
      setFormIndicadorCustom('');
    } else {
      setFormIndicador('__custom__');
      setFormIndicadorCustom(acao.indicador);
    }
    setFormCriticidade(acao.criticidade);
    setFormTipo(acao.tipo);
    setFormOQueFazer(acao.oQueFazer);
    setFormResolucao(acao.resolucao);
    setFormDataInicio(acao.dataInicio || new Date().toISOString().split('T')[0]);
    setFormDataTermino(acao.dataTermino || new Date().toISOString().split('T')[0]);
    setFormResponsavel(acao.responsavel || user?.nome || '');
    setFormLocal(acao.local || '');
    setFormStatus(acao.status);
    setIsModalOpen(true);
  };

  // Handle Save (Create / Update)
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const finalIndicador = formIndicador === '__custom__' ? formIndicadorCustom.trim() : (formIndicador || formIndicadorCustom.trim());
    if (!finalIndicador) {
      alert('Por favor, informe ou selecione o Indicador.');
      return;
    }
    if (!formOQueFazer.trim()) {
      alert('Por favor, informe o campo "O Que Fazer".');
      return;
    }
    if (!formResolucao.trim()) {
      alert('Por favor, informe o campo "Resolução / Contramedida".');
      return;
    }
    if (!formDataInicio || !formDataTermino) {
      alert('Por favor, defina a Data de Início e a Data de Término.');
      return;
    }

    if (editingAcao) {
      const updated: AcaoDpoItem = {
        ...editingAcao,
        processo: formProcesso,
        indicador: finalIndicador,
        criticidade: formCriticidade,
        tipo: formTipo,
        oQueFazer: formOQueFazer,
        resolucao: formResolucao,
        dataInicio: formDataInicio,
        dataTermino: formDataTermino,
        status: formStatus,
        responsavel: formResponsavel,
        local: formLocal
      };
      setAcoes(prev => prev.map(a => a.id === updated.id ? updated : a));
      if (maximizedAction && maximizedAction.id === updated.id) {
        setMaximizedAction(updated);
      }
    } else {
      const newAction: AcaoDpoItem = {
        id: `acao-${Date.now()}`,
        processo: formProcesso,
        indicador: finalIndicador,
        criticidade: formCriticidade,
        tipo: formTipo,
        oQueFazer: formOQueFazer,
        resolucao: formResolucao,
        dataInicio: formDataInicio,
        dataTermino: formDataTermino,
        status: formStatus,
        responsavel: formResponsavel,
        local: formLocal,
        etapasVerificacao: [
          { id: '1', texto: `Auditar indicador de ${finalIndicador} no sistema`, concluida: false },
          { id: '2', texto: `Executar contramedida: ${formResolucao.substring(0, 45)}...`, concluida: false },
          { id: '3', texto: 'Validar normalização do processo no padrão DPO', concluida: false }
        ]
      };
      setAcoes(prev => [newAction, ...prev]);
    }

    setIsModalOpen(false);
  };

  // Delete Action
  const handleDeleteAction = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir esta ação DPO?')) {
      setAcoes(prev => prev.filter(a => a.id !== id));
      if (maximizedAction && maximizedAction.id === id) {
        setMaximizedAction(null);
      }
    }
  };

  // Quick Status Toggle
  const handleQuickStatusChange = (id: string, newStatus: AcaoDpoItem['status'], e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAcoes(prev => prev.map(item => {
      if (item.id === id) return { ...item, status: newStatus };
      return item;
    }));
    if (maximizedAction && maximizedAction.id === id) {
      setMaximizedAction(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  // Toggle Verification Step
  const handleToggleStep = (stepId: string) => {
    if (!maximizedAction) return;
    const updatedSteps = (maximizedAction.etapasVerificacao || []).map(s => {
      if (s.id === stepId) return { ...s, concluida: !s.concluida };
      return s;
    });
    const updated = { ...maximizedAction, etapasVerificacao: updatedSteps };
    setMaximizedAction(updated);
    setAcoes(prev => prev.map(item => item.id === updated.id ? updated : item));
  };

  // Save Observation in Maximized View
  const handleSaveObservation = (obs: string) => {
    if (!maximizedAction) return;
    const updated = { ...maximizedAction, observacaoCampo: obs };
    setMaximizedAction(updated);
    setAcoes(prev => prev.map(item => item.id === updated.id ? updated : item));
  };

  // Filtered Ações List
  const filteredAcoes = useMemo(() => {
    return acoes.filter(item => {
      // Process filter
      if (filterProcessoInterno !== 'all' && item.processo?.toLowerCase() !== filterProcessoInterno.toLowerCase()) {
        return false;
      }
      // Criticidade filter
      if (filterCriticidade !== 'all' && item.criticidade !== filterCriticidade) {
        return false;
      }
      // Tipo filter
      if (filterTipo !== 'all' && item.tipo !== filterTipo) {
        return false;
      }
      // Status filter
      if (filterStatus !== 'all' && item.status !== filterStatus) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchIndicador = item.indicador?.toLowerCase().includes(term);
        const matchOQueFazer = item.oQueFazer?.toLowerCase().includes(term);
        const matchResolucao = item.resolucao?.toLowerCase().includes(term);
        const matchResponsavel = item.responsavel?.toLowerCase().includes(term);
        const matchLocal = item.local?.toLowerCase().includes(term);
        const matchProc = item.processo?.toLowerCase().includes(term);
        if (!matchIndicador && !matchOQueFazer && !matchResolucao && !matchResponsavel && !matchLocal && !matchProc) {
          return false;
        }
      }
      return true;
    });
  }, [acoes, filterProcessoInterno, filterCriticidade, filterTipo, filterStatus, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const list = processoFilter !== 'all' ? acoes.filter(a => a.processo?.toLowerCase() === processoFilter.toLowerCase()) : acoes;
    const total = list.length;
    const alta = list.filter(a => a.criticidade === 'Alta').length;
    const andamento = list.filter(a => a.status === 'Em Andamento').length;
    const concluidas = list.filter(a => a.status === 'Concluído').length;
    const pendentes = list.filter(a => a.status === 'Pendente').length;
    return { total, alta, andamento, concluidas, pendentes };
  }, [acoes, processoFilter]);

  // Badges Helpers
  const getCriticidadeBadge = (crit: AcaoDpoItem['criticidade']) => {
    switch (crit) {
      case 'Alta':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-500 border border-rose-500/30">
            <AlertOctagon className="w-3 h-3" /> Alta
          </span>
        );
      case 'Média':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-500 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" /> Média
          </span>
        );
      case 'Baixa':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
            <ShieldAlert className="w-3 h-3" /> Baixa
          </span>
        );
    }
  };

  const getTipoBadge = (tipo: AcaoDpoItem['tipo']) => {
    switch (tipo) {
      case 'Corretiva':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-600/10 text-red-500 border border-red-500/20">
            Corretiva
          </span>
        );
      case 'Rotina':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-600/10 text-blue-400 border border-blue-500/20">
            Rotina
          </span>
        );
      case 'Melhoria':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-600/10 text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-3 h-3" /> Melhoria
          </span>
        );
    }
  };

  const getStatusBadge = (status: AcaoDpoItem['status']) => {
    switch (status) {
      case 'Pendente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-500/15 text-slate-400 border border-slate-500/30">
            <Clock className="w-3 h-3" /> Pendente
          </span>
        );
      case 'Em Andamento':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <Activity className="w-3 h-3 animate-spin" /> Em Andamento
          </span>
        );
      case 'Concluído':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Concluído
          </span>
        );
    }
  };

  const displayTitle = title || (processoFilter !== 'all' ? `Quadro de Ações — ${processoFilter}` : 'Quadro de Ações Operacionais DPO');
  const displaySubtitle = subtitle || 'Tratativas de desvios, contramedidas e planos com cronograma de início e término.';

  return (
    <div className={`w-full min-h-[600px] p-3 md:p-6 transition-colors duration-200 rounded-2xl border ${
      isDark ? 'bg-[#0b0f17] text-slate-100 border-[#1f293d]' : 'bg-slate-50 text-slate-800 border-slate-200'
    }`} id="quadro-acoes-dpo-main">
      
      {/* ── TOP BREADCRUMB & HEADER ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDark 
                  ? 'bg-[#151b23] border-[#222d3a] text-slate-400 hover:text-white hover:border-slate-600' 
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs'
              }`}
              title="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {processoFilter !== 'all' ? processoFilter.toUpperCase() : 'GESTÃO DE AÇÕES DPO'}
              </span>
              <span className="text-[10px] font-bold text-slate-500">Padrão Armazém 2026</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight mt-0.5 flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-500" />
              {displayTitle}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">{displaySubtitle}</p>
          </div>
        </div>

        {/* Action Buttons Header */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {externalLink && (
            <a
              href={externalLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/20 border border-blue-400/30 transition-all cursor-pointer"
            >
              <span>{externalLink.label}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          {/* Gerar Ações Button (RENAMED FROM GERAR AÇÕES SIMPLES) */}
          <button
            onClick={handleOpenCreateModal}
            id="btn-gerar-acoes-header"
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-white bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-600/20 border border-amber-400/30 transition-all cursor-pointer transform active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Gerar Ações</span>
          </button>
        </div>
      </div>

      {/* ── KPI COUNTER SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#121824] border-[#1e2738]' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider text-[10px]">Total de Ações</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black">{stats.total}</div>
          <div className="text-[10px] text-slate-500 mt-1">Registros no quadro</div>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#121824] border-[#1e2738]' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div className="flex items-center justify-between text-rose-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider text-[10px]">Alta Criticidade</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-500">{stats.alta}</div>
          <div className="text-[10px] text-slate-500 mt-1">Prioridade imediata (P1)</div>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#121824] border-[#1e2738]' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div className="flex items-center justify-between text-sky-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider text-[10px]">Em Andamento</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-sky-400">{stats.andamento}</div>
          <div className="text-[10px] text-slate-500 mt-1">Em execução no campo</div>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#121824] border-[#1e2738]' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div className="flex items-center justify-between text-emerald-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider text-[10px]">Concluídas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{stats.concluidas}</div>
          <div className="text-[10px] text-slate-500 mt-1">Normalizadas no padrão</div>
        </div>
      </div>

      {/* ── SEARCH & FILTERS BAR ── */}
      <div className={`p-4 rounded-2xl border mb-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 ${
        isDark ? 'bg-[#121824] border-[#1e2738]' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por indicador, ação, resolução, responsável ou setor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 text-xs rounded-xl border outline-none transition-all ${
              isDark 
                ? 'bg-[#0b0f17] border-slate-800 text-white focus:border-amber-500' 
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-amber-500'
            }`}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {processoFilter === 'all' && (
            <select
              value={filterProcessoInterno}
              onChange={(e) => setFilterProcessoInterno(e.target.value)}
              className={`text-xs px-3 py-2 rounded-xl border font-bold outline-none cursor-pointer ${
                isDark ? 'bg-[#0b0f17] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="all">Todos os Processos</option>
              {Object.keys(INDICADORES_POR_PROCESSO).map(proc => (
                <option key={proc} value={proc}>{proc}</option>
              ))}
            </select>
          )}

          {/* Criticidade */}
          <select
            value={filterCriticidade}
            onChange={(e) => setFilterCriticidade(e.target.value as any)}
            className={`text-xs px-3 py-2 rounded-xl border font-bold outline-none cursor-pointer ${
              isDark ? 'bg-[#0b0f17] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="all">Todas as Criticidades</option>
            <option value="Alta">Alta</option>
            <option value="Média">Média</option>
            <option value="Baixa">Baixa</option>
          </select>

          {/* Tipo */}
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value as any)}
            className={`text-xs px-3 py-2 rounded-xl border font-bold outline-none cursor-pointer ${
              isDark ? 'bg-[#0b0f17] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="all">Todos os Tipos</option>
            <option value="Corretiva">Corretiva</option>
            <option value="Rotina">Rotina</option>
            <option value="Melhoria">Melhoria</option>
          </select>

          {/* Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className={`text-xs px-3 py-2 rounded-xl border font-bold outline-none cursor-pointer ${
              isDark ? 'bg-[#0b0f17] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="all">Todos os Status</option>
            <option value="Pendente">Pendente</option>
            <option value="Em Andamento">Em Andamento</option>
            <option value="Concluído">Concluído</option>
          </select>
        </div>
      </div>

      {/* ── CARDS GRID ── */}
      {filteredAcoes.length === 0 ? (
        <div className={`p-12 text-center rounded-2xl border border-dashed ${
          isDark ? 'bg-[#121824]/40 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
        }`}>
          <AlertCircleIcon className="w-12 h-12 mx-auto mb-3 text-slate-500" />
          <h3 className="text-base font-bold">Nenhuma ação encontrada</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Não há registros correspondentes aos filtros selecionados. Clique no botão abaixo para gerar uma nova ação.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase text-white bg-amber-600 hover:bg-amber-500 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Gerar Ações</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAcoes.map((acao) => {
            const diasDuracao = Math.max(1, Math.round(
              (new Date(acao.dataTermino).getTime() - new Date(acao.dataInicio).getTime()) / (1000 * 60 * 60 * 24)
            ));

            return (
              <div
                key={acao.id}
                className={`rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden relative group hover:shadow-xl ${
                  isDark 
                    ? 'bg-[#121824] border-[#1e2738] hover:border-amber-500/40' 
                    : 'bg-white border-slate-200 hover:border-amber-400 shadow-sm'
                }`}
              >
                {/* Top Strip / Header */}
                <div className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                        {acao.processo || 'Operação'}
                      </span>
                      {getCriticidadeBadge(acao.criticidade)}
                      {getTipoBadge(acao.tipo)}
                    </div>
                    {getStatusBadge(acao.status)}
                  </div>

                  <h3 className="font-black text-sm text-slate-900 dark:text-white leading-snug line-clamp-1">
                    {acao.indicador}
                  </h3>
                </div>

                {/* Body Content: O Que Fazer & Resolução */}
                <div className="p-4 space-y-3 flex-1 text-xs">
                  {/* O Que Fazer */}
                  <div className={`p-2.5 rounded-xl border ${
                    isDark ? 'bg-[#0e141f] border-slate-800/80' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <span className="text-[9px] font-black uppercase tracking-wider text-rose-500 block mb-1">
                      O Que Fazer / Desvio
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3">
                      {acao.oQueFazer}
                    </p>
                  </div>

                  {/* Resolução */}
                  <div className={`p-2.5 rounded-xl border ${
                    isDark ? 'bg-[#0e141f] border-slate-800/80' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-500 block mb-1">
                      Resolução / Contramedida
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3">
                      {acao.resolucao}
                    </p>
                  </div>

                  {/* Cronograma: STRICTLY Data de Início e Data de Término */}
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-[11px] font-mono ${
                    isDark ? 'bg-[#0b0f17] border-slate-800' : 'bg-amber-50/60 border-amber-100 text-amber-950'
                  }`}>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-slate-900 dark:text-slate-200 font-bold">
                        {acao.dataInicio.split('-').reverse().join('/')}
                      </span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-500" />
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span className="text-slate-900 dark:text-slate-200 font-bold">
                        {acao.dataTermino.split('-').reverse().join('/')}
                      </span>
                      <span className="text-[9px] font-sans font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                        {diasDuracao}d
                      </span>
                    </div>
                  </div>

                  {/* Responsável & Local */}
                  {(acao.responsavel || acao.local) && (
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1 truncate max-w-[140px]" title={acao.responsavel}>
                        <User className="w-3 h-3 text-slate-500 shrink-0" />
                        <strong className="text-slate-300 font-medium truncate">{acao.responsavel || '—'}</strong>
                      </span>
                      <span className="flex items-center gap-1 truncate max-w-[130px]" title={acao.local}>
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{acao.local || '—'}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className={`p-3 pt-2.5 border-t flex items-center justify-between gap-2 ${
                  isDark ? 'bg-[#0e141f] border-slate-800/80' : 'bg-slate-50/80 border-slate-100'
                }`}>
                  {/* Status Toggle Selector */}
                  <select
                    value={acao.status}
                    onChange={(e) => handleQuickStatusChange(acao.id, e.target.value as any)}
                    className={`text-[10px] font-bold px-2 py-1.5 rounded-lg border outline-none cursor-pointer ${
                      isDark ? 'bg-[#151b23] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700 shadow-2xs'
                    }`}
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Concluído">Concluído</option>
                  </select>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleOpenEditModal(acao, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                      title="Editar Ação"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteAction(acao.id, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Excluir Ação"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {/* Botão Maximizar / Detalhes */}
                    <button
                      onClick={() => setMaximizedAction(acao)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider text-amber-500 hover:text-white bg-amber-500/10 hover:bg-amber-600 transition-all cursor-pointer shadow-xs"
                      title="Maximizar e Analisar no Detalhe"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Detalhes</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL: GERAR / EDITAR AÇÕES ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden my-6 ${
                isDark ? 'bg-[#111622] border-[#222d3a] text-slate-100' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-transparent to-transparent">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black tracking-tight">
                      {editingAcao ? 'Editar Ação DPO' : 'Gerar Ações'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Defina o indicador, criticidade, contramedida e prazos estritos de início e término.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveForm} className="p-5 md:p-6 space-y-4">
                
                {/* Linha 1: Processo & Criticidade & Tipo */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                      Processo / Dashboard
                    </label>
                    <select
                      value={formProcesso}
                      onChange={(e) => {
                        const newProc = e.target.value;
                        setFormProcesso(newProc);
                        const list = INDICADORES_POR_PROCESSO[newProc] || INDICADORES_POR_PROCESSO.Geral;
                        setFormIndicador(list[0] || '');
                        setFormLocal(`${newProc} / Posição Operacional`);
                      }}
                      className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none ${
                        isDark ? 'bg-[#0b0f17] border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      {Object.keys(INDICADORES_POR_PROCESSO).map(proc => (
                        <option key={proc} value={proc}>{proc}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                      Criticidade
                    </label>
                    <select
                      value={formCriticidade}
                      onChange={(e) => setFormCriticidade(e.target.value as any)}
                      className={`w-full p-2.5 rounded-xl border text-xs font-black outline-none ${
                        formCriticidade === 'Alta' 
                          ? 'border-rose-500/50 text-rose-500' 
                          : formCriticidade === 'Média' 
                          ? 'border-amber-500/50 text-amber-500' 
                          : 'border-emerald-500/50 text-emerald-500'
                      } ${isDark ? 'bg-[#0b0f17]' : 'bg-slate-50'}`}
                    >
                      <option value="Alta">Alta (P1 - Crítica)</option>
                      <option value="Média">Média (P2 - Atenção)</option>
                      <option value="Baixa">Baixa (P3 - Rotina)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                      Tipo de Ação
                    </label>
                    <select
                      value={formTipo}
                      onChange={(e) => setFormTipo(e.target.value as any)}
                      className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none ${
                        isDark ? 'bg-[#0b0f17] border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <option value="Corretiva">Corretiva</option>
                      <option value="Rotina">Rotina</option>
                      <option value="Melhoria">Melhoria</option>
                    </select>
                  </div>
                </div>

                {/* Linha 2: Indicador (Sugestão ou Custom) */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Indicador / KPI Envolvido
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={formIndicador}
                      onChange={(e) => setFormIndicador(e.target.value)}
                      className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none ${
                        isDark ? 'bg-[#0b0f17] border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      {currentSuggestedIndicadores.map(ind => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                      <option value="__custom__">Outro (Digitar Indicador Customizado)</option>
                    </select>

                    {formIndicador === '__custom__' && (
                      <input
                        type="text"
                        placeholder="Nome do indicador customizado..."
                        value={formIndicadorCustom}
                        onChange={(e) => setFormIndicadorCustom(e.target.value)}
                        className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                          isDark ? 'bg-[#0b0f17] border-amber-500/50 text-white' : 'bg-slate-50 border-amber-500/50 text-slate-800'
                        }`}
                        autoFocus
                      />
                    )}
                  </div>
                </div>

                {/* Linha 3: O Que Fazer */}
                <div>
                  <label className="text-[10px] font-black uppercase text-rose-400 block mb-1">
                    O Que Fazer (Descrição do Desvio / Problema Identificado)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Descreva claramente qual anomalia ou desvio operacional ocorreu..."
                    value={formOQueFazer}
                    onChange={(e) => setFormOQueFazer(e.target.value)}
                    required
                    className={`w-full p-3 rounded-xl border text-xs leading-relaxed outline-none focus:border-rose-500 transition-colors ${
                      isDark ? 'bg-[#0b0f17] border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                {/* Linha 4: Resolução / Contramedida */}
                <div>
                  <label className="text-[10px] font-black uppercase text-emerald-400 block mb-1">
                    Resolução / Contramedida Prática
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Descreva a contramedida e como a ação deve ser executada para normalizar o processo..."
                    value={formResolucao}
                    onChange={(e) => setFormResolucao(e.target.value)}
                    required
                    className={`w-full p-3 rounded-xl border text-xs leading-relaxed outline-none focus:border-emerald-500 transition-colors ${
                      isDark ? 'bg-[#0b0f17] border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                {/* Linha 5: Cronograma (Data Início & Data Término STRICTLY) */}
                <div className={`p-4 rounded-2xl border grid grid-cols-1 sm:grid-cols-2 gap-3 ${
                  isDark ? 'bg-[#0b0f17] border-slate-800' : 'bg-amber-50/50 border-amber-200/60'
                }`}>
                  <div>
                    <label className="text-[10px] font-black uppercase text-amber-500 block mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Data de Início
                    </label>
                    <input
                      type="date"
                      value={formDataInicio}
                      onChange={(e) => setFormDataInicio(e.target.value)}
                      required
                      className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold outline-none ${
                        isDark ? 'bg-[#151b23] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-amber-500 block mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Data de Término (Prazo Final)
                    </label>
                    <input
                      type="date"
                      value={formDataTermino}
                      onChange={(e) => setFormDataTermino(e.target.value)}
                      required
                      className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold outline-none ${
                        isDark ? 'bg-[#151b23] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>
                </div>

                {/* Linha 6: Responsável, Local & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                      Responsável
                    </label>
                    <input
                      type="text"
                      value={formResponsavel}
                      onChange={(e) => setFormResponsavel(e.target.value)}
                      placeholder="Nome do colaborador..."
                      list="colaboradores-dpo-list"
                      className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none ${
                        isDark ? 'bg-[#0b0f17] border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    />
                    <datalist id="colaboradores-dpo-list">
                      {LISTA_COLABORADORES_OFICIAIS.map((c, idx) => (
                        <option key={(c as any).id || (c as any).matricula || `${c.nome}-${idx}`} value={c.nome}>{c.nome} ({c.cargo})</option>
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                      Local / Posição
                    </label>
                    <input
                      type="text"
                      value={formLocal}
                      onChange={(e) => setFormLocal(e.target.value)}
                      placeholder="Ex: Picking Rua 04 / Bancada 01"
                      className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                        isDark ? 'bg-[#0b0f17] border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                      Status Inicial
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none ${
                        isDark ? 'bg-[#0b0f17] border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Em Andamento">Em Andamento</option>
                      <option value="Concluído">Concluído</option>
                    </select>
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-600/25 cursor-pointer transition-all transform active:scale-98"
                  >
                    {editingAcao ? 'Salvar Alterações' : 'Confirmar e Gerar Ação'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: MAXIMIZAR / ANÁLISE NO DETALHE ── */}
      <AnimatePresence>
        {maximizedAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className={`w-full ${
                isFullScreen ? 'max-w-none h-screen rounded-none' : 'max-w-4xl max-h-[92vh] rounded-3xl'
              } border shadow-2xl flex flex-col overflow-hidden ${
                isDark ? 'bg-[#0d121c] border-[#1e2738] text-slate-100' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              {/* Header */}
              <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-transparent to-transparent shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Maximize2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                        {maximizedAction.processo}
                      </span>
                      {getCriticidadeBadge(maximizedAction.criticidade)}
                      {getTipoBadge(maximizedAction.tipo)}
                      {getStatusBadge(maximizedAction.status)}
                    </div>
                    <h2 className="text-lg md:text-xl font-black tracking-tight">
                      {maximizedAction.indicador}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden sm:inline-flex"
                    title="Imprimir / Exportar Ficha"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsFullScreen(!isFullScreen)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title={isFullScreen ? 'Restaurar Tamanho' : 'Tela Cheia'}
                  >
                    {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setMaximizedAction(null)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Fechar Detalhes"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="p-4 md:p-6 overflow-y-auto space-y-6 flex-1">
                
                {/* COMPARATIVO LADO A LADO: O Que Fazer vs Resolução */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* O Que Fazer Card */}
                  <div className={`p-4 rounded-2xl border ${
                    isDark ? 'bg-[#121824] border-rose-500/20' : 'bg-rose-50/40 border-rose-200'
                  }`}>
                    <div className="flex items-center gap-2 text-rose-500 font-black text-xs uppercase tracking-wider mb-2">
                      <AlertOctagon className="w-4 h-4" />
                      <span>Diagnóstico / O Que Fazer</span>
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                      {maximizedAction.oQueFazer}
                    </p>
                  </div>

                  {/* Resolução Card */}
                  <div className={`p-4 rounded-2xl border ${
                    isDark ? 'bg-[#121824] border-emerald-500/20' : 'bg-emerald-50/40 border-emerald-200'
                  }`}>
                    <div className="flex items-center gap-2 text-emerald-500 font-black text-xs uppercase tracking-wider mb-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Resolução & Contramedida</span>
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                      {maximizedAction.resolucao}
                    </p>
                  </div>
                </div>

                {/* CRONOGRAMA DE EXECUÇÃO: Data Início & Data Término */}
                <div className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-[#121824] border-[#1e2738]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <h4 className="text-xs font-black uppercase text-amber-500 tracking-wider flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4" /> Cronograma de Execução
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0b0f17] border-slate-800' : 'bg-white border-slate-200'}`}>
                      <span className="text-[10px] font-sans font-bold text-slate-400 block uppercase">Data de Início</span>
                      <strong className="text-sm text-slate-200 font-bold">
                        {maximizedAction.dataInicio.split('-').reverse().join('/')}
                      </strong>
                    </div>
                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0b0f17] border-slate-800' : 'bg-white border-slate-200'}`}>
                      <span className="text-[10px] font-sans font-bold text-slate-400 block uppercase">Data de Término</span>
                      <strong className="text-sm text-amber-400 font-bold">
                        {maximizedAction.dataTermino.split('-').reverse().join('/')}
                      </strong>
                    </div>
                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0b0f17] border-slate-800' : 'bg-white border-slate-200'}`}>
                      <span className="text-[10px] font-sans font-bold text-slate-400 block uppercase">Responsável & Setor</span>
                      <strong className="text-xs text-sky-400 font-bold block truncate">
                        {maximizedAction.responsavel || 'Operação'}
                      </strong>
                      <span className="text-[10px] text-slate-400 font-sans truncate block">{maximizedAction.local || 'Armazém'}</span>
                    </div>
                  </div>
                </div>

                {/* CHECKLIST DE VERIFICAÇÃO OPERACIONAL */}
                <div className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-[#121824] border-[#1e2738]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-2 mb-3">
                    <CheckSquare className="w-4 h-4 text-amber-400" /> Etapas de Verificação Operacional
                  </h4>
                  <div className="space-y-2">
                    {(maximizedAction.etapasVerificacao || []).map((step) => (
                      <div
                        key={step.id}
                        onClick={() => handleToggleStep(step.id)}
                        className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                          step.concluida
                            ? isDark ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : isDark ? 'bg-[#0b0f17] border-slate-800 text-slate-300 hover:border-slate-700' : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                          step.concluida 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-white'
                        }`}>
                          {step.concluida && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className={`text-xs ${step.concluida ? 'line-through opacity-80' : 'font-medium'}`}>
                          {step.texto}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ANOTAÇÕES & PARECER DE CAMPO */}
                <div className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-[#121824] border-[#1e2738]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-sky-400" /> Parecer de Campo / Observações de Execução
                  </h4>
                  <textarea
                    rows={3}
                    placeholder="Adicione observações de campo, validações com a equipe ou justificativas..."
                    defaultValue={maximizedAction.observacaoCampo || ''}
                    onBlur={(e) => handleSaveObservation(e.target.value)}
                    className={`w-full p-3 rounded-xl border text-xs leading-relaxed outline-none focus:border-amber-500 transition-colors ${
                      isDark ? 'bg-[#0b0f17] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    * O parecer é salvo automaticamente ao clicar fora da caixa de texto.
                  </span>
                </div>

              </div>

              {/* Footer Controls */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-slate-50/50 dark:bg-[#0b0f17]">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Alterar Status:</span>
                  <div className="flex items-center gap-1.5">
                    {(['Pendente', 'Em Andamento', 'Concluído'] as AcaoDpoItem['status'][]).map(st => (
                      <button
                        key={st}
                        onClick={() => handleQuickStatusChange(maximizedAction.id, st)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          maximizedAction.status === st
                            ? st === 'Concluído' ? 'bg-emerald-600 text-white' : st === 'Em Andamento' ? 'bg-sky-600 text-white' : 'bg-slate-700 text-white'
                            : isDark ? 'bg-slate-900 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const item = maximizedAction;
                      setMaximizedAction(null);
                      handleOpenEditModal(item);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 cursor-pointer"
                  >
                    Editar Ação
                  </button>
                  <button
                    onClick={() => setMaximizedAction(null)}
                    className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-slate-800 hover:bg-slate-700 cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

function AlertCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export default QuadroAcoesDpo;
