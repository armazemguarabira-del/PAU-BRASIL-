import { DespejoRow } from '../types';
import { RetroactiveRecord } from './dadosRetroativosUtils';
import { sanitizeData } from '../security/JsonSecuritySanitizer';

export interface RawDespejoJsonItem {
  Data?: string;
  data?: string;
  DATA?: string;
  'Data Lançamento'?: string;
  'Data Lancamento'?: string;
  dataISO?: string;

  Mês?: string;
  Mes?: string;
  mes?: string;
  MES?: string;

  CodProduto?: number | string;
  codProduto?: number | string;
  CODPRODUTO?: number | string;
  'Cód Produto'?: number | string;
  Codigo?: number | string;
  codigo?: number | string;
  SKU?: number | string;

  Descricao?: string;
  descricao?: string;
  DESCRICAO?: string;
  'Descrição Produto'?: string;
  Produto?: string;
  produto?: string;

  EMBALAGEM?: string;
  Embalagem?: string;
  embalagem?: string;
  TipoEmbalagem?: string;

  Quantidade?: number | string;
  quantidade?: number | string;
  QUANTIDADE?: number | string;
  Qtd?: number | string;
  qtd?: number | string;
  Volume?: number | string;
  'Qtd Despejada'?: number | string;

  'HECTO LITRO PERDIDO'?: number | string;
  'HECTO LITRO PERDIDO '?: number | string;
  'Hecto Litro Perdido'?: number | string;
  'Hectolitro Perdido'?: number | string;
  hlPerdido?: number | string;
  HLPerdido?: number | string;
  'HECTO LITRO'?: number | string;
  'Hecto Litro'?: number | string;
  'HECTOLITRO'?: number | string;
  Hectolitro?: number | string;

  INICIO?: string;
  Inicio?: string;
  inicio?: string;
  'Hora Inicio'?: string;
  'Hora Início'?: string;
  HoraInicio?: string;

  FINAL?: string;
  Final?: string;
  final?: string;
  FIM?: string;
  Fim?: string;
  fim?: string;
  'Hora Fim'?: string;
  HoraFim?: string;

  TEMPO?: string;
  Tempo?: string;
  tempo?: string;
  Duracao?: string | number;
  duracao?: string | number;

  META?: string | number;
  Meta?: string | number;
  meta?: string | number;
  Resultado?: string;
  resultado?: string;
  Status?: string;
  status?: string;

  Operador?: string;
  operador?: string;
  OPERADOR?: string;
  Colaborador?: string;
  colaborador?: string;
  Ajudante?: string;
  Responsavel?: string;

  Motivo?: string;
  motivo?: string;
  Observacoes?: string;
  observacoes?: string;

  [key: string]: any;
}

export interface ParsedDespejoResult {
  valid: boolean;
  despejoRows: DespejoRow[];
  retroactiveRecords: RetroactiveRecord[];
  totalRecords: number;
  totalQuantidade: number;
  totalHlPerdido: number;
  totalMetaBatida: number;
  totalMetaNaoBatida: number;
  tempoMedioSegundos: number;
  tempoMedioFormatado: string;
  resumoPorEmbalagem: Record<string, { count: number; quantidade: number; hlPerdido: number; metaBatida: number; metaNaoBatida: number }>;
  resumoPorProduto: Record<string, { count: number; quantidade: number; hlPerdido: number; metaBatida: number; metaNaoBatida: number }>;
  resumoPorMes: Record<string, { count: number; quantidade: number; hlPerdido: number; metaBatida: number; metaNaoBatida: number }>;
  resumoPorResultado: Record<string, { count: number; quantidade: number; hlPerdido: number }>;
  errors: string[];
  warnings: string[];
}

/**
 * Exemplo padrão oficial para testes e modelo de importação de Despejo
 */
