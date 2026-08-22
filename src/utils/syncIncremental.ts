import {
  collection,
  query,
  where,
  getDocsFromCache,
  getDocsFromServer,
  getDocs,
  onSnapshot,
  Timestamp,
  QueryDocumentSnapshot,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  getHybridCacheCollection, 
  setHybridCacheCollection, 
  recordActualFirestoreReads 
} from './hybridCacheService';
import { saveJsonTable, getJsonTable } from './hybridJsonDatabase';
import { isRealtimePermitido, getRealtimeInfo } from './realtimeClassification';

export interface SyncIncrementalOptions {
  collectionName: string;
  empresaId: string;
  onData: (data: any[]) => void;
  onError?: (err: any) => void;
  forceRealtime?: boolean;
}

/**
 * Utilitário de Sincronização Incremental Híbrida:
 * 1. Carrega imediatamente do Cache L1 (Memória) / L2 (IndexedDB) e JSON Database (0 leituras no servidor, 0ms).
 * 2. Se houver delta pendente, busca no Firestore apenas os documentos alterados após 'lastSync'.
 * 3. Alimenta a camada de JSON Database e Cache L1/L2 para consultas históricas offline e relatórios.
 * 4. Mantém listener em tempo real escopado com debounce para não gerar leituras redundantes.
 */
