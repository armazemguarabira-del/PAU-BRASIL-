import { QuebraRow } from '../types';
import { RetroactiveRecord } from './dadosRetroativosUtils';
import { sanitizeData } from '../security/JsonSecuritySanitizer';

export interface RawQuebraJsonItem {
  Data?: string;
  data?: string;
  DATA?: string;
  'Data Lançamento'?: string;
  
  Mês?: string;
  Mes?: string;
  mes?: string;
  MÊS?: string;
  MES?: string;
  
  CodProduto?: number | string;
  codProduto?: number | string;
  CODPRODUTO?: number | string;
  Produto?: number | string;
  PRODUTO?: number | string;
  codigo?: number | string;
  
  Descricao?: string;
  descricao?: string;
  DESCRICAO?: string;
  'Descrição'?: string;
  'DESCRIÇÃO'?: string;
  
  Quantidade?: number;
  quantidade?: number;
  QUANTIDADE?: number;
  'QUANT UND.'?: number;
  'QUANT UND'?: number;
  Qtd?: number;
  
  Area?: string;
  area?: string;
  AREA?: string;
  Setor?: string;
  
  Turno?: string;
  turno?: string;
  TURNO?: string;
  
  CodQuebra?: number | string;
  codQuebra?: number | string;
  CODQUEBRA?: number | string;
  'Cod Quebra'?: number | string;
  'COD QUEBRA'?: number | string;
  
  Motivo?: string;
  motivo?: string;
  MOTIVO?: string;
  'Motivo Quebra'?: string;
  
  Colaborador?: string;
  colaborador?: string;
  COLABORADOR?: string;
  'Colaborador Quebrou'?: string;
  Responsavel?: string;
  responsavel?: string;
  
  Funcao?: string;
  funcao?: string;
  FUNCAO?: string;
  'Função'?: string;
  'FUNÇÃO'?: string;
  Cargo?: string;
  
  'VALOR DA AVARIA'?: number | string;
  'VALOR AVARIA'?: number | string;
  valorDaAvaria?: number | string;
  valorAvaria?: number | string;
  valorUnitario?: number | string;
  'VALOR TT'?: number | string;
  valorTotal?: number | string;
  Valor?: number | string;
  
  'HECTO LITRO'?: number | string;
  'HECTOLITRO'?: number | string;
  hectoLitro?: number | string;
  fatorHl?: number | string;
  
  'HECTO PERDIDO '?: number | string;
  'HECTO PERDIDO'?: number | string;
  'HECTOPERDIDO'?: number | string;
  hectoPerdido?: number | string;
  hlPerdido?: number | string;
  
  [key: string]: any;
}

export interface ParsedQuebrasResult {
  valid: boolean;
  quebraRows: QuebraRow[];
  retroactiveRecords: RetroactiveRecord[];
  totalRecords: number;
  totalQuantidade: number;
  totalHlPerdido: number;
  totalValorAvaria: number;
  resumoPorArea: Record<string, { count: number; quantidade: number; valor: number; hl: number }>;
  resumoPorMotivo: Record<string, { count: number; quantidade: number; valor: number; hl: number }>;
  resumoPorMes: Record<string, { count: number; quantidade: number; valor: number; hl: number }>;
  resumoPorColaborador: Record<string, { count: number; quantidade: number; valor: number; hl: number }>;
  errors: string[];
  warnings: string[];
}

/**
 * Exemplo padrão oficial para testes e modelo de importação
 */