export const SAMPLE_DESPEJO_JSON: RawDespejoJsonItem[] = [
  {
    "Data": "2026-01-02",
    "Mês": "JANEIRO",
    "CodProduto": 9276,
    "Descricao": "PEPSI ZERO P2",
    "EMBALAGEM": "PET 2L",
    "Quantidade": 5,
    "HECTO LITRO PERDIDO": 0.0006,
    "INICIO": "16:00:00",
    "FINAL": "16:02:42",
    "TEMPO": "00:02:42",
    "META": "🟢 META BATIDA"
  },
  {
    "Data": "2026-01-02",
    "Mês": "JANEIRO",
    "CodProduto": 21020,
    "Descricao": "BUDWEISER 350ML",
    "EMBALAGEM": "LATA 350ML",
    "Quantidade": 10,
    "HECTO LITRO PERDIDO": 0.0035,
    "INICIO": "16:10:00",
    "FINAL": "16:14:30",
    "TEMPO": "00:04:30",
    "META": "🟢 META BATIDA"
  },
  {
    "Data": "2026-01-03",
    "Mês": "JANEIRO",
    "CodProduto": 18836,
    "Descricao": "CORONA EXTRA 330ML",
    "EMBALAGEM": "LONG NECK 330ML",
    "Quantidade": 8,
    "HECTO LITRO PERDIDO": 0.0026,
    "INICIO": "09:30:00",
    "FINAL": "09:38:50",
    "TEMPO": "00:08:50",
    "META": "🔴 META NÃO BATIDA"
  },
  {
    "Data": "2026-01-04",
    "Mês": "JANEIRO",
    "CodProduto": 1010,
    "Descricao": "SKOL 600ML RETORNAVEL",
    "EMBALAGEM": "GARRAFA 600ML",
    "Quantidade": 12,
    "HECTO LITRO PERDIDO": 0.0072,
    "INICIO": "10:15:00",
    "FINAL": "10:18:20",
    "TEMPO": "00:03:20",
    "META": "🟢 META BATIDA"
  },
  {
    "Data": "2026-01-05",
    "Mês": "JANEIRO",
    "CodProduto": 5040,
    "Descricao": "PEPSI 2L PET",
    "EMBALAGEM": "PET 2L",
    "Quantidade": 4,
    "HECTO LITRO PERDIDO": 0.0008,
    "INICIO": "14:20:00",
    "FINAL": "14:23:10",
    "TEMPO": "00:03:10",
    "META": "🟢 META BATIDA"
  }
];

/**
 * Converte string no formato HH:MM:SS ou MM:SS para segundos
 */
function timeStringToSeconds(timeStr?: string | number): number {
  if (!timeStr) return 0;
  if (typeof timeStr === 'number') {
    if (timeStr <= 0 || isNaN(timeStr)) return 0;
    if (timeStr < 1) return Math.round(timeStr * 86400); // Fração serial de dia no Excel (ex: 0.002083 = 180s)
    if (timeStr <= 300) return Math.round(timeStr * 60); // Minutos -> Segundos (ex: 3.5m = 210s)
    return Math.round(timeStr); // Segundos
  }

  const cleaned = String(timeStr).trim();
  if (cleaned.includes(':')) {
    const parts = cleaned.split(':').map(p => parseFloat(p) || 0);
    if (parts.length === 3) {
      return Math.round((parts[0] * 3600) + (parts[1] * 60) + parts[2]);
    } else if (parts.length === 2) {
      return Math.round((parts[0] * 60) + parts[1]);
    }
  }

  const num = parseFloat(cleaned.replace(',', '.'));
  if (!isNaN(num) && num > 0) {
    if (num < 1) return Math.round(num * 86400);
    if (num <= 300) return Math.round(num * 60);
    return Math.round(num);
  }
  return 0;
}

/**
 * Formata segundos no formato HH:MM:SS
 */
function secondsToTimeString(totalSec: number): string {
  if (!totalSec || isNaN(totalSec) || totalSec < 0) return '00:00:00';
  const secInt = Math.round(totalSec);
  const hours = Math.floor(secInt / 3600);
  const minutes = Math.floor((secInt % 3600) / 60);
  const seconds = secInt % 60;

  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0')
  ].join(':');
}

