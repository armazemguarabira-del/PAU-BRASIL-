import { ValidadeRow } from '../types';
import { formatDateToBR, normalizeDateString } from './fefoDefaultData';

export interface DashboardValidadeAdjustment {
  codigo: string;
  validadeOriginal: string; // DD/MM/AAAA ou ISO
  quantidade: number;       // Quantidade exata e definitiva no Dashboard
  novaValidade?: string;    // DD/MM/AAAA se alterada
  localizacao?: string;
  bloco?: string;
  isExcluded?: boolean;     // Se marcado como excluído apenas no Dashboard
  ajustadoEm: string;
  ajustadoPor?: string;
  originalQty?: number;     // Guarda a contagem original recolhida pelo conferente
}

export function getAdjustmentKey(codigo: string | number, validade: string): string {
  const codClean = String(codigo || '').replace(/^0+/, '').trim();
  const valBR = formatDateToBR(validade || '');
  return `${codClean}_${valBR}`;
}

const STORAGE_PREFIX = 'fefo_dashboard_adjustments_';

export function getDashboardAdjustments(companyId: string): Record<string, DashboardValidadeAdjustment> {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${companyId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    console.error('[getDashboardAdjustments] Erro ao ler ajustes:', e);
  }
  return {};
}

export function saveDashboardAdjustment(companyId: string, adjustment: DashboardValidadeAdjustment): void {
  try {
    const adjustments = getDashboardAdjustments(companyId);
    const key = getAdjustmentKey(adjustment.codigo, adjustment.validadeOriginal);
    adjustments[key] = {
      ...adjustment,
      codigo: String(adjustment.codigo).replace(/^0+/, '').trim(),
      validadeOriginal: formatDateToBR(adjustment.validadeOriginal),
      novaValidade: adjustment.novaValidade ? formatDateToBR(adjustment.novaValidade) : formatDateToBR(adjustment.validadeOriginal),
      ajustadoEm: new Date().toISOString()
    };
    localStorage.setItem(`${STORAGE_PREFIX}${companyId}`, JSON.stringify(adjustments));
    window.dispatchEvent(new Event('fefo_adjustments_updated'));
  } catch (e) {
    console.error('[saveDashboardAdjustment] Erro ao salvar ajuste:', e);
  }
}

export function removeDashboardAdjustment(companyId: string, codigo: string | number, validade: string): void {
  try {
    const adjustments = getDashboardAdjustments(companyId);
    const key = getAdjustmentKey(codigo, validade);
    if (adjustments[key]) {
      delete adjustments[key];
      localStorage.setItem(`${STORAGE_PREFIX}${companyId}`, JSON.stringify(adjustments));
      window.dispatchEvent(new Event('fefo_adjustments_updated'));
    }
  } catch (e) {
    console.error('[removeDashboardAdjustment] Erro ao remover ajuste:', e);
  }
}

/**
 * Aplica os ajustes exclusivos do Dashboard sobre uma lista de validades originais do conferente,
 * garantindo que a quantidade ajustada pelo usuário no Dashboard seja exatamente a configurada,
 * sem duplicar somas e sem modificar os dados originais do conferente.
 */
export function applyDashboardAdjustments(validades: ValidadeRow[], companyId: string): ValidadeRow[] {
  const adjustments = getDashboardAdjustments(companyId);
  if (!adjustments || Object.keys(adjustments).length === 0) {
    return validades;
  }

  // Agrupa os itens para saber quais já foram processados
  const processedKeys = new Set<string>();
  const result: ValidadeRow[] = [];

  for (const item of validades) {
    const cod = String(item.codigo || (item as any).cod || '').replace(/^0+/, '').trim();
    const valBR = formatDateToBR(item.validade || '');
    const key = `${cod}_${valBR}`;
    const adj = adjustments[key];

    if (adj) {
      if (adj.isExcluded || adj.quantidade <= 0) {
        // Excluído do Dashboard
        continue;
      }

      if (!processedKeys.has(key)) {
        // Primeiro registro deste SKU/validade: recebe EXATAMENTE a quantidade ajustada
        processedKeys.add(key);
        result.push({
          ...item,
          quantidade: adj.quantidade,
          caixa: adj.quantidade,
          palhete: 0,
          lastro: 0,
          validade: adj.novaValidade || valBR,
          localizacao: adj.localizacao || item.localizacao || 'central',
          bloco: adj.bloco || item.bloco || '',
          // Flags para exibição no dashboard
          ...( {
            _hasDashboardAdjustment: true,
            _dashboardOriginalQty: adj.originalQty !== undefined ? adj.originalQty : (item.quantidade || (item as any).caixa || 0)
          } as any )
        });
      } else {
        // Registros subsequentes do mesmo SKU e validade são ignorados para não somar duas vezes
        continue;
      }
    } else {
      result.push(item);
    }
  }

  // Se houver algum ajuste de item novo que não estava na lista original mas foi adicionado/ajustado com quantidade > 0
  for (const key of Object.keys(adjustments)) {
    if (!processedKeys.has(key)) {
      const adj = adjustments[key];
      if (!adj.isExcluded && adj.quantidade > 0) {
        processedKeys.add(key);
        result.push({
          codigo: adj.codigo,
          descricao: `Produto ${adj.codigo}`,
          quantidade: adj.quantidade,
          caixa: adj.quantidade,
          palhete: 0,
          lastro: 0,
          validade: adj.novaValidade || adj.validadeOriginal,
          localizacao: adj.localizacao || 'central',
          bloco: adj.bloco || '',
          _uniqueKey: `adj_${adj.codigo}_${adj.novaValidade || adj.validadeOriginal}`,
          ...( {
            _hasDashboardAdjustment: true,
            _dashboardOriginalQty: adj.originalQty !== undefined ? adj.originalQty : 0
          } as any )
        });
      }
    }
  }

  return result;
}
