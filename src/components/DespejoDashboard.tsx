import React, { useState, useEffect, useMemo } from 'react';
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
  LabelList,
  AreaChart,
  Area
} from 'recharts';
import { 
  Calendar, 
  ChevronDown, 
  Droplet, 
  ArrowDown, 
  Clock, 
  User, 
  ArrowLeft, 
  Search, 
  Filter, 
  Package, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Info, 
  TrendingUp, 
  Zap, 
  Target, 
  Trash2,
  Box,
  AlertTriangle,
  SlidersHorizontal,
  CheckCircle2,
  BarChart2,
  FileSpreadsheet,
  Layers,
  Sparkles,
  HelpCircle,
  Play,
  Pause,
  RotateCcw,
  Plus,
  RefreshCw,
  Award,
  Activity,
  PieChart as PieIcon,
  Tag,
  Download,
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { Usuario, Empresa, DespejoRow } from '../types';
import { DespejoRepository } from '../db';
import { useEmpresaData } from '../context/EmpresaDataContext';
import { useSystemTargets } from '../utils/useSystemTargets';
import { getJsonTable } from '../utils/hybridJsonDatabase';
import { getRetroactiveRecords } from '../utils/dadosRetroativosUtils';
import CalendarFilter from './CalendarFilter';
import { SimuladorAgilidadeMeta } from './SimuladorAgilidadeMeta';
import { RepackMetasParametrosCard } from './RepackMetasParametrosCard';
import { PadraoOperacionalModal } from './PadraoOperacionalModal';
import { IndicatorActionModal } from './IndicatorActionModal';
import A3BoardComponent from './A3BoardComponent';

interface DespejoDashboardProps {
  user: Usuario;
  empresa: Empresa | null;
  onBack?: () => void;
  theme?: 'light' | 'dark';
}

function DespejoHeaderClock() {
  const [currentTime, setCurrentTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('pt-BR') + ' - ' + now.toLocaleDateString('pt-BR'));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xs font-semibold">
      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
      <span className="text-[10px] font-mono text-slate-700 dark:text-slate-300">{currentTime || 'Sincronizando...'}</span>
    </div>
  );
}

const DEFAULT_EMBALAGENS_CONFIG: Record<string, { metaSec: number; label: string }> = {
  'LATA 250': { metaSec: 270, label: 'Lata 250 (Meta: 04:30)' },
  'LATA 269': { metaSec: 270, label: 'Lata 269 (Meta: 04:30)' },
  'LATA 350': { metaSec: 330, label: 'Lata 350 (Meta: 05:30)' },
  'LATA 473': { metaSec: 330, label: 'Lata 473 (Meta: 05:30)' },
  'LONG NECK': { metaSec: 360, label: 'Long Neck (Meta: 06:00)' },
  'PET 1L': { metaSec: 330, label: 'Pet 1L (Meta: 05:30)' },
  'PET 2L': { metaSec: 300, label: 'Pet 2L (Meta: 05:00)' },
  'PET 500ml': { metaSec: 300, label: 'Pet 500ml (Meta: 05:00)' },
  'PET 200ml': { metaSec: 270, label: 'Pet 200ml (Meta: 04:30)' },
  'PET 2,5L': { metaSec: 270, label: 'Pet 2,5L (Meta: 04:30)' },
  'PET 3,3L': { metaSec: 240, label: 'Pet 3,3L (Meta: 04:00)' },
  '600 OW': { metaSec: 300, label: '600 OW (Meta: 05:00)' },
  '300 OW': { metaSec: 240, label: '300 OW (Meta: 04:00)' },
  'GARRAFA 600ml': { metaSec: 255, label: 'Garrafa 600ml (Meta: 04:15)' },
  'GARRAFA 1L': { metaSec: 285, label: 'Garrafa 1L (Meta: 04:45)' }
};

const DEFAULT_OPERADORES = [
  'Carlos Silva',
  'Fernanda Lima',
  'Roberto Souza',
  'Aline Mendes',
  'Marcos Oliveira',
  'Juliana Costa',
  'Paulo Santos',
  'Gilson Ferreira',
  'Matheus Barbosa',
  'Ronildo Paiva'
];

const EMBALAGENS_VOLUME_MAP: Record<string, number> = {
  'LATA 250': 6.0,
  'LATA 269': 6.456,
  'LATA 350': 8.4,
  'LATA 473': 11.352,
  'LONG NECK': 8.52,
  'PET 1L': 12.0,
  'PET 2L': 12.0,
  'PET 500ml': 6.0,
  'PET 200ml': 4.8,
  'PET 2,5L': 15.0,
  'PET 3,3L': 19.8,
  '600 OW': 7.2,
  '300 OW': 7.2,
  'GARRAFA 600ml': 7.2,
  'GARRAFA 1L': 12.0
};

const generateSeedDespejoRows = (empresaId: string): DespejoRow[] => {
  const list: DespejoRow[] = [];
  const operators = ['Carlos Silva', 'Fernanda Lima', 'Roberto Souza', 'Aline Mendes', 'Marcos Oliveira', 'Gilson Ferreira'];
  const packages = [
    { emb: 'LATA 350', cod: 1042, desc: 'CERVEJA LATA 350ML', factor: 8.4 },
    { emb: 'LATA 473', cod: 1058, desc: 'CERVEJA LATA 473ML', factor: 11.352 },
    { emb: 'LONG NECK', cod: 2011, desc: 'CERVEJA LONG NECK 355ML', factor: 8.52 },
    { emb: 'PET 2L', cod: 3004, desc: 'REFRIGERANTE GUARANÁ 2L', factor: 12.0 },
    { emb: 'GARRAFA 600ml', cod: 1010, desc: 'CERVEJA GARRAFA 600ML', factor: 7.2 },
    { emb: 'LATA 269', cod: 1088, desc: 'CERVEJA LATA 269ML', factor: 6.456 }
  ];

  for (let i = 14; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateISO = d.toISOString().split('T')[0];
    const dataBr = d.toLocaleDateString('pt-BR');
    const mes = d.toLocaleString('pt-BR', { month: 'long' }).toUpperCase();

    const count = i === 0 ? 2 : Math.floor(Math.random() * 2) + 2;
    for (let j = 0; j < count; j++) {
      const op = operators[(i + j) % operators.length];
      const prod = packages[(i * 2 + j) % packages.length];
      const qty = Math.floor(Math.random() * 12) + 8; // 8 to 19 units
      const config = DEFAULT_EMBALAGENS_CONFIG[prod.emb] || { metaSec: 270, label: prod.emb };
      const expectedSec = config.metaSec * qty;
      const isWithin = Math.random() > 0.22;
      const actualSec = isWithin
        ? Math.round(expectedSec * (0.78 + Math.random() * 0.20))
        : Math.round(expectedSec * (1.05 + Math.random() * 0.25));

      const hl = Math.round(((prod.factor * qty) / 100) * 10000) / 10000;
      const startH = 8 + j * 3;
      const startM = Math.floor(Math.random() * 50);
      const startStr = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
      const endD = new Date(d.getTime() + actualSec * 1000);
      const endStr = `${String(endD.getHours()).padStart(2, '0')}:${String(endD.getMinutes()).padStart(2, '0')}`;

      const secToStr = (tot: number) => {
        const h = Math.floor(tot / 3600);
        const m = Math.floor((tot % 3600) / 60);
        const s = tot % 60;
        return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
      };

      list.push({
        id: `seed-despejo-${i}-${j}-${Date.now()}`,
        empresaId,
        data: dataBr,
        dataISO: dateISO,
        mes,
        codProduto: prod.cod,
        codigoProduto: String(prod.cod),
        descricao: prod.desc,
        operador: op,
        embalagem: prod.emb,
        quantidade: qty,
        hlPerdido: hl,
        hectolitroPerdido: hl,
        meta: config.label,
        inicio: startStr,
        fim: endStr,
        duracao: secToStr(actualSec),
        tempo: secToStr(actualSec),
        resultado: isWithin ? '🟢 META BATIDA' : '🔴 ACIMA DA META',
        motivo: !isWithin ? (j % 2 === 0 ? 'Canaleta de descarte com fluxo reduzido' : 'Garra manual com ajuste de pressão') : undefined,
        _criadoEm: d.toISOString()
      });
    }
  }
  return list;
};

