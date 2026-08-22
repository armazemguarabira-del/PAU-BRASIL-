import { PRODUCTS } from '../planosData';
import { getVendaMediaItens, saveVendaMediaItens } from './estoqueStorage';
import { VendaMediaItem } from '../types/estoque';
import { useEffect, useState } from 'react';

export interface Item030519Data {
  codigo: number;
  produto: string;
  unidade: string;
  volumeTotalTrimestre: number;
  vendaMediaDiaria: number;
  fatorHecto: number;
  precoUnitario: number;
  vendaMediaReais: number;
  vendaMediaHectolitro: number;
  faturamentoTotal: number;
  volumeTotalHectolitros: number;
  categoria?: string;
  classeABC?: 'A' | 'B' | 'C';
  curvaAbc?: 'A' | 'B' | 'C';
  rank?: number;
  source: '030519' | 'fallback';
}

export interface TrimestreStore {
  diasUteis: number;
  itemsMap: Record<number, any>;
  importadoEm?: string;
  nomeArquivo?: string;
}

export const STORAGE_KEY_TRIMESTRES_030519 = 'af_curva_abc_trimestres_030519_v1';
export const EVENT_VENDA_MEDIA_030519_UPDATED = 'vendaMedia030519Updated';

/**
 * Returns all stored quarters data for 03.05.19
 */
export function getStored030519Quarters(): Record<string, TrimestreStore> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRIMESTRES_030519);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler 03.05.19 do localStorage:', e);
  }
  return {
    Q1: { diasUteis: 66, itemsMap: {} },
    Q2: { diasUteis: 65, itemsMap: {} },
    Q3: { diasUteis: 66, itemsMap: {} },
    Q4: { diasUteis: 64, itemsMap: {} },
  };
}

/**
 * Returns a consolidated lookup map of all SKUs with their 03.05.19 daily sales and ABC class.
 * Looks across active/most recent quarter or aggregates.
 */
export function getConsolidated030519Map(): Map<string, Item030519Data> {
  const quarters = getStored030519Quarters();
  const map = new Map<string, Item030519Data>();

  // Determine current active quarter based on month
  const month = new Date().getMonth() + 1; // 1 to 12
  const currentQ = month <= 3 ? 'Q1' : month <= 6 ? 'Q2' : month <= 9 ? 'Q3' : 'Q4';

  // Priority order: Current quarter -> other quarters with data
  const qPriority = [currentQ, 'Q1', 'Q2', 'Q3', 'Q4'].filter((v, i, a) => a.indexOf(v) === i);

  let chosenQuarterKey = '';
  for (const qKey of qPriority) {
    const qData = quarters[qKey];
    if (qData && qData.itemsMap && Object.keys(qData.itemsMap).length > 0) {
      chosenQuarterKey = qKey;
      break;
    }
  }

  // If a quarter has data, load it first
  if (chosenQuarterKey && quarters[chosenQuarterKey]?.itemsMap) {
    const items = Object.values(quarters[chosenQuarterKey].itemsMap);
    
    // Sort by volume to assign Pareto ABC
    const sorted = [...items].sort((a: any, b: any) => (b.volumeTotalTrimestre || 0) - (a.volumeTotalTrimestre || 0));
    const totalVol = sorted.reduce((sum, item: any) => sum + (Number(item.volumeTotalTrimestre) || 0), 0);
    
    let acc = 0;
    sorted.forEach((item: any, idx) => {
      const vol = Number(item.volumeTotalTrimestre) || 0;
      acc += vol;
      const pctAcc = totalVol > 0 ? (acc / totalVol) * 100 : 0;
      const classeABC: 'A' | 'B' | 'C' = pctAcc <= 80 ? 'A' : pctAcc <= 95 ? 'B' : 'C';

      const codeStr = String(item.codigo).trim();
      map.set(codeStr, {
        codigo: Number(item.codigo),
        produto: item.produto || `Produto ${codeStr}`,
        unidade: item.unidade || 'cx',
        volumeTotalTrimestre: vol,
        vendaMediaDiaria: Math.max(0.1, Number(item.vendaMediaDiaria) || (vol / (quarters[chosenQuarterKey].diasUteis || 66))),
        fatorHecto: Number(item.fatorHecto) || 0.1,
        precoUnitario: Number(item.precoUnitario) || 50,
        vendaMediaReais: Number(item.vendaMediaReais) || 0,
        vendaMediaHectolitro: Number(item.vendaMediaHectolitro) || 0,
        faturamentoTotal: Number(item.faturamentoTotal) || 0,
        volumeTotalHectolitros: Number(item.volumeTotalHectolitros) || 0,
        categoria: item.categoria || 'Geral',
        classeABC,
        curvaAbc: classeABC,
        rank: idx + 1,
        source: '030519'
      });
    });
  }

  // Fill in any missing products from fallback catalog or estoqueStorage
  const fallbackList = getVendaMediaItens();
  fallbackList.forEach(fb => {
    const codeStr = String(fb.codigo).trim();
    if (!map.has(codeStr)) {
      const pCatalog = PRODUCTS.find(p => String(p.codigo) === codeStr);
      map.set(codeStr, {
        codigo: Number(fb.codigo),
        produto: fb.produto || pCatalog?.descricao || `Produto ${codeStr}`,
        unidade: 'cx',
        volumeTotalTrimestre: (fb.vendaMediaDiaria || 15) * 66,
        vendaMediaDiaria: Number(fb.vendaMediaDiaria) || 15,
        fatorHecto: pCatalog?.fatorHecto || 0.1,
        precoUnitario: Number(fb.precoUnitario) || 50,
        vendaMediaReais: (Number(fb.vendaMediaDiaria) || 15) * (Number(fb.precoUnitario) || 50),
        vendaMediaHectolitro: (Number(fb.vendaMediaDiaria) || 15) * (pCatalog?.fatorHecto || 0.1),
        faturamentoTotal: ((fb.vendaMediaDiaria || 15) * 66) * (Number(fb.precoUnitario) || 50),
        volumeTotalHectolitros: ((fb.vendaMediaDiaria || 15) * 66) * (pCatalog?.fatorHecto || 0.1),
        categoria: fb.familia || 'Geral',
        classeABC: 'B',
        curvaAbc: 'B',
        source: 'fallback'
      });
    }
  });

  return map;
}

