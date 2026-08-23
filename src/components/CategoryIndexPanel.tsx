import React, { useState } from 'react';
import { Usuario } from '../types';
import { isPanelAllowedForUser } from '../utils/permissions';
import { 
  Users,
  RefreshCw, 
  Trash2, 
  Truck, 
  AlertTriangle, 
  Calendar, 
  Search, 
  Package, 
  ClipboardCheck, 
  Download, 
  ListChecks,
  ChevronRight,
  Database,
  BarChart2,
  Sliders,
  Activity,
  Layers,
  ShieldCheck,
  Clock,
  ClipboardList,
  Upload,
  TrendingUp,
  ShieldAlert,
  Award,
  Zap,
  FileSpreadsheet,
  BookOpen,
  ArrowRight,
  Sparkles,
  Shield,
  Target,
  ExternalLink,
  FileCode
} from 'lucide-react';

interface CategoryIndexPanelProps {
  categoryKey: 'cat-produtividade' | 'cat-dashboards' | 'cat-ferramentas-gestao' | 'cat-cadastros' | 'cat-dados-acoes';
  user: Usuario;
  onNavigate: (tabId: string) => void;
  theme?: 'light' | 'dark';
}

export interface ModuleItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  color: string;
}

export const CATEGORY_DEFINITIONS: Record<
  'cat-produtividade' | 'cat-dashboards' | 'cat-ferramentas-gestao' | 'cat-cadastros' | 'cat-dados-acoes',
  {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    color: string;
    items: ModuleItem[];
  }
