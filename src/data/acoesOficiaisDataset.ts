import { convertRawItemToAcaoCorretiva, RawAcaoItem } from './acoesTransformer';
import { AcaoCorretiva } from '../utils/simulacaoAcoesUtils';
import { ACOES_OFICIAIS_QUEBRAS_20 } from './acoesQuebrasOficiais20';
import { ACOES_OFICIAIS_REPACK_20 } from './acoesRepackOficiais20';
import { ACOES_OFICIAIS_DESPEJO_10 } from './acoesDespejoOficiais10';
import { ACOES_OFICIAIS_OPERADORES_40 } from './acoesOperadoresOficiais40';
import { ACOES_OFICIAIS_LAYOUT_CAPACIDADE_20 } from './acoesLayoutCapacidadeOficiais20';
import { ACOES_OFICIAIS_MONTAGEM_CARREGAMENTO_40 } from './acoesMontagemCarregamentoOficiais40';
import acoesJson from './acoesOficiais2026.json';

export const ACOES_OFICIAIS_METADATA = {
  versao: acoesJson.versao,
  origem: acoesJson.origem,
  descricao: acoesJson.descricao,
  total_acoes: acoesJson.total_acoes,
  data_limite: acoesJson.data_limite
};

let cachedAcoes: AcaoCorretiva[] | null = null;

export function getOfficialSeededAcoes(): AcaoCorretiva[] {
  if (cachedAcoes) return cachedAcoes;
  
  const rawList = (acoesJson.acoes || []) as RawAcaoItem[];
  const converted = rawList.map(convertRawItemToAcaoCorretiva);
  
  // Filter out any legacy actions for Quebras, Repack, Despejo, Operadores/Ressuprimento, and Layout/Capacidade
  // to strictly enforce only the official DPO datasets requested.
  const filteredLegacy = converted.filter(a => {
    const p = (a.processo || '').toLowerCase();
    const ind = (a.indicador || '').toLowerCase();
    const desv = (a.desvioEncontrado || '').toLowerCase();
    const text = `${p} ${ind} ${desv}`;

    const isQuebra = text.includes('quebra') || text.includes('avaria');
    const isRepack = text.includes('repack');
    const isDespejo = text.includes('despejo');
    const isOperador = text.includes('empilhador') || text.includes('ressuprimento') || text.includes('reabastecimento') || text.includes('movimentação');
    const isLayoutCapacidade = text.includes('layout') || text.includes('capacidade') || text.includes('ocupação') || text.includes('curva abc');

    return !isQuebra && !isRepack && !isDespejo && !isOperador && !isLayoutCapacidade;
  });

  cachedAcoes = [
    ...ACOES_OFICIAIS_QUEBRAS_20,
    ...ACOES_OFICIAIS_REPACK_20,
    ...ACOES_OFICIAIS_DESPEJO_10,
    ...ACOES_OFICIAIS_OPERADORES_40,
    ...ACOES_OFICIAIS_LAYOUT_CAPACIDADE_20,
    ...ACOES_OFICIAIS_MONTAGEM_CARREGAMENTO_40,
    ...filteredLegacy
  ];

  return cachedAcoes;
}
