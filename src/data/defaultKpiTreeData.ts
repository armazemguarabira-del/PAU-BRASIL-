import { CustomKpiTree } from '../types/treeKpiTypes';

export const DEFAULT_OFFICIAL_KPI_TREE: CustomKpiTree = {
  id: 'tree-kpi-personalizada',
  name: 'Árvore de Indicadores (KPI)',
  title: 'ÁRVORE DE DECOMPOSIÇÃO DE INDICADORES (KPI)',
  subtitle: 'Estrutura hierárquica de 7 níveis customizável para qualquer tipo de processo ou indicador',
  badgeText: '7 NÍVEIS',
  unitName: 'unidades',
  currencySymbol: 'R$',
  totalValue: 0,
  totalVolume: 0,
  totalRegistros: 0,
  ticketMedio: 0,
  summaryTag: 'Estrutura personalizada ativa.',
  criticalHighlight: '',
  levels: {
    level1Title: 'ÁRVORE DE KPI',
    level1Badge: 'RAIZ',
    level2Title: 'NÍVEL 2 - CATEGORIAS',
    level2Badge: '0 CARDS',
    level3Title: 'NÍVEL 3 - SUB-RAMOS',
    level3Badge: '0 CARDS',
    level4Title: 'NÍVEL 4 - SEGMENTOS',
    level4Badge: '0 CARDS',
    level5Title: 'NÍVEL 5 - DETALHAMENTO',
    level5Badge: '0 CARDS',
    level6Title: 'NÍVEL 6 - OPERAÇÃO',
    level6Badge: '0 CARDS',
    level7Title: 'NÍVEL 7 - ITENS / SKUS',
    level7Badge: '0 ITENS',
  },
  nodes: {
    level1: {
      id: 'root',
      label: 'ARVORE DE KPI',
      sublabel: 'Base Limpa',
      value: 0,
      volume: 0,
      badge: '0 Lançamentos',
      metaInfo: 'Árvore de Indicadores',
    },
    level2: [],
    level3: {},
    level4: {},
    level5: {},
    level6: {},
    level7: {}
  }
};