export const SAMPLE_QUEBRAS_JSON: RawQuebraJsonItem[] = [
  {
    "Data": "2026-01-01 11:59:15",
    "Mês": "JANEIRO",
    "CodProduto": 21020,
    "Descricao": "BUDWEISER 350ML",
    "Quantidade": 1,
    "Area": "ARMAZEM",
    "Turno": "Noite",
    "CodQuebra": 524,
    "Motivo": "FALTA NO PALETE",
    "Colaborador": "RONILDO",
    "Funcao": "EMPILHADOR",
    "VALOR DA AVARIA": 2.648683333333333,
    "HECTO LITRO": 0.0035,
    "HECTO PERDIDO ": 0.0035
  },
  {
    "Data": "2026-01-02 14:30:00",
    "Mês": "JANEIRO",
    "CodProduto": 21015,
    "Descricao": "STELLA ARTOIS 330ML LN",
    "Quantidade": 2,
    "Area": "PICKING",
    "Turno": "Tarde",
    "CodQuebra": 525,
    "Motivo": "QUEDA DE PALETE",
    "Colaborador": "CARLOS SILVA",
    "Funcao": "SEPARADOR",
    "VALOR DA AVARIA": 8.50,
    "HECTO LITRO": 0.0033,
    "HECTO PERDIDO ": 0.0066
  },
  {
    "Data": "2026-01-03 09:15:22",
    "Mês": "JANEIRO",
    "CodProduto": 21030,
    "Descricao": "CORONA EXTRA 330ML",
    "Quantidade": 3,
    "Area": "DOCA",
    "Turno": "Manhã",
    "CodQuebra": 539,
    "Motivo": "AVARIA NA DESCARGA",
    "Colaborador": "MARCOS SOUZA",
    "Funcao": "EMPILHADOR",
    "VALOR DA AVARIA": 14.85,
    "HECTO LITRO": 0.0033,
    "HECTO PERDIDO ": 0.0099
  }
];

/**
 * Normaliza número aceitando vírgula ou ponto
 */
export function parseNumberSafely(val: any, fallback = 0): number {
  if (val === null || val === undefined || val === '') return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/\s+/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? fallback : num;
  }
  return fallback;
}

/**
 * Normaliza data para strings ISO ("YYYY-MM-DD") e formatada ("DD/MM/YYYY")
 */
export function parseDateString(rawDate?: string): { dataISO: string; dataFormatada: string; hora: string } {
  const now = new Date();
  const todayISO = now.toISOString().split('T')[0];
  const todayFmt = now.toLocaleDateString('pt-BR');
  
  if (!rawDate) {
    return { dataISO: todayISO, dataFormatada: todayFmt, hora: '08:00' };
  }

  const str = String(rawDate).trim();
  let timeStr = '08:00';
  
  // Extrai componente de hora se presente (Ex: "2026-01-01 11:59:15" ou "2026-01-01T11:59:15")
  if (str.includes(' ') || str.includes('T')) {
    const parts = str.split(/[ T]/);
    if (parts.length > 1 && parts[1]) {
      const timeParts = parts[1].split(':');
      if (timeParts.length >= 2) {
        timeStr = `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`;
      }
    }
  }

  const datePart = str.split(/[ T]/)[0];

  // Caso 1: YYYY-MM-DD
  if (datePart.includes('-')) {
    const segs = datePart.split('-');
    if (segs.length === 3) {
      if (segs[0].length === 4) { // YYYY-MM-DD
        const year = segs[0];
        const month = segs[1].padStart(2, '0');
        const day = segs[2].padStart(2, '0');
        return {
          dataISO: `${year}-${month}-${day}`,
          dataFormatada: `${day}/${month}/${year}`,
          hora: timeStr
        };
      } else { // DD-MM-YYYY
        const day = segs[0].padStart(2, '0');
        const month = segs[1].padStart(2, '0');
        const year = segs[2].length === 2 ? `20${segs[2]}` : segs[2];
        return {
          dataISO: `${year}-${month}-${day}`,
          dataFormatada: `${day}/${month}/${year}`,
          hora: timeStr
        };
      }
    }
  }

  // Caso 2: DD/MM/YYYY
  if (datePart.includes('/')) {
    const segs = datePart.split('/');
    if (segs.length === 3) {
      const day = segs[0].padStart(2, '0');
      const month = segs[1].padStart(2, '0');
      const year = segs[2].length === 2 ? `20${segs[2]}` : segs[2];
      return {
        dataISO: `${year}-${month}-${day}`,
        dataFormatada: `${day}/${month}/${year}`,
        hora: timeStr
      };
    }
  }

  return { dataISO: todayISO, dataFormatada: todayFmt, hora: timeStr };
}

/**
 * Converte e sanitiza payload JSON de quebras para entidades do banco de dados
 */
