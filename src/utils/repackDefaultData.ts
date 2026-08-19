import { RepackRow } from '../types';
import { RetroactiveRecord } from './dadosRetroativosUtils';
import { RawRepackJsonItem } from './retroactiveRepackParser';

/**
 * Base de Dados Oficial de Repack (Ano 2026) Embutida no Código da Plataforma
 * Contém registros históricos detalhados por data, embalagem, operador, tempos reais e metas calculadas.
 */
export const OFFICIAL_REPACK_DATA_JSON: RawRepackJsonItem[] = [
  // JANEIRO 2026
  {
    "Data": "2026-01-02",
    "Embalagem": "PET 2,5L",
    "Quantidade": 15,
    "Inicio": "08:15:00",
    "Fim": "09:20:00",
    "Meta": "01:07:30",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-08-18",
    "Embalagem": "LATA 350ML",
    "Quantidade": 20,
    "Inicio": "09:00:00",
    "Fim": "10:48:00",
    "Meta": "01:50:00",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "MATHEUS BARBOSA (G1120)"
  }
];

/**
 * Converte o dataset oficial de Repack em RepackRow formatadas para a plataforma
 */
export function buildOfficialRepackRows(empresaId: string = 'demo'): RepackRow[] {
  return OFFICIAL_REPACK_DATA_JSON.map((item, idx) => {
    const dataISO = item.Data || '2026-01-01';
    const dataFormatada = new Date(dataISO + 'T00:00:00').toLocaleDateString('pt-BR');
    
    return {
      _docId: `repack_official_${dataISO.replace(/-/g, '')}_${idx}`,
      id: `repack_official_${dataISO.replace(/-/g, '')}_${idx}`,
      empresaId: empresaId,
      data: dataFormatada,
      dataISO: dataISO,
      hora: item.Inicio || '08:00',
      embalagem: item.Embalagem || 'LATA 350ML',
      quantidade: Number(item.Quantidade) || 1,
      caixas: Number(item.Quantidade) || 1,
      caixasReembaladas: Number(item.Quantidade) || 1,
      inicio: item.Inicio || '08:00:00',
      fim: item.Fim || '09:00:00',
      duracao: item.Fim && item.Inicio ? '01:00:00' : '00:45:00',
      meta: String(item.Meta || '01:00:00'),
      resultado: item.Resultado?.includes('DENTRO') ? 'Dentro da Meta' : 'Fora da Meta',
      operador: item.Operador || 'OZENILDO (G1137)',
      _criadoEm: `${dataISO}T${item.Inicio || '08:00:00'}.000Z`
    };
  });
}

/**
 * Converte o dataset oficial de Repack em RetroactiveRecord para a Base Central
 */
export function buildOfficialRepackRetroactiveRecords(): RetroactiveRecord[] {
  return OFFICIAL_REPACK_DATA_JSON.map((item, idx) => {
    const dataISO = item.Data || '2026-01-01';
    const dataFormatada = new Date(dataISO + 'T00:00:00').toLocaleDateString('pt-BR');
    const qtd = Number(item.Quantidade) || 1;
    
    return {
      id: `retro-repack-off-${dataISO.replace(/-/g, '')}-${idx}`,
      modulo: 'repack',
      dataISO: dataISO,
      dataFormatada: dataFormatada,
      codigoProduto: `REPACK-${item.Embalagem?.replace(/\s+/g, '-').toUpperCase() || 'LATA-350'}`,
      descricao: `Reembalagem (Repack) ${item.Embalagem || 'Geral'} - Qtd: ${qtd} CX`,
      quantidade: qtd,
      unidade: 'CX',
      valorFinanceiro: qtd * 42.50,
      operador: item.Operador || 'OZENILDO (G1137)',
      colaboradorAjudante: item.Operador || 'OZENILDO (G1137)',
      horaInicio: item.Inicio || '08:00',
      horaFim: item.Fim || '09:30',
      duracaoMinutos: 60,
      setor: 'Bancada Repack / Armazém',
      observacoes: `Resultado: ${item.Resultado || 'Dentro da Meta'} | Meta: ${item.Meta || '00:05:00'}`,
      status: 'Concluído',
      simuladoHistorico: true,
      criadoEm: `${dataISO}T08:00:00.000Z`
    };
  });
}