/**
 * Calcula a diferença entre hora de início e final no formato HH:MM:SS
 */
function calculateDuration(inicio: string, final: string): { seconds: number; formatted: string } {
  const startSec = timeStringToSeconds(inicio);
  const endSec = timeStringToSeconds(final);

  let diff = endSec - startSec;
  if (diff < 0) {
    diff += 24 * 3600;
  }

  return {
    seconds: diff,
    formatted: secondsToTimeString(diff)
  };
}

/**
 * Normaliza e padroniza a data para ISO (YYYY-MM-DD) e formato BR (DD/MM/YYYY)
 */
function parseDates(rawDate?: string): { dataISO: string; dataFormatada: string; mesExtenso: string } {
  const fallback = new Date().toISOString().split('T')[0];
  const monthsBR = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];

  if (!rawDate) {
    const d = new Date();
    return { 
      dataISO: fallback, 
      dataFormatada: d.toLocaleDateString('pt-BR'),
      mesExtenso: monthsBR[d.getMonth()]
    };
  }

  const str = String(rawDate).trim();

  // Caso 1: Formato "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const isoPart = str.substring(0, 10);
    const [y, m, d] = isoPart.split('-');
    const mIdx = Math.max(0, Math.min(11, (parseInt(m, 10) || 1) - 1));
    return {
      dataISO: isoPart,
      dataFormatada: `${d}/${m}/${y}`,
      mesExtenso: monthsBR[mIdx]
    };
  }

  // Caso 2: Formato "DD/MM/YYYY"
  if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
    const brPart = str.substring(0, 10);
    const [d, m, y] = brPart.split('/');
    const mIdx = Math.max(0, Math.min(11, (parseInt(m, 10) || 1) - 1));
    return {
      dataISO: `${y}-${m}-${d}`,
      dataFormatada: brPart,
      mesExtenso: monthsBR[mIdx]
    };
  }

  const d = new Date();
  return { 
    dataISO: fallback, 
    dataFormatada: d.toLocaleDateString('pt-BR'),
    mesExtenso: monthsBR[d.getMonth()]
  };
}

/**
 * Realiza o parse completo do lote JSON de Despejo, com validações,
 * sanitizações de segurança e normalizações de negócio.
 */
