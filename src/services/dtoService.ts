import { DtoRegistro, DtoOperacaoId } from '../types/dto';
import { INITIAL_DTO_HISTORICO_MOCK } from '../data/dtoOperacoesData';

const DTO_STORAGE_KEY = 'armazem_dto_historico_registros_v1';

export class DtoService {
  /**
   * Retrieves all registered DTOs from storage (with fallback to mock data)
   */
  static getHistorico(empresaId?: string): DtoRegistro[] {
    try {
      const key = empresaId ? `${DTO_STORAGE_KEY}_${empresaId}` : DTO_STORAGE_KEY;
      const data = localStorage.getItem(key);
      if (data) {
        const parsed: DtoRegistro[] = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.sort((a, b) => new Date(b.dataHoraISO).getTime() - new Date(a.dataHoraISO).getTime());
        }
      }
      // If none in custom key, try global key
      const globalData = localStorage.getItem(DTO_STORAGE_KEY);
      if (globalData) {
        const parsed: DtoRegistro[] = JSON.parse(globalData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.sort((a, b) => new Date(b.dataHoraISO).getTime() - new Date(a.dataHoraISO).getTime());
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar histórico DTO do localStorage:', e);
    }
    // Return initial mock history
    return [...INITIAL_DTO_HISTORICO_MOCK];
  }

  /**
   * Saves a new DTO registration
   */
  static saveRegistro(registro: DtoRegistro, empresaId?: string): boolean {
    try {
      const currentList = this.getHistorico(empresaId);
      // If already exists (edit), replace it; otherwise add to start
      const existingIdx = currentList.findIndex(r => r.id === registro.id);
      let updated: DtoRegistro[];
      if (existingIdx >= 0) {
        updated = [...currentList];
        updated[existingIdx] = registro;
      } else {
        updated = [registro, ...currentList];
      }

      const key = empresaId ? `${DTO_STORAGE_KEY}_${empresaId}` : DTO_STORAGE_KEY;
      localStorage.setItem(key, JSON.stringify(updated));
      localStorage.setItem(DTO_STORAGE_KEY, JSON.stringify(updated));

      // Trigger custom event so other components update if needed
      window.dispatchEvent(new CustomEvent('dto_historico_updated', { detail: registro }));
      return true;
    } catch (e) {
      console.error('Erro ao salvar registro DTO:', e);
      return false;
    }
  }

  /**
   * Deletes a DTO registration
   */
  static deleteRegistro(registroId: string, empresaId?: string): boolean {
    try {
      const currentList = this.getHistorico(empresaId);
      const filtered = currentList.filter(r => r.id !== registroId);
      const key = empresaId ? `${DTO_STORAGE_KEY}_${empresaId}` : DTO_STORAGE_KEY;
      localStorage.setItem(key, JSON.stringify(filtered));
      localStorage.setItem(DTO_STORAGE_KEY, JSON.stringify(filtered));
      window.dispatchEvent(new CustomEvent('dto_historico_updated', { detail: { deletedId: registroId } }));
      return true;
    } catch (e) {
      console.error('Erro ao excluir registro DTO:', e);
      return false;
    }
  }

  /**
   * Clears all DTOs and restores initial mock data
   */
  static resetToDefault(empresaId?: string): void {
    const key = empresaId ? `${DTO_STORAGE_KEY}_${empresaId}` : DTO_STORAGE_KEY;
    localStorage.setItem(key, JSON.stringify(INITIAL_DTO_HISTORICO_MOCK));
    localStorage.setItem(DTO_STORAGE_KEY, JSON.stringify(INITIAL_DTO_HISTORICO_MOCK));
    window.dispatchEvent(new CustomEvent('dto_historico_updated'));
  }

  /**
   * Exports all DTOs as JSON file
   */
  static exportToJson(empresaId?: string): void {
    const list = this.getHistorico(empresaId);
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(list, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `DTO_Historico_Diagnosticos_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  /**
   * Imports DTOs from JSON array
   */
  static importFromJson(jsonArray: DtoRegistro[], empresaId?: string): boolean {
    try {
      if (!Array.isArray(jsonArray)) return false;
      const current = this.getHistorico(empresaId);
      // Merge avoiding duplicates by id
      const map = new Map<string, DtoRegistro>();
      jsonArray.forEach(item => map.set(item.id, item));
      current.forEach(item => {
        if (!map.has(item.id)) {
          map.set(item.id, item);
        }
      });
      const merged = Array.from(map.values()).sort((a, b) => new Date(b.dataHoraISO).getTime() - new Date(a.dataHoraISO).getTime());
      const key = empresaId ? `${DTO_STORAGE_KEY}_${empresaId}` : DTO_STORAGE_KEY;
      localStorage.setItem(key, JSON.stringify(merged));
      localStorage.setItem(DTO_STORAGE_KEY, JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent('dto_historico_updated'));
      return true;
    } catch (e) {
      console.error('Erro ao importar JSON DTO:', e);
      return false;
    }
  }

  /**
   * Computes statistics for dashboard
   */
  static getEstatisticas(empresaId?: string) {
    const list = this.getHistorico(empresaId);
    const total = list.length;
    if (total === 0) {
      return {
        total: 0,
        mediaConformidade: 0,
        criticosCount: 0,
        atencaoCount: 0,
        conformesCount: 0,
        metaNaoBatidaCount: 0,
        planosAcaoAbertos: 0,
        porOperacao: {} as Record<DtoOperacaoId, { count: number; media: number }>
      };
    }

    const somaPercentuais = list.reduce((acc, curr) => acc + curr.percentualConformidade, 0);
    const mediaConformidade = Number((somaPercentuais / total).toFixed(1));

    const criticosCount = list.filter(r => r.classificacao === 'critico').length;
    const atencaoCount = list.filter(r => r.classificacao === 'atencao').length;
    const conformesCount = list.filter(r => r.classificacao === 'conforme').length;
    const metaNaoBatidaCount = list.filter(r => r.motivoDto === 'meta_nao_batida').length;
    const planosAcaoAbertos = list.filter(r => r.planoAcao && r.planoAcao.status !== 'concluido').length;

    // Per operation breakdown
    const porOperacao: Record<string, { count: number; soma: number; media: number }> = {};
    list.forEach(r => {
      if (!porOperacao[r.operacaoId]) {
        porOperacao[r.operacaoId] = { count: 0, soma: 0, media: 0 };
      }
      porOperacao[r.operacaoId].count += 1;
      porOperacao[r.operacaoId].soma += r.percentualConformidade;
    });

    Object.keys(porOperacao).forEach(opId => {
      const item = porOperacao[opId];
      item.media = Number((item.soma / item.count).toFixed(1));
    });

    return {
      total,
      mediaConformidade,
      criticosCount,
      atencaoCount,
      conformesCount,
      metaNaoBatidaCount,
      planosAcaoAbertos,
      porOperacao
    };
  }
}