> = {
  'cat-produtividade': {
    title: 'Produtividade',
    subtitle: 'Módulos de apontamento operacional diário do armazém e pátio',
    icon: <Zap className="w-6 h-6 text-amber-500 dark:text-amber-400" />,
    color: 'from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/20 dark:via-amber-500/5 dark:to-transparent',
    items: [
      {
        id: 'ajudante',
        label: 'Operação Ajudante',
        description: 'Apontamento unificado de atividades de Ajudante: Repack, Despejo e Quebras.',
        icon: <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
        badge: 'Ajudantes',
        color: 'border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500/60'
      },
      {
        id: 'empilhador',
        label: 'Operação Empilhador',
        description: 'Apontamento de atividades de pátio, movimentação e carregamento.',
        icon: <Package className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
        badge: 'Pátio',
        color: 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60'
      },
      {
        id: 'conferente',
        label: 'Conferente/ADM',
        description: 'Conferência de cargas, validação de minutas, contagem de validade e relatórios.',
        icon: <ClipboardCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
        badge: 'Conferência',
        color: 'border-teal-500/30 bg-teal-500/5 hover:border-teal-500/60'
      }
    ]
  },
  'cat-dashboards': {
    title: 'Dashboards',
    subtitle: 'Painéis analíticos, BI e métricas em tempo real para tomada de decisão',
    icon: <BarChart2 className="w-6 h-6 text-sky-600 dark:text-sky-400" />,
    color: 'from-sky-500/10 via-sky-500/5 to-transparent dark:from-sky-500/20 dark:via-sky-500/5 dark:to-transparent',
    items: [
      {
        id: 'visao-geral',
        label: 'Workstation (Centro de Controle)',
        description: 'Painel central de controle com visão integrada de movimentação e alertas.',
        icon: <Activity className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
        badge: 'Central',
        color: 'border-sky-500/30 bg-sky-500/5 hover:border-sky-500/60'
      },
      {
        id: 'repack-dashboard',
        label: 'Dashboard Repack',
        description: 'Indicadores de produtividade, velocidade cx/h e histórico do Repack.',
        icon: <BarChart2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
        badge: 'BI Repack',
        color: 'border-purple-500/30 bg-purple-500/5 hover:border-purple-500/60'
      },
      {
        id: 'despejo-dashboard',
        label: 'Dashboard Despejo',
        description: 'Métricas de escoamento de liquido, volumetria e capacidade.',
        icon: <BarChart2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
        badge: 'BI Despejo',
        color: 'border-rose-500/30 bg-rose-500/5 hover:border-rose-500/60'
      },
      {
        id: 'quebras-dashboard',
        label: 'Dashboard Quebras',
        description: 'Análise de causas de perdas, mapa de calor por turno e setor.',
        icon: <BarChart2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
        badge: 'BI Perdas',
        color: 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60'
      },
      {
        id: 'fefo-dashboard',
        label: 'Dashboard FEFO (Validades)',
        description: 'Curva de envelhecimento de lote, alertas de risco e curva ABC.',
        icon: <BarChart2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        badge: 'BI FEFO',
        color: 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60'
      },
      {
        id: 'picking-dashboard',
        label: 'Dashboard Operadores',
        description: 'Performance de separadores, conferentes e SLA de atendimento.',
        icon: <BarChart2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
        badge: 'Operadores',
        color: 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60'
      },
      {
        id: 'gestao-capacidade',
        label: 'Gestão de Capacidade & Curva ABC',
        description: 'Layout, Ocupação de Posições, Matriz de Correlação e Curva ABC (Relatório 03.05.19).',
        icon: <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        badge: 'Armazém & ABC',
        color: 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60'
      },
      {
        id: 'ranking-produtividade',
        label: 'Ranking de Produtividade',
        description: 'Gamificação e quadro de destaques do time operacional.',
        icon: <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
        badge: 'Gamificação',
        color: 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60'
      },
      {
        id: 'wlp-dashboard',
        label: 'Dashboard WLP (HL/HH)',
        description: 'Produtividade Workload Planning, acompanhamento de horas trabalhadas e desvios DPO.',
        icon: <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
        badge: 'WLP & DPO',
        color: 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60'
      },
      {
        id: 'qualidade',
        label: 'Qualidade (5S, Temp & Pragas)',
        description: 'Controle sanitário, medição de temperatura e auditorias de 5S.',
        icon: <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        badge: 'Qualidade',
        color: 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60'
      },
      {
        id: 'kpi-arvore',
        label: 'KPI em Árvore',
        description: 'Visão em árvore hierárquica para desdobramento de metas DPO.',
        icon: <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        badge: 'Árvore KPI',
        color: 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60'
      }
    ]
  },
  'cat-ferramentas-gestao': {
    title: 'Ferramentas de Gestão',
    subtitle: 'Sistemas de governança, auditoria DPO, inventários e padronização',
    icon: <Sliders className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
    color: 'from-blue-500/10 via-blue-500/5 to-transparent dark:from-blue-500/20 dark:via-blue-500/5 dark:to-transparent',
    items: [
      {
        id: 'dto-diagnostico',
        label: 'DTO (Diagnóstico do Trabalho Operacional)',
        description: 'Diagnóstico aplicado quando não se bate a meta nas 9 frentes operacionais (Repack, Despejo, Quebras, EFC, EFD, Montagem, Validades, Blitz Puxada e Blitz Refugo).',
        icon: <ClipboardCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
        badge: 'DTO DPO',
        color: 'border-blue-500/40 bg-blue-500/10 hover:border-blue-500/70 shadow-sm'
      },
      {
        id: 'plataformas-externas',
        label: 'Plataforma Retorno de Rota, Trocas & Reposições',
        description: 'Ferramentas de Gestão com links de redirecionamento para Plataforma de Retorno de Rota e Plataforma de Trocas e Reposições.',
        icon: <ExternalLink className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
        badge: 'Redirecionamentos',
        color: 'border-sky-500/30 bg-sky-500/5 hover:border-sky-500/60'
      },
      {
        id: 'auditoria-dpo',
        label: 'Auditoria DPO (5 Blocos)',
        description: 'Avaliação de maturidade dos 5 blocos operacionais do Pilar Armazém.',
        icon: <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        badge: 'DPO',
        color: 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60'
      },
      {
        id: 'treinamentos-qualidade',
        label: 'Treinamentos de Qualidade',
        description: 'Matriz de habilitação e registros de capacitação do time.',
        icon: <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        badge: 'Capacitação',
        color: 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60'
      },
      {
        id: 'bloqueio-armazem',
        label: 'Bloqueio no Armazém',
        description: 'Gestão de produtos bloqueados, quarentena e devolução técnica.',
        icon: <ShieldAlert className="w-5 h-5 text-rose-500" />,
        badge: 'Bloqueios',
        color: 'border-rose-500/30 bg-rose-500/5 hover:border-rose-500/60'
      },
      {
        id: 'devolucao',
        label: 'Devolução de Produtos',
        description: 'Processamento de devoluções de rota e tratativa de avarias de cliente.',
        icon: <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
        badge: 'Devoluções',
        color: 'border-blue-500/30 bg-blue-500/5 hover:border-blue-500/60'
      },
      {
        id: 'contagem-inventario',
        label: 'Contagem de Inventário',
        description: 'Rotinas de inventário cíclico e contagem geral de estoque.',
        icon: <ClipboardList className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
        badge: 'Inventário',
        color: 'border-purple-500/30 bg-purple-500/5 hover:border-purple-500/60'
      },
      {
        id: 'gestao-ativos',
        label: 'Gestão de Ativos Retornáveis',
        description: 'Controle de vasilhames vazios, caixas plásticas e garrafeiras.',
        icon: <Package className="w-5 h-5 text-amber-600 dark:text-amber-500" />,
        badge: 'Ativos',
        color: 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60'
      },
      {
        id: 'qualidade-puxada',
        label: 'Qualidade da Puxada',
        description: 'Conferência e checklist de transferência de carretas entre fábricas.',
        icon: <Truck className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
        badge: 'Puxada',
        color: 'border-teal-500/30 bg-teal-500/5 hover:border-teal-500/60'
      },
      {
        id: 'ciclo-carretas',
        label: 'Ciclo das Carretas',
        description: 'Gestão de TMR, tempo em doca e giro de frotas pesadas.',
        icon: <Truck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
        badge: 'Frotas',
        color: 'border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500/60'
      },
      {
        id: 'politica-estoque',
        label: 'Política de Estoque & Análise',
        description: 'Análise de dias de cobertura, estoque mínimo e giro de produtos.',
        icon: <BarChart2 className="w-5 h-5 text-blue-600 dark:text-[#1e56f0]" />,
        badge: 'Giro',
        color: 'border-blue-500/30 bg-blue-500/5 hover:border-blue-500/60'
      },
      {
        id: 'simulador-ressuprimento',
        label: 'Simulador de Ressuprimento',
        description: 'Calculadora de reposição baseada na demanda média e lead time.',
        icon: <Truck className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
        badge: 'Simulação',
        color: 'border-cyan-500/30 bg-cyan-500/5 hover:border-cyan-500/60'
      },
      {
        id: 'importacao-contagens',
        label: 'Importação de Contagens',
        description: 'Carregamento em lote de arquivos de inventário físico.',
        icon: <Upload className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
        badge: 'Importar',
        color: 'border-sky-500/30 bg-sky-500/5 hover:border-sky-500/60'
      },
      {
        id: 'venda-media',
        label: 'Curva ABC & Venda Média',
        description: 'Motor de cálculo Pareto (80/20) com Venda Média de 3 Meses e sugestões de alocação de Picking.',
        icon: <TrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
        badge: 'Curva ABC 80/20',
        color: 'border-teal-500/30 bg-teal-500/5 hover:border-teal-500/60'
      },
      {
        id: 'area-contingencia',
        label: 'Área de Contingência',
        description: 'Procedimentos de emergência para quedas de sistema ou pico de safra.',
        icon: <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-500" />,
        badge: 'Contingência',
        color: 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60'
      },
      {
        id: 'padronizacao-processos',
        label: 'Padronização de Processos (POP)',
        description: 'Biblioteca de Procedimentos Operacionais Padrão e rotinas.',
        icon: <ClipboardList className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        badge: 'POP',
        color: 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60'
      },
      {
        id: 'simulacao-acoes',
        label: 'Gestão de Ações & Governança',
        description: 'Acompanhamento do Plano de Ações, Donos e Matriz de Priorização.',
        icon: <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
        badge: 'Ações',
        color: 'border-purple-500/30 bg-purple-500/5 hover:border-purple-500/60'
      },
      {
        id: 'dn-swot',
        label: 'DN & Matriz SWOT',
        description: 'Análise de Diagnóstico de Negócio, Forças, Fraquezas e Oportunidades.',
        icon: <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        badge: 'Estratégia',
        color: 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60'
      },
      {
        id: 'controle',
        label: 'Painel Controle',
        description: 'Configurações avançadas da unidade e limites operacionais.',
        icon: <Sliders className="w-5 h-5 text-amber-600 dark:text-amber-500" />,
        badge: 'Parâmetros',
        color: 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60'
      },
      {
        id: 'dados-retroativos',
        label: 'Dados Retroativos',
        description: 'Ferramenta para reprocessamento de histórico e correções passadas.',
        icon: <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
        badge: 'Ajustes',
        color: 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60'
      },
      {
        id: 'agenda-executiva',
        label: 'Agenda Executiva',
        description: 'Compromissos do dia, semana e mês no Workstation Executivo.',
        icon: <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
        badge: 'Agenda',
        color: 'border-blue-500/30 bg-blue-500/5 hover:border-blue-500/60'
      },
      {
        id: 'diario-bordo',
        label: 'Diário de Bordo',
        description: 'Anotações diárias, treinamentos e lembretes individuais por colaborador.',
        icon: <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
        badge: 'Diário',
        color: 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60'
      },
      {
        id: 'reunioes',
        label: 'Reuniões e Treinamentos',
        description: 'Gestão de reuniões, treinamentos DPO, Team Room do armazém, trocas de turno e atas em PDF.',
        icon: <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
        badge: 'Treinamentos',
        color: 'border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500/60'
      },
      {
        id: 'semana-qualidade',
        label: 'Semana da Qualidade',
        description: 'Gestão do evento anual da qualidade, anexos de atas assinadas, materiais e formulários de Check de Retenção.',
        icon: <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        badge: 'DPO Qualidade',
        color: 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60'
      },
      {
        id: 'armazem-facil-padrao-02',
        label: 'Armazém Fácil Padrão 02',
        description: 'Página em branco padrão integrada com o banco de dados banco-03-teste.',
        icon: <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
        badge: 'Padrão 02',
        color: 'border-blue-500/30 bg-blue-500/5 hover:border-blue-500/60'
      }
    ]
  },
  'cat-cadastros': {
    title: 'Cadastros & Governança',
    subtitle: 'Gestão unificada da base mestre de produtos, colaboradores, acessos, metas e planos de ação',
    icon: <Database className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
    color: 'from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-500/20 dark:via-emerald-500/5 dark:to-transparent',
    items: [
      {
        id: 'cadastros',
        label: 'Central de Cadastros & Dados-Mestre',
        description: 'Hub unificado para gestão de Produtos, Colaboradores, Permissões de Acesso, Metas Operacionais e Padrões (POP/SOP).',
        icon: <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        badge: 'Hub Central',
        color: 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60'
      },
      {
        id: 'dados-retroativos',
        label: 'Importação de Dados Retroativos (JSON)',
        description: 'Módulo dedicado para importação em lote, validação e gravação direta de Quebras, Avarias e apontamentos históricos em JSON.',
        icon: <FileCode className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
        badge: 'Novo • JSON Sync',
        color: 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60'
      },
      {
        id: 'exportar',
        label: 'Base de Dados Central (Apagar & Importar)',
        description: 'Gestão da base mestre por processo, expurgo/limpeza de base e importação de planilhas.',
        icon: <Database className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
        badge: 'Base Central',
        color: 'border-sky-500/30 bg-sky-500/5 hover:border-sky-500/60'
      },
      {
        id: 'acoes',
        label: 'Gestão de Ações & Governança',
        description: 'Central de acompanhamento de tratativas DPO, criação e liberação de setores operacionais.',
        icon: <ListChecks className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        badge: 'Ações & Setores',
        color: 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60'
      },
      {
        id: 'firebase',
        label: 'Status Firestore',
        description: 'Monitoramento da conexão com o banco de dados e sincronização em tempo real.',
        icon: <Database className="w-5 h-5 text-amber-600 dark:text-amber-500" />,
        badge: 'Infra',
        color: 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60'
      }
    ]
  },
  'cat-dados-acoes': {
    title: 'Cadastros & Governança',
    subtitle: 'Gestão unificada da base mestre de produtos, colaboradores, acessos, metas e planos de ação',
    icon: <Database className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
    color: 'from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-500/20 dark:via-emerald-500/5 dark:to-transparent',
    items: [
      {
        id: 'cadastros',
        label: 'Central de Cadastros & Dados-Mestre',
        description: 'Hub unificado para gestão de Produtos, Colaboradores, Permissões de Acesso, Metas Operacionais e Padrões (POP/SOP).',
        icon: <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        badge: 'Hub Central',
        color: 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60'
      },
      {
        id: 'dados-retroativos',
        label: 'Importação de Dados Retroativos (JSON)',
        description: 'Módulo dedicado para importação em lote, validação e gravação direta de Quebras, Avarias e apontamentos históricos em JSON.',
        icon: <FileCode className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
        badge: 'Novo • JSON Sync',
        color: 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60'
      },
      {
        id: 'exportar',
        label: 'Base de Dados Central (Apagar & Importar)',
        description: 'Gestão da base mestre por processo, expurgo/limpeza de base e importação de planilhas.',
        icon: <Database className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
        badge: 'Base Central',
        color: 'border-sky-500/30 bg-sky-500/5 hover:border-sky-500/60'
      },
      {
        id: 'acoes',
        label: 'Gestão de Ações & Governança',
        description: 'Central de acompanhamento de tratativas DPO, criação e liberação de setores operacionais.',
        icon: <ListChecks className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        badge: 'Ações & Setores',
        color: 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60'
      },
      {
        id: 'firebase',
        label: 'Status Firestore',
        description: 'Monitoramento da conexão com o banco de dados e sincronização em tempo real.',
        icon: <Database className="w-5 h-5 text-amber-600 dark:text-amber-500" />,
        badge: 'Infra',
        color: 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60'
      }
    ]
  }
};