/**
 * Returns single SKU 03.05.19 data with fallback
 */
export function get030519DataForSku(codigo: string | number): Item030519Data {
  const codeStr = String(codigo).trim();
  const map = getConsolidated030519Map();
  if (map.has(codeStr)) {
    return map.get(codeStr)!;
  }

  // Fallback defaults
  const pCatalog = PRODUCTS.find(p => String(p.codigo) === codeStr);
  return {
    codigo: Number(codeStr) || 0,
    produto: pCatalog?.descricao || `SKU ${codeStr}`,
    unidade: 'cx',
    volumeTotalTrimestre: 990,
    vendaMediaDiaria: 15,
    fatorHecto: pCatalog?.fatorHecto || 0.1,
    precoUnitario: 50,
    vendaMediaReais: 750,
    vendaMediaHectolitro: 1.5,
    faturamentoTotal: 49500,
    volumeTotalHectolitros: 99,
    categoria: 'Geral',
    classeABC: 'B',
    curvaAbc: 'B',
    source: 'fallback'
  };
}

/**
 * Broadcasts an update across the app whenever 03.05.19 is imported or updated
 */
export function sync030519WithEstoqueStorage(updatedItemsMap: Record<number, any>): void {
  try {
    const currentStorage = getVendaMediaItens();
    const storageMap = new Map<number, VendaMediaItem>();
    currentStorage.forEach(item => {
      storageMap.set(Number(item.codigo), item);
    });

    Object.values(updatedItemsMap).forEach((item: any) => {
      const code = Number(item.codigo);
      const existing = storageMap.get(code);
      storageMap.set(code, {
        codigo: code,
        produto: item.produto || existing?.produto || `Produto ${code}`,
        vendaMediaDiaria: Math.max(0.1, Math.round(Number(item.vendaMediaDiaria) * 100) / 100),
        precoUnitario: Number(item.precoUnitario) || existing?.precoUnitario || 50,
        familia: item.categoria || existing?.familia || 'Cervejas',
        marca: existing?.marca || 'Ambev',
        setor: existing?.setor || 'Central A',
        atualizadoEm: new Date().toISOString()
      });
    });

    saveVendaMediaItens(Array.from(storageMap.values()));
    window.dispatchEvent(new CustomEvent(EVENT_VENDA_MEDIA_030519_UPDATED));
  } catch (e) {
    console.error('Erro ao sincronizar 03.05.19 com estoque storage:', e);
  }
}

/**
 * Custom React Hook that keeps any component in sync with 03.05.19 data updates
 */
export function useVendaMedia030519() {
  const [dataMap, setDataMap] = useState<Map<string, Item030519Data>>(() => getConsolidated030519Map());
  const [activeQuarterInfo, setActiveQuarterInfo] = useState<{ quarter: string; skusCount: number; importadoEm?: string }>({
    quarter: 'Q1',
    skusCount: 0
  });

  const reload = () => {
    const map = getConsolidated030519Map();
    setDataMap(map);

    const quarters = getStored030519Quarters();
    let qFound = 'Q1';
    let count = 0;
    let imp: string | undefined = undefined;

    const month = new Date().getMonth() + 1;
    const currentQ = month <= 3 ? 'Q1' : month <= 6 ? 'Q2' : month <= 9 ? 'Q3' : 'Q4';
    const qPriority = [currentQ, 'Q1', 'Q2', 'Q3', 'Q4'].filter((v, i, a) => a.indexOf(v) === i);

    for (const qKey of qPriority) {
      if (quarters[qKey] && quarters[qKey].itemsMap && Object.keys(quarters[qKey].itemsMap).length > 0) {
        qFound = qKey;
        count = Object.keys(quarters[qKey].itemsMap).length;
        imp = quarters[qKey].importadoEm;
        break;
      }
    }

    setActiveQuarterInfo({
      quarter: qFound,
      skusCount: count,
      importadoEm: imp
    });
  };

  useEffect(() => {
    reload();

    const handleUpdate = () => reload();
    window.addEventListener(EVENT_VENDA_MEDIA_030519_UPDATED, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(EVENT_VENDA_MEDIA_030519_UPDATED, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return {
    dataMap,
    activeQuarterInfo,
    reload,
    getItem: (code: string | number) => dataMap.get(String(code).trim()) || get030519DataForSku(code)
  };
}
