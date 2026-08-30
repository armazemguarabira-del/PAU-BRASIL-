import { ManualInstrucaoCard } from './ManualInstrucaoCard';
import { SopBannerViewer } from './SopBannerViewer';
import { IndicatorActionModal } from './IndicatorActionModal';
import React, { useState, useEffect, useMemo } from 'react';
import { calculateStockAgeIndex, calculateStockAgeSummary } from '../utils/calculateStockAgeIndex';
import { getYearlyStockAgeSummary } from '../utils/stockAgeMonthlyManager';
import { MATRIZ_BLOCOS_CONFIG, validarPosicionamentoLayout, getDistanciaPickingScore, getBlocoIdealParaCurva, calcularQuebrasFefoEstoqueXEstoque, calcularQuebrasFefoEstoqueXPicking } from '../utils/matrizBlocos';
import { calcularTotalCaixas as calcCaixasPkg } from '../data/coletaPackagingData';
import * as XLSX from 'xlsx';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line,
  PieChart,
  Pie,
  Legend,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine
} from 'recharts';
import { 
  Calendar, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
  Sparkles,
  AlertTriangle,
  ArrowLeft,
  Download,
  TrendingUp,
  Filter,
  CheckCircle,
  Clock,
  Plus,
  Trash2,
  FileText,
  User,
  ShieldAlert,
  Archive,
  Truck,
  Layers,
  MapPin,
  RefreshCw,
  Users,
  AlertCircle,
  Search,
  CheckSquare,
  ClipboardCheck
} from 'lucide-react';
import { Usuario, Empresa, ValidadeRow } from '../types';
import { isCustomFirebaseConnected } from '../firebase';
import { ValidadesRepository } from '../db';
import { firestoreDb } from '../database/firestoreDatabase';
import { useEmpresaData } from '../context/EmpresaDataContext';
import { PRODUCTS } from '../planosData';
import A3BoardComponent from './A3BoardComponent';
import CalendarFilter from './CalendarFilter';
import StockAgeIndexTab from './StockAgeIndexTab';
import FuturoShelfTab from './FuturoShelfTab';
import GestaoEscoamentoTab from './GestaoEscoamentoTab';
import { WorkstationCriticosRecolhimento } from './WorkstationCriticosRecolhimento';
import { getInitialDefaultValidades, removeLegacySeedValidades } from '../utils/fefoDefaultData';
import { triggerAutoAcaoCorretiva, triggerAutoAcaoMelhoriaPreventiva } from '../utils/simulacaoAcoesUtils';
import html2canvas from 'html2canvas';
import { syncFefoDemandsFromValidades, getStoredFefoDemands, updateFefoDemandStatus, concluirTodosGirosFefoQuebras } from '../utils/fefoDemandManager';
import { QuadroAcoesDpo } from './QuadroAcoesDpo';
import ShelfLifePncTab from './ShelfLifePncTab';
import FefoEstoqueXEstoqueTab from './FefoEstoqueXEstoqueTab';
import FefoEstoqueXPickingTab from './FefoEstoqueXPickingTab';
import Import030519Modal from './Import030519Modal';
import ImportJsonModal from './ImportJsonModal';
import FefoAderenciaHistoricoModal from './FefoAderenciaHistoricoModal';
import { getStoredAderenciaHistorico } from '../utils/fefoAderenciaHistorico';
import { get030519DataForSku } from '../utils/vendaMedia030519';

interface FefoDashboardProps {
  user: Usuario;
  empresa: Empresa | null;
  onBack?: () => void;
  theme?: 'light' | 'dark';
  initialTab?: FefoPage;
  initialSubTab?: string;
}

// Sub-pages defined by user
type FefoPage = 'validades' | 'pnc' | 'stock-age' | 'futuro-shelf' | 'escoamento' | 'shelf-pnc' | 'estoque-estoque' | 'estoque-picking' | 'boarda3' | 'acoes' | 'executiva' | 'rlp' | 'shelf-life' | 'rlp-semanal';

interface RLPMeeting {
  id: string;
  data: string;
  produtos: string;
  quantidadeRisco: number;
  estrategia: string;
  responsavel: string;
  prazo: string;
  status: 'Aberta' | 'Em andamento' | 'Concluída';
}

interface ActionPoint {
  id: string;
  produto: string;
  lote: string;
  acao: string;
  responsavel: string;
  dataAbertura: string;
  dataPrevista: string;
  dataConclusao?: string;
  status: 'Pendente' | 'Em Andamento' | 'Concluído' | 'Atrasado';
}

interface StockTransfer {
  id?: string;
  ruaOrigem: string;
  ruaDestino: string;
  produto: string;
  lote: string;
  validade: string;
  quantidade: number;
  motivo: string;
  data: string;
}

interface PickingComparison {
  id?: string;
  produto: string;
  lote: string;
  validade: string;
  qtdEstoque: number;
  qtdPicking: number;
  diferenca: number;
  status: 'Conforme' | 'Atenção' | 'Desvio Crítico';
  pickingDays?: number;
  estoqueDays?: number;
  gap?: number;
  validadeEstoque?: string;
  validadePicking?: string;
}

// Seed highly polished starting data for realistic analytics
const SEED_RLP_MEETINGS: RLPMeeting[] = [
  {
    id: 'rlp-1',
    data: '22/06/2026',
    produtos: 'SKOL 600ML (Lote: B-20)',
    quantidadeRisco: 420,
    estrategia: 'Conceder desconto de volume para rede de supermercados parceira e ativar ponto extra de gôndola.',
    responsavel: 'Felipe (Vendas)',
    prazo: '30/06/2026',
    status: 'Em andamento'
  },
  {
    id: 'rlp-2',
    data: '15/06/2026',
    produtos: 'STELLA ARTOIS LT 269ML (Lote: S-10)',
    quantidadeRisco: 180,
    estrategia: 'Inclusão em combo promocional com petiscos em canais de autosserviço.',
    responsavel: 'Marina (Trade Mkt)',
    prazo: '25/06/2026',
    status: 'Concluída'
  },
  {
    id: 'rlp-3',
    data: '25/06/2026',
    produtos: 'BUDWEISER 600ML (Lote: BU-80)',
    quantidadeRisco: 310,
    estrategia: 'Transferência imediata de estoque excedente para filial B com maior giro do produto.',
    responsavel: 'Carlos (Logística)',
    prazo: '05/07/2026',
    status: 'Aberta'
  }
];

const SEED_ACTION_POINTS: ActionPoint[] = [
  {
    id: 'act-1',
    produto: 'SKOL 600ML',
    lote: 'SK-2026A',
    acao: 'Repactuação de preço e envio para mercadinhos de rota rápida',
    responsavel: 'Marcos (Vendas)',
    dataAbertura: '18/06/2026',
    dataPrevista: '25/06/2026',
    status: 'Atrasado'
  },
  {
    id: 'act-2',
    produto: 'BRAHMA CHOPP GFA VD 1L',
    lote: 'BR-9842',
    acao: 'Identificar ruas com erro físico de endereçamento e relocar lotes antigos',
    responsavel: 'Thiago (Depósito)',
    dataAbertura: '20/06/2026',
    dataPrevista: '30/06/2026',
    status: 'Em Andamento'
  },
  {
    id: 'act-3',
    produto: 'STELLA ARTOIS LT 269ML',
    lote: 'ST-5512',
    acao: 'Emissão de bonificação estratégica para atingimento de meta de volume',
    responsavel: 'Aline (Comercial)',
    dataAbertura: '15/06/2026',
    dataPrevista: '22/06/2026',
    dataConclusao: '21/06/2026',
    status: 'Concluído'
  },
  {
    id: 'act-4',
    produto: 'GUARANA CHP ANTARCTICA PET 2L',
    lote: 'GU-8821',
    acao: 'Fazer repick acelerado e liberar na frente de carregamento do turno 1',
    responsavel: 'Cleiton (Supervisor)',
    dataAbertura: '24/06/2026',
    dataPrevista: '28/06/2026',
    status: 'Pendente'
  }
];

const SEED_STOCK_TRANSFERS: StockTransfer[] = [
  { ruaOrigem: 'A1', ruaDestino: 'A4', produto: 'SKOL 600ML', lote: 'SK-2026A', validade: '12/07/2026', quantidade: 140, motivo: 'Consolidação de Lote Antigo (FEFO)', data: '26/06/2026' },
  { ruaOrigem: 'B2', ruaDestino: 'B4', produto: 'BRAHMA CHOPP GFA VD 1L', lote: 'BR-9842', validade: '22/07/2026', quantidade: 80, motivo: 'Correção de Endereçamento de Bloco', data: '25/06/2026' },
  { ruaOrigem: 'A3', ruaDestino: 'C1', produto: 'ORIGINAL 600ML', lote: 'OR-3310', validade: '18/08/2026', quantidade: 120, motivo: 'Reorganização do Blocado de Alto Giro', data: '27/06/2026' },
  { ruaOrigem: 'C2', ruaDestino: 'B1', produto: 'PEPSI COLA PET 2L', lote: 'PE-4100', validade: '05/09/2026', quantidade: 200, motivo: 'Ajuste de Paletes de Lastro Duplo', data: '24/06/2026' },
  { ruaOrigem: 'A2', ruaDestino: 'C4', produto: 'BUDWEISER 600ML', lote: 'BU-80', validade: '15/07/2026', quantidade: 90, motivo: 'Desvio de Fluxo Corrigido', data: '26/06/2026' },
  { ruaOrigem: 'B3', ruaDestino: 'A1', produto: 'SKOL GFA VD 1L', lote: 'SK-12', validade: '01/08/2026', quantidade: 70, motivo: 'Remontagem de Palete Danificado', data: '27/06/2026' }
];

const SEED_PICKING_COMP: PickingComparison[] = [
  { produto: 'SKOL 600ML', lote: 'SK-2026A', validade: '12/07/2026', qtdEstoque: 500, qtdPicking: 50, diferenca: 450, status: 'Desvio Crítico' },
  { produto: 'BRAHMA CHOPP GFA VD 1L', lote: 'BR-9842', validade: '22/07/2026', qtdEstoque: 320, qtdPicking: 280, diferenca: 40, status: 'Atenção' },
  { produto: 'STELLA ARTOIS LT 269ML', lote: 'ST-5512', validade: '25/08/2026', qtdEstoque: 150, qtdPicking: 145, diferenca: 5, status: 'Conforme' },
  { produto: 'GUARANA CHP ANTARCTICA PET 2L', lote: 'GU-8821', validade: '10/08/2026', qtdEstoque: 800, qtdPicking: 50, diferenca: 750, status: 'Desvio Crítico' },
  { produto: 'ORIGINAL 600ML', lote: 'OR-3310', validade: '18/08/2026', qtdEstoque: 410, qtdPicking: 395, diferenca: 15, status: 'Conforme' },
  { produto: 'BUDWEISER 600ML', lote: 'BU-80', validade: '15/07/2026', qtdEstoque: 280, qtdPicking: 220, diferenca: 60, status: 'Atenção' },
  { produto: 'PEPSI COLA PET 2L', lote: 'PE-4100', validade: '05/09/2026', qtdEstoque: 600, qtdPicking: 580, diferenca: 20, status: 'Conforme' }
];

const CustomScatterTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-md text-xs font-sans">
        <p className="font-extrabold text-[#032b5e] uppercase mb-1">{data.fullName}</p>
        <p className="text-gray-500 font-bold">Validade Estoque: <span className="text-slate-800">{data.estoque} dias</span></p>
        <p className="text-gray-500 font-bold">Validade Picking: <span className="text-slate-800">{data.picking} dias</span></p>
        <p className="text-gray-500 font-bold">Diferença (Gap): <span className={`font-black ${data.gap > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{data.gap > 0 ? `+${data.gap}` : data.gap} dias</span></p>
        <p className="text-gray-500 font-bold mt-1">Qtd. Estoque: <span className="text-slate-800">{data.qtdEstoque} cx</span></p>
        <p className="text-gray-500 font-bold">Localização: <span className="text-slate-800">{data.location}</span></p>
      </div>
    );
  }
  return null;
};

const PORTUGUESE_MONTHS = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
];

interface BlockData {
  id: string;
  avgValidity: number; // in days
  menorValidade: number; // in days
  skuCount: number;
  pallets: number;
  criticalPct: number; // percentage of critical products (<=30 days)
  riskIndex: number;
  ranges: {
    critical: number;  // 0-30 days
    alertMedium: number; // 31-60 days
    alertLow: number;  // 61-90 days
    safe: number;      // >90 days
  };
}

const BLOCKS_DATA: Record<string, BlockData> = {
  A1: { id: 'A1', avgValidity: 105, menorValidade: 98, skuCount: 14, pallets: 160, criticalPct: 3, riskIndex: 15, ranges: { critical: 5, alertMedium: 15, alertLow: 30, safe: 110 } },
  A2: { id: 'A2', avgValidity: 95, menorValidade: 91, skuCount: 18, pallets: 170, criticalPct: 5, riskIndex: 25, ranges: { critical: 8, alertMedium: 22, alertLow: 45, safe: 95 } },
  A3: { id: 'A3', avgValidity: 72, menorValidade: 65, skuCount: 22, pallets: 180, criticalPct: 14, riskIndex: 48, ranges: { critical: 25, alertMedium: 35, alertLow: 80, safe: 40 } },
  A4: { id: 'A4', avgValidity: 25, menorValidade: 12, skuCount: 28, pallets: 155, criticalPct: 61, riskIndex: 94, ranges: { critical: 95, alertMedium: 40, alertLow: 15, safe: 5 } },
  A5: { id: 'A5', avgValidity: 110, menorValidade: 100, skuCount: 12, pallets: 140, criticalPct: 2, riskIndex: 12, ranges: { critical: 2, alertMedium: 10, alertLow: 28, safe: 100 } },
  A6: { id: 'A6', avgValidity: 125, menorValidade: 115, skuCount: 10, pallets: 130, criticalPct: 0, riskIndex: 8, ranges: { critical: 0, alertMedium: 8, alertLow: 22, safe: 100 } },
  A7: { id: 'A7', avgValidity: 118, menorValidade: 108, skuCount: 11, pallets: 135, criticalPct: 1, riskIndex: 10, ranges: { critical: 1, alertMedium: 9, alertLow: 25, safe: 100 } },
  A8: { id: 'A8', avgValidity: 122, menorValidade: 110, skuCount: 9, pallets: 125, criticalPct: 0, riskIndex: 7, ranges: { critical: 0, alertMedium: 7, alertLow: 18, safe: 100 } },
  B1: { id: 'B1', avgValidity: 115, menorValidade: 104, skuCount: 12, pallets: 167, criticalPct: 1, riskIndex: 10, ranges: { critical: 2, alertMedium: 10, alertLow: 25, safe: 130 } },
  B2: { id: 'B2', avgValidity: 68, menorValidade: 62, skuCount: 24, pallets: 168, criticalPct: 12, riskIndex: 45, ranges: { critical: 20, alertMedium: 48, alertLow: 65, safe: 35 } },
  B3: { id: 'B3', avgValidity: 42, menorValidade: 38, skuCount: 26, pallets: 165, criticalPct: 27, riskIndex: 65, ranges: { critical: 45, alertMedium: 60, alertLow: 40, safe: 20 } },
  B4: { id: 'B4', avgValidity: 85, menorValidade: 70, skuCount: 15, pallets: 150, criticalPct: 6, riskIndex: 30, ranges: { critical: 10, alertMedium: 30, alertLow: 60, safe: 50 } },
  C1: { id: 'C1', avgValidity: 120, menorValidade: 112, skuCount: 10, pallets: 166, criticalPct: 1, riskIndex: 8, ranges: { critical: 1, alertMedium: 5, alertLow: 15, safe: 145 } },
  C2: { id: 'C2', avgValidity: 92, menorValidade: 92, skuCount: 16, pallets: 190, criticalPct: 5, riskIndex: 28, ranges: { critical: 10, alertMedium: 25, alertLow: 70, safe: 85 } },
  C3: { id: 'C3', avgValidity: 78, menorValidade: 64, skuCount: 20, pallets: 175, criticalPct: 17, riskIndex: 55, ranges: { critical: 30, alertMedium: 55, alertLow: 60, safe: 30 } },
  C4: { id: 'C4', avgValidity: 95, menorValidade: 80, skuCount: 14, pallets: 160, criticalPct: 4, riskIndex: 22, ranges: { critical: 8, alertMedium: 20, alertLow: 52, safe: 80 } }
};

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

export default function FefoDashboard({ 
  user, 
  empresa, 
  onBack, 
  theme = 'light',
  initialTab = 'validades',
  initialSubTab
}: FefoDashboardProps) {
  const [activeTab, setActiveTab] = useState<FefoPage>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [viewUnit, setViewUnit] = useState<'u' | 'he'>('u');
  const [selectedBlock, setSelectedBlock] = useState<string>('A1');
  const [showSopViewer, setShowSopViewer] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  // Recontagem Modal state
  const [recontagemModal, setRecontagemModal] = useState<{
    codigo: string;
    descricao: string;
    validadeOriginal: string;
    novaValidade: string;
    quantidade: number;
    localizacao: string;
    bloco: string;
    _rawDoc?: any;
  } | null>(null);

  const handleSaveRecontagem = async () => {
    if (!recontagemModal) return;

    const companyId = (empresaData as any)?.empresa?.id || empresaData?.empresaId || empresa?.id || 'demo';
    const validadesKey = `validades_${companyId}`;
    const armazemValidadesKey = `armazem_validades_${companyId}`;

    try {
      let rawList: any[] = [];
      try {
        rawList = JSON.parse(localStorage.getItem(validadesKey) || localStorage.getItem(armazemValidadesKey) || '[]');
      } catch (e) {}

      const targetCod = String(recontagemModal.codigo).trim();
      const targetVal = String(recontagemModal.validadeOriginal).trim();

      let found = false;
      const updatedList = rawList.map((item: any) => {
        const itemCod = String(item.codigo || item.cod || '').trim();
        const itemVal = String(item.validade || '').trim();

        if (itemCod === targetCod && itemVal === targetVal) {
          found = true;
          return {
            ...item,
            quantidade: recontagemModal.quantidade,
            caixa: recontagemModal.quantidade,
            validade: recontagemModal.novaValidade,
            localizacao: recontagemModal.localizacao,
            bloco: recontagemModal.bloco,
            recontadoEm: new Date().toISOString()
          };
        }
        return item;
      });

      if (!found) {
        updatedList.push({
          id: Date.now(),
          codigo: targetCod,
          descricao: recontagemModal.descricao,
          quantidade: recontagemModal.quantidade,
          caixa: recontagemModal.quantidade,
          validade: recontagemModal.novaValidade,
          localizacao: recontagemModal.localizacao,
          bloco: recontagemModal.bloco,
          recontadoEm: new Date().toISOString()
        });
      }

      localStorage.setItem(validadesKey, JSON.stringify(updatedList));
      localStorage.setItem(armazemValidadesKey, JSON.stringify(updatedList));

      if (recontagemModal._rawDoc?._docId) {
        try {
          await ValidadesRepository.update(recontagemModal._rawDoc._docId, {
            quantidade: recontagemModal.quantidade,
            caixa: recontagemModal.quantidade,
            validade: recontagemModal.novaValidade,
            localizacao: recontagemModal.localizacao,
            bloco: recontagemModal.bloco,
            recontadoEm: new Date().toISOString()
          }, companyId);
        } catch (e) {}
      }

      window.dispatchEvent(new Event('local_data_changed'));
      window.dispatchEvent(new Event('storage'));
      setRecontagemModal(null);
      alert(`✅ Recontagem salva! A quantidade e a validade do SKU ${targetCod} foram sobrescritas no sistema.`);
    } catch (err) {
      alert('Erro ao salvar recontagem: ' + err);
    }
  };

  // Helper to convert individual units (can/bottle) to HE
  const convertUnitsToHE = (units: number, descricao: string): number => {
    const desc = (descricao || '').toUpperCase();
    let volumePerUnit = 0.350; // default to 350ml in liters
    if (desc.includes('250')) volumePerUnit = 0.250;
    else if (desc.includes('269')) volumePerUnit = 0.269;
    else if (desc.includes('350')) volumePerUnit = 0.350;
    else if (desc.includes('473')) volumePerUnit = 0.473;
    else if (desc.includes('500')) volumePerUnit = 0.500;
    else if (desc.includes('600')) volumePerUnit = 0.600;
    else if (desc.includes('1L') || desc.includes('1 L')) volumePerUnit = 1.0;
    else if (desc.includes('2L') || desc.includes('2 L')) volumePerUnit = 2.0;
    else if (desc.includes('300')) volumePerUnit = 0.300;
    return (units * volumePerUnit) / 100;
  };
  
  // Core dynamic datasets from firebase / localstorage
  const [actualValidades, setActualValidades] = useState<ValidadeRow[]>([]);
  const [rlpMeetings, setRlpMeetings] = useState<RLPMeeting[]>([]);
  const [actionPoints, setActionPoints] = useState<ActionPoint[]>([]);
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>([]);
  const [pickingComp, setPickingComp] = useState<PickingComparison[]>([]);

  const validades = useMemo(() => {
    if (actualValidades && actualValidades.length > 0) {
      return actualValidades;
    }
    return [];
  }, [actualValidades]);

  // Advanced Filters State
  const [periodFilter, setPeriodFilter] = useState<string>('30');
  const [productFilter, setProductFilter] = useState<string>('TODOS');
  const [categoryFilter, setCategoryFilter] = useState<string>('TODAS');
  const [ CDFilter, setCDFilter] = useState<string>('TODOS');
  const [streetFilter, setStreetFilter] = useState<string>('TODAS');
  const [blocoFilter, setBlocoFilter] = useState<string>('TODOS');
  const [lotFilter, setLotFilter] = useState<string>('TODOS');
  const [expiryBracketFilter, setExpiryBracketFilter] = useState<string>('TODAS');
  const [actionStatusFilter, setActionStatusFilter] = useState<string>('TODOS');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('TODOS');

  // Estoque x Picking tab advanced filters
  const [epColaborador, setEpColaborador] = useState<string>('todos');
  const [epEmbalagem, setEpEmbalagem] = useState<string>('todos');
  const [epMeta, setEpMeta] = useState<string>('todos');
  const [epStartDate, setEpStartDate] = useState<string>('');
  const [epEndDate, setEpEndDate] = useState<string>('');
  const [showEpCalendar, setShowEpCalendar] = useState<boolean>(false);
  const [draftStartDate, setDraftStartDate] = useState<string>('');
  const [draftEndDate, setDraftEndDate] = useState<string>('');
  const [calMonth, setCalMonth] = useState<number>(6); // July (0-indexed is 6)
  const [calYear, setCalYear] = useState<number>(2026);

  // Addition forms states
  const [showAddAction, setShowAddAction] = useState(false);
  const [newAction, setNewAction] = useState<Omit<ActionPoint, 'id' | 'status'>>({
    produto: 'SKOL 600ML',
    lote: '',
    acao: '',
    responsavel: '',
    dataAbertura: new Date().toLocaleDateString('pt-BR'),
    dataPrevista: ''
  });

  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [newMeeting, setNewMeeting] = useState<Omit<RLPMeeting, 'id' | 'status'>>({
    data: new Date().toLocaleDateString('pt-BR'),
    produtos: '',
    quantidadeRisco: 100,
    estrategia: '',
    responsavel: '',
    prazo: ''
  });

  const [showAddTransfer, setShowAddTransfer] = useState(false);
  const [newTransfer, setNewTransfer] = useState<StockTransfer>({
    ruaOrigem: 'A1',
    ruaDestino: 'A2',
    produto: 'SKOL 600ML',
    lote: '',
    validade: '',
    quantidade: 50,
    motivo: 'Ajuste Operacional',
    data: new Date().toLocaleDateString('pt-BR')
  });

  // Novos Modais solicitados: 03.05.19, JSON e Histórico de Aderência ao Giro FEFO (89%)
  const [showImport030519Modal, setShowImport030519Modal] = useState(false);
  const [showImportJsonModal, setShowImportJsonModal] = useState(false);
  const [showFefoAderenciaModal, setShowFefoAderenciaModal] = useState(false);

  const companyId = empresa?.id || 'demo';

  const empresaData = useEmpresaData();

  // 1. Sync & Seed Data
  useEffect(() => {
    // Sync validades (dynamic) - merge Firestore and localStorage so all collected items are included
    const saved = localStorage.getItem(`validades_${companyId}`);
    let localRows: ValidadeRow[] = [];
    if (saved) {
      try {
        localRows = JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }

    const firestoreRows = empresaData.validades || [];
    const map = new Map<string, ValidadeRow>();
    
    firestoreRows.forEach(v => {
      const key = v._docId || `${v.codigo}_${v.validade}_${v.bloco}_${v.localizacao}`;
      map.set(key, v);
    });

    localRows.forEach(v => {
      const key = v._docId || `${v.codigo}_${v.validade}_${v.bloco}_${v.localizacao}`;
      if (!map.has(key)) {
        map.set(key, v);
      }
    });

    const combinedValidades = removeLegacySeedValidades(Array.from(map.values()));
    try {
      localStorage.setItem(`validades_${companyId}`, JSON.stringify(combinedValidades));
      localStorage.setItem(`armazem_validades_${companyId}`, JSON.stringify(combinedValidades));
    } catch (e) {}

    setActualValidades(combinedValidades);
    syncFefoDemandsFromValidades(companyId, combinedValidades);
  }, [empresaData.validades, companyId]);

  // Sync other sub-tables with localstorage and Firestore
  useEffect(() => {
    const meetKey = `fefo_meetings_${companyId}`;
    const actKey = `fefo_actions_${companyId}`;
    const transferKey = `fefo_transfers_${companyId}`;
    const pickingKey = `fefo_picking_${companyId}`;

    const savedMeets = localStorage.getItem(meetKey);
    const savedActs = localStorage.getItem(actKey);
    const savedTransfers = localStorage.getItem(transferKey);
    const savedPicking = localStorage.getItem(pickingKey);

    if (savedMeets) setRlpMeetings(JSON.parse(savedMeets));
    else setRlpMeetings([]);

    if (savedActs) setActionPoints(JSON.parse(savedActs));
    else setActionPoints([]);

    if (savedTransfers) setStockTransfers(JSON.parse(savedTransfers));
    else setStockTransfers([]);

    if (savedPicking) setPickingComp(JSON.parse(savedPicking));
    else setPickingComp([]);

    // Hydrate from Firestore if local is empty
    if (!savedMeets) {
      firestoreDb.getList<RLPMeeting>('fefo_meetings', companyId).then(docs => {
        if (docs && docs.length > 0) {
          setRlpMeetings(docs);
          try { localStorage.setItem(meetKey, JSON.stringify(docs)); } catch (e) {}
        }
      }).catch(() => {});
    }
    if (!savedActs) {
      firestoreDb.getList<ActionPoint>('fefo_actions', companyId).then(docs => {
        if (docs && docs.length > 0) {
          setActionPoints(docs);
          try { localStorage.setItem(actKey, JSON.stringify(docs)); } catch (e) {}
        }
      }).catch(() => {});
    }
    if (!savedTransfers) {
      firestoreDb.getList<StockTransfer>('fefo_transfers', companyId).then(docs => {
        if (docs && docs.length > 0) {
          setStockTransfers(docs);
          try { localStorage.setItem(transferKey, JSON.stringify(docs)); } catch (e) {}
        }
      }).catch(() => {});
    }
    if (!savedPicking) {
      firestoreDb.getList<PickingComparison>('fefo_picking', companyId).then(docs => {
        if (docs && docs.length > 0) {
          setPickingComp(docs);
          try { localStorage.setItem(pickingKey, JSON.stringify(docs)); } catch (e) {}
        }
      }).catch(() => {});
    }
  }, [companyId]);

  // Save helper functions with Firestore persistence
  const saveMeetings = (list: RLPMeeting[]) => {
    setRlpMeetings(list);
    localStorage.setItem(`fefo_meetings_${companyId}`, JSON.stringify(list));
    firestoreDb.batchUpsert('fefo_meetings', list, companyId).catch(err => console.warn('FEFO meetings firestore error:', err));
  };

  const saveActions = (list: ActionPoint[]) => {
    setActionPoints(list);
    localStorage.setItem(`fefo_actions_${companyId}`, JSON.stringify(list));
    firestoreDb.batchUpsert('fefo_actions', list, companyId).catch(err => console.warn('FEFO actions firestore error:', err));
  };

  const saveTransfers = (list: StockTransfer[]) => {
    setStockTransfers(list);
    localStorage.setItem(`fefo_transfers_${companyId}`, JSON.stringify(list));
    const itemsToUpsert = list.map((t, idx) => ({ id: t.id || `transf_${idx}_${t.produto}_${t.lote}`, ...t }));
    firestoreDb.batchUpsert('fefo_transfers', itemsToUpsert, companyId).catch(err => console.warn('FEFO transfers firestore error:', err));
  };

  const savePicking = (list: PickingComparison[]) => {
    setPickingComp(list);
    localStorage.setItem(`fefo_picking_${companyId}`, JSON.stringify(list));
    const itemsToUpsert = list.map((p, idx) => ({ id: p.id || `picking_${idx}_${p.produto}_${p.lote}`, ...p }));
    firestoreDb.batchUpsert('fefo_picking', itemsToUpsert, companyId).catch(err => console.warn('FEFO picking firestore error:', err));
  };

  // Helper date/time functions
  const getDaysRemaining = (expDate: string) => {
    if (!expDate) return 999;
    try {
      let normDate = expDate.trim();
      if (normDate.includes('/')) {
        const parts = normDate.split('/');
        if (parts.length === 3) {
          const d = parts[0].padStart(2, '0');
          const m = parts[1].padStart(2, '0');
          let y = parts[2];
          if (y.length === 2) y = '20' + y;
          normDate = `${y}-${m}-${d}`;
        }
      } else if (normDate.includes('-')) {
        const parts = normDate.split('-');
        if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
          normDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const exp = new Date(normDate + 'T00:00:00');
      if (isNaN(exp.getTime())) return 999;
      return Math.round((exp.getTime() - today.getTime()) / 86400000);
    } catch {
      return 999;
    }
  };

  const calculateTotalCaixas = (v: ValidadeRow): number => {
    const q = Number((v as any).quantidade) || 0;
    if (q > 0) return q;

    const p = Number(v.palhete) || 0;
    const l = Number(v.lastro) || 0;
    const c = Number(v.caixa) || 0;

    if (p > 0 || l > 0 || c > 0) {
      return calcCaixasPkg(v.codigo, p, l, c);
    }
    return 1;
  };

  // 2. Metrics Compiling
  const compiledValidades = validades.map(v => {
    const days = getDaysRemaining(v.validade);
    let bracket: '0-30' | '31-60' | '61-90' | '90+' = '90+';
    if (days <= 30) bracket = '0-30';
    else if (days <= 60) bracket = '31-60';
    else if (days <= 90) bracket = '61-90';

    const totalUnitiesRaw = calculateTotalCaixas(v);
    const totalUnities = viewUnit === 'u' ? totalUnitiesRaw : Math.round(convertUnitsToHE(totalUnitiesRaw, v.descricao) * 100) / 100;
    const category = v.descricao.toLowerCase().includes('pet') ? 'PET' : 
                     v.descricao.toLowerCase().includes('lata') || v.descricao.toLowerCase().includes('lt') ? 'Lata' : 'Garrafa Retornável';

    return {
      ...v,
      days,
      bracket,
      totalUnities,
      totalUnitiesRaw,
      category,
      unitCost: 6.20, // estimated cost factor per bottle/pack
      estimatedCost: totalUnitiesRaw * 6.20
    };
  });

  // Effective picking comparison derived dynamically from compiledValidades if real data exists
  const effectivePickingComp = useMemo(() => {
    if (compiledValidades.length === 0) {
      return pickingComp;
    }

    const groupedBySku: Record<string, {
      produto: string;
      lote: string;
      validade: string;
      qtdEstoque: number;
      qtdPicking: number;
      minDaysEstoque: number;
      minDaysPicking: number;
      valEstoque: string;
      valPicking: string;
    }> = {};

    compiledValidades.forEach(v => {
      const key = (v.codigo ? String(v.codigo) : v.descricao).trim();
      const caixas = (viewUnit as string) === 'cx' ? v.totalUnitiesRaw : Math.round(v.totalUnities * 100) / 100;
      const loc = (v.localizacao || '').toLowerCase();
      const isPicking = loc.includes('pick');

      if (!groupedBySku[key]) {
        groupedBySku[key] = {
          produto: v.descricao,
          lote: v.codigo ? `SKU-${v.codigo}` : 'LOTE-PADRAO',
          validade: v.validade,
          qtdEstoque: 0,
          qtdPicking: 0,
          minDaysEstoque: 99999,
          minDaysPicking: 99999,
          valEstoque: '',
          valPicking: ''
        };
      }

      if (isPicking) {
        groupedBySku[key].qtdPicking += caixas;
        if (v.days < groupedBySku[key].minDaysPicking) {
          groupedBySku[key].minDaysPicking = v.days;
          groupedBySku[key].valPicking = v.validade;
        }
      } else {
        groupedBySku[key].qtdEstoque += caixas;
        if (v.days < groupedBySku[key].minDaysEstoque) {
          groupedBySku[key].minDaysEstoque = v.days;
          groupedBySku[key].valEstoque = v.validade;
        }
      }

      if (v.days < 99999) {
        if (!groupedBySku[key].validade || v.days < getDaysRemaining(groupedBySku[key].validade)) {
          groupedBySku[key].validade = v.validade;
        }
      }
    });

    return Object.values(groupedBySku).map(item => {
      const hasPicking = item.qtdPicking > 0;
      const hasEstoque = item.qtdEstoque > 0;

      let pickingDays = hasPicking && item.minDaysPicking < 99999 ? item.minDaysPicking : 0;
      let estoqueDays = hasEstoque && item.minDaysEstoque < 99999 ? item.minDaysEstoque : (hasPicking ? pickingDays : 0);

      const formatDate = (valStr: string) => {
        if (!valStr) return '-';
        if (valStr.includes('-')) {
          const [y, m, d] = valStr.split('-');
          return `${d}/${m}/${y}`;
        }
        return valStr;
      };

      const validadePicking = formatDate(item.valPicking || item.validade);
      const validadeEstoque = formatDate(item.valEstoque || item.validade);

      let gap = 0;
      let status: 'Conforme' | 'Atenção' | 'Desvio Crítico' = 'Conforme';

      if (!hasPicking && hasEstoque) {
        status = 'Atenção';
        gap = 0;
      } else if (hasPicking && hasEstoque) {
        gap = pickingDays - estoqueDays;
        if (gap > 0) {
          status = gap > 15 ? 'Desvio Crítico' : 'Atenção';
        } else if (pickingDays <= 30 || estoqueDays <= 30) {
          status = 'Atenção';
        } else {
          status = 'Conforme';
        }
      } else {
        status = 'Conforme';
      }

      const diferenca = Math.abs(item.qtdEstoque - item.qtdPicking);

      return {
        produto: item.produto,
        lote: item.lote,
        validade: validadePicking !== '-' ? validadePicking : validadeEstoque,
        qtdEstoque: Math.round(item.qtdEstoque * 100) / 100,
        qtdPicking: Math.round(item.qtdPicking * 100) / 100,
        diferenca: Math.round(diferenca * 100) / 100,
        status,
        estoqueDays,
        pickingDays,
        validadeEstoque,
        validadePicking,
        gap
      };
    });
  }, [compiledValidades, pickingComp, viewUnit]);

  // Dynamic blocks data derived directly from compiledValidades
  const dynamicBlocksData = useMemo(() => {
    const result: Record<string, BlockData> = {};

    // If no real collections exist at all, return default initial blocks
    if (compiledValidades.length === 0) {
      return { ...BLOCKS_DATA };
    }

    // Initialize all standard warehouse blocks (A1..A8, B1..B4, C1..C4) with 0 stats
    const standardGrid = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4'];
    standardGrid.forEach(id => {
      result[id] = {
        id,
        avgValidity: 0,
        menorValidade: 0,
        skuCount: 0,
        pallets: 0,
        criticalPct: 0,
        riskIndex: 0,
        ranges: { critical: 0, alertMedium: 0, alertLow: 0, safe: 0 }
      };
    });

    const blockGroups: Record<string, typeof compiledValidades> = {};
    compiledValidades.forEach(v => {
      let bKey = (v.bloco || '').trim().toUpperCase();
      if (!bKey) {
        const loc = (v.localizacao || '').toLowerCase();
        if (loc.includes('pick')) bKey = 'PICKING';
        else if (loc.includes('pnc')) bKey = 'PNC';
        else bKey = 'A1';
      }
      if (!blockGroups[bKey]) blockGroups[bKey] = [];
      blockGroups[bKey].push(v);
    });

    Object.entries(blockGroups).forEach(([bKey, rows]) => {
      if (rows.length === 0) return;
      
      const skuCount = new Set(rows.map(r => r.codigo)).size;
      const pallets = rows.reduce((acc, r) => acc + (Number(r.palhete) || 1), 0);
      const totalUnities = rows.reduce((acc, r) => acc + r.totalUnities, 0);
      const totalDays = rows.reduce((acc, r) => acc + (r.days * r.totalUnities), 0);
      const avgValidity = totalUnities > 0 ? Math.round(totalDays / totalUnities) : (rows.length > 0 ? Math.round(rows.reduce((acc, r) => acc + r.days, 0) / rows.length) : 0);
      const menorValidade = rows.length > 0 ? Math.min(...rows.map(r => r.days)) : 0;

      const criticalRows = rows.filter(r => r.days <= 30);
      const alertMediumRows = rows.filter(r => r.days > 30 && r.days <= 60);
      const alertLowRows = rows.filter(r => r.days > 60 && r.days <= 90);
      const safeRows = rows.filter(r => r.days > 90);

      const criticalUnits = criticalRows.reduce((acc, r) => acc + r.totalUnities, 0);
      const alertMediumUnits = alertMediumRows.reduce((acc, r) => acc + r.totalUnities, 0);
      const alertLowUnits = alertLowRows.reduce((acc, r) => acc + r.totalUnities, 0);
      const safeUnits = safeRows.reduce((acc, r) => acc + r.totalUnities, 0);

      const criticalPct = totalUnities > 0 
        ? Math.round((criticalUnits / totalUnities) * 100) 
        : (rows.length > 0 ? Math.round((criticalRows.length / rows.length) * 100) : 0);

      // Balanced Risk Index: 0 to 100 based on critical concentration and shortest shelf-life
      const critRatio = totalUnities > 0 ? (criticalUnits / totalUnities) : (criticalRows.length / Math.max(1, rows.length));
      const medRatio = totalUnities > 0 ? (alertMediumUnits / totalUnities) : (alertMediumRows.length / Math.max(1, rows.length));
      const menorValScore = menorValidade <= 0 ? 100 : Math.max(0, 100 - menorValidade);
      const riskIndex = Math.min(100, Math.max(0, Math.round(critRatio * 60 + medRatio * 25 + (menorValScore / 100) * 15)));

      result[bKey] = {
        id: bKey,
        avgValidity,
        menorValidade,
        skuCount,
        pallets,
        criticalPct,
        riskIndex,
        ranges: {
          critical: criticalUnits,
          alertMedium: alertMediumUnits,
          alertLow: alertLowUnits,
          safe: safeUnits,
        }
      };
    });

    return result;
  }, [compiledValidades]);

  // Helper product info lookup
  const getProductInfo = (code: string) => {
    const codeStr = String(code).trim();
    const pContext = empresaData.produtos?.find(p => String(p.codigo).trim() === codeStr);
    const pMaster = PRODUCTS.find((p: any) => String(p.codigo || p.cod || '').trim() === codeStr);
    const item030519 = get030519DataForSku(codeStr);

    const idade = Number(pContext?.idade) || Number((pMaster as any)?.idade) || 180;
    const preco = Number(pContext?.preco) || (item030519 ? item030519.precoUnitario : 0) || Number((pMaster as any)?.preco) || Number((pMaster as any)?.custo) || 68.50;
    const hlPerUnit = Number(pContext?.fatorHecto) || (item030519 ? item030519.fatorHecto : 0) || Number((pMaster as any)?.fatorHecto) || 0.12;
    
    // Venda Média com prioridade ao 03.05.19 oficial anexado ao código
    const vendaMedia030519 = item030519 && item030519.vendaMediaDiaria > 0 ? item030519.vendaMediaDiaria : 0;
    const vendaMediaContext = Number(pContext?.vendaMedia) || 0;
    const vendaMediaMaster = Number((pMaster as any)?.vendaMedia) || 0;
    const vendaMedia = vendaMedia030519 || vendaMediaContext || vendaMediaMaster || 1.0;

    return { idade, preco, hlPerUnit, vendaMedia, item030519 };
  };

  // Deduplicated list for "Validades Recolhidas" (1ª guia)
  const validadesRecolhidasDeduplicadas = useMemo(() => {
    const map = new Map<string, {
      codigo: string;
      descricao: string;
      quantidade: number;
      validade: string;
      localizacao: string;
      bloco: string;
      _rawDoc?: any;
    }>();

    actualValidades.forEach(item => {
      const cod = String(item.codigo || '000').trim();
      const val = String(item.validade || '').trim();
      const key = `${cod}_${val}`;

      const p = Number(item.palhete) || 0;
      const l = Number(item.lastro) || 0;
      const c = Number(item.caixa) || 0;
      const q = Number((item as any).quantidade) || 0;
      let qty = 1;
      if (p > 0 && l > 0 && c > 0) qty = p * l * c;
      else if (p > 0 && l > 0) qty = p * l;
      else if (p > 0 && c > 0) qty = p * c;
      else if (c > 0) qty = c;
      else if (q > 0) qty = q;

      if (map.has(key)) {
        const existing = map.get(key)!;
        // Sobrescrever a quantidade com a nova contagem (não somar contagens anteriores)
        existing.quantidade = qty;
        existing.localizacao = item.localizacao || existing.localizacao;
        existing.bloco = item.bloco || existing.bloco;
        existing._rawDoc = item;
      } else {
        map.set(key, {
          codigo: cod,
          descricao: item.descricao || `Produto ${cod}`,
          quantidade: qty,
          validade: val,
          localizacao: item.localizacao || 'central',
          bloco: item.bloco || '',
          _rawDoc: item
        });
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rows = Array.from(map.values()).map(item => {
      const info = getProductInfo(item.codigo);

      // Unified calculation using calculateStockAgeIndex
      const calcResult = calculateStockAgeIndex({
        codigo: item.codigo,
        descricao: item.descricao,
        validade: item.validade
      }, empresaData?.produtos);

      const vendaMedia = Math.max(0.01, info.vendaMedia);
      const diasEstoque = Math.max(1, Math.round(item.quantidade / vendaMedia));

      const previsaoEscoamentoObj = new Date(today.getTime() + diasEstoque * 24 * 60 * 60 * 1000);
      const previsaoEscoamento = previsaoEscoamentoObj.toLocaleDateString('pt-BR');

      const valorTotal = item.quantidade * info.preco;
      const hlTotal = item.quantidade * info.hlPerUnit;

      const faixa: 'critico' | 'atencao' | 'ok' = 
        calcResult.status === 'Crítico' || calcResult.idadeMissing ? 'critico' :
        calcResult.status === 'Atenção' ? 'atencao' : 'ok';

      return {
        codigo: item.codigo,
        descricao: item.descricao,
        quantidade: item.quantidade,
        validade: item.validade,
        localizacao: item.localizacao,
        bloco: item.bloco,
        idade: calcResult.idadeCadastrada,
        idadeMissing: calcResult.idadeMissing,
        diasParaVencer: calcResult.diasRestantes,
        stockAgeIndex: calcResult.stockAgeIndex,
        faixa,
        vendaMedia,
        diasEstoque,
        previsaoEscoamento,
        valorTotal,
        hlTotal,
        precoUnitario: info.preco,
        _rawDoc: (item as any)._rawDoc
      };
    });

    // Rank by Stock Age Index ascending (most critical first)
    rows.sort((a, b) => {
      if (a.idadeMissing && !b.idadeMissing) return -1;
      if (!a.idadeMissing && b.idadeMissing) return 1;
      return a.stockAgeIndex - b.stockAgeIndex;
    });

    return rows.map((r, i) => ({ ...r, rank: i + 1 }));
  }, [actualValidades, empresaData.produtos]);

  // Header KPI Summary (Requirement 1.3)
  const yearlySummary = useMemo(() => {
    return getYearlyStockAgeSummary();
  }, [actualValidades, empresaData.produtos]);

  const kpiSummary = useMemo(() => {
    const totalItensCount = validadesRecolhidasDeduplicadas.length;
    if (totalItensCount === 0) {
      return {
        stockAgeAtual: 100,
        faixaStockAge: 'ok',
        criticoSkusCount: 0,
        criticoCaixasCount: 0,
        valorationCritico: 0,
        valorationTotal: 0,
        hectolitroTotal: 0,
        quebrasFefoTotal: 0,
        aderenciaGiroPct: 100,
        monthlyChartData: [
          { mes: 'Jan', index: 85 }, { mes: 'Fev', index: 82 }, { mes: 'Mar', index: 78 },
          { mes: 'Abr', index: 80 }, { mes: 'Mai', index: 75 }, { mes: 'Jun', index: 72 },
          { mes: 'Jul', index: 70 }, { mes: 'Ago', index: 74 }, { mes: 'Set', index: 79 },
          { mes: 'Out', index: 82 }, { mes: 'Nov', index: 86 }, { mes: 'Dez', index: 88 }
        ]
      };
    }

    const processedStockAgeItems = validadesRecolhidasDeduplicadas.map(r => calculateStockAgeIndex({
      codigo: r.codigo,
      descricao: r.descricao,
      quantidade: r.quantidade,
      validade: r.validade,
      dataVencimento: r.validade,
      valorTotal: r.valorTotal,
      volumeHL: r.hlTotal
    }, empresaData.produtos));

    const summary = calculateStockAgeSummary(processedStockAgeItems);

    const criticos = validadesRecolhidasDeduplicadas.filter(r => r.faixa === 'critico');
    const criticoSkusCount = new Set(criticos.map(r => r.codigo)).size;
    const criticoCaixasCount = criticos.reduce((acc, r) => acc + r.quantidade, 0);

    const valorationCritico = criticos.reduce((acc, r) => acc + r.valorTotal, 0);
    const valorationTotal = validadesRecolhidasDeduplicadas.reduce((acc, r) => acc + r.valorTotal, 0);

    const hectolitroTotal = Math.round(validadesRecolhidasDeduplicadas.reduce((acc, r) => acc + r.hlTotal, 0) * 10) / 10;

    const avgStockAge = summary.avgIndex;

    let faixaStockAge: 'critico' | 'atencao' | 'ok' = 'ok';
    if (avgStockAge < 60) faixaStockAge = 'critico';
    else if (avgStockAge <= 75) faixaStockAge = 'atencao';

    const quebrasEstoque = calcularQuebrasFefoEstoqueXEstoque(actualValidades);
    const quebrasPicking = calcularQuebrasFefoEstoqueXPicking(actualValidades);
    const totalQuebrasDetectadas = quebrasEstoque.length + quebrasPicking.length;

    const fefoDemands = getStoredFefoDemands(companyId);
    const pendingDemands = fefoDemands.filter(d => d.status !== 'done');
    const doneDemands = fefoDemands.filter(d => d.status === 'done').length;
    const totalDemands = fefoDemands.length;

    // Quebras ativas / pendentes: quando os empilhadores (Ronildo & Marivaldo) concluem os giros, as quebras são sanadas (0 pendentes)
    const quebrasFefoTotal = pendingDemands.length;
    const quebrasResolvidasTotal = doneDemands > 0 ? doneDemands : totalQuebrasDetectadas;

    // Obter taxa do histórico consolidado de aderência
    const historicoAderencia = getStoredAderenciaHistorico(companyId);
    const taxaHistoricoRecente = historicoAderencia.length > 0 ? historicoAderencia[historicoAderencia.length - 1].aderenciaPct : 100.0;
    const aderenciaGiroPct = totalDemands > 0 ? Math.round((doneDemands / totalDemands) * 100) : (totalQuebrasDetectadas > 0 && pendingDemands.length === 0 ? 100 : taxaHistoricoRecente);

    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthlyChartData = months.map((m, idx) => {
      let val = avgStockAge;
      if (idx < 6) val = Math.min(100, Math.max(35, avgStockAge + (6 - idx) * 3 - (idx % 2 === 0 ? 4 : -2)));
      else if (idx > 6) val = Math.min(100, Math.max(35, avgStockAge + (idx - 6) * 2));
      return { mes: m, index: Math.round(val) };
    });

    return {
      stockAgeAtual: avgStockAge,
      faixaStockAge,
      criticoSkusCount,
      criticoCaixasCount,
      valorationCritico,
      valorationTotal,
      hectolitroTotal,
      quebrasFefoTotal,
      quebrasResolvidasTotal,
      aderenciaGiroPct,
      monthlyChartData
    };
  }, [validadesRecolhidasDeduplicadas, actualValidades, companyId]);

  const handleDeleteAllValidades = async () => {
    if (!window.confirm('⚠️ Tem certeza que deseja EXCLUIR TODA A BASE DE VALIDADES?\nEsta ação apagará permanentemente todos os registros coletados para que você possa reimportar do zero.')) {
      return;
    }
    try {
      for (const item of actualValidades) {
        if (item._docId) {
          try { await ValidadesRepository.delete(item._docId, companyId); } catch(e){}
        }
      }
      setActualValidades([]);
      localStorage.removeItem(`validades_${companyId}`);
      localStorage.removeItem(`fefo_demands_${companyId}`);
      window.dispatchEvent(new Event('fefo_demands_updated'));
      window.dispatchEvent(new Event('app_data_updated'));
      window.dispatchEvent(new Event('local_data_changed'));
      alert('✅ Toda a Base de Validades foi excluída com sucesso!');
    } catch (e) {
      alert('Erro ao excluir base de validades: ' + e);
    }
  };

  const handleExportValidadesExcel = () => {
    if (validadesRecolhidasDeduplicadas.length === 0) {
      alert('Nenhum dado de validade disponível para exportar.');
      return;
    }
    const exportData = validadesRecolhidasDeduplicadas.map(r => ({
      'Rank': r.rank,
      'Código SKU': r.codigo,
      'Descrição': r.descricao,
      'Qnd SKU (cx)': r.quantidade,
      'Vencimento': r.validade,
      'Stock Age Index (%)': `${r.stockAgeIndex}%`,
      'Dias p/ Vencimento': r.diasParaVencer,
      'Venda Média (cx/dia)': r.vendaMedia,
      'Dias Estoque': r.diasEstoque,
      'Previsão Escoamento': r.previsaoEscoamento,
      'Valor Total (R$)': r.valorTotal,
      'Hectolitros (HL)': r.hlTotal,
      'Faixa de Risco': r.faixa === 'critico' ? 'CRÍTICO (<60%)' : r.faixa === 'atencao' ? 'ATENÇÃO (60-75%)' : 'OK (>75%)'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Validades Recolhidas');
    XLSX.writeFile(wb, `Validades_Recolhidas_FEFO_${new Date().toISOString().substring(0,10)}.xlsx`);
  };

  const handleExportValidadesJson = () => {
    if (validadesRecolhidasDeduplicadas.length === 0) {
      alert('Nenhum dado de validade disponível para exportar.');
      return;
    }
    const blob = new Blob([JSON.stringify(validadesRecolhidasDeduplicadas, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Validades_Recolhidas_FEFO_${new Date().toISOString().substring(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportValidadesFromModal = (rows: ValidadeRow[]) => {
    if (!Array.isArray(rows) || rows.length === 0) return;
    const combined = [...actualValidades, ...rows];
    setActualValidades(combined);
    try {
      localStorage.setItem(`validades_${companyId}`, JSON.stringify(combined));
    } catch (e) {}
    syncFefoDemandsFromValidades(companyId, combined);
    window.dispatchEvent(new Event('app_data_updated'));
    window.dispatchEvent(new Event('local_data_changed'));
  };

  const handleExportValidadesImagem = async () => {
    const element = document.getElementById('validades-recolhidas-table-container');
    if (!element) {
      alert('Tabela de Validades não encontrada.');
      return;
    }
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `Validades_Recolhidas_${new Date().toISOString().substring(0,10)}.png`;
      link.click();
    } catch (err) {
      alert('Erro ao exportar imagem: ' + err);
    }
  };

  const handleExportQuadroAcoesImagem = async () => {
    const element = document.getElementById('quadro-acoes-container');
    if (!element) {
      alert('Quadro de Ações não encontrado.');
      return;
    }
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#0f172a' });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `Quadro_Acoes_FEFO_${new Date().toISOString().substring(0,10)}.png`;
      link.click();
    } catch (err) {
      alert('Erro ao exportar imagem: ' + err);
    }
  };

  // Calculate high quality KPIs (Critical risk <= 30 days)
  const totalRiscoUnities = compiledValidades.reduce((acc, curr) => curr.days <= 30 ? acc + curr.totalUnities : acc, 0);
  const totalValorRisco = compiledValidades.reduce((acc, curr) => curr.days <= 30 ? acc + curr.estimatedCost : acc, 0);
  const totalVencidosUnidades = compiledValidades.reduce((acc, curr) => curr.days < 0 ? acc + curr.totalUnities : acc, 0);

  // Desvios FEFO calculation using effectivePickingComp
  const totalDesviosFEFO = effectivePickingComp.filter(p => p.status === 'Desvio Crítico').length;
  const totalConformeFEFO = effectivePickingComp.filter(p => p.status === 'Conforme').length;
  const aderenciaFEFO = effectivePickingComp.length > 0 ? Math.round((totalConformeFEFO / effectivePickingComp.length) * 100) : 100;

  // 10 Primeiros Produtos a Vencer (ordenados do menor para o maior número de dias restantes)
  const top10Expiring = useMemo(() => {
    return [...compiledValidades]
      .sort((a, b) => a.days - b.days)
      .slice(0, 10);
  }, [compiledValidades]);

  const handleExportTop10Excel = () => {
    if (top10Expiring.length === 0) return;

    const dataToExport = top10Expiring.map((item, idx) => {
      let formattedVal = item.validade;
      try {
        if (item.validade && item.validade.includes('-')) {
          const [y, m, d] = item.validade.split('-');
          formattedVal = `${d}/${m}/${y}`;
        }
      } catch (e) {}

      let statusStr = `${item.days} dias restantes`;
      if (item.days < 0) statusStr = `${Math.abs(item.days)} dias atrasado`;
      else if (item.days === 0) statusStr = 'Vence Hoje';

      const localizacaoStr = item.localizacao === 'central'
        ? 'Estoque Central'
        : item.localizacao === 'pnc'
        ? 'PNC (Produto Não Conforme)'
        : item.localizacao === 'repack'
        ? 'Repack'
        : item.localizacao === 'picking'
        ? 'Picking'
        : item.localizacao === 'marketplace'
        ? 'Marketplace'
        : item.localizacao || 'Estoque Central';
      const localizacaoCompleta = item.bloco ? `${localizacaoStr} - Bloco ${item.bloco}` : localizacaoStr;

      return {
        'Posição (#)': idx + 1,
        'Código SKU': item.codigo,
        'Descrição do Produto': item.descricao,
        'Localização': localizacaoCompleta,
        'Data de Vencimento': formattedVal,
        'Dias Restantes': item.days,
        'Status FEFO': statusStr,
        'Paletes (PL)': item.palhete || 0,
        'Caixas (CX)': item.caixa || 0,
        'Quantidade Total (CX)': item.totalUnitiesRaw
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Top 10 Vencimentos');

    const companyName = empresa?.razaoSocial ? empresa.razaoSocial.replace(/[^a-zA-Z0-9]/g, '_') : 'Empresa';
    const todayStr = new Date().toISOString().substring(0, 10);
    XLSX.writeFile(workbook, `10_Produtos_Primeiros_A_Vencer_FEFO_${companyName}_${todayStr}.xlsx`);
  };

  // Actions completion rate
  const completedActions = actionPoints.filter(a => a.status === 'Concluído').length;
  const completionRate = actionPoints.length > 0 ? Math.round((completedActions / actionPoints.length) * 100) : 0;

  // 3. Dynamic Interactive Actions handling
  const handleAddActionPoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAction.lote || !newAction.acao || !newAction.responsavel) {
      alert('Preencha os dados da ação corretiva RLP.');
      return;
    }
    const item: ActionPoint = {
      id: `act-${Date.now()}`,
      ...newAction,
      status: 'Pendente'
    };
    saveActions([...actionPoints, item]);
    setNewAction({
      produto: 'SKOL 600ML',
      lote: '',
      acao: '',
      responsavel: '',
      dataAbertura: new Date().toLocaleDateString('pt-BR'),
      dataPrevista: ''
    });
    setShowAddAction(false);
  };

  const handleDeleteAction = (id: string) => {
    if (confirm('Excluir esta ação preventiva RLP?')) {
      saveActions(actionPoints.filter(a => a.id !== id));
    }
  };

  const handleToggleActionStatus = (id: string) => {
    const statuses: Array<ActionPoint['status']> = ['Pendente', 'Em Andamento', 'Concluído', 'Atrasado'];
    const updated = actionPoints.map(a => {
      if (a.id === id) {
        const nextIdx = (statuses.indexOf(a.status) + 1) % statuses.length;
        const dataConcl = statuses[nextIdx] === 'Concluído' ? new Date().toLocaleDateString('pt-BR') : undefined;
        return { ...a, status: statuses[nextIdx], dataConclusao: dataConcl };
      }
      return a;
    });
    saveActions(updated);
  };

  const handleAddRLPMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeeting.produtos || !newMeeting.estrategia || !newMeeting.responsavel) {
      alert('Preencha os detalhes obrigatórios da reunião RLP.');
      return;
    }
    const item: RLPMeeting = {
      id: `rlp-${Date.now()}`,
      ...newMeeting,
      status: 'Aberta'
    };
    saveMeetings([item, ...rlpMeetings]);
    setNewMeeting({
      data: new Date().toLocaleDateString('pt-BR'),
      produtos: '',
      quantidadeRisco: 100,
      estrategia: '',
      responsavel: '',
      prazo: ''
    });
    setShowAddMeeting(false);
  };

  const handleAddTransferItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransfer.lote || !newTransfer.quantidade) {
      alert('Preencha as informações da movimentação de rua.');
      return;
    }
    saveTransfers([newTransfer, ...stockTransfers]);
    setNewTransfer({
      ruaOrigem: 'A1',
      ruaDestino: 'A2',
      produto: 'SKOL 600ML',
      lote: '',
      validade: '',
      quantidade: 50,
      motivo: 'Ajuste Operacional',
      data: new Date().toLocaleDateString('pt-BR')
    });
    setShowAddTransfer(false);
  };

  const handleConcluirTodosGirosRonildoMarivaldo = () => {
    const result = concluirTodosGirosFefoQuebras(companyId, {
      validadesList: actualValidades,
      operadores: [
        'Operador de Empilhadeira (Bloco A)',
        'Operador de Empilhadeira (Bloco B)'
      ]
    });
    alert(`✅ Todos os giros de FEFO (${result.totalConcluidos} movimentações) foram concluídos com sucesso!\n\n🚜 Operação: Equipe de Empilhadores\n📋 Histórico de Auditoria atualizado para 100% de conformidade com o registro detalhado das quebras sanadas.`);
  };

  // 4. Advanced Filter Logic for Page 6 (Detalhamento)
  const getFilteredProductsList = () => {
    return compiledValidades.filter(v => {
      // Product
      if (productFilter !== 'TODOS' && v.codigo !== productFilter) return false;
      // Category
      if (categoryFilter !== 'TODAS' && v.category !== categoryFilter) return false;
      // Location (CD/Rua filter simulated)
      if (streetFilter !== 'TODAS' && !v.descricao.includes(streetFilter)) {
        // dynamic check of locations/picking
        if (streetFilter === 'PICKING' && v.localizacao !== 'picking') return false;
        if (streetFilter === 'CENTRAL' && v.localizacao !== 'central') return false;
        if (streetFilter === 'MARKETPLACE' && v.localizacao !== 'marketplace') return false;
      }
      // Bracket
      if (expiryBracketFilter !== 'TODAS' && v.bracket !== expiryBracketFilter) return false;

      // Bloco
      if (blocoFilter !== 'TODOS' && v.bloco !== blocoFilter) return false;

      // Period limit
      if (periodFilter !== 'tudo') {
        const daysLimit = parseInt(periodFilter);
        if (v.days > daysLimit) return false;
      }

      return true;
    });
  };

  const filteredValidadesList = getFilteredProductsList().sort((a, b) => a.days - b.days);

  // 5. Chart Data preparations
  // Bracket distribution chart
  const bracketCount = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
  compiledValidades.forEach(v => {
    bracketCount[v.bracket] = (bracketCount[v.bracket] || 0) + v.totalUnities;
  });

  const bracketChartData = [
    { name: 'Crítico (0-30 dias)', value: bracketCount['0-30'], color: '#ef4444' },
    { name: 'Alerta (31-60 dias)', value: bracketCount['31-60'], color: '#3b82f6' },
    { name: 'Atenção (61-90 dias)', value: bracketCount['61-90'], color: '#eab308' },
    { name: 'Seguro (+90 dias)', value: bracketCount['90+'], color: '#10b981' }
  ];

  // Overdue actions by category
  const actionsStatusCount = { 'Pendente': 0, 'Em Andamento': 0, 'Concluído': 0, 'Atrasado': 0 };
  actionPoints.forEach(a => {
    actionsStatusCount[a.status] = (actionsStatusCount[a.status] || 0) + 1;
  });

  const actionsPieData = Object.entries(actionsStatusCount).map(([name, value]) => ({ name, value }));

  // Heatmap data simulator for Streets
  const streetActivity: Record<string, number> = {};
  stockTransfers.forEach(t => {
    streetActivity[t.ruaOrigem] = (streetActivity[t.ruaOrigem] || 0) + t.quantidade;
    streetActivity[t.ruaDestino] = (streetActivity[t.ruaDestino] || 0) + t.quantidade;
  });

  // Category Risk Data (Stacked)
  const categoryRisk: Record<string, { critico: number, seguro: number }> = {
    'Garrafa Retornável': { critico: 0, seguro: 0 },
    'PET': { critico: 0, seguro: 0 },
    'Lata': { critico: 0, seguro: 0 }
  };

  compiledValidades.forEach(v => {
    const cat = v.category;
    if (categoryRisk[cat]) {
      if (v.days <= 60) categoryRisk[cat].critico += v.totalUnities;
      else categoryRisk[cat].seguro += v.totalUnities;
    }
  });

  const categoryRiskChartData = Object.entries(categoryRisk).map(([name, val]) => ({
    name,
    'Crítico / Alerta': val.critico,
    'Estoque Regular': val.seguro
  }));

  // Trend evolution data helper (last 6 weeks)
  const trendData = [
    { week: 'Semana 1', risco: totalRiscoUnities * 1.25, aderencia: aderenciaFEFO - 4 },
    { week: 'Semana 2', risco: totalRiscoUnities * 1.15, aderencia: aderenciaFEFO - 2 },
    { week: 'Semana 3', risco: totalRiscoUnities * 1.10, aderencia: aderenciaFEFO - 1 },
    { week: 'Semana 4', risco: totalRiscoUnities * 0.95, aderencia: aderenciaFEFO },
    { week: 'Semana 5', risco: totalRiscoUnities,       aderencia: aderenciaFEFO }
  ];

  // Calendar generator for custom datepicker
  const calendarDays = useMemo(() => {
    const firstDayIndex = getFirstDayOfMonth(calYear, calMonth);
    const totalDays = getDaysInMonth(calYear, calMonth);
    
    // Previous month info
    const prevMonth = calMonth === 0 ? 11 : calMonth - 1;
    const prevYear = calMonth === 0 ? calYear - 1 : calYear;
    const prevMonthDays = getDaysInMonth(prevYear, prevMonth);
    
    const days = [];
    
    // Fill previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dayNum,
        isCurrentMonth: false,
        dateStr,
        month: prevMonth,
        year: prevYear
      });
    }
    
    // Fill current month days
    for (let i = 1; i <= totalDays; i++) {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dayNum: i,
        isCurrentMonth: true,
        dateStr,
        month: calMonth,
        year: calYear
      });
    }
    
    // Fill next month leading days
    const nextMonth = calMonth === 11 ? 0 : calMonth + 1;
    const nextYear = calMonth === 11 ? calYear + 1 : calYear;
    let nextDayNum = 1;
    while (days.length < 42) {
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(nextDayNum).padStart(2, '0')}`;
      days.push({
        dayNum: nextDayNum,
        isCurrentMonth: false,
        dateStr,
        month: nextMonth,
        year: nextYear
      });
      nextDayNum++;
    }
    
    return days;
  }, [calMonth, calYear]);

  // Apply predefined shortcut dates
  const applyShortcut = (shortcut: string) => {
    const today = new Date('2026-07-18T00:00:00');
    let start = new Date(today);
    let end = new Date(today);
    
    switch (shortcut) {
      case 'hoje':
        // 2026-07-18 to 2026-07-18
        break;
      case 'ontem':
        start.setDate(today.getDate() - 1);
        end.setDate(today.getDate() - 1);
        break;
      case '7dias':
        start.setDate(today.getDate() - 6);
        break;
      case '30dias':
        start.setDate(today.getDate() - 29);
        break;
      case 'esteMes':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'mesPassado':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case '4meses':
        start = new Date(today.getFullYear(), today.getMonth() - 4, today.getDate());
        break;
      default:
        break;
    }
    
    const formatDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const r = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${r}`;
    };
    
    setDraftStartDate(formatDate(start));
    setDraftEndDate(formatDate(end));
    
    // Focus calendar view to start date's month and year
    setCalMonth(start.getMonth());
    setCalYear(start.getFullYear());
  };

  // Filtered picking data for Estoque x Picking tab
  const filteredPickingComp = useMemo(() => {
    return effectivePickingComp.filter(p => {
      // 1. Filter by Packaging (Embalagem)
      if (epEmbalagem !== 'todos') {
        const prodUpper = p.produto.toUpperCase();
        if (epEmbalagem === 'vidro') {
          const isVidro = prodUpper.includes('GFA') || prodUpper.includes('VD') || prodUpper.includes('600ML') || prodUpper.includes('1L') || prodUpper.includes('ORIGINAL') || prodUpper.includes('BUDWEISER') || prodUpper.includes('BRAHMA') || prodUpper.includes('SKOL');
          if (!isVidro) return false;
        } else if (epEmbalagem === 'lata') {
          const isLata = prodUpper.includes('LT') || prodUpper.includes('LATA') || prodUpper.includes('269') || prodUpper.includes('LATA');
          if (!isLata) return false;
        } else if (epEmbalagem === 'pet') {
          const isPet = prodUpper.includes('PET') || prodUpper.includes('2L') || prodUpper.includes('PEPSI') || prodUpper.includes('GUARANA') || prodUpper.includes('ANTARCTICA');
          if (!isPet) return false;
        }
      }

      // 2. Filter by Meta (Compliance)
      if (epMeta !== 'todos') {
        if (epMeta === 'dentro') {
          if (p.status !== 'Conforme') return false;
        } else if (epMeta === 'fora') {
          if (p.status !== 'Atenção' && p.status !== 'Desvio Crítico') return false;
        }
      }

      // 3. Filter by Date range (validade)
      if (epStartDate || epEndDate) {
        if (p.validade) {
          const parts = p.validade.split('/');
          if (parts.length === 3) {
            const valDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
            if (epStartDate) {
              const start = new Date(epStartDate + 'T00:00:00');
              if (valDate < start) return false;
            }
            if (epEndDate) {
              const end = new Date(epEndDate + 'T00:00:00');
              if (valDate > end) return false;
            }
          }
        }
      }

      // 4. Filter by Collaborator (Colaborador)
      if (epColaborador !== 'todos') {
        const pColab = p.produto.includes('SKOL') || p.produto.includes('ORIGINAL') ? 'Marcos' :
                       p.produto.includes('BRAHMA') || p.produto.includes('BUDWEISER') ? 'Thiago' :
                       p.produto.includes('STELLA') ? 'Aline' :
                       p.produto.includes('GUARANA') ? 'Cleiton' : 'Carlos';
        if (pColab.toLowerCase() !== epColaborador.toLowerCase()) return false;
      }

      return true;
    });
  }, [effectivePickingComp, epEmbalagem, epMeta, epStartDate, epEndDate, epColaborador]);

  // 4 New Operational Charts Datasets for ESTOQUE x PICKING
  const fefoEstoquePickingData = useMemo(() => {
    return filteredPickingComp.map(p => {
      const days = getDaysRemaining(p.validade);
      // Clean up product name for short SKU
      let shortSku = p.produto;
      if (p.produto.includes('SKOL')) shortSku = 'SKOL 600';
      else if (p.produto.includes('BRAHMA')) shortSku = 'BRAHMA 1L';
      else if (p.produto.includes('STELLA')) shortSku = 'STELLA 269';
      else if (p.produto.includes('GUARANA')) shortSku = 'GUARANÁ 2L';
      else if (p.produto.includes('ORIGINAL')) shortSku = 'ORIGINAL 600';
      else if (p.produto.includes('BUDWEISER')) shortSku = 'BUD 600';
      else if (p.produto.includes('PEPSI')) shortSku = 'PEPSI 2L';
      else if (p.produto.length > 18) {
        shortSku = p.produto.split(' ').slice(0, 3).join(' ');
      }

      let pickingDays = p.pickingDays;
      let estoqueDays = p.estoqueDays;
      let gap = p.gap;

      if (pickingDays === undefined || estoqueDays === undefined || gap === undefined) {
        if (p.status === 'Desvio Crítico') {
          pickingDays = days + 35;
          estoqueDays = days;
          gap = 35;
        } else if (p.status === 'Atenção' && p.qtdPicking > 0 && p.qtdEstoque > 0) {
          pickingDays = days + 15;
          estoqueDays = days;
          gap = 15;
        } else {
          pickingDays = days;
          estoqueDays = days + 30;
          gap = -30;
        }
      }

      return {
        sku: shortSku,
        fullName: p.produto,
        estoque: estoqueDays,
        picking: pickingDays,
        gap: gap,
        status: p.status,
        qtdEstoque: p.qtdEstoque,
        qtdPicking: p.qtdPicking,
        location: p.status === 'Conforme' ? 'Picking' : 'Estoque Central',
        validade: p.validade,
        validadeEstoque: p.validadeEstoque || p.validade,
        validadePicking: p.validadePicking || p.validade
      };
    });
  }, [filteredPickingComp]);

  const fefoQuebrasOnlyData = useMemo(() => {
    return fefoEstoquePickingData
      .filter(p => p.qtdPicking > 0 && p.qtdEstoque > 0 && p.gap > 0)
      .sort((a, b) => b.gap - a.gap);
  }, [fefoEstoquePickingData]);

  const quebrasEstoqueXEstoque = useMemo(() => {
    return calcularQuebrasFefoEstoqueXEstoque(actualValidades);
  }, [actualValidades]);

  const quebrasEstoqueXPicking = useMemo(() => {
    return calcularQuebrasFefoEstoqueXPicking(actualValidades);
  }, [actualValidades]);

  const gapSortedData = useMemo(() => {
    return [...fefoEstoquePickingData].sort((a, b) => b.gap - a.gap);
  }, [fefoEstoquePickingData]);

  const conformidadeData = useMemo(() => {
    const currentConformes = filteredPickingComp.filter(p => p.status === 'Conforme').length;
    const currentDesvios = filteredPickingComp.filter(p => p.status === 'Desvio Crítico' || p.status === 'Atenção').length;
    const currentPct = filteredPickingComp.length > 0 ? Math.round((currentConformes / filteredPickingComp.length) * 100) : 100;

    return [
      { mes: 'Março/2026', conformes: 14, naoConformes: 6, percentual: 70, meta: 98 },
      { mes: 'Abril/2026', conformes: 16, naoConformes: 4, percentual: 80, meta: 98 },
      { mes: 'Maio/2026', conformes: 19, naoConformes: 3, percentual: 86, meta: 98 },
      { mes: 'Junho/2026', conformes: 22, naoConformes: 2, percentual: 91, meta: 98 },
      { mes: 'Julho/2026 (Atual)', conformes: currentConformes, naoConformes: currentDesvios, percentual: currentPct, meta: 98 }
    ];
  }, [filteredPickingComp]);

  return (
    <div id="fefo-dashboard-wrapper" className="flex flex-col gap-3 bg-[#f8fafc] text-[#0f172a] p-4 rounded-xl shadow-sm border border-gray-200/80 w-full">
      
      {/* SECTION HEADER */}
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-1.5 hover:bg-gray-200/80 rounded-lg transition-colors cursor-pointer text-gray-500 border-none bg-transparent"
                title="Voltar"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="font-sans font-black text-2xl tracking-tight text-[#032b5e] uppercase flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-[#f5a623]" /> FEFO E CONTROLE DE VENCIMENTO
              </h1>
              <p className="text-[10px] text-gray-500 tracking-wider font-bold uppercase mt-0.5">
                PAINEL CORPORATIVO PARA PREVENÇÃO DE PERDAS, MONITORAMENTO FEFO E ALINHAMENTO RLP (LOGÍSTICA &amp; VENDAS)
              </p>
            </div>
          </div>

          {/* Unit Selector Toggle, DTO Shortcut & SOP Button */}
          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
            {/* ATALHO DTO DIAGNÓSTICO OPERACIONAL (FEFO / VALIDADES) */}
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open_dto_operacao', { detail: { operacao: 'validades' } }));
                window.dispatchEvent(new CustomEvent('app_navigate', { detail: { panel: 'dto-diagnostico', operacao: 'validades' } }));
              }}
              className="px-3.5 py-2 rounded-xl font-black text-xs uppercase bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border border-purple-400/40 hover:scale-[1.02] active:scale-95"
              title="Abrir Diagnóstico DTO Operacional de Gestão de Validades & FEFO"
            >
              <ClipboardCheck className="w-4 h-4 text-purple-200" />
              <span>DTO FEFO</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSopViewer(true)}
              className="px-3.5 py-2 rounded-xl font-bold text-xs uppercase bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border-none"
            >
              <FileText className="w-4 h-4 text-slate-950" />
              <span>Padrão</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('acoes')}
              className="px-3.5 py-2 rounded-xl font-black text-xs uppercase bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border border-blue-400/30"
            >
              <CheckCircle className="w-4 h-4 text-emerald-300" />
              <span>Gerar Ações</span>
            </button>

            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-slate-500 tracking-wider uppercase mb-1">
                VISUALIZAÇÃO
              </span>
              <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200/60 h-[38px] w-[110px] shrink-0">
                <button
                  type="button"
                  onClick={() => setViewUnit('u')}
                  className={`flex-1 rounded-lg font-sans font-black text-xs transition-all border-none cursor-pointer h-full flex items-center justify-center ${viewUnit === 'u' ? 'bg-[#032b5e] text-white shadow-sm' : 'text-slate-400 hover:text-[#032b5e] bg-transparent'}`}
                >
                  CX
                </button>
                <button
                  type="button"
                  onClick={() => setViewUnit('he')}
                  className={`flex-1 rounded-lg font-sans font-black text-xs transition-all border-none cursor-pointer h-full flex items-center justify-center ${viewUnit === 'he' ? 'bg-[#032b5e] text-white shadow-sm' : 'text-slate-400 hover:text-[#032b5e] bg-transparent'}`}
                >
                  HE
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab/Page navigation - Totalmente responsivo no celular */}
        <div className="bg-gray-100/90 p-1.5 rounded-2xl border border-gray-200/80 w-full">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-9 gap-1.5">
            <button 
              onClick={() => setActiveTab('validades')}
              className={`px-2.5 py-2 rounded-xl font-sans font-extrabold text-[11px] sm:text-xs uppercase tracking-wider transition-all border-none cursor-pointer flex items-center justify-center text-center ${activeTab === 'validades' ? 'bg-[#032b5e] text-white shadow-sm' : 'text-gray-600 hover:text-[#032b5e] hover:bg-white/60 bg-transparent'}`}
            >
              📋 Validades
            </button>
            <button 
              onClick={() => setActiveTab('stock-age')}
              className={`px-2.5 py-2 rounded-xl font-sans font-extrabold text-[11px] sm:text-xs uppercase tracking-wider transition-all border-none cursor-pointer flex items-center justify-center text-center ${activeTab === 'stock-age' ? 'bg-[#032b5e] text-white shadow-sm' : 'text-gray-600 hover:text-[#032b5e] hover:bg-white/60 bg-transparent'}`}
            >
              📊 Stock Age Index
            </button>
            <button 
              onClick={() => setActiveTab('pnc')}
              className={`px-2.5 py-2 rounded-xl font-sans font-extrabold text-[11px] sm:text-xs uppercase tracking-wider transition-all border-none cursor-pointer flex items-center justify-center text-center ${activeTab === 'pnc' || activeTab === 'shelf-pnc' || activeTab === 'shelf-life' ? 'bg-[#032b5e] text-white shadow-sm' : 'text-gray-600 hover:text-[#032b5e] hover:bg-white/60 bg-transparent'}`}
            >
              📦 PNC &amp; SHELF
            </button>
            <button 
              onClick={() => setActiveTab('futuro-shelf')}
              className={`px-2.5 py-2 rounded-xl font-sans font-extrabold text-[11px] sm:text-xs uppercase tracking-wider transition-all border-none cursor-pointer flex items-center justify-center text-center ${activeTab === 'futuro-shelf' ? 'bg-[#032b5e] text-white shadow-sm' : 'text-gray-600 hover:text-[#032b5e] hover:bg-white/60 bg-transparent'}`}
            >
              ⚡ Futuro Shelf
            </button>
            <button 
              onClick={() => setActiveTab('escoamento')}
              className={`px-2.5 py-2 rounded-xl font-sans font-extrabold text-[11px] sm:text-xs uppercase tracking-wider transition-all border-none cursor-pointer flex items-center justify-center text-center ${activeTab === 'escoamento' ? 'bg-[#032b5e] text-white shadow-sm' : 'text-gray-600 hover:text-[#032b5e] hover:bg-white/60 bg-transparent'}`}
            >
              🚚 Escoamento
            </button>
            <button 
              onClick={() => setActiveTab('estoque-estoque')}
              className={`px-2.5 py-2 rounded-xl font-sans font-extrabold text-[11px] sm:text-xs uppercase tracking-wider transition-all border-none cursor-pointer flex items-center justify-center text-center ${activeTab === 'estoque-estoque' ? 'bg-[#032b5e] text-white shadow-sm' : 'text-gray-600 hover:text-[#032b5e] hover:bg-white/60 bg-transparent'}`}
            >
              🔍 Est. x Est.
            </button>
            <button 
              onClick={() => setActiveTab('estoque-picking')}
              className={`px-2.5 py-2 rounded-xl font-sans font-extrabold text-[11px] sm:text-xs uppercase tracking-wider transition-all border-none cursor-pointer flex items-center justify-center text-center ${activeTab === 'estoque-picking' ? 'bg-[#032b5e] text-white shadow-sm' : 'text-gray-600 hover:text-[#032b5e] hover:bg-white/60 bg-transparent'}`}
            >
              ⚡ Est. x Pick.
            </button>
            <button 
              onClick={() => setActiveTab('acoes')}
              className={`px-2.5 py-2 rounded-xl font-sans font-extrabold text-[11px] sm:text-xs uppercase tracking-wider transition-all border-none cursor-pointer flex items-center justify-center text-center ${activeTab === 'acoes' || activeTab === 'boarda3' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-[#032b5e] hover:bg-white/60 bg-transparent'}`}
            >
              🚨 Ações DPO (FEFO)
            </button>
            <button 
              onClick={() => setActiveTab('executiva')}
              className={`px-2.5 py-2 rounded-xl font-sans font-extrabold text-[11px] sm:text-xs uppercase tracking-wider transition-all border-none cursor-pointer flex items-center justify-center text-center ${activeTab === 'executiva' ? 'bg-[#032b5e] text-white shadow-sm' : 'text-gray-600 hover:text-[#032b5e] hover:bg-white/60 bg-transparent'}`}
            >
              📈 Executiva
            </button>
          </div>
        </div>
      </div>

      {/* MANUAL DE INSTRUÇÃO E METAS */}
      <ManualInstrucaoCard
        title="Manual de Instrução & Parâmetros de Meta — Gestão FEFO & Validades"
        metrics={[
          {
            key: 'fefo',
            label: 'Aderência FEFO Total',
            unit: '%',
            comoCalcular: '(Volume de Produto Expedido em Conformidade com a Fila do Lote de Menor Validade) ÷ (Volume Total Expedido) × 100.'
          },
          {
            key: 'lotes_criticos',
            label: 'Lotes Críticos (< 30 Dias)',
            unit: 'lotes',
            comoCalcular: 'Quantidade de lotes estocados com validade residual igual ou inferior a 30 dias aguardando alocação ou plano RLP.'
          }
        ]}
      />

      {/* 1.3 KPI SUMMARY HEADER (Display on top of dashboard) */}
      <div className="bg-white text-slate-900 p-5 rounded-2xl shadow-sm flex flex-col gap-5 border border-slate-200">
        
        {/* Banner Operação de Empilhadeiras: Giros de FEFO - Ronildo & Marivaldo */}
        <div className="bg-gradient-to-r from-[#032b5e] via-blue-900 to-indigo-950 text-white p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-sm border border-blue-800">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2.5 rounded-xl border border-white/20 text-2xl flex items-center justify-center">
              🚜
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <span>OPERAÇÃO EMPILHADORES • GIROS DE FEFO</span>
              </div>
              <div className="text-xs text-blue-100 font-bold mt-0.5">
                Conclusão de todos os giros de FEFO gerados por quebras (Estoque x Picking e Ruas). Registro histórico gravado com 100% de aderência.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleConcluirTodosGirosRonildoMarivaldo}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase px-4 py-2.5 rounded-lg transition-all shadow-md flex items-center gap-2 cursor-pointer border-none"
              title="Concluir todos os giros de FEFO pendentes e registrar histórico"
            >
              <span>🚜 CONCLUIR TODOS OS GIROS DE FEFO</span>
            </button>
            <button
              onClick={() => setShowFefoAderenciaModal(true)}
              className="bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs uppercase px-3.5 py-2.5 rounded-lg transition-all border border-white/20 cursor-pointer"
            >
              <span>📋 HISTÓRICO &amp; AUDITORIA</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          
          {/* Card 1: Stock Age Index (Ano) */}
          <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase font-black tracking-widest text-[#032b5e]">STOCK AGE INDEX (ANO)</span>
              <span className="text-[8px] font-black bg-blue-200 text-blue-900 px-1.5 py-0.5 rounded uppercase">
                Acumulado Ano
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-3xl font-black ${yearlySummary.avgStockAgeAno >= 75 ? 'text-emerald-700' : yearlySummary.avgStockAgeAno >= 60 ? 'text-amber-700' : 'text-rose-700'}`}>
                {yearlySummary.avgStockAgeAno}%
              </span>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${yearlySummary.avgStockAgeAno >= 75 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'}`}>
                {yearlySummary.avgStockAgeAno >= 75 ? 'CONFORME' : 'ATENÇÃO'}
              </span>
            </div>
            <div className="text-[9px] text-slate-600 font-bold mt-2 border-t border-blue-200 pt-1.5 flex justify-between items-center">
              <span>Média Acumulada no Ano:</span>
              <span className="text-[#032b5e] font-black">{yearlySummary.totalLotesAno} lotes</span>
            </div>
          </div>

          {/* Card 2: Itens Críticos */}
          <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200 flex flex-col justify-between shadow-2xs">
            <span className="text-[9px] uppercase font-black tracking-widest text-rose-800">ITENS CRÍTICOS (&lt;60%)</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-rose-600">{kpiSummary.criticoSkusCount}</span>
              <span className="text-[10px] font-bold text-slate-600">SKUs</span>
            </div>
            <div className="text-[9px] text-slate-600 font-bold mt-2 border-t border-rose-200/80 pt-1.5 flex justify-between">
              <span>Volume Crítico:</span>
              <span className="text-rose-700 font-extrabold">{kpiSummary.criticoCaixasCount.toLocaleString('pt-BR')} cx</span>
            </div>
          </div>

          {/* Card 3: Valoração */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-2xs">
            <span className="text-[9px] uppercase font-black tracking-widest text-slate-500">VALORAÇÃO DE ESTOQUE</span>
            <div className="flex flex-col mt-1">
              <span className="text-xs font-black text-rose-600">R$ {kpiSummary.valorationCritico.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              <span className="text-[9px] font-bold text-slate-500">em risco crítico</span>
            </div>
            <div className="text-[9px] text-slate-500 font-bold mt-2 border-t border-slate-200 pt-1.5 flex justify-between">
              <span>Valoração Total:</span>
              <span className="text-slate-800 font-extrabold">R$ {kpiSummary.valorationTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Card 4: Hectolitro Total */}
          <div className="bg-sky-50/60 p-4 rounded-xl border border-sky-200 flex flex-col justify-between shadow-2xs">
            <span className="text-[9px] uppercase font-black tracking-widest text-sky-800">HECTOLITROS TOTAL (HL)</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-3xl font-black text-sky-700">{kpiSummary.hectolitroTotal.toLocaleString('pt-BR')}</span>
              <span className="text-[10px] font-bold text-sky-900">HL</span>
            </div>
            <div className="text-[9px] text-slate-600 font-bold mt-2 border-t border-sky-200/80 pt-1.5 flex justify-between">
              <span>Volume Total:</span>
              <span className="text-sky-800 font-extrabold">{validadesRecolhidasDeduplicadas.reduce((a, b) => a + b.quantidade, 0).toLocaleString('pt-BR')} cx</span>
            </div>
          </div>

          {/* Card 5: Quebras de FEFO */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-2xs">
            <span className="text-[9px] uppercase font-black tracking-widest text-slate-500">QUEBRAS DE FEFO</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-3xl font-black ${kpiSummary.quebrasFefoTotal > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {kpiSummary.quebrasFefoTotal}
              </span>
              <span className="text-[10px] font-bold text-slate-600">desvios ativos</span>
            </div>
            <div className="text-[9px] text-slate-500 font-bold mt-2 border-t border-slate-200 pt-1.5 flex justify-between">
              <span>Status:</span>
              <span className={kpiSummary.quebrasFefoTotal > 0 ? "text-amber-700 font-black" : "text-emerald-700 font-black"}>
                {kpiSummary.quebrasFefoTotal > 0 ? 'Ação Necessária' : '100% Regularizado'}
              </span>
            </div>
          </div>

          {/* Card 6: Aderência ao Giro FEFO */}
          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase font-black tracking-widest text-emerald-800">% ADERÊNCIA AO GIRO</span>
              <button
                onClick={() => setShowFefoAderenciaModal(true)}
                className="text-[8px] font-extrabold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-1.5 py-0.5 rounded border border-emerald-300 transition-colors cursor-pointer"
                title="Abrir Histórico de Auditorias de Aderência FEFO"
              >
                Histórico
              </button>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-3xl font-black ${kpiSummary.aderenciaGiroPct >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {kpiSummary.aderenciaGiroPct}%
              </span>
            </div>
            <div className="text-[9px] text-slate-600 font-bold mt-2 border-t border-emerald-200/80 pt-1.5 flex justify-between">
              <span>Operação Empilhadores:</span>
              <span className="text-emerald-700 font-black">100% Giros Concluídos</span>
            </div>
          </div>

        </div>

        {/* Mini Distribution Chart baseado nas últimas validades recolhidas */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col gap-2 shadow-2xs">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-700">
              📊 DISTRIBUIÇÃO DAS ÚLTIMAS VALIDADES RECOLHIDAS POR FAIXA DE VENCIMENTO
            </span>
            <span className="text-[9px] font-extrabold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200">
              {validadesRecolhidasDeduplicadas.length} Lotes Monitorados
            </span>
          </div>
          <div className="h-20 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bracketChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={8} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', fontSize: '10px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name="Caixas" radius={[4, 4, 0, 0]}>
                  {bracketChartData.map((entry, index) => (
                    <Cell key={`cell-mini-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* TAB PAGE RENDERINGS */}

      {/* ─────────────────────────────────────────────────────────────────
          TAB 1: VALIDADES RECOLHIDAS (1ª Guia)
          ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'validades' && (
        <div className="flex flex-col gap-5">
          
          {/* ACOMPANHAMENTO DE ITENS CRÍTICOS DO ÚLTIMO RECOLHIMENTO NO WORKSTATION */}
          <WorkstationCriticosRecolhimento
            validadesList={actualValidades}
            user={user}
            empresa={empresa}
            onRefresh={() => (empresaData as any)?.refetchValidades?.() || (empresaData as any)?.refreshAllData?.()}
          />

          {/* Header Controls */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-sm uppercase text-[#032b5e] tracking-wider flex items-center gap-2">
                📋 LISTA DE VALIDADES RECOLHIDAS
              </span>
              <span className="text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-md">
                {validadesRecolhidasDeduplicadas.length} Registros Únicos (Deduplicados)
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowImport030519Modal(true)}
                className="bg-[#032b5e] hover:bg-[#021f44] text-white font-extrabold text-[11px] uppercase tracking-wider px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border-none"
                title="Importar relatório 03.05.19 de 30 dias para cálculo de Venda Média Diária"
              >
                📥 IMPORTAR 03.05.19 (30 DIAS)
              </button>
              <button
                onClick={handleExportValidadesExcel}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] uppercase tracking-wider px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border-none"
              >
                📥 Exportar Excel
              </button>
              <button
                onClick={handleExportValidadesImagem}
                className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-[11px] uppercase tracking-wider px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border-none"
              >
                📸 Exportar Imagem
              </button>
              <button
                onClick={handleDeleteAllValidades}
                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] uppercase tracking-wider px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border-none"
              >
                🗑 Excluir Base de Validades
              </button>
            </div>
          </div>

          {/* Table Container matching Image 2 */}
          <div id="validades-recolhidas-table-container" className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1100px]">
                <thead>
                  <tr className="bg-[#f59e0b] text-slate-950 font-black uppercase text-[10.5px] tracking-wider border-b-2 border-amber-600">
                    <th className="p-3 text-center border-r border-amber-500/50">Rank</th>
                    <th className="p-3 border-r border-amber-500/50">Cod</th>
                    <th className="p-3 border-r border-amber-500/50">Descrição</th>
                    <th className="p-3 text-right border-r border-amber-500/50">Qnd. SKU (cx)</th>
                    <th className="p-3 text-center border-r border-amber-500/50">Vencimento</th>
                    <th className="p-3 text-center border-r border-amber-500/50">Stock Age Index (%)</th>
                    <th className="p-3 text-center border-r border-amber-500/50">Dias p/ Venc.</th>
                    <th className="p-3 text-right border-r border-amber-500/50">Venda Média</th>
                    <th className="p-3 text-center border-r border-amber-500/50">Dias Estoque</th>
                    <th className="p-3 text-center border-r border-amber-500/50">Previsão Escoamento</th>
                    <th className="p-3 text-right border-r border-amber-500/50">Valor (R$)</th>
                    <th className="p-3 text-center">Ações Recontagem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-xs font-mono">
                  {validadesRecolhidasDeduplicadas.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="p-8 text-center text-gray-400 font-sans font-bold">
                        Nenhuma validade cadastrada no sistema. Importe uma planilha ou cadastre validades na guia Conferente.
                      </td>
                    </tr>
                  ) : (
                    validadesRecolhidasDeduplicadas.map((row, idx) => {
                      let bgClass = 'bg-[#bbf7d0] text-[#14532d] hover:bg-[#86efac]'; // OK (>75%)
                      if (row.faixa === 'critico') bgClass = 'bg-[#fecdd3] text-[#9f1239] hover:bg-[#fda4af]'; // Critical (<60%)
                      else if (row.faixa === 'atencao') bgClass = 'bg-[#fef08a] text-[#854d0e] hover:bg-[#fde047]'; // Attention (60-75%)

                      return (
                        <tr key={`${row.codigo}_${row.validade}_${idx}`} className={`${bgClass} transition-colors font-bold`}>
                          <td className="p-2.5 text-center font-black border-r border-black/10">{row.rank}</td>
                          <td className="p-2.5 font-black border-r border-black/10">{row.codigo}</td>
                          <td className="p-2.5 border-r border-black/10 font-sans">{row.descricao}</td>
                          <td className="p-2.5 text-right font-black border-r border-black/10">{row.quantidade.toLocaleString('pt-BR')}</td>
                          <td className="p-2.5 text-center border-r border-black/10">{row.validade}</td>
                          <td className="p-2.5 text-center font-black border-r border-black/10">{row.stockAgeIndex}%</td>
                          <td className="p-2.5 text-center font-black border-r border-black/10">{row.diasParaVencer}d</td>
                          <td className="p-2.5 text-right border-r border-black/10">
                            {typeof row.vendaMedia === 'number'
                              ? (row.vendaMedia >= 100 
                                  ? Math.round(row.vendaMedia).toLocaleString('pt-BR') 
                                  : row.vendaMedia.toLocaleString('pt-BR', { minimumFractionDigits: row.vendaMedia % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 }))
                              : row.vendaMedia}
                          </td>
                          <td className="p-2.5 text-center border-r border-black/10">{row.diasEstoque}d</td>
                          <td className="p-2.5 text-center border-r border-black/10">{row.previsaoEscoamento}</td>
                          <td className="p-2.5 text-right font-black border-r border-black/10">
                            {row.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                          <td className="p-2 text-center font-sans">
                            <button
                              type="button"
                              onClick={() => setRecontagemModal({
                                codigo: row.codigo,
                                descricao: row.descricao,
                                validadeOriginal: row.validade,
                                novaValidade: row.validade,
                                quantidade: row.quantidade,
                                localizacao: row.localizacao || 'central',
                                bloco: row.bloco || '',
                                _rawDoc: row._rawDoc
                              })}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[10px] rounded-lg cursor-pointer transition-all uppercase tracking-wider shadow-xs flex items-center justify-center gap-1 mx-auto"
                              title="Solicitar / Realizar Recontagem para alterar quantidade e validade"
                            >
                              🔄 Recontar
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          TAB: STOCK AGE INDEX (Consolidado Mensal, Importação 03.05.19 & Riscos por Rua)
          ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'stock-age' && (
        <StockAgeIndexTab 
          user={user} 
          empresa={empresa} 
          validades={actualValidades} 
        />
      )}

      {/* ─────────────────────────────────────────────────────────────────
          TAB 7: VISÃO EXECUTIVA
          ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'executiva' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Chart: Vencimento por faixa */}
            <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-sans font-black text-xs uppercase text-[#032b5e] tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-sky-500" /> RISCO POR VOLUME &amp; FAIXA DE EXCLUSÃO FEFO
                  </h3>
                  <p className="text-[10px] text-gray-500 font-bold mt-0.5">
                    Representação das faixas críticas em dias restantes com base nas coletas de validade efetuadas
                  </p>
                </div>
                {actualValidades.length > 0 && (
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      {actualValidades.length} Coletas Coletadas
                    </span>
                  </div>
                )}
              </div>

              <div className="h-64 w-full">
                {bracketChartData.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                    Cadastre lotes de validades para gerar a volumetria por faixa.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bracketChartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={9.5} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={9.5} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ fontSize: 10 }} />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={45}>
                        {bracketChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart: Status das Ações RLP */}
            <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4 justify-between">
              <div>
                <h3 className="font-sans font-black text-xs uppercase text-[#032b5e] tracking-wider">
                  Distribuição das Ações RLP
                </h3>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">Qualidade e andamento de planos de ação preventivos</p>
              </div>

              <div className="h-44 w-full relative flex items-center justify-center">
                {actionPoints.length === 0 ? (
                  <div className="text-xs text-gray-400">Sem ações</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={actionsPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {actionsPieData.map((entry, index) => {
                          const col = entry.name === 'Concluído' ? '#10b981' : 
                                      entry.name === 'Em Andamento' ? '#3b82f6' : 
                                      entry.name === 'Atrasado' ? '#ef4444' : '#eab308';
                          return <Cell key={`cell-${index}`} fill={col} />;
                        })}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 9 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="grid grid-cols-2 gap-1.5 border-t border-gray-100 pt-3">
                {actionsPieData.map((entry) => {
                  const col = entry.name === 'Concluído' ? 'bg-emerald-500' : 
                              entry.name === 'Em Andamento' ? 'bg-blue-500' : 
                              entry.name === 'Atrasado' ? 'bg-red-500' : 'bg-yellow-500';
                  return (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${col}`} />
                      <span className="text-[9px] font-black text-gray-600 uppercase truncate">
                        {entry.name}: {entry.value} ac.
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>



          {/* Top 10 Produtos com Vencimento Mais Próximo */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-sans font-black text-xs uppercase text-[#032b5e] tracking-wider flex items-center gap-2">
                  <span>🚨 10 Primeiros Produtos a Vencer</span>
                  <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">
                    Prioridade FEFO
                  </span>
                </h3>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                  Lista dos 10 itens no estoque com a data de vencimento mais próxima (ordenados do menor para o maior prazo restante)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                  {top10Expiring.length} de {compiledValidades.length} lotes
                </span>
                <button
                  onClick={handleExportTop10Excel}
                  disabled={top10Expiring.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer hover:shadow"
                  title="Exportar os 10 primeiros produtos a vencer em planilha Excel"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar Excel</span>
                </button>
              </div>
            </div>

            {top10Expiring.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 font-semibold bg-slate-50 rounded-lg">
                Nenhum produto cadastrado no estoque de validades.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-slate-50/70 text-[10px] uppercase font-black text-gray-500 tracking-wider">
                      <th className="py-2.5 px-3 text-center w-12">#</th>
                      <th className="py-2.5 px-3">Código</th>
                      <th className="py-2.5 px-3">Descrição do Produto</th>
                      <th className="py-2.5 px-3">Localização</th>
                      <th className="py-2.5 px-3 text-center">Data Vencimento</th>
                      <th className="py-2.5 px-3 text-center">Dias Restantes</th>
                      <th className="py-2.5 px-3 text-center">Quantidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {top10Expiring.map((item, idx) => {
                      let formattedValDate = item.validade;
                      try {
                        if (item.validade && item.validade.includes('-')) {
                          const [y, m, d] = item.validade.split('-');
                          formattedValDate = `${d}/${m}/${y}`;
                        }
                      } catch (e) {}

                      let badgeBg = 'bg-red-50 text-red-700 border-red-200 font-bold';
                      let badgeText = `${item.days} dias`;
                      if (item.days < 0) {
                        badgeBg = 'bg-red-600 text-white border-red-700 font-black animate-pulse';
                        badgeText = `${Math.abs(item.days)}d vencido`;
                      } else if (item.days === 0) {
                        badgeBg = 'bg-red-600 text-white border-red-700 font-black';
                        badgeText = 'Vence Hoje';
                      } else if (item.days <= 30) {
                        badgeBg = 'bg-red-100 text-red-800 border-red-300 font-bold';
                      } else if (item.days <= 60) {
                        badgeBg = 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
                      } else if (item.days <= 90) {
                        badgeBg = 'bg-yellow-100 text-yellow-800 border-yellow-300 font-bold';
                      } else {
                        badgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
                      }

                      return (
                        <tr key={item.id || item._docId || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 text-center font-mono font-black text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-black text-[#f5a623]">
                            {item.codigo}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-800">
                            {item.descricao}
                          </td>
                          <td className="py-2.5 px-3 text-[11px]">
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-semibold uppercase text-[9px]">
                              {item.localizacao === 'central' ? 'Estoque Central' : item.localizacao === 'picking' ? 'Picking' : 'Marketplace'}
                              {item.bloco ? ` — Bloco ${item.bloco}` : ''}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                            📅 {formattedValDate}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] border ${badgeBg}`}>
                              ⏳ {badgeText}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-700">
                            {item.palhete > 0 && <span className="font-bold text-purple-700 mr-1.5">🪵 {item.palhete} pl</span>}
                            {item.caixa > 0 && <span className="font-bold text-slate-700">📦 {item.caixa} cx</span>}
                            {item.palhete === 0 && item.caixa === 0 && <span className="font-bold">{item.totalUnitiesRaw} cx</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}





      {/* ─────────────────────────────────────────────────────────────────
          TAB 3: ESTOQUE X PICKING (QUEBRAS FEFO & AUDITORIA DE LOTES)
          ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'estoque-picking' && (
        <div className="w-full">
          <FefoEstoqueXPickingTab
            validadesList={actualValidades}
            user={user}
            empresa={empresa}
            onRefresh={() => (empresaData as any)?.refetchValidades?.() || (empresaData as any)?.refreshAllData?.()}
          />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          TAB: STOCK AGE INDEX
          ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'stock-age' && (
        <div className="w-full">
          <StockAgeIndexTab
            validadesList={actualValidades}
            user={user}
            empresa={empresa}
            onRefresh={() => (empresaData as any)?.refetchValidades?.() || (empresaData as any)?.refreshAllData?.()}
          />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          TAB: FUTURO SHELF
          ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'futuro-shelf' && (
        <div className="w-full">
          <FuturoShelfTab
            validadesList={actualValidades}
            user={user}
            empresa={empresa}
            onRefresh={() => (empresaData as any)?.refetchValidades?.() || (empresaData as any)?.refreshAllData?.()}
          />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          TAB: GESTÃO DE ESCOAMENTO
          ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'escoamento' && (
        <div className="w-full">
          <GestaoEscoamentoTab
            validadesList={actualValidades}
            user={user}
            empresa={empresa}
            onRefresh={() => (empresaData as any)?.refetchValidades?.() || (empresaData as any)?.refreshAllData?.()}
          />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          TAB: PNC (PRODUTOS NÃO CONFORMES) & SHELF (VENCIDOS)
          ───────────────────────────────────────────────────────────────── */}
      {(activeTab === 'pnc' || activeTab === 'shelf-pnc' || activeTab === 'shelf-life') && (
        <div className="w-full">
          <ShelfLifePncTab
            validadesList={actualValidades}
            user={user}
            empresa={empresa}
            initialSubTab={(initialSubTab as any) || (activeTab === 'shelf-life' ? 'shelf' : undefined)}
            onRefresh={() => (empresaData as any)?.refetchValidades?.() || (empresaData as any)?.refreshAllData?.()}
          />
        </div>
      )}


      {/* ─────────────────────────────────────────────────────────────────
          TAB 4: ESTOQUE X ESTOQUE (POR BLOCO & AUDITORIA DE QUEBRAS)
          ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'estoque-estoque' && (
        <div className="w-full">
          <FefoEstoqueXEstoqueTab
            validadesList={actualValidades}
            user={user}
            empresa={empresa}
            onRefresh={() => (empresaData as any)?.refetchValidades?.() || (empresaData as any)?.refreshAllData?.()}
          />
        </div>
      )}



      {false && activeTab === 'rlp' && (
        <div className="flex flex-col gap-6">
          
          {/* RLP WEEKLY MEETINGS SCHEDULE */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
              <div>
                <h3 className="font-sans font-black text-xs uppercase text-[#032b5e] tracking-wider flex items-center gap-1.5">
                  <Users className="w-4.5 h-4.5 text-[#f5a623]" /> HISTÓRICO DE REUNIÕES RLP (LOGÍSTICA + VENDAS)
                </h3>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">Definição de estratégias corporativas de escoamento para os maiores lotes ofensores em risco de vencimento</p>
              </div>
              
              <button 
                onClick={() => setShowAddMeeting(!showAddMeeting)}
                className="flex items-center gap-1 bg-[#032b5e] hover:bg-[#021f44] text-white font-sans font-bold text-[10px] uppercase tracking-wider px-3 py-2 rounded-lg transition-all border-none cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Nova Reunião RLP
              </button>
            </div>

            {showAddMeeting && (
              <form onSubmit={handleAddRLPMeeting} className="bg-slate-50 p-4 border border-gray-200 rounded-xl mb-5 text-xs flex flex-col gap-3">
                <h4 className="font-bold text-[#032b5e] uppercase text-[10px] tracking-wider">Registrar Ata de Reunião RLP</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Data da Reunião *</label>
                    <input 
                      type="text" 
                      value={newMeeting.data} 
                      onChange={e => setNewMeeting({ ...newMeeting, data: e.target.value })}
                      placeholder="DD/MM/AAAA"
                      className="w-full p-2 border border-gray-300 rounded text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Produtos Ofensores Discutidos *</label>
                    <input 
                      type="text" 
                      value={newMeeting.produtos} 
                      onChange={e => setNewMeeting({ ...newMeeting, produtos: e.target.value })}
                      placeholder="Ex: Brahma 600ml..."
                      className="w-full p-2 border border-gray-300 rounded text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Quantidade em Risco (Fardo/SKUs)</label>
                    <input 
                      type="number" 
                      value={newMeeting.quantidadeRisco} 
                      onChange={e => setNewMeeting({ ...newMeeting, quantidadeRisco: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 border border-gray-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Responsável *</label>
                    <input 
                      type="text" 
                      value={newMeeting.responsavel} 
                      onChange={e => setNewMeeting({ ...newMeeting, responsavel: e.target.value })}
                      placeholder="Nome do Ofensor/Cargo"
                      className="w-full p-2 border border-gray-300 rounded text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-8">
                    <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Estratégia de Escoamento Definida *</label>
                    <input 
                      type="text" 
                      value={newMeeting.estrategia} 
                      onChange={e => setNewMeeting({ ...newMeeting, estrategia: e.target.value })}
                      placeholder="Ex: Combo Brahma + Churrasco no canal de bares..."
                      className="w-full p-2 border border-gray-300 rounded text-xs"
                      required
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Prazo de Ação *</label>
                    <input 
                      type="text" 
                      value={newMeeting.prazo} 
                      onChange={e => setNewMeeting({ ...newMeeting, prazo: e.target.value })}
                      placeholder="DD/MM/AAAA"
                      className="w-full p-2 border border-gray-300 rounded text-xs"
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="self-end py-2 px-6 bg-[#032b5e] hover:bg-[#021f44] text-white font-sans font-bold text-[10px] uppercase tracking-wider rounded border-none cursor-pointer"
                >
                  Salvar Ata RLP
                </button>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="w-full border-collapse font-sans text-xs min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200">
                    <th className="p-3 text-gray-500 text-left uppercase tracking-wider text-[9px]">Data Reunião</th>
                    <th className="p-3 text-gray-500 text-left uppercase tracking-wider text-[9px]">Produtos Discutidos</th>
                    <th className="p-3 text-gray-500 text-right uppercase tracking-wider text-[9px]">Qtd em Risco</th>
                    <th className="p-3 text-gray-500 text-left uppercase tracking-wider text-[9px]">Estratégia Comercial / Operacional</th>
                    <th className="p-3 text-gray-500 text-left uppercase tracking-wider text-[9px]">Responsável</th>
                    <th className="p-3 text-gray-500 text-center uppercase tracking-wider text-[9px]">Prazo Limite</th>
                    <th className="p-3 text-gray-500 text-center uppercase tracking-wider text-[9px]">Status RLP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rlpMeetings.map((m) => {
                    const statusStyle = m.status === 'Concluída' ? 'bg-emerald-100 text-emerald-800' :
                                        m.status === 'Em andamento' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800';
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-700">{m.data}</td>
                        <td className="p-3 font-bold text-slate-800 uppercase">{m.produtos}</td>
                        <td className="p-3 text-right font-black text-red-500">{m.quantidadeRisco} cx</td>
                        <td className="p-3 text-gray-600 leading-normal max-w-[250px] truncate" title={m.estrategia}>{m.estrategia}</td>
                        <td className="p-3 font-semibold text-slate-700">{m.responsavel}</td>
                        <td className="p-3 text-center font-bold text-slate-700">{m.prazo}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              const nextStatus: 'Aberta' | 'Em andamento' | 'Concluída' = m.status === 'Aberta' ? 'Em andamento' : m.status === 'Em andamento' ? 'Concluída' : 'Aberta';
                              const updated: RLPMeeting[] = rlpMeetings.map(item => item.id === m.id ? { ...item, status: nextStatus } : item);
                              saveMeetings(updated);
                            }}
                            className={`px-2.5 py-1 rounded-full text-[8.5px] font-bold uppercase cursor-pointer border-none shadow-sm transition-all ${statusStyle}`}
                            title="Clique para alternar o status"
                          >
                            {m.status}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* CONTROL OF ACTIONS TABLE */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
              <div>
                <h3 className="font-sans font-black text-xs uppercase text-[#032b5e] tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-4.5 h-4.5 text-emerald-500" /> PLANILHA DE CONTROLE DE AÇÕES CORRETIVAS
                </h3>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">Plano tático individualizado de prevenção de perdas com cálculo automático de dias de atraso</p>
              </div>

              <button 
                onClick={() => setShowAddAction(!showAddAction)}
                className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white font-sans font-bold text-[10px] uppercase tracking-wider px-3 py-2 rounded-lg transition-all border-none cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Ação
              </button>
            </div>

            {showAddAction && (
              <form onSubmit={handleAddActionPoint} className="bg-slate-50 p-4 border border-gray-200 rounded-xl mb-5 text-xs flex flex-col gap-3">
                <h4 className="font-bold text-[#032b5e] uppercase text-[10px] tracking-wider">Cadastrar Ação de Preventiva de Bloqueio</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Produto Alvo *</label>
                    <select 
                      value={newAction.produto} 
                      onChange={e => setNewAction({ ...newAction, produto: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded text-xs"
                    >
                      {PRODUCTS.slice(0, 15).map((p, pIdx) => (
                        <option key={`fefo-prod-${p.codigo}-${pIdx}`} value={p.descricao}>{p.descricao}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Lote *</label>
                    <input 
                      type="text" 
                      value={newAction.lote} 
                      onChange={e => setNewAction({ ...newAction, lote: e.target.value })}
                      placeholder="Lote de validade..."
                      className="w-full p-2 border border-gray-300 rounded text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Responsável *</label>
                    <input 
                      type="text" 
                      value={newAction.responsavel} 
                      onChange={e => setNewAction({ ...newAction, responsavel: e.target.value })}
                      placeholder="Responsável da execução..."
                      className="w-full p-2 border border-gray-300 rounded text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-8">
                    <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Ação Preventiva de Bloqueio *</label>
                    <input 
                      type="text" 
                      value={newAction.acao} 
                      onChange={e => setNewAction({ ...newAction, acao: e.target.value })}
                      placeholder="Descreva a ação de escoamento ou conferência..."
                      className="w-full p-2 border border-gray-300 rounded text-xs"
                      required
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Data Prevista *</label>
                    <input 
                      type="text" 
                      value={newAction.dataPrevista} 
                      onChange={e => setNewAction({ ...newAction, dataPrevista: e.target.value })}
                      placeholder="DD/MM/AAAA"
                      className="w-full p-2 border border-gray-300 rounded text-xs"
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="self-end py-2 px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-sans font-bold text-[10px] uppercase tracking-wider rounded border-none cursor-pointer"
                >
                  Gravar Ação
                </button>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="w-full border-collapse font-sans text-xs min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200">
                    <th className="p-3 text-gray-500 text-left uppercase tracking-wider text-[9px]">Produto</th>
                    <th className="p-3 text-gray-500 text-left uppercase tracking-wider text-[9px]">Lote</th>
                    <th className="p-3 text-gray-500 text-left uppercase tracking-wider text-[9px]">Ação Preventiva</th>
                    <th className="p-3 text-gray-500 text-left uppercase tracking-wider text-[9px]">Responsável</th>
                    <th className="p-3 text-gray-500 text-center uppercase tracking-wider text-[9px]">Abertura</th>
                    <th className="p-3 text-gray-500 text-center uppercase tracking-wider text-[9px]">Previsão</th>
                    <th className="p-3 text-gray-500 text-center uppercase tracking-wider text-[9px]">Conclusão</th>
                    <th className="p-3 text-gray-500 text-center uppercase tracking-wider text-[9px]">Dias de Atraso</th>
                    <th className="p-3 text-gray-500 text-center uppercase tracking-wider text-[9px]">Status</th>
                    <th className="p-3 text-gray-500 text-right uppercase tracking-wider text-[9px]">Excluir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {actionPoints.map((a) => {
                    const badgeClass = a.status === 'Concluído' ? 'bg-emerald-100 text-emerald-800' :
                                       a.status === 'Em Andamento' ? 'bg-blue-100 text-blue-800' :
                                       a.status === 'Atrasado' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800';
                    
                    // calculate delay days if status is pending and past deadline
                    let delayStr = 'No Prazo';
                    if (a.status === 'Atrasado') delayStr = '7 dias de atraso';
                    else if (a.status === 'Concluído') delayStr = 'Concluído';

                    return (
                      <tr key={a.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-800 uppercase">{a.produto}</td>
                        <td className="p-3 font-mono font-bold text-gray-600">{a.lote}</td>
                        <td className="p-3 text-gray-700 font-semibold">{a.acao}</td>
                        <td className="p-3 font-semibold text-slate-700">{a.responsavel}</td>
                        <td className="p-3 text-center text-gray-500">{a.dataAbertura}</td>
                        <td className="p-3 text-center font-bold text-slate-700">{a.dataPrevista}</td>
                        <td className="p-3 text-center text-slate-500">{a.dataConclusao || '--'}</td>
                        <td className="p-3 text-center font-black">
                          <span className={a.status === 'Atrasado' ? 'text-red-500' : 'text-emerald-600'}>
                            {delayStr}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleActionStatus(a.id)}
                            className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase cursor-pointer border-none shadow-sm transition-all ${badgeClass}`}
                          >
                            {a.status}
                          </button>
                        </td>
                        <td className="p-3 text-right">
                          <button 
                            type="button"
                            onClick={() => handleDeleteAction(a.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer border-none bg-transparent"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}







      {/* ─────────────────────────────────────────────────────────────────
          TAB 6: AÇÕES SEMANAIS RLP (REUNIÃO DE RESULTADOS LOGÍSTICOS) - REQ 38
          ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'rlp-semanal' && (
        <div className="flex flex-col gap-5">
          {/* RLP BANNER */}
          <div className="bg-gradient-to-r from-[#032b5e] to-indigo-900 text-white p-5 rounded-xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-amber-400" />
                <h3 className="font-sans font-black text-lg uppercase tracking-tight">
                  Reunião de Resultados Logísticos (RLP) - Ações de Melhoria Preventiva
                </h3>
              </div>
              <p className="text-xs text-indigo-200 mt-1">
                Alinhamento semanal entre Logística, Comercial, Planejamento e Operação para tratativa de riscos e prevenção de perdas.
              </p>
            </div>

            <button
              onClick={() => {
                triggerAutoAcaoMelhoriaPreventiva({
                  processo: 'Gestão FEFO',
                  indicador: 'Aderência RLP',
                  tendenciaProjecao: 'Risco de vencimento acumulado na linha de cervejas em garrafa',
                  recomendacaoSugerida: 'Redistribuir 300 caixas para revenda da regional sul e lançar combo promocional',
                  areaRlp: 'Comercial',
                  isRlp: true,
                  prioridade: 'Alta'
                });
                alert('✅ Nova Ação de Melhoria RLP gerada e publicada no Quadro Executivo!');
              }}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-lg transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Propor Nova Ação RLP
            </button>
          </div>

          {/* 4 QUADRANTES POR ÁREA (LOGÍSTICA, COMERCIAL, PLANEJAMENTO, OPERAÇÃO) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* LOGÍSTICA */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="font-black text-xs uppercase text-indigo-900 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-indigo-600" /> Logística
                </span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">2 Propostas</span>
              </div>
              <p className="text-xs text-gray-600">
                Priorização do sequenciamento de carregamento no WMS e garantia da saída estrita via regra FEFO.
              </p>
              <button
                onClick={() => {
                  triggerAutoAcaoMelhoriaPreventiva({
                    processo: 'Carregamento',
                    indicador: 'Prioridade FEFO Expedição',
                    tendenciaProjecao: 'Aumento de permanência de paletes em doca secundária',
                    recomendacaoSugerida: 'Alterar prioridade de fila no WMS para docas 01 a 04',
                    areaRlp: 'Logística',
                    isRlp: true
                  });
                  alert('✅ Ação RLP Logística publicada com sucesso!');
                }}
                className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded border border-indigo-200 cursor-pointer text-center"
              >
                Gerar Ação Logística
              </button>
            </div>

            {/* COMERCIAL */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="font-black text-xs uppercase text-amber-900 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-600" /> Comercial
                </span>
                <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold">3 Propostas</span>
              </div>
              <p className="text-xs text-gray-600">
                Concessão estratégica de incentivos e campanhas de giro rápido para itens em janela crítica.
              </p>
              <button
                onClick={() => {
                  triggerAutoAcaoMelhoriaPreventiva({
                    processo: 'Gestão FEFO',
                    indicador: 'Aceleração de Giro Comercial',
                    tendenciaProjecao: 'Desaceleração de vendas em latas 269ml nas últimas 2 semanas',
                    recomendacaoSugerida: 'Criar preço promocional para redes parceiras de hipermercados',
                    areaRlp: 'Comercial',
                    isRlp: true
                  });
                  alert('✅ Ação RLP Comercial publicada com sucesso!');
                }}
                className="w-full py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded border border-amber-200 cursor-pointer text-center"
              >
                Gerar Ação Comercial
              </button>
            </div>

            {/* PLANEJAMENTO */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="font-black text-xs uppercase text-sky-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-sky-600" /> Planejamento
                </span>
                <span className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded font-bold">1 Proposta</span>
              </div>
              <p className="text-xs text-gray-600">
                Ajuste de volume de recebimento de fábrica e calibração da cobertura máxima em dias de estoque.
              </p>
              <button
                onClick={() => {
                  triggerAutoAcaoMelhoriaPreventiva({
                    processo: 'Gestão de Capacidade',
                    indicador: 'Ajuste de Cobertura de Estoque',
                    tendenciaProjecao: 'Capacidade ocupada em 94% com acúmulo de paletes de giro lento',
                    recomendacaoSugerida: 'Postergar em 5 dias o recebimento de lote excedente de fábrica',
                    areaRlp: 'Planejamento',
                    isRlp: true
                  });
                  alert('✅ Ação RLP Planejamento publicada com sucesso!');
                }}
                className="w-full py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs rounded border border-sky-200 cursor-pointer text-center"
              >
                Gerar Ação Planejamento
              </button>
            </div>

            {/* OPERAÇÃO */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="font-black text-xs uppercase text-emerald-900 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-emerald-600" /> Operação
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">2 Propostas</span>
              </div>
              <p className="text-xs text-gray-600">
                Rotina acelerada de reabastecimento de picking e auditorias de conferência semáforo.
              </p>
              <button
                onClick={() => {
                  triggerAutoAcaoMelhoriaPreventiva({
                    processo: 'Estoque x Picking',
                    indicador: 'Repick Acelerado FEFO',
                    tendenciaProjecao: 'Lotes mais antigos retidos no bloco A3 sem transferência para o picking',
                    recomendacaoSugerida: 'Realizar movimentação emergencial de 120 caixas para a frente de picking',
                    areaRlp: 'Operação',
                    isRlp: true
                  });
                  alert('✅ Ação RLP Operação publicada com sucesso!');
                }}
                className="w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded border border-emerald-200 cursor-pointer text-center"
              >
                Gerar Ação Operação
              </button>
            </div>
          </div>

          {/* HISTÓRICO DE ACORDOS RLP */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
            <h3 className="font-sans font-black text-xs uppercase text-[#032b5e] tracking-wider">
              Acordos Firmados nas Reuniões Semanal de RLP
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse font-sans text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-gray-200 text-left text-[9px] font-black uppercase text-gray-600 tracking-wider">
                    <th className="p-3">Data Reunião</th>
                    <th className="p-3">Produtos / Lotes Impactados</th>
                    <th className="p-3 text-right">Qtd em Risco</th>
                    <th className="p-3 text-left">Estratégia Aprovada (RLP)</th>
                    <th className="p-3 text-left">Responsável</th>
                    <th className="p-3 text-center">Prazo</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rlpMeetings.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-700">{m.data}</td>
                      <td className="p-3 font-bold text-slate-800">{m.produtos}</td>
                      <td className="p-3 text-right font-mono font-bold text-red-600">{m.quantidadeRisco} cx</td>
                      <td className="p-3 text-gray-700 font-medium">{m.estrategia}</td>
                      <td className="p-3 font-semibold text-slate-700">{m.responsavel}</td>
                      <td className="p-3 text-center font-mono">{m.prazo}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          m.status === 'Concluída' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {(activeTab === 'acoes' || activeTab === 'boarda3') && (
        <QuadroAcoesDpo
          user={user}
          empresa={empresa}
          theme={theme || 'light'}
          processoFilter="Validade"
          title="Quadro de Ações — FEFO & Gestão de Validades"
          subtitle="Planos de ação, tratativas RLP, contramedidas 5W2H e desvios de validade."
          onBack={() => setActiveTab('validades')}
        />
      )}


      {/* FOOTER BLOCK */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-2">
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          SISTEMA INTELIGENTE • MONITORAMENTO CORPORATIVO DE VALIDADES E FEFO
        </span>
        <span className="text-[10px] text-gray-400 font-medium uppercase">
          Atualizado em tempo real • Versão 4.2.0
        </span>
      </div>

      {/* RECONTAGEM MODAL */}
      {recontagemModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 flex flex-col gap-5 font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  🔄
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Realizar Recontagem / Correção</h3>
                  <p className="text-xs text-slate-400">Altere a quantidade ou validade recolhida para sobrescrever no sistema</p>
                </div>
              </div>
              <button
                onClick={() => setRecontagemModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
              ⚠️ <strong className="font-bold">Aviso de Sobrescrita:</strong> Ao salvar, esta recontagem irá substituir o registro anterior do produto <strong>{recontagemModal.codigo}</strong> sem duplicar itens ou somar valores.
            </div>

            <div className="grid grid-cols-1 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  SKU / Produto
                </label>
                <input
                  type="text"
                  disabled
                  value={`[${recontagemModal.codigo}] ${recontagemModal.descricao}`}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Nova Quantidade (Caixas / Itens)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={recontagemModal.quantidade}
                    onChange={(e) => setRecontagemModal({ ...recontagemModal, quantidade: Math.max(1, Number(e.target.value)) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-extrabold text-sm focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Nova Data de Validade
                  </label>
                  <input
                    type="text"
                    placeholder="YYYY-MM-DD ou DD/MM/AAAA"
                    value={recontagemModal.novaValidade}
                    onChange={(e) => setRecontagemModal({ ...recontagemModal, novaValidade: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-extrabold text-sm focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Localização no Armazém
                  </label>
                  <select
                    value={recontagemModal.localizacao}
                    onChange={(e) => setRecontagemModal({ ...recontagemModal, localizacao: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:border-amber-500 focus:outline-hidden"
                  >
                    <option value="central">Estoque Central</option>
                    <option value="picking">Picking de Separação</option>
                    <option value="pnc">Área 6 (PNC - Produtos Não Conformes)</option>
                    <option value="repack">Área Repack</option>
                    <option value="pulmao">Área 5 (Pulmão)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Rua / Bloco
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: A4, B2, A1-03"
                    value={recontagemModal.bloco}
                    onChange={(e) => setRecontagemModal({ ...recontagemModal, bloco: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-bold focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRecontagemModal(null)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveRecontagem}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md flex items-center gap-1.5"
              >
                💾 Salvar Recontagem (Sobrescrever)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SOP BANNER VIEWER */}
      {showSopViewer && (
        <SopBannerViewer
          operation="fefo"
          operationName="FEFO (Validades)"
        />
      )}

      {/* DEDICATED ACTION MODAL (FILTERED EXCLUSIVELY FOR FEFO) */}
      <IndicatorActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        indicatorTitle="Gestão FEFO"
        indicatorSubtitle="Visualizando e gerenciando apenas os planos de ação e contramedidas 5W2H do controle de FEFO e Validades."
        indicatorBadge="FEFO DPO"
        allowedProcessos={['Gestão FEFO', 'FEFO', 'Validades', 'Vencimento', 'Lotes']}
        defaultProcesso="Gestão FEFO"
        defaultIndicador="Aderência FEFO e Risco de Shelf Life"
        defaultMeta="≥ 98%"
        user={user}
      />

      {/* MODAL: IMPORTAR 03.05.19 (VENDA MÉDIA DIÁRIA & DIAS EM ESTOQUE) */}
      <Import030519Modal
        isOpen={showImport030519Modal}
        onClose={() => setShowImport030519Modal(false)}
        companyId={companyId}
        onImportSuccess={() => {
          (empresaData as any)?.refetchValidades?.();
          (empresaData as any)?.refreshAllData?.();
        }}
      />

      {/* MODAL: IMPORTAR JSON (VALIDADES & COLETAS MENSAIS RETROATIVAS) */}
      <ImportJsonModal
        isOpen={showImportJsonModal}
        onClose={() => setShowImportJsonModal(false)}
        companyId={companyId}
        onImportValidades={handleImportValidadesFromModal}
      />

      {/* MODAL: HISTÓRICO DE ADERÊNCIA AO GIRO FEFO (META 89% / 90%) */}
      <FefoAderenciaHistoricoModal
        isOpen={showFefoAderenciaModal}
        onClose={() => setShowFefoAderenciaModal(false)}
        companyId={companyId}
        user={user}
      />

    </div>
  );
}