export function parseDespejoJson(
  input: string | any[],
  empresaId = 'demo',
  userNome = 'Sistema'
): ParsedDespejoResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  let rawList: any[] = [];

  try {
    if (typeof input === 'string') {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        rawList = parsed;
      } else if (typeof parsed === 'object' && parsed !== null) {
        if (Array.isArray(parsed.itens)) {
          rawList = parsed.itens;
        } else if (Array.isArray(parsed.data)) {
          rawList = parsed.data;
        } else if (Array.isArray(parsed.despejo)) {
          rawList = parsed.despejo;
        } else {
          rawList = [parsed];
        }
      } else {
        throw new Error('O formato do JSON deve ser uma lista (Array) de objetos de Despejo.');
      }
    } else if (Array.isArray(input)) {
      rawList = input;
    } else {
      rawList = [input];
    }
  } catch (err: any) {
    return {
      valid: false,
      despejoRows: [],
      retroactiveRecords: [],
      totalRecords: 0,
      totalQuantidade: 0,
      totalHlPerdido: 0,
      totalMetaBatida: 0,
      totalMetaNaoBatida: 0,
      tempoMedioSegundos: 0,
      tempoMedioFormatado: '00:00:00',
      resumoPorEmbalagem: {},
      resumoPorProduto: {},
      resumoPorMes: {},
      resumoPorResultado: {},
      errors: [`Erro de Sintaxe JSON: ${err.message}`],
      warnings: []
    };
  }

  if (rawList.length === 0) {
    return {
      valid: false,
      despejoRows: [],
      retroactiveRecords: [],
      totalRecords: 0,
      totalQuantidade: 0,
      totalHlPerdido: 0,
      totalMetaBatida: 0,
      totalMetaNaoBatida: 0,
      tempoMedioSegundos: 0,
      tempoMedioFormatado: '00:00:00',
      resumoPorEmbalagem: {},
      resumoPorProduto: {},
      resumoPorMes: {},
      resumoPorResultado: {},
      errors: ['A lista de dados fornecida está vazia.'],
      warnings: []
    };
  }

  const despejoRows: DespejoRow[] = [];
  const retroactiveRecords: RetroactiveRecord[] = [];

  let totalQuantidade = 0;
  let totalHlPerdido = 0;
  let totalMetaBatida = 0;
  let totalMetaNaoBatida = 0;
  let totalDuracaoSegundos = 0;

  const resumoPorEmbalagem: Record<string, { count: number; quantidade: number; hlPerdido: number; metaBatida: number; metaNaoBatida: number }> = {};
  const resumoPorProduto: Record<string, { count: number; quantidade: number; hlPerdido: number; metaBatida: number; metaNaoBatida: number }> = {};
  const resumoPorMes: Record<string, { count: number; quantidade: number; hlPerdido: number; metaBatida: number; metaNaoBatida: number }> = {};
  const resumoPorResultado: Record<string, { count: number; quantidade: number; hlPerdido: number }> = {};

  rawList.forEach((rawItem, idx) => {
    // 1. Sanitização
    const item: RawDespejoJsonItem = sanitizeData(rawItem);

    // 2. Extração de Campos
    const rawData = item.Data || item.data || item.DATA || item['Data Lançamento'] || item['Data Lancamento'] || item.dataISO;
    const { dataISO, dataFormatada, mesExtenso } = parseDates(rawData);
    const mes = String(item.Mês || item.Mes || item.mes || item.MES || mesExtenso).trim().toUpperCase();

    // CodProduto
    const rawCod = item.CodProduto ?? item.codProduto ?? item.CODPRODUTO ?? item['Cód Produto'] ?? item.Codigo ?? item.codigo ?? item.SKU ?? '9276';
    const codProduto = String(rawCod).trim();

    // Descrição
    const descricao = String(
      item.Descricao || 
      item.descricao || 
      item.DESCRICAO || 
      item['Descrição Produto'] || 
      item.Produto || 
      item.produto || 
      `PRODUTO ${codProduto}`
    ).trim().toUpperCase();

    // Embalagem
    const embalagem = String(
      item.EMBALAGEM || 
      item.Embalagem || 
      item.embalagem || 
      item.TipoEmbalagem || 
      'PET 2L'
    ).trim().toUpperCase();

    // Quantidade
    let quantidade = 1;
    const rawQtd = item.Quantidade ?? item.quantidade ?? item.QUANTIDADE ?? item.Qtd ?? item.qtd ?? item.Volume ?? item['Qtd Despejada'];
    if (typeof rawQtd === 'number') {
      quantidade = rawQtd;
    } else if (typeof rawQtd === 'string') {
      const parsedQtd = parseFloat(rawQtd.replace(',', '.'));
      if (!isNaN(parsedQtd)) quantidade = parsedQtd;
    }

    // Hecto Litro Perdido
    let hlPerdido = 0;
    const rawHl = item['HECTO LITRO PERDIDO'] ?? item['HECTO LITRO PERDIDO '] ?? item['Hecto Litro Perdido'] ?? item['Hectolitro Perdido'] ?? item.hlPerdido ?? item.HLPerdido ?? item['HECTO LITRO'] ?? item['Hecto Litro'] ?? item.HECTOLITRO ?? item.Hectolitro;
    if (typeof rawHl === 'number') {
      hlPerdido = rawHl;
    } else if (typeof rawHl === 'string') {
      const parsedHl = parseFloat(rawHl.replace(',', '.'));
      if (!isNaN(parsedHl)) hlPerdido = parsedHl;
    }

    // Horários
    const inicio = String(
      item.INICIO || 
      item.Inicio || 
      item.inicio || 
      item['Hora Inicio'] || 
      item['Hora Início'] || 
      item.HoraInicio || 
      '16:00:00'
    ).trim();

    const final = String(
      item.FINAL || 
      item.Final || 
      item.final || 
      item.FIM || 
      item.Fim || 
      item.fim || 
      item['Hora Fim'] || 
      item.HoraFim || 
      '16:02:42'
    ).trim();

    // Tempo / Duração
    let tempoStr = String(item.TEMPO || item.Tempo || item.tempo || item.Duracao || item.duracao || '').trim();
    let durationSeconds = 0;

    if (tempoStr) {
      durationSeconds = timeStringToSeconds(tempoStr);
    } else {
      const calc = calculateDuration(inicio, final);
      durationSeconds = calc.seconds;
      tempoStr = calc.formatted;
    }

    const duracaoMinutos = Math.round((durationSeconds / 60) * 100) / 100;

    // Meta / Resultado
    let metaResultado = String(item.META || item.Meta || item.meta || item.Resultado || item.resultado || item.Status || item.status || '').trim();
    let isBatida = false;

    if (metaResultado) {
      const upper = metaResultado.toUpperCase();
      if (upper.includes('BATIDA') && !upper.includes('NÃO') && !upper.includes('NAO') || upper.includes('DENTRO') || upper.includes('🟢') || upper.includes('OK')) {
        isBatida = true;
        metaResultado = '🟢 META BATIDA';
      } else if (upper.includes('NÃO BATIDA') || upper.includes('NAO BATIDA') || upper.includes('ACIMA') || upper.includes('🔴') || upper.includes('FORA')) {
        isBatida = false;
        metaResultado = '🔴 META NÃO BATIDA';
      } else {
        isBatida = true;
        metaResultado = '🟢 META BATIDA';
      }
    } else {
      isBatida = true;
      metaResultado = '🟢 META BATIDA';
    }

    if (isBatida) {
      totalMetaBatida++;
    } else {
      totalMetaNaoBatida++;
    }

    // Operador
    const operador = String(
      item.Operador || 
      item.operador || 
      item.OPERADOR || 
      item.Colaborador || 
      item.colaborador || 
      item.Ajudante || 
      item.Responsavel || 
      'OPERADOR DESPEJO'
    ).trim().toUpperCase();

    // Observações / Motivo
    const motivo = String(item.Motivo || item.motivo || item.Observacoes || item.observacoes || '').trim();

    // Identificador único determinístico
    const hash = Math.abs(
      (dataISO + codProduto + embalagem + inicio + final + idx).split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0)
    ).toString(36);

    const docId = `retro_despejo_${dataISO.replace(/-/g, '')}_${hash}_${idx}`;

    // 3. Montar DespejoRow
    const despejoRow: DespejoRow = {
      _docId: docId,
      id: docId,
      empresaId,
      data: dataFormatada,
      dataISO,
      embalagem,
      quantidade,
      inicio,
      fim: final,
      tempo: tempoStr,
      duracao: duracaoMinutos,
      meta: '00:03:00', // Meta de referência
      resultado: metaResultado,
      status: isBatida ? 'DENTRO DA META' : 'ACIMA DA META',
      motivo: motivo || `${descricao} (Cód: ${codProduto}) - Despejo ${mes}`,
      operador,
      _criadoEm: new Date().toISOString()
    };

    // 4. Montar RetroactiveRecord
    const retroRecord: RetroactiveRecord = {
      id: docId,
      modulo: 'despejo',
      dataISO,
      dataFormatada,
      codigoProduto: codProduto,
      descricao: `${descricao} - ${embalagem} (${quantidade} un | ${hlPerdido.toFixed(4)} HL)`,
      quantidade,
      unidade: 'UN',
      valorFinanceiro: quantidade * 35,
      operador,
      colaboradorAjudante: operador,
      setor: 'Área de Despejo / DPO',
      status: 'Concluído',
      observacoes: `${metaResultado} | Início: ${inicio} | Final: ${final} | Tempo: ${tempoStr} | Mês: ${mes} | HL Perdido: ${hlPerdido.toFixed(4)}`,
      horaInicio: inicio,
      horaFim: final,
      duracaoMinutos,
      rendimentoHLHora: quantidade > 0 && duracaoMinutos > 0 ? Math.round((quantidade / (duracaoMinutos / 60)) * 10) / 10 : undefined,
      simuladoHistorico: true,
      criadoEm: new Date().toISOString()
    };

    despejoRows.push(despejoRow);
    retroactiveRecords.push(retroRecord);

    // Acumuladores
    totalQuantidade += quantidade;
    totalHlPerdido += hlPerdido;
    totalDuracaoSegundos += durationSeconds;

    // Resumo por Embalagem
    if (!resumoPorEmbalagem[embalagem]) {
      resumoPorEmbalagem[embalagem] = { count: 0, quantidade: 0, hlPerdido: 0, metaBatida: 0, metaNaoBatida: 0 };
    }
    resumoPorEmbalagem[embalagem].count += 1;
    resumoPorEmbalagem[embalagem].quantidade += quantidade;
    resumoPorEmbalagem[embalagem].hlPerdido += hlPerdido;
    if (isBatida) resumoPorEmbalagem[embalagem].metaBatida += 1;
    else resumoPorEmbalagem[embalagem].metaNaoBatida += 1;

    // Resumo por Produto
    const prodKey = `${codProduto} - ${descricao}`;
    if (!resumoPorProduto[prodKey]) {
      resumoPorProduto[prodKey] = { count: 0, quantidade: 0, hlPerdido: 0, metaBatida: 0, metaNaoBatida: 0 };
    }
    resumoPorProduto[prodKey].count += 1;
    resumoPorProduto[prodKey].quantidade += quantidade;
    resumoPorProduto[prodKey].hlPerdido += hlPerdido;
    if (isBatida) resumoPorProduto[prodKey].metaBatida += 1;
    else resumoPorProduto[prodKey].metaNaoBatida += 1;

    // Resumo por Mês
    if (!resumoPorMes[mes]) {
      resumoPorMes[mes] = { count: 0, quantidade: 0, hlPerdido: 0, metaBatida: 0, metaNaoBatida: 0 };
    }
    resumoPorMes[mes].count += 1;
    resumoPorMes[mes].quantidade += quantidade;
    resumoPorMes[mes].hlPerdido += hlPerdido;
    if (isBatida) resumoPorMes[mes].metaBatida += 1;
    else resumoPorMes[mes].metaNaoBatida += 1;

    // Resumo por Resultado
    if (!resumoPorResultado[metaResultado]) {
      resumoPorResultado[metaResultado] = { count: 0, quantidade: 0, hlPerdido: 0 };
    }
    resumoPorResultado[metaResultado].count += 1;
    resumoPorResultado[metaResultado].quantidade += quantidade;
    resumoPorResultado[metaResultado].hlPerdido += hlPerdido;
  });

  const totalRecords = despejoRows.length;
  const tempoMedioSegundos = totalRecords > 0 ? totalDuracaoSegundos / totalRecords : 0;

  return {
    valid: errors.length === 0,
    despejoRows,
    retroactiveRecords,
    totalRecords,
    totalQuantidade,
    totalHlPerdido: Math.round(totalHlPerdido * 10000) / 10000,
    totalMetaBatida,
    totalMetaNaoBatida,
    tempoMedioSegundos,
    tempoMedioFormatado: secondsToTimeString(tempoMedioSegundos),
    resumoPorEmbalagem,
    resumoPorProduto,
    resumoPorMes,
    resumoPorResultado,
    errors,
    warnings
  };
}
