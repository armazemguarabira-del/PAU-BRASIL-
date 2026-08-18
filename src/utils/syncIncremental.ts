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

  const notify = () => {
    if (!isUnsubscribed) {
      const records = Array.from(docsMap.values());
      onData(records);
      // Salva em background no JSON Database e no Cache L2
      setHybridCacheCollection(cacheKey, records, 1000 * 60 * 60 * 24).catch(() => {});
      saveJsonTable(empresaId, collectionName, records).catch(() => {});
    }
  };

  const runSync = async () => {
    // 1. CARGA IMEDIATA: Tenta Memória / IndexedDB / JSON DB (0 leituras no servidor)
    try {
      const cached = await getHybridCacheCollection<any>(cacheKey, true);
      if (cached && cached.data && cached.data.length > 0) {
        cached.data.forEach((item: any) => {
          const id = item.id || item._docId;
          if (id) docsMap.set(id, item);
        });
        notify();
      } else {
        // Fallback: tenta ler direto da tabela JSON local
        const jsonRecords = await getJsonTable<any>(empresaId, collectionName);
        if (jsonRecords && jsonRecords.length > 0) {
          jsonRecords.forEach((item: any) => {
            const id = item.id || item._docId;
            if (id) docsMap.set(id, item);
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
          docsMap.set(doc.id, { _docId: doc.id, id: doc.id, ...doc.data() });
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
        } else {
          throw serverErr;
        }
      }

      if (serverSnap && !serverSnap.empty) {
        recordActualFirestoreReads(serverSnap.docs.length);
        serverSnap.docs.forEach((doc: QueryDocumentSnapshot) => {
          docsMap.set(doc.id, { _docId: doc.id, id: doc.id, ...doc.data() });
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
          fallbackSnap.docs.forEach((doc: QueryDocumentSnapshot) => {
            docsMap.set(doc.id, { _docId: doc.id, id: doc.id, ...doc.data() });
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
      // Para histórico, relatórios, cadastros e dados diários: NÃO conecta onSnapshot!
      // A carga inicial (Cache + Delta pontual) já atualizou docsMap e notificou a UI.
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
              changed = true;
            } else {
              docsMap.set(change.doc.id, { _docId: change.doc.id, id: change.doc.id, ...change.doc.data() });
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