function getItemStyle(itemId: string) {
  if (itemId.includes('ajudante') || itemId.includes('reunioes') || itemId.includes('ciclo-carretas')) {
    return {
      iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30',
      badgeClass: 'text-indigo-700 bg-indigo-50 border-indigo-200 dark:text-indigo-300 dark:bg-indigo-950/60 dark:border-indigo-800',
      topLine: 'from-indigo-500 to-indigo-600',
      hoverBorder: 'hover:border-indigo-500/60 dark:hover:border-indigo-400/60',
      btnHover: 'group-hover:bg-indigo-600 group-hover:border-indigo-600',
      btnText: 'text-indigo-600 dark:text-indigo-400',
      btnBg: 'bg-indigo-50/80 dark:bg-indigo-500/10 border-indigo-200/80 dark:border-indigo-500/20'
    };
  }
  if (itemId.includes('empilhador') || itemId.includes('ranking') || itemId.includes('wlp') || itemId.includes('diario') || itemId.includes('quebras') || itemId.includes('controle') || itemId.includes('dados-retroativos') || itemId.includes('area-contingencia') || itemId.includes('gestao-ativos')) {
    return {
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
      badgeClass: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/60 dark:border-amber-800',
      topLine: 'from-amber-500 to-amber-600',
      hoverBorder: 'hover:border-amber-500/60 dark:hover:border-amber-400/60',
      btnHover: 'group-hover:bg-amber-600 group-hover:border-amber-600',
      btnText: 'text-amber-600 dark:text-amber-400',
      btnBg: 'bg-amber-50/80 dark:bg-amber-500/10 border-amber-200/80 dark:border-amber-500/20'
    };
  }
  if (itemId.includes('conferente') || itemId.includes('qualidade-puxada') || itemId.includes('venda-media')) {
    return {
      iconBg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-500/30',
      badgeClass: 'text-teal-700 bg-teal-50 border-teal-200 dark:text-teal-300 dark:bg-teal-950/60 dark:border-teal-800',
      topLine: 'from-teal-500 to-teal-600',
      hoverBorder: 'hover:border-teal-500/60 dark:hover:border-teal-400/60',
      btnHover: 'group-hover:bg-teal-600 group-hover:border-teal-600',
      btnText: 'text-teal-600 dark:text-teal-400',
      btnBg: 'bg-teal-50/80 dark:bg-teal-500/10 border-teal-200/80 dark:border-teal-500/20'
    };
  }
  if (itemId.includes('fefo') || itemId.includes('cadastros') || itemId.includes('auditoria-dpo') || itemId.includes('treinamentos') || itemId.includes('qualidade') || itemId.includes('kpi-arvore') || itemId.includes('padronizacao') || itemId.includes('dn-swot') || itemId.includes('semana-qualidade') || itemId.includes('acoes') || itemId.includes('gestao-capacidade')) {
    return {
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
      badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-800',
      topLine: 'from-emerald-500 to-emerald-600',
      hoverBorder: 'hover:border-emerald-500/60 dark:hover:border-emerald-400/60',
      btnHover: 'group-hover:bg-emerald-600 group-hover:border-emerald-600',
      btnText: 'text-emerald-600 dark:text-emerald-400',
      btnBg: 'bg-emerald-50/80 dark:bg-emerald-500/10 border-emerald-200/80 dark:border-emerald-500/20'
    };
  }
  if (itemId.includes('repack') || itemId.includes('contagem') || itemId.includes('simulacao-acoes')) {
    return {
      iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/30',
      badgeClass: 'text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-300 dark:bg-purple-950/60 dark:border-purple-800',
      topLine: 'from-purple-500 to-purple-600',
      hoverBorder: 'hover:border-purple-500/60 dark:hover:border-purple-400/60',
      btnHover: 'group-hover:bg-purple-600 group-hover:border-purple-600',
      btnText: 'text-purple-600 dark:text-purple-400',
      btnBg: 'bg-purple-50/80 dark:bg-purple-500/10 border-purple-200/80 dark:border-purple-500/20'
    };
  }
  if (itemId.includes('despejo') || itemId.includes('bloqueio')) {
    return {
      iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30',
      badgeClass: 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950/60 dark:border-rose-800',
      topLine: 'from-rose-500 to-rose-600',
      hoverBorder: 'hover:border-rose-500/60 dark:hover:border-rose-400/60',
      btnHover: 'group-hover:bg-rose-600 group-hover:border-rose-600',
      btnText: 'text-rose-600 dark:text-rose-400',
      btnBg: 'bg-rose-50/80 dark:bg-rose-500/10 border-rose-200/80 dark:border-rose-500/20'
    };
  }
  return {
    iconBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-500/30',
    badgeClass: 'text-sky-700 bg-sky-50 border-sky-200 dark:text-sky-300 dark:bg-sky-950/60 dark:border-sky-800',
    topLine: 'from-sky-500 to-blue-600',
    hoverBorder: 'hover:border-sky-500/60 dark:hover:border-sky-400/60',
    btnHover: 'group-hover:bg-sky-600 group-hover:border-sky-600',
    btnText: 'text-sky-600 dark:text-sky-400',
    btnBg: 'bg-sky-50/80 dark:bg-sky-500/10 border-sky-200/80 dark:border-sky-500/20'
  };
}