export function parseQuebrasJson(
  rawInput: string | any[],
  empresaId = 'demo',
  userNome = 'Operador Sistema'
): ParsedQuebrasResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  let rawList: any[] = [];

  try {
    if (typeof rawInput === 'string') {
      const trimmed = rawInput.trim();
      if (!trimmed) {
        return createEmptyResult(['Arquivo ou texto JSON está vazio.']);
      }
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        rawList = parsed;
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.quebras)) {
          rawList = parsed.quebras;
        } else if (Array.isArray(parsed.data)) {
          rawList = parsed.data;
        } else if (Array.isArray(parsed.itens)) {
          rawList = parsed.itens;
        } else {
          rawList = [parsed];
        }
      } else {
        return createEmptyResult(['Estrutura JSON inválida. Esperado um array ou objeto de quebras.']);
      }
    } else if (Array.isArray(rawInput)) {
      rawList = rawInput;
    } else if (rawInput && typeof rawInput === 'object') {
      rawList = [rawInput];
    } else {
      return createEmptyResult(['Formato de entrada não suportado.']);
    }
  } catch (err: any) {
    return createEmptyResult([`Erro de sintaxe JSON: ${err?.message || 'JSON inválido'}`]);
  }

  if (rawList.length === 0) {
    return createEmptyResult(['Nenhum registro encontrado no JSON informado.']);
  }

  // Sanitização de segurança de acordo com o padrão do projeto
  const sanitizedList = sanitizeData(rawList);

  const quebraRows: QuebraRow[] = [];
  const retroactiveRecords: RetroactiveRecord[] = [];

  let totalQuantidade = 0;
  let totalHlPerdido = 0;
  let totalValorAvaria = 0;

  const resumoPorArea: Record<string, { count: number; quantidade: number; valor: number; hl: number }> = {};
  const resumoPorMotivo: Record<string, { count: number; quantidade: number; valor: number; hl: number }> = {};
  const resumoPorMes: Record<string, { count: number; quantidade: number; valor: number; hl: number }> = {};
  const resumoPorColaborador: Record<string, { count: number; quantidade: number; valor: number; hl: number }> = {};

  sanitizedList.forEach((item: RawQuebraJsonItem, index: number) => {
    if (!item || typeof item !== 'object') {
      warnings.push(`Item na posição #${index + 1} foi ignorado por não ser um objeto válido.`);
      return;
    }

    // Normalização de chaves sem case sensitivity
    const lookup: Record<string, any> = {};
    Object.entries(item).forEach(([k, v]) => {
      const cleanKey = k.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      lookup[cleanKey] = v;
    });

    const rawData = item.Data || item.data || lookup['data'] || lookup['data lancamento'];
    const { dataISO, dataFormatada, hora } = parseDateString(rawData);

    const mes = String(
      item.Mês || item.Mes || item.mes || lookup['mes'] || getMesFromDate(dataISO)
    ).trim().toUpperCase();

    const codProduto = String(
      item.CodProduto || item.codProduto || lookup['codproduto'] || lookup['produto'] || lookup['codigo'] || '00000'
    ).trim();

    const descricao = String(
      item.Descricao || item.descricao || lookup['descricao'] || lookup['descricaoproduto'] || 'PRODUTO NÃO IDENTIFICADO'
    ).trim().toUpperCase();

    const quantidade = Math.max(1, parseNumberSafely(
      item.Quantidade || item.quantidade || lookup['quantidade'] || lookup['quant und.'] || lookup['quant und'] || lookup['qtd'],
      1
    ));

    const area = String(
      item.Area || item.area || lookup['area'] || lookup['setor'] || 'ARMAZEM'
    ).trim().toUpperCase();

    const turno = String(
      item.Turno || item.turno || lookup['turno'] || 'MANHÃ'
    ).trim();

    const codQuebra = String(
      item.CodQuebra || item.codQuebra || lookup['codquebra'] || lookup['cod quebra'] || lookup['codigoquebra'] || '524'
    ).trim();

    const motivo = String(
      item.Motivo || item.motivo || lookup['motivo'] || lookup['motivo quebra'] || 'FALTA NO PALETE'
    ).trim().toUpperCase();

    const colaborador = String(
      item.Colaborador || item.colaborador || lookup['colaborador'] || lookup['colaborador quebrou'] || lookup['responsavel'] || ''
    ).trim().toUpperCase();

    const funcao = String(
      item.Funcao || item.funcao || lookup['funcao'] || lookup['cargo'] || 'EMPILHADOR'
    ).trim().toUpperCase();

    const valorAvaria = parseNumberSafely(
      item['VALOR DA AVARIA'] || item['VALOR AVARIA'] || item.valorDaAvaria || item.valorAvaria || lookup['valor da avaria'] || lookup['valor avaria'] || lookup['valorunitario'] || lookup['valor'],
      0
    );

    const fatorHl = parseNumberSafely(
      item['HECTO LITRO'] || item['HECTOLITRO'] || item.hectoLitro || lookup['hecto litro'] || lookup['hectolitro'] || lookup['fator hl'],
      0.0035
    );

    const hlPerdido = parseNumberSafely(
      item['HECTO PERDIDO '] || item['HECTO PERDIDO'] || item['HECTOPERDIDO'] || item.hectoPerdido || lookup['hecto perdido'] || lookup['hectoperdido'] || lookup['hl perdido'],
      fatorHl * quantidade
    );

    const valorTotal = valorAvaria > 0 ? valorAvaria : (fatorHl * 100 * quantidade);
    const uniqueId = `qb-retro-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`;

    // 1. Cria a entidade QuebraRow para o Banco de Dados Operacional / Repositório
    const quebraRow: QuebraRow = {
      id: uniqueId,
      empresaId,
      data: `${dataFormatada} ${hora}:00`,
      dataISO,
      mes,
      codProduto,
      descricao,
      quantidade,
      caixas: quantidade,
      area,
      turno,
      codQuebra,
      motivo,
      colaboradorQuebrou: colaborador,
      responsavel: colaborador,
      funcao,
      fiscal: userNome,
      valorUnitario: valorAvaria / (quantidade || 1),
      valorTotal: valorAvaria,
      valor: valorAvaria,
      fatorHl,
      hlPerdido,
      tipoMarca: inferMarca(descricao),
      embalagem: inferEmbalagem(descricao),
      _criadoEm: new Date().toISOString()
    };

    // 2. Cria a entidade RetroactiveRecord para a camada de Dados Retroativos
    const retroRecord: RetroactiveRecord = {
      id: uniqueId,
      modulo: 'quebras',
      dataISO,
      dataFormatada,
      codigoProduto: codProduto,
      descricao: `${descricao} - ${motivo}`,
      quantidade,
      unidade: 'UN',
      valorFinanceiro: valorAvaria,
      operador: colaborador || userNome,
      setor: area,
      status: 'Concluído',
      empilhador: colaborador,
      horaInicio: hora,
      horaFim: hora,
      observacoes: `Cód. Quebra: ${codQuebra} | Motivo: ${motivo} | Função: ${funcao} | Turno: ${turno} | HL Perdido: ${hlPerdido.toFixed(4)} | Mês: ${mes}`,
      simuladoHistorico: true,
      criadoEm: new Date().toISOString()
    };

    quebraRows.push(quebraRow);
    retroactiveRecords.push(retroRecord);

    totalQuantidade += quantidade;
    totalHlPerdido += hlPerdido;
    totalValorAvaria += valorAvaria;

    // Agregações estatísticas
    // Área
    if (!resumoPorArea[area]) resumoPorArea[area] = { count: 0, quantidade: 0, valor: 0, hl: 0 };
    resumoPorArea[area].count++;
    resumoPorArea[area].quantidade += quantidade;
    resumoPorArea[area].valor += valorAvaria;
    resumoPorArea[area].hl += hlPerdido;

    // Motivo
    if (!resumoPorMotivo[motivo]) resumoPorMotivo[motivo] = { count: 0, quantidade: 0, valor: 0, hl: 0 };
    resumoPorMotivo[motivo].count++;
    resumoPorMotivo[motivo].quantidade += quantidade;
    resumoPorMotivo[motivo].valor += valorAvaria;
    resumoPorMotivo[motivo].hl += hlPerdido;

    // Mês
    if (!resumoPorMes[mes]) resumoPorMes[mes] = { count: 0, quantidade: 0, valor: 0, hl: 0 };
    resumoPorMes[mes].count++;
    resumoPorMes[mes].quantidade += quantidade;
    resumoPorMes[mes].valor += valorAvaria;
    resumoPorMes[mes].hl += hlPerdido;

    // Colaborador
    const colabKey = colaborador || 'NÃO INFORMADO';
    if (!resumoPorColaborador[colabKey]) resumoPorColaborador[colabKey] = { count: 0, quantidade: 0, valor: 0, hl: 0 };
    resumoPorColaborador[colabKey].count++;
    resumoPorColaborador[colabKey].quantidade += quantidade;
    resumoPorColaborador[colabKey].valor += valorAvaria;
    resumoPorColaborador[colabKey].hl += hlPerdido;
  });

  return {
    valid: quebraRows.length > 0,
    quebraRows,
    retroactiveRecords,
    totalRecords: quebraRows.length,
    totalQuantidade,
    totalHlPerdido,
    totalValorAvaria,
    resumoPorArea,
    resumoPorMotivo,
    resumoPorMes,
    resumoPorColaborador,
    errors,
    warnings
  };
}

