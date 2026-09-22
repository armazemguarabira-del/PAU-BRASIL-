import { formatDateToBR, normalizeDateString } from './dateUtils';

export interface FefoDashboardOverride {
  codigo: string;
  descricao?: string;
  validadeOriginal: string; // Ex: '05/11/2026' ou '2026-11-05'
  novaValidade: string;     // Ex: '05/11/2026'
  quantidade: number;       // Quantidade exata definida no Dashboard
  localizacao?: string;
  bloco?: string;
  atualizadoEm: string;
  isDeleted?: boolean;      // Item removido do Dashboard
  observacao?: string;
}

const STORAGE_PREFIX = 'fefo_dashboard_overrides_';

/**
 * Gera uma chave única padronizada para identificar o lote no Dashboard:
 * Ex: '4293_05/11/2026'
 */
export function getDashboardOverrideKey(codigo: string | number, validade?: string): string {
  const cleanCod = String(codigo || '').replace(/^0+/, '').trim();
  const valBR = validade ? formatDateToBR(validade) : '';
  return `${cleanCod}_${valBR}`;
}

/**
 * Obtém todos os ajustes manuais de recontagem realizados no Dashboard para a empresa
 */
export function getDashboardOverrides(companyId: string): Record<string, FefoDashboardOverride> {
  const cId = companyId || 'demo';
  const key = `${STORAGE_PREFIX}${cId}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (err) {
    console.warn('[dashboardOverridesManager] Erro ao carregar overrides:', err);
    return {};
  }
}

/**
 * Salva um ajuste manual de recontagem realizado no Dashboard.
 * NÃO altera a contagem física original recolhida pelo conferente.
 */
export function saveDashboardOverride(companyId: string, override: FefoDashboardOverride): void {
  const cId = companyId || 'demo';
  const key = `${STORAGE_PREFIX}${cId}`;
  try {
    const current = getDashboardOverrides(cId);
    const itemKey = getDashboardOverrideKey(override.codigo, override.validadeOriginal);
    
    current[itemKey] = {
      ...override,
      atualizadoEm: new Date().toISOString()
    };

    localStorage.setItem(key, JSON.stringify(current));

    // Notifica componentes em tempo real
    window.dispatchEvent(new CustomEvent('fefo_dashboard_overrides_changed', { 
      detail: { companyId: cId, key: itemKey, override } 
    }));
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    console.error('[dashboardOverridesManager] Erro ao salvar override:', err);
  }
}

/**
 * Remove um ajuste manual do Dashboard (restaura a contagem original do conferente)
 */
export function removeDashboardOverride(companyId: string, codigo: string | number, validadeOriginal?: string): void {
  const cId = companyId || 'demo';
  const key = `${STORAGE_PREFIX}${cId}`;
  try {
    const current = getDashboardOverrides(cId);
    const itemKey = getDashboardOverrideKey(codigo, validadeOriginal);
    
    if (current[itemKey]) {
      delete current[itemKey];
    } else {
      // Se não encontrou pela chave composta exata, remove todas do mesmo código
      const cleanCod = String(codigo).replace(/^0+/, '').trim();
      Object.keys(current).forEach(k => {
        if (k.startsWith(`${cleanCod}_`)) {
          delete current[k];
        }
      });
    }

    localStorage.setItem(key, JSON.stringify(current));

    window.dispatchEvent(new CustomEvent('fefo_dashboard_overrides_changed', { 
      detail: { companyId: cId, key: itemKey, removed: true } 
    }));
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    console.error('[dashboardOverridesManager] Erro ao remover override:', err);
  }
}

/**
 * Marca um item como excluído exclusivamente no Dashboard, preservando o registro de coleta do conferente
 */
export function deleteItemFromDashboard(companyId: string, codigo: string | number, validadeOriginal: string, descricao?: string): void {
  saveDashboardOverride(companyId, {
    codigo: String(codigo),
    descricao,
    validadeOriginal,
    novaValidade: validadeOriginal,
    quantidade: 0,
    isDeleted: true,
    atualizadoEm: new Date().toISOString()
  });
}

/**
 * Procura se existe um override para o item especificado
 */
export function findDashboardOverride(
  overrides: Record<string, FefoDashboardOverride>,
  codigo: string | number,
  validade?: string
): FefoDashboardOverride | undefined {
  const cleanCod = String(codigo || '').replace(/^0+/, '').trim();
  const valBR = validade ? formatDateToBR(validade) : '';
  
  // 1. Match exato: código + validade BR
  const exactKey = `${cleanCod}_${valBR}`;
  if (overrides[exactKey]) return overrides[exactKey];

  // 2. Match normalizando data
  const normVal = validade ? normalizeDateString(validade) : '';
  for (const k of Object.keys(overrides)) {
    const item = overrides[k];
    const itemCod = String(item.codigo).replace(/^0+/, '').trim();
    if (itemCod === cleanCod) {
      if (!valBR || !item.validadeOriginal) return item;
      if (formatDateToBR(item.validadeOriginal) === valBR || normalizeDateString(item.validadeOriginal) === normVal) {
        return item;
      }
    }
  }

  return undefined;
}