export default function CategoryIndexPanel({
  categoryKey,
  user,
  onNavigate,
  theme = 'light'
}: CategoryIndexPanelProps) {
  const [filterText, setFilterText] = useState('');

  const config = CATEGORY_DEFINITIONS[categoryKey] || CATEGORY_DEFINITIONS['cat-produtividade'];

  const visibleItems = config.items.filter(item => {
    const isAllowed = isPanelAllowedForUser(item.id, user);
    if (!isAllowed) return false;
    if (!filterText.trim()) return true;
    const query = filterText.toLowerCase();
    return (
      item.label.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      (item.badge && item.badge.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Category Header Banner */}
      <div className="bg-gradient-to-r from-[#0d1b3e] via-[#112555] to-[#0a1530] border-2 border-blue-500/40 rounded-2xl p-6 relative overflow-hidden shadow-xl text-white">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-blue-900/60 border border-blue-400/40 rounded-2xl shadow-inner flex items-center justify-center shrink-0 text-blue-300">
              {config.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-sky-300 bg-sky-500/20 px-2.5 py-0.5 rounded-md border border-sky-400/30">
                  Índice da Categoria
                </span>
                <span className="text-[10px] font-bold text-blue-200/80 uppercase font-mono">
                  {visibleItems.length} Módulo(s) disponível(is)
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-1">
                {config.title}
              </h1>
              <p className="text-xs text-blue-100/90 font-medium max-w-2xl mt-0.5 leading-relaxed">
                {config.subtitle}
              </p>
            </div>
          </div>

          {/* Local Filter Box */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 text-blue-300 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={`Filtrar em ${config.title}...`}
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full bg-[#070e20]/90 border border-blue-500/40 text-white placeholder:text-blue-300/60 text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Full-Screen Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visibleItems.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3 shadow-sm">
            <Search className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">
              Nenhum módulo encontrado
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Não foram localizados módulos ativos para esta busca ou perfil de usuário. Tente limpar os filtros de pesquisa.
            </p>
          </div>
        ) : (
          visibleItems.map((item) => {
            const style = getItemStyle(item.id);
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`text-left bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 sm:p-6 relative group transition-all duration-300 cursor-pointer shadow-md hover:shadow-2xl hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden min-h-[220px] ${style.hoverBorder}`}
              >
                {/* Top decorative gradient bar */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${style.topLine} opacity-80 group-hover:opacity-100 group-hover:h-2 transition-all duration-300`} />

                <div>
                  {/* Header row: Icon, Badge and Arrow */}
                  <div className="flex items-center justify-between gap-3">
                    <div className={`p-3 rounded-2xl border shadow-sm ${style.iconBg} transition-transform duration-300 group-hover:scale-105`}>
                      {item.icon}
                    </div>

                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg border shadow-xs ${style.badgeClass}`}>
                          {item.badge}
                        </span>
                      )}
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#0b1222] border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-blue-600 group-hover:border-blue-600 transition-all duration-200 shadow-xs">
                        <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Title and Description */}
                  <div className="mt-4">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors">
                      {item.label}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed mt-1.5 line-clamp-3">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Interactive Bottom CTA Footer */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Disponível</span>
                  </div>
                  
                  <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all duration-200 ${style.btnBg} ${style.btnText} ${style.btnHover} group-hover:text-white`}>
                    <span>Acessar Módulo</span>
                    <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
