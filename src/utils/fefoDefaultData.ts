import { ValidadeRow } from '../types';
import validadesRecolhidasSemana3Data from '../data/validadesRecolhidasSemana3.json';
import validadesRecolhidasSemana4Data from '../data/validadesRecolhidasSemana4.json';

export const DEFAULT_OFFICIAL_VALIDADES_WEEK4: ValidadeRow[] = (validadesRecolhidasSemana4Data as ValidadeRow[]).map((item, idx) => ({
  ...item,
  id: item.id || `val_${item.codigo}_sem4_${idx + 1}`,
  dataColeta: '28/08/2026',
  semanaNumero: 4,
  mesReferencia: '08'
}));

export const DEFAULT_OFFICIAL_VALIDADES_WEEK3: ValidadeRow[] = (validadesRecolhidasSemana3Data as ValidadeRow[]).map((item, idx) => ({
  ...item,
  id: item.id || `val_${item.codigo}_sem3_${idx + 1}`,
  dataColeta: '21/08/2026',
  semanaNumero: 3,
  mesReferencia: '08'
}));

export function getInitialDefaultValidades(companyId: string = 'demo'): ValidadeRow[] {
  return DEFAULT_OFFICIAL_VALIDADES_WEEK4.map(item => ({
    ...item,
    empresaId: companyId
  }));
}

/**
 * Remove itens legados de seed/mock ou versões antigas com poucos itens, garantindo os 314 recolhidos
 */
export function removeLegacySeedValidades(rows: ValidadeRow[], companyId: string = 'demo'): ValidadeRow[] {
  if (!Array.isArray(rows) || rows.length < 100) {
    return getInitialDefaultValidades(companyId);
  }
  const filtered = rows.filter(r => {
    const docId = String(r._docId || '');
    const id = String(r.id || '');
    if (docId.startsWith('seed-val-') || id.startsWith('seed-val-')) return false;
    return true;
  });

  if (filtered.length < 100) {
    return getInitialDefaultValidades(companyId);
  }
  return filtered;
}

