import { ValidadeRow } from '../types';

export function getInitialDefaultValidades(_companyId: string = 'demo'): ValidadeRow[] {
  // Retorna lista zerada por padrão para que o estoque seja 100% alimentado pelas coletas reais do conferente
  return [];
}

/**
 * Remove itens legados de seed/mock que possam estar salvos no localStorage
 */
export function removeLegacySeedValidades(rows: ValidadeRow[]): ValidadeRow[] {
  if (!Array.isArray(rows)) return [];
  return rows.filter(r => {
    const docId = String(r._docId || '');
    const id = String(r.id || '');
    if (docId.startsWith('seed-val-') || id.startsWith('seed-val-')) return false;
    return true;
  });
}

