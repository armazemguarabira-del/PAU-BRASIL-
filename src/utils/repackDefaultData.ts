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
    "Data": "2026-01-02",
    "Embalagem": "GARRAFA 600ML",
    "Quantidade": 18,
    "Inicio": "10:00:00",
    "Fim": "11:25:00",
    "Meta": "01:30:00",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-05",
    "Embalagem": "LATA 350ML",
    "Quantidade": 22,
    "Inicio": "08:30:00",
    "Fim": "10:28:00",
    "Meta": "02:01:00",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "CARLOS SILVA (G2040)"
  },
  {
    "Data": "2026-01-05",
    "Embalagem": "LONG NECK 330ML",
    "Quantidade": 14,
    "Inicio": "13:30:00",
    "Fim": "15:05:00",
    "Meta": "01:24:00",
    "Resultado": "🔴 ACIMA DA META",
    "Operador": "CARLOS SILVA (G2040)"
  },
  {
    "Data": "2026-01-08",
    "Embalagem": "PET 2L",
    "Quantidade": 20,
    "Inicio": "09:00:00",
    "Fim": "10:35:00",
    "Meta": "01:40:00",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "MARCOS SOUZA (G3102)"
  },
  {
    "Data": "2026-01-12",
    "Embalagem": "LATA 473ML",
    "Quantidade": 16,
    "Inicio": "14:00:00",
    "Fim": "15:22:00",
    "Meta": "01:28:00",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "MATHEUS BARBOSA (G1120)"
  },
  {
    "Data": "2026-01-15",
    "Embalagem": "600 OW",
    "Quantidade": 25,
    "Inicio": "08:00:00",
    "Fim": "10:02:00",
    "Meta": "02:05:00",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "PAULO PEREIRA (G1099)"
  },
  {
    "Data": "2026-01-20",
    "Embalagem": "PET 1L",
    "Quantidade": 12,
    "Inicio": "10:30:00",
    "Fim": "11:32:00",
    "Meta": "01:06:00",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-26",
    "Embalagem": "LATA 269ML",
    "Quantidade": 18,
    "Inicio": "13:00:00",
    "Fim": "14:18:00",
    "Meta": "01:21:00",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "CARLOS SILVA (G2040)"
  },
  
  // FEVEREIRO 2026
  {
    "Data": "2026-02-02",
    "Embalagem": "LATA 350ML",
    "Quantidade": 24,
    "Inicio": "08:00:00",
    "Fim": "10:05:00",
    "Meta": "02:12:00",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-04",
    "Embalagem": "PET 2L",
    "Quantidade": 16,
    "Inicio": "10:30:00",
    "Fim": "11:45:00",
    "Meta": "01:20:00",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "MATHEUS BARBOSA (G1120)"
  },
  {
    "Data": "2026-02-09",
    "Embalagem": "LONG NECK 330ML",
    "Quantidade": 20,
    "Inicio": "13:15:00",
    "Fim": "15:10:00",
    "Meta": "02:00:00",
    "Resultado": "🔴 ACIMA DA META",
    "Operador": "MARCOS SOUZA (G3102)"
  },
  {
    "Data": "2026-02-12",
    "Embalagem": "GARRAFA 600ML",
    "Quantidade": 22,
    "Inicio": "08:30:00",
    "Fim": "10:15:00",
    "Meta": "01:50:00",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "PAULO PEREIRA (G1099)"
  },
  {
    "Data": "2026-02-18",
    "Embalagem": "PET 2,5L",
    "Quantidade": 14,
    "Inicio": "09:00:00",
    "Fim": "10:00:00",
    "Meta": "01:03:00",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "CARLOS SILVA (G2040)"
  },
  {
    "Data": "2026-02-23",
    "Embalagem": "600 OW",
    "Quantidade": 19,
    "Inicio": "14:00:00",
    "Fim": "15:32:00",
    "Meta": "01:35:00",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-27",
    "Embalagem": "LATA 350ML",
    "Quantidade": 28,
    "Inicio": "08:10:00",
    "Fim": "10:38:00",
    "Meta": "02:34:00",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "MATHEUS BARBOSA (G1120)"
  },

  // MARÇO 2026
  {
    "Data": "2026-03-03",
    "Embalagem": "PET 2L",
    "Quantidade": 18,
    "Inicio": "08:30:00",
    "Fim": "09:55:00",
    "Meta": "01:30:00",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-06",
    "Embalagem": "LATA 473ML",
    "Quantidade": 20,
    "Inicio": "10:15:00",
    "Fim": "12:00:00",
    "Meta": "01:50:00",
    "Resultado": "🔴 ACIMA DA META",
    "Operador": "CARLOS SILVA (G2040)"
  },
  {
    "Data": "2026-03-11",
    "Embalagem": "LONG NECK 330ML",
    "Quantidade": 15,
    "Inicio": "13:30:00",
    "Fim": "14:58:00",
    "Meta": "01:30:00",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "MARCOS SOUZA (G3102)"
  },
  {
    "Data": "2026-03-18",
    "Embalagem": "GARRAFA 600ML",
    "Quantidade": 26,
    "Inicio": "08:00:00",
    "Fim": "10:05:00",
    "Meta": "02:10:00",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "PAULO PEREIRA (G1099)"
  },
  {
    "Data": "2026-03-25",
    "Embalagem": "PET 500ML",
    "Quantidade": 22,
    "Inicio": "14:00:00",
    "Fim": "15:45:00",
    "Meta": "01:50:00",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "MATHEUS BARBOSA (G1120)"
  },

  // ABRIL 2026
  {
    "Data": "2026-04-02",
    "Embalagem": "LATA 350ML",
    "Quantidade": 30,
    "Inicio": "08:00:00",
    "Fim": "10:40:00",
    "Meta": "02:45:00",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-08",
    "Embalagem": "PET 2,5L",
    "Quantidade": 16,
    "Inicio": "10:30:00",
    "Fim": "11:38:00",
    "Meta": "01:12:00",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "CARLOS SILVA (G2040)"
  },
  {
    "Data": "2026-04-15",
    "Embalagem": "LONG NECK 330ML",
    "Quantidade": 18,
    "Inicio": "13:00:00",
    "Fim": "14:45:00",
    "Meta": "01:48:00",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "MARCOS SOUZA (G3102)"
  },
  {
    "Data": "2026-04-22",
    "Embalagem": "600 OW",
    "Quantidade": 21,
    "Inicio": "08:30:00",
    "Fim": "10:12:00",
    "Meta": "01:45:00",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "PAULO PEREIRA (G1099)"
  },

  // MAIO 2026
  {
    "Data": "2026-05-04",
    "Embalagem": "PET 2L",
    "Quantidade": 22,
    "Inicio": "08:00:00",
    "Fim": "09:48:00",
    "Meta": "01:50:00",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-05-12",
    "Embalagem": "LATA 350ML",
    "Quantidade": 26,
    "Inicio": "10:00:00",
    "Fim": "12:20:00",
    "Meta": "02:23:00",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "MATHEUS BARBOSA (G1120)"
  },
  {
    "Data": "2026-05-19",
    "Embalagem": "GARRAFA 600ML",
    "Quantidade": 24,
    "Inicio": "13:30:00",
    "Fim": "15:28:00",
    "Meta": "02:00:00",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "CARLOS SILVA (G2040)"
  },

  // JUNHO 2026
  {
    "Data": "2026-06-03",
    "Embalagem": "LATA 269ML",
    "Quantidade": 20,
    "Inicio": "08:30:00",
    "Fim": "09:58:00",
    "Meta": "01:30:00",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "MARCOS SOUZA (G3102)"
  },
  {
    "Data": "2026-06-11",
    "Embalagem": "PET 2,5L",
    "Quantidade": 18,
    "Inicio": "10:15:00",
    "Fim": "11:32:00",
    "Meta": "01:21:00",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "PAULO PEREIRA (G1099)"
  },
  {
    "Data": "2026-06-18",
    "Embalagem": "LONG NECK 330ML",
    "Quantidade": 16,
    "Inicio": "14:00:00",
    "Fim": "15:35:00",
    "Meta": "01:36:00",
    "Resultado": "🔴 ACIMA DA META",
    "Operador": "OZENILDO (G1137)"
  },

  // JULHO 2026
  {
    "Data": "2026-07-02",
    "Embalagem": "LATA 350ML",
    "Quantidade": 28,
    "Inicio": "08:00:00",
    "Fim": "10:30:00",
    "Meta": "02:34:00",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-07-10",
    "Embalagem": "PET 2L",
    "Quantidade": 20,
    "Inicio": "10:00:00",
    "Fim": "11:38:00",
    "Meta": "01:40:00",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "CARLOS SILVA (G2040)"
  },
  {
    "Data": "2026-07-21",
    "Embalagem": "600 OW",
    "Quantidade": 22,
    "Inicio": "13:30:00",
    "Fim": "15:18:00",
    "Meta": "01:50:00",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "MATHEUS BARBOSA (G1120)"
  },

  // AGOSTO 2026 (Mês Atual)
  {
    "Data": "2026-08-03",
    "Embalagem": "LATA 350ML",
    "Quantidade": 25,
    "Inicio": "08:15:00",
    "Fim": "10:30:00",
    "Meta": "02:17:30",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-08-07",
    "Embalagem": "LONG NECK 330ML",
    "Quantidade": 17,
    "Inicio": "10:40:00",
    "Fim": "12:20:00",
    "Meta": "01:42:00",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "CARLOS SILVA (G2040)"
  },
  {
    "Data": "2026-08-11",
    "Embalagem": "PET 2L",
    "Quantidade": 21,
    "Inicio": "13:00:00",
    "Fim": "14:42:00",
    "Meta": "01:45:00",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "MARCOS SOUZA (G3102)"
  },
  {
    "Data": "2026-08-14",
    "Embalagem": "PET 2,5L",
    "Quantidade": 16,
    "Inicio": "08:30:00",
    "Fim": "09:40:00",
    "Meta": "01:12:00",
    "Resultado": "🟢 DENTRO DA META",
    "Operador": "PAULO PEREIRA (G1099)"
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