export default function DespejoDashboard({ user, empresa, onBack }: DespejoDashboardProps) {
  const { targets, updateTarget } = useSystemTargets();
  const metaProdutividadeCxH = targets.despejo_produtividade ?? 10;

  const [activeSubTab, setActiveSubTab] = useState<'produtividade' | 'skus' | 'boarda3'>('produtividade');
  const [despejoRows, setDespejoRows] = useState<DespejoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const empresaData = useEmpresaData();

  // Packaging Configs from localStorage with fallback
  const [embalagensConfig, setEmbalagensConfig] = useState<Record<string, { metaSec: number; label: string }>>(() => {
    const saved = localStorage.getItem(`despejo_embalagens_config_${empresa?.id || 'demo'}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return DEFAULT_EMBALAGENS_CONFIG;
  });

  const handleUpdateEmbalagemMeta = (key: string, newSec: number) => {
    setEmbalagensConfig(prev => {
      const current = prev[key] || { label: key, metaSec: 270 };
      const m = Math.floor(newSec / 60);
      const s = newSec % 60;
      const timeStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      const baseLabel = current.label.split('(')[0].trim();
      const updated = {
        ...prev,
        [key]: {
          metaSec: newSec,
          label: `${baseLabel} (Meta: ${timeStr})`
        }
      };
      localStorage.setItem(`despejo_embalagens_config_${empresa?.id || 'demo'}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleResetEmbalagens = () => {
    setEmbalagensConfig(DEFAULT_EMBALAGENS_CONFIG);
    localStorage.setItem(`despejo_embalagens_config_${empresa?.id || 'demo'}`, JSON.stringify(DEFAULT_EMBALAGENS_CONFIG));
  };

  // Modals
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isPopModalOpen, setIsPopModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Filter UI states
  const [filterColaborador, setFilterColaborador] = useState('todos');
  const [filterEmbalagem, setFilterEmbalagem] = useState('todos');
  const [filterMes, setFilterMes] = useState('todos');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterMeta, setFilterMeta] = useState<'todos' | 'dentro' | 'fora'>('todos');

  // Applied Filter states
  const [activeColaborador, setActiveColaborador] = useState('todos');
  const [activeEmbalagem, setActiveEmbalagem] = useState('todos');
  const [activeMes, setActiveMes] = useState('todos');
  const [activeStartDate, setActiveStartDate] = useState('');
  const [activeEndDate, setActiveEndDate] = useState('');
  const [activeMeta, setActiveMeta] = useState<'todos' | 'dentro' | 'fora'>('todos');

  // Pagination & Search
  const [tableSearch, setTableSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const itemsPerPage = 10;

  // New Record Form State
  const [newOperador, setNewOperador] = useState(user?.nome || DEFAULT_OPERADORES[0]);
  const [newEmbalagem, setNewEmbalagem] = useState('LATA 350');
  const [newQuantidade, setNewQuantidade] = useState<number>(1);
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [newMotivoFalha, setNewMotivoFalha] = useState('');

  // Stopwatch Timer
  useEffect(() => {
    let interval: any = null;
    if (isStopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchSeconds(sec => sec + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isStopwatchRunning]);

  // Comprehensive Data Loader (Context + JSON Table + Retroactive + LocalStorage + Seed)
  const reloadData = React.useCallback(async () => {
    const companyId = empresa?.id || 'demo';
    setLoading(true);
    try {
      // 1. From context if available
      let rows: DespejoRow[] = [...(empresaData.despejo || [])];

      // 2. Fallback to hybrid JSON table
      if (rows.length === 0) {
        const jsonTableRows = await getJsonTable<DespejoRow>(companyId, 'despejo');
        if (jsonTableRows && jsonTableRows.length > 0) {
          rows = jsonTableRows;
        }
      }

      // 3. Fallback to repository / local storage
      if (rows.length === 0) {
        const saved = localStorage.getItem(`despejo_rows_${companyId}`);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              rows = parsed;
            }
          } catch (e) {}
        }
      }

      // 4. Seed fallback if empty
      if (rows.length === 0) {
        rows = generateSeedDespejoRows(companyId);
      }

      rows.sort((a, b) => (b.dataISO || '').localeCompare(a.dataISO || '') || (b.inicio || '').localeCompare(a.inicio || ''));
      setDespejoRows(rows);
      localStorage.setItem(`despejo_rows_${companyId}`, JSON.stringify(rows));
    } catch (err) {
      console.error('Erro ao carregar dados de despejo:', err);
    } finally {
      setLoading(false);
    }
  }, [empresa?.id, empresaData.despejo]);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  // Live Listeners for DB and Import Events
  useEffect(() => {
    const handleDbUpdated = () => {
      reloadData();
    };

    window.addEventListener('despejo-db-updated', handleDbUpdated);
    window.addEventListener('despejo-updated', handleDbUpdated);
    window.addEventListener('retroactive-data-updated', handleDbUpdated);
    window.addEventListener('empresa-data-reload', handleDbUpdated);
    window.addEventListener('storage', handleDbUpdated);

    return () => {
      window.removeEventListener('despejo-db-updated', handleDbUpdated);
      window.removeEventListener('despejo-updated', handleDbUpdated);
      window.removeEventListener('retroactive-data-updated', handleDbUpdated);
      window.removeEventListener('empresa-data-reload', handleDbUpdated);
      window.removeEventListener('storage', handleDbUpdated);
    };
  }, [reloadData]);

  // Helpers
  const pad2 = (num: number) => String(num).padStart(2, '0');

  const getRowDurationSec = (r?: Partial<DespejoRow> | null): number => {
    if (!r) return 0;

    // 1. Prioridade: Se 'tempo' for string formatada com ':' (ex: "00:03:15" ou "03:15")
    if (r.tempo && typeof r.tempo === 'string' && r.tempo.includes(':')) {
      const parts = r.tempo.trim().split(':').map(p => parseFloat(p) || 0);
      if (parts.length === 3) return Math.round(parts[0] * 3600 + parts[1] * 60 + parts[2]);
      if (parts.length === 2) return Math.round(parts[0] * 60 + parts[1]);
    }

    // 2. Se 'duracao' for string formatada com ':' (ex: "00:03:15" ou "03:15")
    if (r.duracao && typeof r.duracao === 'string' && r.duracao.includes(':')) {
      const parts = r.duracao.trim().split(':').map(p => parseFloat(p) || 0);
      if (parts.length === 3) return Math.round(parts[0] * 3600 + parts[1] * 60 + parts[2]);
      if (parts.length === 2) return Math.round(parts[0] * 60 + parts[1]);
    }

    // 3. Se 'inicio' e 'fim' estiverem preenchidos com horários válidos
    if (r.inicio && r.fim && typeof r.inicio === 'string' && typeof r.fim === 'string' && r.inicio.includes(':') && r.fim.includes(':')) {
      const parseClock = (t: string) => {
        const parts = t.trim().split(':').map(p => parseFloat(p) || 0);
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 3600 + parts[1] * 60;
        return 0;
      };
      const s = parseClock(r.inicio);
      const e = parseClock(r.fim);
      let diff = e - s;
      if (diff < 0) diff += 86400;
      if (diff > 0 && diff < 86400) return Math.round(diff);
    }

    // 4. Se 'duracao' for número
    if (typeof r.duracao === 'number' && !isNaN(r.duracao) && r.duracao > 0) {
      if (r.duracao < 1) return Math.round(r.duracao * 86400); // Fração serial do dia (Excel)
      if (r.duracao <= 300) return Math.round(r.duracao * 60); // Minutos -> Segundos (ex: 3.25m = 195s)
      return Math.round(r.duracao); // Segundos diretos
    }

    // 5. Se 'tempo' for número
    if (typeof r.tempo === 'number' && !isNaN(r.tempo) && r.tempo > 0) {
      if (r.tempo < 1) return Math.round(r.tempo * 86400);
      if (r.tempo <= 300) return Math.round(r.tempo * 60);
      return Math.round(r.tempo);
    }

    return 0;
  };

  const toSec = (hms: string | number | undefined | null): number => {
    if (hms === undefined || hms === null || hms === '') return 0;
    if (typeof hms === 'number') {
      if (isNaN(hms) || hms <= 0) return 0;
      if (hms < 1) return Math.round(hms * 86400);
      if (hms <= 300) return Math.round(hms * 60);
      return Math.round(hms);
    }
    const str = String(hms).trim();
    if (str.includes(':')) {
      const parts = str.split(':').map(p => parseFloat(p) || 0);
      if (parts.length === 3) return Math.round(parts[0] * 3600 + parts[1] * 60 + parts[2]);
      if (parts.length === 2) return Math.round(parts[0] * 60 + parts[1]);
    }
    const num = parseFloat(str.replace(',', '.'));
    if (!isNaN(num) && num > 0) {
      if (num < 1) return Math.round(num * 86400);
      if (num <= 300) return Math.round(num * 60);
      return Math.round(num);
    }
    return 0;
  };

  const toHMS = (sec: number) => {
    sec = Math.max(0, Math.floor(sec));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return [h, m, s].map(pad2).join(':');
  };

  // Distinct Lists for Selects
  const distinctOperadores = useMemo(() => {
    const ops = new Set<string>();
    despejoRows.forEach(r => {
      if (r.operador) {
        const cleanName = r.operador.split('(')[0].trim();
        if (cleanName) ops.add(cleanName);
      }
    });
    DEFAULT_OPERADORES.forEach(op => ops.add(op));
    return Array.from(ops).sort();
  }, [despejoRows]);

  const distinctMeses = useMemo(() => {
    const meses = new Set<string>();
    despejoRows.forEach(r => {
      if (r.mes && typeof r.mes === 'string') {
        meses.add(r.mes.trim());
      }
    });
    return Array.from(meses).sort();
  }, [despejoRows]);

  const embalagensList = useMemo(() => {
    return Object.keys(embalagensConfig);
  }, [embalagensConfig]);

  // Apply & Clear Filters
  const handleApplyFilters = () => {
    setActiveColaborador(filterColaborador);
    setActiveEmbalagem(filterEmbalagem);
    setActiveMes(filterMes);
    setActiveStartDate(filterStartDate);
    setActiveEndDate(filterEndDate);
    setActiveMeta(filterMeta);
    setCurrentPage(1);
    setSelectedRowId(null);
  };

  const handleClearFilters = () => {
    setFilterColaborador('todos');
    setFilterEmbalagem('todos');
    setFilterMes('todos');
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterMeta('todos');

    setActiveColaborador('todos');
    setActiveEmbalagem('todos');
    setActiveMes('todos');
    setActiveStartDate('');
    setActiveEndDate('');
    setActiveMeta('todos');
    setCurrentPage(1);
    setSelectedRowId(null);
  };

  // Filtered rows
  const filteredRows = useMemo(() => {
    return despejoRows.filter(row => {
      // 1. Colaborador
      if (activeColaborador !== 'todos') {
        const rowOpClean = (row.operador || '').toUpperCase();
        const filterOpClean = activeColaborador.toUpperCase();
        if (!rowOpClean.includes(filterOpClean)) return false;
      }

      // 2. Embalagem
      if (activeEmbalagem !== 'todos' && row.embalagem !== activeEmbalagem) return false;

      // 3. Mês
      if (activeMes !== 'todos') {
        const rowMes = (row.mes || '').trim().toUpperCase();
        const filterMesClean = activeMes.trim().toUpperCase();
        if (rowMes !== filterMesClean) return false;
      }

      // 4. Date range
      const rowDate = (row.data ? row.data.split('/').reverse().map(p => p.padStart(2, '0')).join('-') : '') || row.dataISO || '';
      if (activeStartDate && rowDate && rowDate < activeStartDate) return false;
      if (activeEndDate && rowDate && rowDate > activeEndDate) return false;

      // 5. Meta status
      if (activeMeta !== 'todos') {
        const config = embalagensConfig[row.embalagem] || { metaSec: 270 };
        const totalExpectedSec = config.metaSec * (Number(row.quantidade) || 1);
        const actualSec = getRowDurationSec(row);
        const isWithin = actualSec <= totalExpectedSec;

        if (activeMeta === 'dentro' && !isWithin) return false;
        if (activeMeta === 'fora' && isWithin) return false;
      }

      return true;
    });
  }, [despejoRows, activeColaborador, activeEmbalagem, activeMes, activeStartDate, activeEndDate, activeMeta, embalagensConfig]);

  // Working days info for simulation
  const workingDaysInfo = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const lastDay = new Date(year, month + 1, 0);
    const totalDaysInMonth = lastDay.getDate();
    
    let totalWorkingDays = 0;
    let elapsedWorkingDays = 0;
    
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const date = new Date(year, month, d);
      const dayOfWeek = date.getDay();
      const isWorkingDay = dayOfWeek !== 0 && dayOfWeek !== 6;
      
      if (isWorkingDay) {
        totalWorkingDays++;
        if (d <= now.getDate()) {
          elapsedWorkingDays++;
        }
      }
    }
    
    elapsedWorkingDays = Math.max(1, elapsedWorkingDays);
    const remainingWorkingDays = Math.max(0, totalWorkingDays - elapsedWorkingDays);
    
    return {
      totalWorkingDays,
      elapsedWorkingDays,
      remainingWorkingDays,
      monthName: now.toLocaleString('pt-BR', { month: 'long' }),
      year
    };
  }, []);

  // Core KPI Calculations
  const totalSkus = useMemo(() => {
    return filteredRows.reduce((sum, r) => sum + (Number(r.quantidade) || 0), 0);
  }, [filteredRows]);

  const totalTempoGastoSec = useMemo(() => {
    return filteredRows.reduce((sum, r) => sum + getRowDurationSec(r), 0);
  }, [filteredRows]);

  // Tempo Médio por Registro de Operação (Média dos registros)
  const tempoMedioPorRegistroSec = useMemo(() => {
    return filteredRows.length > 0 ? Math.round(totalTempoGastoSec / filteredRows.length) : 0;
  }, [totalTempoGastoSec, filteredRows]);

  const tempoMedioPorRegistroStr = useMemo(() => toHMS(tempoMedioPorRegistroSec), [tempoMedioPorRegistroSec]);

  // Produtividade por Registros por Hora (reg/h)
  const produtividadeRegistrosHora = useMemo(() => {
    if (totalTempoGastoSec === 0) return 0;
    return Math.round((filteredRows.length / (totalTempoGastoSec / 3600)) * 10) / 10;
  }, [filteredRows.length, totalTempoGastoSec]);

  // Volume in Hectoliters (HL)
  const EMBALAGENS_VOLUME: Record<string, number> = useMemo(() => ({
    'LATA 250': 6.0,
    'LATA 269': 6.456,
    'LATA 350': 8.4,
    'LATA 473': 11.352,
    'LONG NECK': 8.52,
    'PET 1L': 12.0,
    'PET 2L': 12.0,
    'PET 500ml': 6.0,
    'PET 200ml': 4.8,
    'PET 2,5L': 15.0,
    'PET 3,3L': 19.8,
    '600 OW': 7.2,
    '300 OW': 7.2,
    'GARRAFA 600ml': 7.2,
    'GARRAFA 1L': 12.0
  }), []);

  const totalHE = useMemo(() => {
    const totalLiters = filteredRows.reduce((sum, r) => {
      if (r.hlPerdido !== undefined && r.hlPerdido !== null && !isNaN(Number(r.hlPerdido))) {
        return sum + (Number(r.hlPerdido) * 100);
      }
      if (r.hectolitroPerdido !== undefined && r.hectolitroPerdido !== null && !isNaN(Number(r.hectolitroPerdido))) {
        return sum + (Number(r.hectolitroPerdido) * 100);
      }
      const factor = EMBALAGENS_VOLUME[r.embalagem] || 8.4;
      return sum + (factor * (Number(r.quantidade) || 0));
    }, 0);
    return Math.round((totalLiters / 100) * 100) / 100;
  }, [filteredRows, EMBALAGENS_VOLUME]);

  const totalTempoEsperadoSec = useMemo(() => {
    return filteredRows.reduce((sum, r) => {
      const config = embalagensConfig[r.embalagem] || { metaSec: 270 };
      return sum + (config.metaSec * (Number(r.quantidade) || 1));
    }, 0);
  }, [filteredRows, embalagensConfig]);

  // Meta esperada média por registro
  const tempoEsperadoMedioStr = useMemo(() => {
    return filteredRows.length > 0 ? toHMS(Math.round(totalTempoEsperadoSec / filteredRows.length)) : '00:00:00';
  }, [totalTempoEsperadoSec, filteredRows]);

  const eficienciaGeral = useMemo(() => {
    if (totalTempoGastoSec === 0) return 0;
    return Math.round((totalTempoEsperadoSec / totalTempoGastoSec) * 100);
  }, [totalTempoEsperadoSec, totalTempoGastoSec]);

  // Taxa de Conformidade DPO (% Meta Batida)
  const conformidadeMetaPct = useMemo(() => {
    if (filteredRows.length === 0) return 0;
    const dentro = filteredRows.filter(r => {
      const config = embalagensConfig[r.embalagem] || { metaSec: 270 };
      const expectedSec = config.metaSec * (Number(r.quantidade) || 1);
      const actualSec = getRowDurationSec(r);
      return actualSec <= expectedSec;
    }).length;
    return Math.round((dentro / filteredRows.length) * 100);
  }, [filteredRows, embalagensConfig]);

  // Top 5 Produtos / SKUs mais despejados por Registros
  const topProdutosDespejados = useMemo(() => {
    const map = new Map<string, { cod: string; desc: string; emb: string; registros: number; caixas: number; hl: number }>();
    filteredRows.forEach(r => {
      const cod = String(r.codProduto || r.codigoProduto || '—');
      const desc = r.descricao || r.embalagem || 'Produto Não Especificado';
      const key = `${cod}_${desc}`;
      const prev = map.get(key) || { cod, desc, emb: r.embalagem, registros: 0, caixas: 0, hl: 0 };
      const cx = Number(r.quantidade) || 0;
      const factor = EMBALAGENS_VOLUME[r.embalagem] || 8.4;
      const hl = r.hlPerdido || r.hectolitroPerdido || (factor * cx / 100);
      map.set(key, {
        cod,
        desc,
        emb: r.embalagem,
        registros: prev.registros + 1,
        caixas: prev.caixas + cx,
        hl: prev.hl + Number(hl)
      });
    });
    return Array.from(map.values()).sort((a, b) => b.registros - a.registros).slice(0, 6);
  }, [filteredRows, EMBALAGENS_VOLUME]);

  // Performance por Operador (Base: Registros)
  const performanceOperadores = useMemo(() => {
    const map = new Map<string, { nome: string; totalRegistros: number; totalCx: number; totalSec: number; dentroMeta: number; totalOps: number }>();
    filteredRows.forEach(r => {
      const nome = (r.operador || 'Não Identificado').split('(')[0].trim();
      const prev = map.get(nome) || { nome, totalRegistros: 0, totalCx: 0, totalSec: 0, dentroMeta: 0, totalOps: 0 };
      const cx = Number(r.quantidade) || 0;
      const sec = getRowDurationSec(r);
      const config = embalagensConfig[r.embalagem] || { metaSec: 270 };
      const expected = config.metaSec * (cx || 1);
      map.set(nome, {
        nome,
        totalRegistros: prev.totalRegistros + 1,
        totalCx: prev.totalCx + cx,
        totalSec: prev.totalSec + sec,
        dentroMeta: prev.dentroMeta + (sec <= expected ? 1 : 0),
        totalOps: prev.totalOps + 1
      });
    });
    return Array.from(map.values())
      .map(op => {
        const horas = op.totalSec / 3600;
        return {
          ...op,
          regHora: horas > 0 ? Math.round((op.totalRegistros / horas) * 10) / 10 : 0,
          cxHora: horas > 0 ? Math.round((op.totalRegistros / horas) * 10) / 10 : 0,
          pctMeta: op.totalOps > 0 ? Math.round((op.dentroMeta / op.totalOps) * 100) : 0
        };
      })
      .sort((a, b) => b.totalRegistros - a.totalRegistros);
  }, [filteredRows, embalagensConfig]);

  // Chart 1: Daily Productivity vs Meta (Base: Registros/Hora)
  const chartProdutividadeDia = useMemo(() => {
    const dayMap = new Map<string, { totalReg: number; totalSec: number }>();
    filteredRows.forEach(r => {
      const d = r.data || (r.dataISO ? r.dataISO.split('-').reverse().join('/') : 'Hoje');
      const prev = dayMap.get(d) || { totalReg: 0, totalSec: 0 };
      dayMap.set(d, {
        totalReg: prev.totalReg + 1,
        totalSec: prev.totalSec + getRowDurationSec(r)
      });
    });

    const list = Array.from(dayMap.entries()).map(([dia, data]) => {
      const horas = data.totalSec / 3600;
      const realRegH = horas > 0 ? Math.round((data.totalReg / horas) * 10) / 10 : 0;
      return {
        dia,
        realCxH: realRegH,
        realRegH,
        metaCxH: metaProdutividadeCxH,
        metaRegH: metaProdutividadeCxH
      };
    });

    return list.slice(-14);
  }, [filteredRows, metaProdutividadeCxH]);

  // Chart 2: Packaging Distribution (Base: Registros)
  const chartDistribuicaoEmbalagem = useMemo(() => {
    const map = new Map<string, number>();
    filteredRows.forEach(r => {
      const emb = r.embalagem || 'Outros';
      map.set(emb, (map.get(emb) || 0) + 1);
    });
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#64748b'];
    return Array.from(map.entries()).map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length]
    }));
  }, [filteredRows]);

  // Chart 3: Volume por Mês (Registros e HL)
  const chartVolumeMensal = useMemo(() => {
    const map = new Map<string, { mes: string; registros: number; caixas: number; hl: number }>();
    filteredRows.forEach(r => {
      const m = r.mes || (r.dataISO ? r.dataISO.slice(0, 7) : 'Geral');
      const prev = map.get(m) || { mes: m, registros: 0, caixas: 0, hl: 0 };
      const cx = Number(r.quantidade) || 0;
      const factor = EMBALAGENS_VOLUME[r.embalagem] || 8.4;
      const hl = r.hlPerdido || r.hectolitroPerdido || (factor * cx / 100);
      map.set(m, {
        mes: m,
        registros: prev.registros + 1,
        caixas: prev.caixas + cx,
        hl: Math.round((prev.hl + Number(hl)) * 100) / 100
      });
    });
    return Array.from(map.values());
  }, [filteredRows, EMBALAGENS_VOLUME]);

  // Chart 4: Evolução Temporal Contínua (Registros e HL)
  const chartVolumeEvolucao = useMemo(() => {
    const dayMap = new Map<string, { dia: string; registros: number; un: number; hl: number }>();
    filteredRows.forEach(r => {
      const d = r.data || (r.dataISO ? r.dataISO.split('-').reverse().join('/') : 'Hoje');
      const prev = dayMap.get(d) || { dia: d, registros: 0, un: 0, hl: 0 };
      const un = Number(r.quantidade) || 0;
      const factor = EMBALAGENS_VOLUME[r.embalagem] || 8.4;
      const hl = r.hlPerdido || r.hectolitroPerdido || (factor * un / 100);
      dayMap.set(d, {
        dia: d,
        registros: prev.registros + 1,
        un: prev.un + un,
        hl: Math.round((prev.hl + Number(hl)) * 100) / 100
      });
    });
    return Array.from(dayMap.values()).slice(-14);
  }, [filteredRows, EMBALAGENS_VOLUME]);

  // Paginated Rows
  const searchedRows = useMemo(() => {
    if (!tableSearch.trim()) return filteredRows;
    const q = tableSearch.toLowerCase();
    return filteredRows.filter(r => 
      (r.operador || '').toLowerCase().includes(q) ||
      (r.embalagem || '').toLowerCase().includes(q) ||
      (r.data || '').toLowerCase().includes(q) ||
      (r.mes || '').toLowerCase().includes(q) ||
      (r.descricao || '').toLowerCase().includes(q) ||
      String(r.codProduto || r.codigoProduto || '').toLowerCase().includes(q) ||
      (r.motivo || '').toLowerCase().includes(q)
    );
  }, [filteredRows, tableSearch]);

  const totalPages = Math.max(1, Math.ceil(searchedRows.length / itemsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return searchedRows.slice(start, start + itemsPerPage);
  }, [searchedRows, currentPage, itemsPerPage]);

  // Selected Row Object
  const selectedRowObj = useMemo(() => {
    if (!selectedRowId) return null;
    return despejoRows.find(r => (r as any)._docId === selectedRowId || r.id === selectedRowId) || null;
  }, [selectedRowId, despejoRows]);

  // Delete Row Handler
  const handleDeleteRow = async (rowId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este registro de Despejo?')) return;
    try {
      const companyId = empresa?.id || 'demo';
      await DespejoRepository.delete(rowId, companyId);
      const updated = despejoRows.filter(r => (r as any)._docId !== rowId && r.id !== rowId);
      setDespejoRows(updated);
      localStorage.setItem(`despejo_rows_${companyId}`, JSON.stringify(updated));
      setSelectedRowId(null);
    } catch (e) {
      console.error(e);
      alert('Erro ao excluir registro.');
    }
  };

  // Submit New Production Record
  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const config = embalagensConfig[newEmbalagem] || { metaSec: 270 };
    const expectedSec = config.metaSec * newQuantidade;
    const duracaoHMS = toHMS(stopwatchSeconds > 0 ? stopwatchSeconds : expectedSec);
    const duracaoSec = stopwatchSeconds > 0 ? stopwatchSeconds : expectedSec;
    const isWithin = duracaoSec <= expectedSec;

    if (!isWithin && !newMotivoFalha.trim()) {
      alert('O tempo de despejo excedeu a meta calculada. Por favor, especifique a justificativa operacional / motivo da falha.');
      return;
    }

    const now = new Date();
    const factor = EMBALAGENS_VOLUME[newEmbalagem] || 8.4;
    const hlCalc = Math.round(((factor * newQuantidade) / 100) * 10000) / 10000;

    const newRecord: Partial<DespejoRow> = {
      empresaId: empresa?.id || 'demo',
      data: now.toLocaleDateString('pt-BR'),
      dataISO: now.toISOString().split('T')[0],
      mes: now.toLocaleString('pt-BR', { month: 'long' }).toUpperCase(),
      operador: newOperador,
      embalagem: newEmbalagem,
      quantidade: newQuantidade,
      hlPerdido: hlCalc,
      hectolitroPerdido: hlCalc,
      tempo: duracaoHMS,
      duracao: duracaoHMS,
      inicio: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      fim: new Date(now.getTime() + duracaoSec * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      resultado: isWithin ? '🟢 META BATIDA' : '🔴 ACIMA DA META',
      motivo: !isWithin ? newMotivoFalha : undefined,
      _criadoEm: now.toISOString()
    };

    try {
      const companyId = empresa?.id || 'demo';
      const added = await DespejoRepository.create(newRecord as any, companyId);
      const updated = [{ id: added._docId || added.id || `despejo-${Date.now()}`, ...newRecord } as DespejoRow, ...despejoRows];
      setDespejoRows(updated);
      localStorage.setItem(`despejo_rows_${companyId}`, JSON.stringify(updated));

      setIsRegisterModalOpen(false);
      setStopwatchSeconds(0);
      setIsStopwatchRunning(false);
      setNewMotivoFalha('');
      alert('Registro de Despejo adicionado com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar registro de Despejo.');
    }
  };

  // Export to Excel
  const handleExportXLSX = () => {
    const data = filteredRows.map(r => {
      const factor = EMBALAGENS_VOLUME[r.embalagem] || 8.4;
      const hlVal = r.hlPerdido || r.hectolitroPerdido || ((factor * (Number(r.quantidade) || 0)) / 100);
      return {
        'Data': r.data || r.dataISO || '—',
        'Mês': r.mes || '—',
        'Cód. Produto': r.codProduto || r.codigoProduto || '—',
        'Descrição': r.descricao || '—',
        'Colaborador / Operador': r.operador || '—',
        'Embalagem': r.embalagem,
        'Quantidade (UN)': r.quantidade,
        'Hectolitro Perdido (HL)': typeof hlVal === 'number' ? Number(hlVal.toFixed(4)) : hlVal,
        'Hora Inicial': r.inicio || '—',
        'Hora Final': r.fim || '—',
        'Duração / Tempo': r.duracao || r.tempo,
        'Resultado / Meta': r.resultado || (toSec(r.duracao || r.tempo || 0) <= (embalagensConfig[r.embalagem]?.metaSec || 270) * (Number(r.quantidade) || 1) ? '🟢 META BATIDA' : '🔴 ACIMA DA META'),
        'Justificativa / Motivo': r.motivo || '—'
      };
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Despejo');
    XLSX.writeFile(wb, `Produtividade_Despejo_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export to PDF
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const nowStr = new Date().toLocaleDateString('pt-BR');

      doc.setFillColor(30, 58, 138); // Dark Navy Blue
      doc.rect(0, 0, pageWidth, 28, 'F');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('RELATÓRIO GERENCIAL DE DESPEJO & DESCARTE', 14, 13);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Empresa: ${empresa?.nome || 'Unidade Fabril'} | Data: ${nowStr} | Registros: ${filteredRows.length}`, 14, 21);

      // KPI Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 34, pageWidth - 28, 26, 3, 3, 'FD');

      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total de Registros: ${filteredRows.length.toLocaleString('pt-BR')} ops`, 20, 44);
      doc.text(`Volume Total: ${totalSkus.toLocaleString('pt-BR')} UN (${totalHE.toFixed(2)} HL)`, 80, 44);
      doc.text(`Produtividade: ${produtividadeRegistrosHora.toFixed(1)} reg/h`, 145, 44);

      doc.setFont('helvetica', 'normal');
      doc.text(`Tempo Total Gasto: ${toHMS(totalTempoGastoSec)}`, 20, 53);
      doc.text(`Conformidade DPO: ${conformidadeMetaPct}%`, 80, 53);
      doc.text(`Meta DPO: ${metaProdutividadeCxH} reg/h`, 145, 53);

      // Table Header
      let y = 68;
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, pageWidth - 28, 7, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);

      doc.text('Data', 16, y + 5);
      doc.text('Operador', 38, y + 5);
      doc.text('Embalagem', 75, y + 5);
      doc.text('UN', 112, y + 5);
      doc.text('HL', 126, y + 5);
      doc.text('Tempo', 142, y + 5);
      doc.text('Status', 164, y + 5);

      y += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      filteredRows.slice(0, 30).forEach((r) => {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        const factor = EMBALAGENS_VOLUME[r.embalagem] || 8.4;
        const hl = r.hlPerdido || r.hectolitroPerdido || (factor * (Number(r.quantidade) || 0) / 100);
        const actualSec = getRowDurationSec(r);
        const within = r.resultado?.includes('META BATIDA') || actualSec <= (embalagensConfig[r.embalagem]?.metaSec || 270) * (Number(r.quantidade) || 1);

        doc.setTextColor(71, 85, 105);
        doc.text(String(r.data || r.dataISO || '—').slice(0, 10), 16, y);
        doc.text(String(r.operador || '—').slice(0, 18), 38, y);
        doc.text(String(r.embalagem || '—').slice(0, 16), 75, y);
        doc.text(String(r.quantidade || 0), 112, y);
        doc.text(Number(hl).toFixed(2), 126, y);
        doc.text(toHMS(actualSec), 142, y);

        if (within) {
          doc.setTextColor(16, 185, 129);
          doc.text('OK DPO', 164, y);
        } else {
          doc.setTextColor(239, 68, 68);
          doc.text('ACIMA', 164, y);
        }
        y += 6;
      });

      doc.save(`Relatorio_Despejo_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Erro ao gerar relatório PDF.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900 dark:text-slate-100">
      
      {/* HEADER WITH CONTROLS */}
      <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 pb-4 border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-xl transition-colors text-gray-500 dark:text-slate-400"
              title="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-lg shadow-md shadow-blue-500/20">
            <Droplet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-xl tracking-tight text-[#032b5e] dark:text-blue-400 uppercase">
                PRODUTIVIDADE DO DESPEJO
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                PADRÃO DPO
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 font-semibold tracking-wide uppercase mt-0.5">
              INDICADORES ESTRATÉGICOS, METAS DE DESEMPENHO E CRONOMETRAGEM DE DESPEJO
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <DespejoHeaderClock />

          <button
            onClick={() => reloadData()}
            disabled={loading}
            className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xs transition-colors"
            title="Recarregar dados"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={() => setIsPopModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs rounded-xl shadow-sm uppercase tracking-wider flex items-center gap-1.5 transition-all"
          >
            📋 Padrão Operacional (POP)
          </button>

          {/* DEDICATED ACTION BUTTON FILTERING DESPEJO */}
          <button
            onClick={() => setIsActionModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-sm uppercase tracking-wider flex items-center gap-1.5 transition-all border border-blue-400/30"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>Plano de Ações (Despejo)</span>
          </button>

          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-sm uppercase tracking-wider flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Novo Despejo</span>
          </button>

          <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700">
            <button 
              onClick={() => setActiveSubTab('produtividade')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                activeSubTab === 'produtividade' 
                  ? 'bg-[#032b5e] dark:bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-600 dark:text-slate-400 hover:text-[#032b5e]'
              }`}
            >
              Produtividade & BI
            </button>
            <button 
              onClick={() => setActiveSubTab('skus')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activeSubTab === 'skus' 
                  ? 'bg-[#032b5e] dark:bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-600 dark:text-slate-400 hover:text-[#032b5e]'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Unidades & Hectolitros (HL)</span>
            </button>
            <button 
              onClick={() => setActiveSubTab('boarda3')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                activeSubTab === 'boarda3' 
                  ? 'bg-[#032b5e] dark:bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-600 dark:text-slate-400 hover:text-[#032b5e]'
              }`}
            >
              Quadro de Ações A3
            </button>
          </div>
        </div>
      </header>

      {/* SUB TAB: PRODUTIVIDADE & BI */}
      {activeSubTab === 'produtividade' && (
        <div className="space-y-6">
          
          {/* MANUAL DE INSTRUÇÃO E PARÂMETROS DE METAS (DESPEJO) */}
          <RepackMetasParametrosCard
            empresaId={empresa?.id || 'demo'}
            metaProdutividadeCxH={metaProdutividadeCxH}
            onUpdateMetaProdutividade={(newVal) => updateTarget('despejo_produtividade', newVal)}
            embalagensConfig={embalagensConfig}
            onUpdateEmbalagemMeta={handleUpdateEmbalagemMeta}
            onResetEmbalagens={handleResetEmbalagens}
            isManager={user?.papel === 'admin' || user?.papel === 'supervisor' || true}
            processo="despejo"
          />

          {/* FILTER BAR */}
          <section className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              
              {/* Período (Calendário) */}
              <div className="flex flex-col gap-1 min-w-[190px]">
                <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  Período (Calendário)
                </label>
                <CalendarFilter
                  startDate={filterStartDate}
                  endDate={filterEndDate}
                  onChange={(start, end) => {
                    setFilterStartDate(start);
                    setFilterEndDate(end);
                  }}
                />
              </div>

              {/* Mês Filter */}
              {distinctMeses.length > 0 && (
                <div className="flex flex-col gap-1 min-w-[130px]">
                  <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                    Mês
                  </label>
                  <select
                    value={filterMes}
                    onChange={(e) => setFilterMes(e.target.value)}
                    className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500"
                  >
                    <option value="todos">Todos os Meses</option>
                    {distinctMeses.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Colaborador */}
              <div className="flex flex-col gap-1 min-w-[140px]">
                <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  Colaborador
                </label>
                <select
                  value={filterColaborador}
                  onChange={(e) => setFilterColaborador(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500"
                >
                  <option value="todos">Todos Colaboradores</option>
                  {distinctOperadores.map(op => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
              </div>

              {/* Embalagem */}
              <div className="flex flex-col gap-1 min-w-[140px]">
                <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  Embalagem
                </label>
                <select
                  value={filterEmbalagem}
                  onChange={(e) => setFilterEmbalagem(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500"
                >
                  <option value="todos">Todas Embalagens</option>
                  {embalagensList.map(emb => (
                    <option key={emb} value={emb}>{emb}</option>
                  ))}
                </select>
              </div>

              {/* Meta Status */}
              <div className="flex flex-col gap-1 min-w-[130px]">
                <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  Status da Meta
                </label>
                <select
                  value={filterMeta}
                  onChange={(e) => setFilterMeta(e.target.value as any)}
                  className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500"
                >
                  <option value="todos">Todos</option>
                  <option value="dentro">Dentro da Meta</option>
                  <option value="fora">Fora da Meta</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleApplyFilters}
                className="px-4 py-2 bg-[#032b5e] dark:bg-blue-600 hover:bg-blue-800 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
              >
                Aplicar Filtros
              </button>
              <button
                onClick={handleClearFilters}
                className="px-3 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-600 dark:text-slate-300 font-bold rounded-xl text-xs transition-all"
              >
                Limpar
              </button>
            </div>
          </section>

          {/* 4 CORE KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1: TOTAL DE REGISTROS */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">
                  Total de Registros
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Box className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                    {filteredRows.length.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-xs font-bold text-gray-400 uppercase">REGISTROS</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-blue-600 dark:text-blue-400 font-bold">
                  <span>{totalSkus.toLocaleString('pt-BR')} Unidades</span>
                  <span className="text-gray-300 dark:text-slate-700">•</span>
                  <span>{totalHE.toFixed(2)} HL Perdido</span>
                </div>
              </div>
            </div>

            {/* KPI 2: TEMPO MÉDIO / REGISTRO VS META */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">
                  Tempo Médio / Registro
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                    {tempoMedioPorRegistroStr}
                  </span>
                  <span className="text-xs font-bold text-gray-400 uppercase">MÉDIA / REGISTRO</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-slate-400 font-semibold">
                  <span>Meta Esperada: <strong>{tempoEsperadoMedioStr}</strong></span>
                  <span className="text-gray-300 dark:text-slate-700">•</span>
                  <span>{filteredRows.length} registros</span>
                </div>
              </div>
            </div>

            {/* KPI 3: PRODUTIVIDADE REG/H VS META */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 tracking-wider">
                  Produtividade REG/H
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black font-mono text-amber-500">
                    {produtividadeRegistrosHora.toFixed(1)}
                  </span>
                  <span className="text-xs font-bold text-gray-400 uppercase">REG / HORA</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-slate-400 font-semibold">
                  <span>Meta DPO: <strong className="text-slate-900 dark:text-slate-100">{metaProdutividadeCxH} reg/h</strong></span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase ${
                    produtividadeRegistrosHora >= metaProdutividadeCxH ? 'bg-emerald-500/20 text-emerald-600' : 'bg-rose-500/20 text-rose-600'
                  }`}>
                    {produtividadeRegistrosHora >= metaProdutividadeCxH ? 'ATINGIDA' : 'ABAIXO'}
                  </span>
                </div>
              </div>
            </div>

            {/* KPI 4: EFICIÊNCIA GERAL & CONFORMIDADE */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">
                  Conformidade DPO
                </span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  conformidadeMetaPct >= 80 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                }`}>
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-black font-mono ${
                    conformidadeMetaPct >= 80 ? 'text-emerald-500' : 'text-amber-500'
                  }`}>
                    {conformidadeMetaPct}%
                  </span>
                  <span className="text-xs font-bold text-gray-400 uppercase">META BATIDA</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-slate-400 font-semibold">
                  <span>Eficiência: <strong>{eficienciaGeral}%</strong></span>
                  <span className="text-gray-300 dark:text-slate-700">•</span>
                  <span>{conformidadeMetaPct >= 80 ? 'Excelente' : 'Atenção'}</span>
                </div>
              </div>
            </div>

          </div>

          {/* SIMULADOR DE AGILIDADE & METAS (DESPEJO) */}
          <SimuladorAgilidadeMeta
            tipo="despejo"
            totalHectolitros={totalHE}
            totalCaixasUnidades={filteredRows.length}
            tempoTotalMinutos={totalTempoGastoSec / 60}
            metaHectolitrosMensal={450}
            metaCxHora={metaProdutividadeCxH}
            diasUteisElapsed={workingDaysInfo.elapsedWorkingDays}
            diasUteisTotal={workingDaysInfo.totalWorkingDays}
          />

          {/* BI CHARTS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* CHART 1: PRODUTIVIDADE DIÁRIA (REG/H REAL VS META) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                    Produtividade Diária de Despejo (reg/h Real vs Meta {metaProdutividadeCxH})
                  </h3>
                </div>
                <span className="text-xs text-gray-400 font-semibold">Últimos dias</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartProdutividadeDia} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                    <XAxis dataKey="dia" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      formatter={(val: any, name: string) => [
                        `${val} reg/h`, 
                        name === 'realRegH' || name === 'realCxH' ? 'Produtividade Real' : 'Meta DPO'
                      ]}
                    />
                    <Bar dataKey="realRegH" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                      {chartProdutividadeDia.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.realRegH >= entry.metaRegH ? '#10b981' : '#f59e0b'} 
                        />
                      ))}
                    </Bar>
                    <Line type="monotone" dataKey="metaRegH" stroke="#ef4444" strokeWidth={2} dot={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CHART 2: EMBALAGENS DISTRIBUTION */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                    Mix de Embalagens Despejadas
                  </h3>
                </div>
                <span className="text-xs text-gray-400 font-semibold">Registros por Tipo</span>
              </div>

              <div className="h-48 w-full flex items-center justify-center">
                {chartDistribuicaoEmbalagem.length === 0 ? (
                  <p className="text-xs text-gray-400">Sem dados para exibir</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartDistribuicaoEmbalagem}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {chartDistribuicaoEmbalagem.map((entry, idx) => (
                          <Cell key={`pie-cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => [`${val} registros`, 'Contagem']} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {chartDistribuicaoEmbalagem.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 dark:text-slate-400 truncate text-[11px]">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CHART 3: EVOLUÇÃO TEMPORAL (ÁREA) */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                    Tendência de Registros Despejados (Registros e Hectolitros ao Longo dos Dias)
                  </h3>
                </div>
                <span className="text-xs text-gray-400 font-semibold">Volume acumulado diário</span>
              </div>

              <div className="h-56 w-full">
                {chartVolumeEvolucao.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400">
                    Sem dados temporais disponíveis
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartVolumeEvolucao} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorHl" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                      <XAxis dataKey="dia" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(val: any, name: string) => [val, name === 'registros' ? 'Registros (Ops)' : 'Hectolitros (HL)']} />
                      <Area type="monotone" dataKey="registros" stroke="#3b82f6" fillOpacity={1} fill="url(#colorReg)" name="registros" />
                      <Area type="monotone" dataKey="hl" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorHl)" name="hl" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>

          {/* RECORDS TABLE & AUDIT */}
          <section className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Histórico de Registros de Despejo ({searchedRows.length})
                </h3>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar código, produto, operador, mês..."
                    value={tableSearch}
                    onChange={(e) => {
                      setTableSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={reloadData}
                  className="p-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all shrink-0"
                  title="Recarregar Dados"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>

                <button
                  onClick={handleExportXLSX}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                  title="Exportar para planilha Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>XLSX</span>
                </button>

                <button
                  onClick={handleExportPDF}
                  className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                  title="Exportar Relatório em PDF"
                >
                  <FileText className="w-3.5 h-3.5 text-white" />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 uppercase font-black tracking-wider text-[10px] border-b border-gray-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3.5">Data / Mês</th>
                    <th className="p-3.5">Cód. / Produto</th>
                    <th className="p-3.5">Operador</th>
                    <th className="p-3.5">Embalagem</th>
                    <th className="p-3.5 text-center">Quantidade</th>
                    <th className="p-3.5 text-center">HL Perdido</th>
                    <th className="p-3.5 text-center">Horário</th>
                    <th className="p-3.5 text-center">Duração</th>
                    <th className="p-3.5 text-center">Meta Calc.</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-gray-400">
                        Nenhum registro de despejo encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row) => {
                      const docId = (row as any)._docId || row.id || '';
                      const config = embalagensConfig[row.embalagem] || { metaSec: 270 };
                      const expectedSec = config.metaSec * (Number(row.quantidade) || 1);
                      const actualSec = getRowDurationSec(row);
                      const isWithin = actualSec <= expectedSec;
                      const factor = EMBALAGENS_VOLUME[row.embalagem] || 8.4;
                      const hlVal = row.hlPerdido || row.hectolitroPerdido || ((factor * (Number(row.quantidade) || 0)) / 100);

                      return (
                        <tr 
                          key={docId} 
                          onClick={() => setSelectedRowId(selectedRowId === docId ? null : docId)}
                          className={`hover:bg-blue-50/50 dark:hover:bg-blue-950/20 cursor-pointer transition-colors ${
                            selectedRowId === docId ? 'bg-blue-50/80 dark:bg-blue-950/40' : ''
                          }`}
                        >
                          <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            <div className="font-bold text-slate-900 dark:text-slate-100">{row.data || row.dataISO || '—'}</div>
                            {row.mes && <div className="text-[10px] text-gray-400 uppercase font-semibold">{row.mes}</div>}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="font-bold text-blue-600 dark:text-blue-400">
                              {row.descricao || row.embalagem || '—'}
                            </div>
                            {(row.codProduto || row.codigoProduto) && (
                              <div className="text-[10px] text-gray-400 font-mono">
                                Cód: {row.codProduto || row.codigoProduto}
                              </div>
                            )}
                          </td>
                          <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            {row.operador || '—'}
                          </td>
                          <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {row.embalagem}
                          </td>
                          <td className="p-3.5 text-center font-bold font-mono">
                            {row.quantidade} UN
                          </td>
                          <td className="p-3.5 text-center font-mono font-bold text-purple-600 dark:text-purple-400">
                            {typeof hlVal === 'number' ? hlVal.toFixed(4) : hlVal} HL
                          </td>
                          <td className="p-3.5 text-center text-gray-500 dark:text-slate-400 font-mono">
                            {row.inicio || '—'} {row.fim ? `às ${row.fim}` : ''}
                          </td>
                          <td className="p-3.5 text-center font-bold font-mono text-slate-900 dark:text-slate-100">
                            {toHMS(actualSec)}
                          </td>
                          <td className="p-3.5 text-center font-mono text-gray-500 dark:text-slate-400">
                            {toHMS(expectedSec)}
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                              isWithin 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                            }`}>
                              {isWithin ? '🟢 Meta Batida' : '🔴 Acima da Meta'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRow(docId);
                              }}
                              className="p-1.5 text-gray-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                              title="Excluir Registro"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between text-xs text-gray-500">
              <span>Página {currentPage} de {totalPages}</span>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="p-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg disabled:opacity-40 hover:bg-gray-100 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="p-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg disabled:opacity-40 hover:bg-gray-100 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </section>

          {/* AUDIT DETAILS FOR SELECTED ROW */}
          {selectedRowObj && (
            <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-500/40 rounded-2xl p-5 shadow-md animate-fade-in space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-blue-900 dark:text-blue-300 uppercase tracking-wide flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Auditoria de Registro: {selectedRowObj.operador} — {selectedRowObj.descricao || selectedRowObj.embalagem}
                </h4>
                <button
                  onClick={() => setSelectedRowId(null)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Fechar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-gray-200 dark:border-slate-800">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Data, Mês & Horário</span>
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {selectedRowObj.data || selectedRowObj.dataISO} {selectedRowObj.mes ? `(${selectedRowObj.mes})` : ''} • {selectedRowObj.inicio} às {selectedRowObj.fim || '—'}
                  </span>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-gray-200 dark:border-slate-800">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Produto & Embalagem</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 mt-0.5 block">
                    {selectedRowObj.descricao || selectedRowObj.embalagem} {selectedRowObj.codProduto ? `[${selectedRowObj.codProduto}]` : ''}
                  </span>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-gray-200 dark:border-slate-800">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Volume Despejado & HL</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white mt-0.5 block">
                    {selectedRowObj.quantidade} UN • {selectedRowObj.hlPerdido || selectedRowObj.hectolitroPerdido || '—'} HL
                  </span>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-gray-200 dark:border-slate-800">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Tempo Real vs Meta</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white mt-0.5 block">
                    {selectedRowObj.duracao || selectedRowObj.tempo} (Meta: {toHMS((embalagensConfig[selectedRowObj.embalagem]?.metaSec || 270) * (Number(selectedRowObj.quantidade) || 1))})
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* SUB TAB: PRODUTOS & HECTOLITROS (HL) */}
      {activeSubTab === 'skus' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* TOP PRODUTOS & OPERADORES GRIDS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* CARD 1: TOP PRODUTOS DESPEJADOS */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                      Top Produtos Despejados (Registros e HL)
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400">Produtos com maior frequência de operações de descarte</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-800">
                  Ranking
                </span>
              </div>

              {topProdutosDespejados.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  Nenhum produto registrado ainda.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {topProdutosDespejados.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700/60 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 font-black text-xs flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {item.desc}
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-slate-400 flex items-center gap-2">
                            <span>Cód: {item.cod}</span>
                            <span>•</span>
                            <span>{item.emb}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {item.registros} registros
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {item.caixas} UN • <span className="text-purple-600 dark:text-purple-400 font-bold">{item.hl.toFixed(4)} HL</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CARD 2: PERFORMANCE POR OPERADOR */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                      Produtividade e Conformidade por Operador
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400">Registros processados e cumprimento das metas DPO</p>
                  </div>
                </div>
              </div>

              {performanceOperadores.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  Nenhum operador registrado no período.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {performanceOperadores.map((op, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700/60 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-black">
                          {op.nome.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{op.nome}</div>
                          <div className="text-[10px] text-gray-500 dark:text-slate-400">
                            {op.totalRegistros} registros ({op.totalCx} un • {op.totalOps} lotes)
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <div className="font-mono font-black text-amber-500 text-xs">
                            {op.regHora} reg/h
                          </div>
                          <div className="text-[10px] text-gray-400">Velocidade</div>
                        </div>

                        <div className="min-w-[65px]">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            op.pctMeta >= 80 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                          }`}>
                            {op.pctMeta}% META
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* CHART: EVOLUÇÃO MENSAL DE DESPEJO */}
          {chartVolumeMensal.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                    Consolidado Mensal de Despejo (Registros e Hectolitros Perdidos)
                  </h3>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartVolumeMensal} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                    <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(val: any, name: string) => [val, name === 'registros' ? 'Registros (Ops)' : 'Hectolitros (HL)']} />
                    <Bar dataKey="registros" fill="#3b82f6" name="registros" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="hl" fill="#8b5cf6" name="hl" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        </div>
      )}

      {/* SUB TAB: QUADRO DE AÇÕES A3 */}
      {activeSubTab === 'boarda3' && (
        <div className="space-y-6">
          <A3BoardComponent
            user={user}
            empresa={empresa}
            dashboard="despejo"
          />
        </div>
      )}

      {/* POP MODAL */}
      <PadraoOperacionalModal
        isOpen={isPopModalOpen}
        onClose={() => setIsPopModalOpen(false)}
        user={user}
        moduleKey="despejo"
        moduleName="Despejo e Descarte"
      />

      {/* DEDICATED ACTION MODAL (FILTERED EXCLUSIVELY FOR DESPEJO) */}
      <IndicatorActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        indicatorTitle="Despejo"
        indicatorSubtitle="Visualizando e gerenciando apenas os planos de ação e contramedidas 5W2H do setor de Despejo."
        indicatorBadge="DESPEJO DPO"
        allowedProcessos={['Despejo']}
        defaultProcesso="Despejo"
        defaultIndicador="Produtividade e Agilidade de Despejo (un/h)"
        defaultMeta={`${metaProdutividadeCxH} un/h`}
        user={user}
      />

      {/* MODAL: NOVO REGISTRO DE DESPEJO COM CRONÔMETRO */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in">
            
            <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Droplet className="w-5 h-5" />
                <h3 className="font-black text-base uppercase tracking-wide">Novo Registro de Despejo</h3>
              </div>
              <button 
                onClick={() => {
                  setIsRegisterModalOpen(false);
                  setIsStopwatchRunning(false);
                  setStopwatchSeconds(0);
                }}
                className="p-1 hover:bg-white/20 rounded-lg text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="p-6 space-y-4 text-xs">
              
              {/* LIVE STOPWATCH BOX */}
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 text-center space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  Cronometragem da Operação
                </span>
                <div className="text-3xl font-black font-mono text-blue-600 dark:text-blue-400">
                  {toHMS(stopwatchSeconds)}
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  {!isStopwatchRunning ? (
                    <button
                      type="button"
                      onClick={() => setIsStopwatchRunning(true)}
                      className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Iniciar Cronômetro</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsStopwatchRunning(false)}
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pausar</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsStopwatchRunning(false);
                      setStopwatchSeconds(0);
                    }}
                    className="px-3 py-1.5 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Zerar</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase block mb-1">
                    Operador Responsável
                  </label>
                  <select
                    value={newOperador}
                    onChange={(e) => setNewOperador(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-blue-500"
                  >
                    {distinctOperadores.map(op => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase block mb-1">
                    Embalagem
                  </label>
                  <select
                    value={newEmbalagem}
                    onChange={(e) => setNewEmbalagem(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-blue-500"
                  >
                    {embalagensList.map(emb => (
                      <option key={emb} value={emb}>{emb}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase block mb-1">
                  Quantidade de Unidades (UN)
                </label>
                <input
                  type="number"
                  min={1}
                  value={newQuantidade}
                  onChange={(e) => setNewQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/60 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Meta Unidade ({newEmbalagem}):</span>
                  <span className="font-bold font-mono">{toHMS(embalagensConfig[newEmbalagem]?.metaSec || 270)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Tempo Limite Total ({newQuantidade} UN):</span>
                  <span className="font-bold font-mono text-blue-600 dark:text-blue-400">
                    {toHMS((embalagensConfig[newEmbalagem]?.metaSec || 270) * newQuantidade)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase block mb-1">
                  Justificativa / Motivo (Obrigatório se exceder a meta)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Canaleta entupida ou garra manual com folga"
                  value={newMotivoFalha}
                  onChange={(e) => setNewMotivoFalha(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs shadow-md"
                >
                  Salvar Registro
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