export function syncIncremental({
  collectionName,
  empresaId,
  onData,
  onError,
  forceRealtime = false
}: SyncIncrementalOptions): () => void {
  if (!db || !empresaId) {
    onData([]);
    return () => {};
  }

  let isUnsubscribed = false;
  let activeUnsub: (() => void) | null = null;
  const docsMap = new Map<string, any>();

  const cacheKey = `hybrid_col:${empresaId}:${collectionName}`;
  const syncKey = `sync:${empresaId}:${collectionName}`;
  const lastSyncStr = localStorage.getItem(syncKey);

  const getItemKey = (item: any): string => {
    if (!item) return '';
    if (item._docId) return `doc:${item._docId}`;
    if (item.id !== undefined && item.id !== null && item.id !== '') return `id:${item.id}`;
    // Chaves de negócio para itens sem _docId e sem id explícito
    if (item.codigo && item.validade && item.localizacao) {
      return `val:${item.codigo}_${item.validade}_${item.localizacao}_${item.bloco || ''}`;
    }
    if (item.dataISO && item.inicio && item.codigo) {
      return `desp:${item.dataISO}_${item.inicio}_${item.codigo}`;
    }
    if (item.dataISO && item.placa && item.inicio) {
      return `arm:${item.dataISO}_${item.placa}_${item.inicio}`;
    }
    if (item.matricula) {
      return `colab:${item.matricula}`;
    }
    return JSON.stringify(item);
  };

  const notify = () => {
    if (!isUnsubscribed) {
      const rawRecords = Array.from(docsMap.values());
      const seen = new Set<string>();
      const records: any[] = [];

      // Processar em ordem reversa ou com prioridade para garantir unicidade estrita
      for (const item of rawRecords) {
        if (!item) continue;
        const key = getItemKey(item);
        if (!key || seen.has(key)) continue;

        // Validação cruzada para evitar duplicidade id vs _docId
        const idKey = (item.id !== undefined && item.id !== null) ? `id:${item.id}` : null;
        const docKey = item._docId ? `doc:${item._docId}` : null;
        if ((idKey && seen.has(idKey)) || (docKey && seen.has(docKey))) {
          continue;
        }

        seen.add(key);
        if (idKey) seen.add(idKey);
        if (docKey) seen.add(docKey);
        records.push(item);
      }

      onData(records);
      // Salva em background no JSON Database e no Cache L2
      setHybridCacheCollection(cacheKey, records, 1000 * 60 * 60 * 24).catch(() => {});
      saveJsonTable(empresaId, collectionName, records).catch(() => {});
    }
  };

  const storeDoc = (docId: string, data: any) => {
    const rawData = typeof data === 'object' && data !== null ? data : {};
    const businessId = rawData.id !== undefined && rawData.id !== null ? rawData.id : docId;
    const docItem = { _docId: docId, id: businessId, ...rawData };

    // Remover qualquer chave anterior que represente o mesmo documento
    for (const [key, existing] of docsMap.entries()) {
      if (
        key === docId ||
        key === `doc:${docId}` ||
        key === `id:${businessId}` ||
        key === String(businessId) ||
        existing._docId === docId ||
        (existing.id !== undefined && String(existing.id) === String(businessId))
      ) {
        docsMap.delete(key);
      }
    }

    const primaryKey = `doc:${docId}`;
    docsMap.set(primaryKey, docItem);
  };

  const runSync = async () => {
    // 1. CARGA IMEDIATA DO CACHE (0ms, 0 leituras no servidor)
    try {
      const cached = await getHybridCacheCollection<any>(cacheKey, true);
      if (cached && cached.data && cached.data.length > 0) {
        cached.data.forEach((item: any) => {
          const key = getItemKey(item);
          if (key) docsMap.set(key, item);
        });
        notify();
      } else {
        // Fallback: tenta ler direto da tabela JSON local
        const jsonRecords = await getJsonTable<any>(empresaId, collectionName);
        if (jsonRecords && jsonRecords.length > 0) {
          jsonRecords.forEach((item: any) => {
            const key = getItemKey(item);
            if (key) docsMap.set(key, item);
          });
          notify();
        }
      }
    } catch (_) {}

    if (isUnsubscribed) return;

    const colRef = collection(db, collectionName);
    const baseQuery = query(colRef, where('empresaId', '==', empresaId));

    // 2. Tenta o cache do Firestore SDK (0 leituras)
    try {
      const cacheSnap = await getDocsFromCache(baseQuery);
      if (!cacheSnap.empty) {
        cacheSnap.docs.forEach((doc: QueryDocumentSnapshot) => {
          storeDoc(doc.id, doc.data());
        });
        notify();
      }
    } catch (_) {}

    if (isUnsubscribed) return;

    // 3. Sincronização Delta inteligente no Servidor (apenas modificados recentemente)
    const startTime = new Date();
    try {
      let serverQuery = baseQuery;
      let isDeltaQuery = false;

      if (lastSyncStr && docsMap.size > 0) {
        const lastSyncDate = new Date(lastSyncStr);
        if (!isNaN(lastSyncDate.getTime())) {
          serverQuery = query(
            colRef,
            where('empresaId', '==', empresaId),
            where('atualizadoEm', '>', Timestamp.fromDate(lastSyncDate)),
            limit(500)
          );
          isDeltaQuery = true;
        }
      }

      let serverSnap;
      try {
        serverSnap = await getDocsFromServer(serverQuery);
      } catch (serverErr) {
        if (isDeltaQuery) {
          // Se a query delta falhar por falta de índice ou timestamp, tenta carregar query base
          serverSnap = await getDocsFromServer(baseQuery);
          isDeltaQuery = false;
        } else {
          throw serverErr;
        }
      }

      if (serverSnap && !serverSnap.empty) {
        recordActualFirestoreReads(serverSnap.docs.length);
        
        // Se foi uma consulta completa (não delta), substitui a base para evitar soma indesejada com cache obsoleto
        if (!isDeltaQuery) {
          docsMap.clear();
        }
        
        serverSnap.docs.forEach((doc: QueryDocumentSnapshot) => {
          storeDoc(doc.id, doc.data());
        });
        notify();
      }

      localStorage.setItem(syncKey, startTime.toISOString());
    } catch (err) {
      console.warn(`[syncIncremental] Aviso ao sincronizar '${collectionName}':`, err);
      // Fallback offline seguro
      try {
        const fallbackSnap = await getDocs(baseQuery);
        if (!fallbackSnap.empty) {
          docsMap.clear();
          fallbackSnap.docs.forEach((doc: QueryDocumentSnapshot) => {
            storeDoc(doc.id, doc.data());
          });
          notify();
        }
      } catch (fErr) {
        if (onError) onError(fErr);
      }
    }

    if (isUnsubscribed) return;

    // 4. Listener em tempo real: SÓ CRIA onSnapshot SE REALTIME FOR NECESSÁRIO
    const permitRealtime = isRealtimePermitido(collectionName, forceRealtime);
    if (!permitRealtime) {
      return;
    }

    try {
      let debounceTimer: any = null;
      activeUnsub = onSnapshot(
        baseQuery,
        (snap) => {
          let changed = false;
          snap.docChanges().forEach((change) => {
            if (change.type === 'removed') {
              docsMap.delete(change.doc.id);
              if (change.doc.data()?.id) {
                docsMap.delete(String(change.doc.data().id));
              }
              changed = true;
            } else {
              storeDoc(change.doc.id, change.doc.data());
              changed = true;
            }
          });
          if (changed) {
            recordActualFirestoreReads(snap.docChanges().length);
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
              localStorage.setItem(syncKey, new Date().toISOString());
              notify();
            }, 300);
          }
        },
        (err) => {
          if (onError) onError(err);
        }
      );
    } catch (err) {
      console.warn(`[syncIncremental] Erro ao iniciar listener em tempo real para '${collectionName}':`, err);
    }
  };

  runSync();

  return () => {
    isUnsubscribed = true;
    if (activeUnsub) {
      activeUnsub();
    }
  };
}