function createEmptyResult(errors: string[]): ParsedQuebrasResult {
  return {
    valid: false,
    quebraRows: [],
    retroactiveRecords: [],
    totalRecords: 0,
    totalQuantidade: 0,
    totalHlPerdido: 0,
    totalValorAvaria: 0,
    resumoPorArea: {},
    resumoPorMotivo: {},
    resumoPorMes: {},
    resumoPorColaborador: {},
    errors,
    warnings: []
  };
}

function getMesFromDate(isoDate: string): string {
  try {
    const parts = isoDate.split('-');
    if (parts.length >= 2) {
      const monthIdx = parseInt(parts[1], 10) - 1;
      const meses = [
        'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
        'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
      ];
      return meses[monthIdx] || 'JANEIRO';
    }
  } catch (e) {
    // fallback
  }
  return 'JANEIRO';
}

function inferMarca(desc: string): string {
  const d = desc.toUpperCase();
  if (d.includes('BUDWEISER') || d.includes('BUD')) return 'BUDWEISER';
  if (d.includes('STELLA')) return 'STELLA ARTOIS';
  if (d.includes('CORONA')) return 'CORONA';
  if (d.includes('BRAHMA')) return 'BRAHMA';
  if (d.includes('SKOL')) return 'SKOL';
  if (d.includes('ANTARCTICA')) return 'ANTARCTICA';
  if (d.includes('HEINEKEN')) return 'HEINEKEN';
  if (d.includes('SPATEN')) return 'SPATEN';
  if (d.includes('BECKS') || d.includes("BECK'S")) return "BECK'S";
  if (d.includes('ORIGINAL')) return 'ORIGINAL';
  if (d.includes('GUARANA') || d.includes('GUARANÁ')) return 'GUARANÁ ANTARCTICA';
  if (d.includes('PEPSI')) return 'PEPSI';
  if (d.includes('BEATS')) return 'SKOL BEATS';
  if (d.includes('GATORADE')) return 'GATORADE';
  if (d.includes('RED BULL')) return 'RED BULL';
  return 'OUTRAS MARCAS';
}

function inferEmbalagem(desc: string): string {
  const d = desc.toUpperCase();
  if (d.includes('600')) return 'Garrafa 600ml';
  if (d.includes('300') || d.includes('RF') || d.includes('RETORNÁVEL') || d.includes('RETORNAVEL')) return 'Garrafa 300ml';
  if (d.includes('473') || d.includes('LATÃO') || d.includes('LATAO') || d.includes('SLEEK')) return 'Lata 473ml';
  if (d.includes('350') || d.includes('355') || d.includes('269') || d.includes('LATA') || d.includes('LT')) return 'Lata 350ml/269ml';
  if (d.includes('LN') || d.includes('LONG') || d.includes('330') || d.includes('275')) return 'Long Neck 330ml';
  if (d.includes('1L') || d.includes('1 L') || d.includes('LITRÃO') || d.includes('LITRAO') || d.includes('1000')) return 'Garrafa 1L';
  if (d.includes('PET') || d.includes('2L') || d.includes('1.5L')) return 'PET';
  return 'Lata / Garrafa';
}
