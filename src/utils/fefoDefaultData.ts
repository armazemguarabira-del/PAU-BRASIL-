import { ValidadeRow } from '../types';
import validadesRecolhidasSemana3Data from '../data/validadesRecolhidasSemana3.json';
import validadesRecolhidasSemana4Data from '../data/validadesRecolhidasSemana4.json';
import { calcularTotalCaixas } from '../data/coletaPackagingData';

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

export function normalizeDateString(dateStr: string): string {
  if (!dateStr) return '';
  const s = String(dateStr).trim();
  if (s.includes('T')) return s.split('T')[0];
  if (s.includes('-')) {
    const parts = s.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) return s.slice(0, 10);
      const [d, m, y] = parts;
      const fullY = y.length === 2 ? `20${y}` : y;
      return `${fullY}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }
  if (s.includes('/')) {
    const parts = s.split('/');
    if (parts.length === 3) {
      const [d, m, y] = parts;
      const fullY = y.length === 2 ? `20${y}` : y;
      return `${fullY}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }
  return s;
}

/**
 * Converte qualquer formato de data (ISO, YYYY-MM-DD, Timestamp, etc.)
 * rigorosamente para o padrão brasileiro DD/MM/AAAA.
 */
export function formatDateToBR(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  const s = String(dateStr).trim();
  if (!s) return '';

  // ISO com T (ex: 2026-10-01T00:00:00)
  if (s.includes('T')) {
    const isoPart = s.split('T')[0];
    const parts = isoPart.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
    }
  }

  // Já no formato DD/MM/AAAA ou D/M/AA
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(s)) {
    const parts = s.split('/');
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    return `${d}/${m}/${y}`;
  }

  // No formato YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(s)) {
    const parts = s.substring(0, 10).split('-');
    return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
  }

  // No formato DD-MM-YYYY
  if (/^\d{1,2}-\d{1,2}-\d{2,4}$/.test(s)) {
    const parts = s.split('-');
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    return `${d}/${m}/${y}`;
  }

  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return s;
}

export function matchValidade(item: any, target: { codigo?: string; validade?: string; id?: string; _docId?: string }): boolean {
  if (!item || !target) return false;
  if (target._docId && item._docId && String(target._docId) === String(item._docId)) return true;
  if (target.id && item.id && String(target.id) === String(item.id)) return true;
  
  const targetCod = String(target.codigo || '').replace(/^0+/, '').trim();
  const itemCod = String(item.codigo || item.cod || '').replace(/^0+/, '').trim();
  
  if (targetCod && itemCod && targetCod === itemCod) {
    if (!target.validade || !item.validade) return true;
    const targetVal = String(target.validade).trim();
    const itemVal = String(item.validade).trim();
    if (targetVal === itemVal) return true;
    const normTargetVal = normalizeDateString(targetVal);
    const normItemVal = normalizeDateString(itemVal);
    if (normTargetVal && normItemVal && normTargetVal === normItemVal) return true;
  }
  return false;
}

export function isValidadeDeleted(item: any, companyId: string = 'demo'): boolean {
  try {
    const raw = localStorage.getItem(`fefo_deleted_validades_${companyId}`) || localStorage.getItem('fefo_deleted_validades_global');
    if (!raw) return false;
    const deletedList: any[] = JSON.parse(raw);
    if (!Array.isArray(deletedList) || deletedList.length === 0) return false;
    return deletedList.some(target => matchValidade(item, target));
  } catch (e) {
    return false;
  }
}

export function markValidadeAsDeleted(
  target: { codigo?: string; validade?: string; id?: string; _docId?: string; lote?: string },
  companyId: string = 'demo'
) {
  try {
    const key = `fefo_deleted_validades_${companyId}`;
    const globalKey = 'fefo_deleted_validades_global';
    
    let list: any[] = [];
    try {
      const stored = localStorage.getItem(key) || localStorage.getItem(globalKey);
      if (stored) list = JSON.parse(stored);
      if (!Array.isArray(list)) list = [];
    } catch (e) {
      list = [];
    }

    list.push(target);
    localStorage.setItem(key, JSON.stringify(list));
    localStorage.setItem(globalKey, JSON.stringify(list));

    // Limpa de TODAS as chaves de validades do localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey && (storageKey.startsWith('validades_') || storageKey.startsWith('armazem_validades_'))) {
        try {
          const val = localStorage.getItem(storageKey);
          if (val) {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) {
              const cleaned = parsed.filter(item => !matchValidade(item, target));
              localStorage.setItem(storageKey, JSON.stringify(cleaned));
            }
          }
        } catch (_) {}
      }
    }
  } catch (e) {
    console.error('Erro ao marcar validade como excluída:', e);
  }
}

export function getValidadeQty(item: any): number {
  if (!item) return 0;

  // 1. Quantidade explícita anotada/recolhida (prioridade absoluta)
  const q = item.quantidade;
  if (q !== undefined && q !== null && !isNaN(Number(q)) && Number(q) > 0) {
    return Number(q);
  }
  const tu = item.totalUnities;
  if (tu !== undefined && tu !== null && !isNaN(Number(tu)) && Number(tu) > 0) {
    return Number(tu);
  }
  const tur = item.totalUnitiesRaw;
  if (tur !== undefined && tur !== null && !isNaN(Number(tur)) && Number(tur) > 0) {
    return Number(tur);
  }

  // 2. Se tiver paletes, lastros ou caixas avulsas anotadas pelo conferente,
  // calcula com fidelidade total usando a função oficial de paletização
  const p = Number(item.palhete) || 0;
  const l = Number(item.lastro) || 0;
  const c = Number(item.caixa) || 0;
  if (p > 0 || l > 0 || c > 0) {
    const calc = calcularTotalCaixas(item.codigo, p, l, c);
    if (calc > 0) return calc;
    if (c > 0) return c;
  }

  if (item.caixa !== undefined && item.caixa !== null && !isNaN(Number(item.caixa)) && Number(item.caixa) > 0) {
    return Number(item.caixa);
  }

  return 0;
}

export function getInitialDefaultValidades(companyId: string = 'demo'): ValidadeRow[] {
  return DEFAULT_OFFICIAL_VALIDADES_WEEK4
    .filter(item => !isValidadeDeleted(item, companyId) && getValidadeQty(item) > 0)
    .map(item => ({
      ...item,
      empresaId: companyId
    }));
}

/**
 * Remove itens legados de seed/mock ou versões antigas com poucos itens, garantindo os 314 recolhidos
 */
export function removeLegacySeedValidades(rows: ValidadeRow[], companyId: string = 'demo'): ValidadeRow[] {
  if (!Array.isArray(rows) || rows.length === 0) {
    return getInitialDefaultValidades(companyId);
  }
  const filtered = rows.filter(r => {
    if (isValidadeDeleted(r, companyId)) return false;
    if (getValidadeQty(r) <= 0) return false;
    const docId = String(r._docId || '');
    const id = String(r.id || '');
    if (docId.startsWith('seed-val-') || id.startsWith('seed-val-')) return false;
    return true;
  });

  return filtered;
}


