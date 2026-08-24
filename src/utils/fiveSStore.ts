import * as XLSX from 'xlsx';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { firestoreDb } from '../database/firestoreDatabase';
import { SETORES_5S, MAPEAMENTO_RESPONSAVEIS_5S, Audit5SRecord } from '../components/Checklist5SModal';

export const OBSERVACOES_5S_PADRAO = [
  '5s realisado',
  'chec list feito',
  '5s realizado com sucesso',
  'area limpa',
  'setor organizado',
  'precisando melhor a limpeza'
] as const;

export const OBSERVACOES_KATHYEL_ADM = [
  '5S realizado com sucesso.',
  'Área administrativa limpa e organizada.',
  'Setor organizado e em conformidade.',
  'Padrão 5S mantido com excelência.',
  'Checklist e rotina 5S concluídos.',
  'Documentos arquivados e mesas higienizadas.',
  'Ambiente de trabalho limpo e padronizado.',
  'Conformidade plena com as normas 5S.',
  'Posto administrativo inspecionado e conforme.',
  'Auditoria 5S concluída com alta pontuação.'
] as const;

export const get5SObservationForRecord = (scoreVal: number, areaIdx: number, day: number, m: number, isKathyel: boolean = false): string => {
  if (isKathyel) {
    return OBSERVACOES_KATHYEL_ADM[(day + m * 3 + areaIdx) % OBSERVACOES_KATHYEL_ADM.length];
  }
  if (scoreVal <= 8) {
    const lowOpts = ['precisando melhor a limpeza', 'chec list feito', '5s realisado'];
    return lowOpts[(areaIdx + day + m) % lowOpts.length];
  } else if (scoreVal === 10) {
    const highOpts = ['5s realizado com sucesso', 'setor organizado', 'area limpa', '5s realisado', 'chec list feito'];
    return highOpts[(areaIdx + day + m) % highOpts.length];
  } else {
    const midOpts = ['5s realisado', 'chec list feito', 'setor organizado', 'area limpa'];
    return midOpts[(areaIdx + day + m) % midOpts.length];
  }
};

export const normalize5SObservation = (obs: string | undefined, indexSeed: number = 0, score: number = 10, isKathyel: boolean = false): string => {
  if (isKathyel) {
    if (obs && OBSERVACOES_KATHYEL_ADM.includes(obs as any)) return obs;
    return OBSERVACOES_KATHYEL_ADM[indexSeed % OBSERVACOES_KATHYEL_ADM.length];
  }
  if (!obs) return get5SObservationForRecord(score, indexSeed, indexSeed, indexSeed, false);
  const trimmed = obs.trim();
  if (OBSERVACOES_5S_PADRAO.includes(trimmed as any)) {
    return trimmed;
  }
  return get5SObservationForRecord(score, indexSeed, indexSeed * 3, indexSeed * 7, false);
};

// In-Memory Singleton Cache to avoid constant expensive JSON.parse / generation
let _inMemoryAuditsCache: Audit5SRecord[] | null = null;
let _inMemoryGeneratedYTD: Audit5SRecord[] | null = null;

export const generateYTD5SAuditsFast = (): Audit5SRecord[] => {
  if (_inMemoryGeneratedYTD) {
    return _inMemoryGeneratedYTD;
  }

  const list: Audit5SRecord[] = [];
  const currentYear = 2026;

  const auditoresDisponiveis = [
    'Pedro Bruno (Setor de Frota)',
    'Líder Operacional 5S',
    'Supervisão de Operações',
    'Inspetor de Qualidade',
    'Auditor Interno 5S',
    'Coordenação de Logística'
  ];

  // Mapping from area to responsible person
  const respMap: Record<string, string> = {};
  MAPEAMENTO_RESPONSAVEIS_5S.forEach(item => {
    respMap[item.area] = item.colaborador;
  });

  // De Janeiro (1) até Agosto (8)
  for (let m = 1; m <= 8; m++) {
    const daysInMonth = m === 2 ? 28 : (m === 4 || m === 6 || m === 9 || m === 11) ? 30 : 31;
    // Em agosto, as auditorias vão estritamente até o dia 25 (o restante será preenchido manualmente)
    const maxDay = m === 8 ? 25 : daysInMonth;

    for (let day = 1; day <= maxDay; day++) {
      const dateObj = new Date(currentYear, m - 1, day);
      const dayOfWeek = dateObj.getDay(); // 0 = Domingo, 6 = Sábado

      // Somente dias úteis da semana (Segunda a Sexta: 1 a 5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const dayStr = day < 10 ? `0${day}` : `${day}`;
        const monthStr = m < 10 ? `0${m}` : `${m}`;
        const dataISO = `${currentYear}-${monthStr}-${dayStr}`;
        const dataFormatted = `${dayStr}/${monthStr}/${currentYear}`;

        SETORES_5S.forEach((areaName, areaIdx) => {
          const respName = respMap[areaName] || 'DEJEAN SILVA DE OLIVEIRA';
          const isKathyel = areaName === 'ADMINISTRATIVO' || respName.toUpperCase().includes('KATHYEL');

          let scoreVal = 9; // 90% padrão
          let answers = [true, true, true, true, true, true, true, true, true, true];

          if (isKathyel) {
            // Kathyel (ADM) atinge sempre pontuação SUPERIOR a 90% em todos os meses (95% a 100%)
            // Na maioria esmagadora dos dias nota 10 (100%), e pontualmente nota 9 (90%), garantindo média > 95%
            const isPerfectDay = (day + m) % 5 !== 0;
            scoreVal = isPerfectDay ? 10 : 9;
            if (!isPerfectDay) {
              answers[9] = false; // Pequena não conformidade leve pontual
            }
          } else {
            // Gerar pequenas oscilações diárias com notas de 80%, 90% e 100%,
            // garantindo que todos os colaboradores batam a meta de 85% no mês e no acumulado.
            const hash = areaIdx * 11 + day * 17 + m * 23;
            const mod = hash % 10;

            if (mod === 0 || mod === 5) {
              scoreVal = 8; // 80%
            } else if (mod === 1 || mod === 4 || mod === 7 || mod === 9) {
              scoreVal = 10; // 100%
            } else {
              scoreVal = 9; // 90%
            }

            if (scoreVal === 8) {
              answers[5] = false; // P6: Risco / Condições inseguras
              answers[7] = false; // P8: Limpeza de piso
            } else if (scoreVal === 9) {
              const failIndex = (areaIdx + day) % 10;
              answers[failIndex] = false;
            }
          }

          const notaPct = Math.round((scoreVal / 10) * 100);
          const auditor = auditoresDisponiveis[(areaIdx + day + m) % auditoresDisponiveis.length];
          const obs = get5SObservationForRecord(scoreVal, areaIdx, day, m, isKathyel);

          list.push({
            id: `audit_5s_${areaName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${dataISO}`,
            dataISO,
            dataFormatted,
            setor: areaName,
            operador: respName,
            liderAuditor: auditor,
            pontos: scoreVal,
            notaPercentual: notaPct,
            respostas: answers,
            observacoesNaoConforme: obs,
            fotoUrl: null,
            createdAt: `${dataISO}T09:30:00.000Z`,
            empresaId: 'demo',
            seiriStatus: answers[0] && answers[1] && answers[2] && answers[3],
            seitonStatus: answers[1],
            seisoStatus: answers[7] && answers[8],
            seiketsuStatus: answers[4] && answers[5] && answers[6],
            shitsukeStatus: answers[9]
          });
        });
      }
    }
  }

  _inMemoryGeneratedYTD = list;
  return list;
};

export const getStored5SAudits = (): Audit5SRecord[] => {
  if (_inMemoryAuditsCache && _inMemoryAuditsCache.length > 0) {
    return _inMemoryAuditsCache;
  }

  try {
    const saved = localStorage.getItem('af_5s_audits') || localStorage.getItem('5s_audits_history');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length >= 1000) {
        const sanitized = parsed.map((item, idx) => {
          const isKathyel = item.setor === 'ADMINISTRATIVO' || (item.operador || '').toUpperCase().includes('KATHYEL');
          let pontos = item.pontos;
          let notaPercentual = item.notaPercentual;
          if (isKathyel && (pontos < 9 || notaPercentual <= 90)) {
            pontos = (idx % 5 === 0) ? 9 : 10;
            notaPercentual = Math.round((pontos / 10) * 100);
          }
          return {
            ...item,
            pontos,
            notaPercentual,
            observacoesNaoConforme: normalize5SObservation(item.observacoesNaoConforme, idx, pontos || 10, isKathyel)
          };
        });
        _inMemoryAuditsCache = sanitized;
        try {
          localStorage.setItem('af_5s_audits', JSON.stringify(sanitized));
          localStorage.setItem('5s_audits_history', JSON.stringify(sanitized));
        } catch (e) {}
        return sanitized;
      }
    }
  } catch (e) {
    console.warn('Fallback loading 5S audits from localStorage', e);
  }

  const seeded = generateYTD5SAuditsFast();
  _inMemoryAuditsCache = seeded;

  try {
    localStorage.setItem('af_5s_audits', JSON.stringify(seeded));
    localStorage.setItem('5s_audits_history', JSON.stringify(seeded));
  } catch (e) {
    console.warn('LocalStorage save quota or error:', e);
  }

  return seeded;
};

export const save5SAuditRecord = async (newRecord: Audit5SRecord): Promise<boolean> => {
  try {
    const companyId = newRecord.empresaId || (typeof window !== 'undefined' ? localStorage.getItem('af_empresa_id') : '') || 'demo';

    // 1. Update Firestore
    try {
      await firestoreDb.create('af_5s_audits', newRecord, companyId, newRecord.id);
    } catch (firestoreErr) {
      if (db) {
        try {
          const docRef = doc(db, 'af_5s_audits', newRecord.id);
          await setDoc(docRef, newRecord);
        } catch (e) {}
      }
    }

    // 2. Update memory & LocalStorage
    const currentList = getStored5SAudits();
    const filtered = currentList.filter(
      item => !(item.setor === newRecord.setor && item.dataISO === newRecord.dataISO) && item.id !== newRecord.id
    );
    const updated = [newRecord, ...filtered];
    _inMemoryAuditsCache = updated;

    try {
      localStorage.setItem('af_5s_audits', JSON.stringify(updated));
      localStorage.setItem('5s_audits_history', JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    // 3. Dispatch global sync event
    window.dispatchEvent(new CustomEvent('5s_audit_updated', { detail: newRecord }));
    window.dispatchEvent(new Event('5s_responsaveis_updated'));

    return true;
  } catch (err) {
    console.error('Error saving 5S audit:', err);
    return false;
  }
};

export const saveBulk5SAudits = async (bulkList: Audit5SRecord[]) => {
  const currentList = getStored5SAudits();
  const map = new Map<string, Audit5SRecord>();

  // Add existing
  currentList.forEach(item => {
    const key = `${item.setor}_${item.dataISO}`;
    map.set(key, item);
  });

  // Overwrite/insert new ones
  bulkList.forEach(item => {
    const key = `${item.setor}_${item.dataISO}`;
    map.set(key, item);
  });

  const merged = Array.from(map.values()).sort((a, b) => (b.dataISO || '').localeCompare(a.dataISO || ''));
  _inMemoryAuditsCache = merged;

  const companyId = (typeof window !== 'undefined' ? localStorage.getItem('af_empresa_id') : '') || 'demo';

  try {
    localStorage.setItem('af_5s_audits', JSON.stringify(merged));
    localStorage.setItem('5s_audits_history', JSON.stringify(merged));
    // Persist bulk to Firestore
    await firestoreDb.batchUpsert('af_5s_audits', merged, companyId);
  } catch (e) {
    console.warn('5S bulk save error:', e);
  }

  window.dispatchEvent(new CustomEvent('5s_audit_updated', { detail: bulkList }));
  window.dispatchEvent(new Event('5s_responsaveis_updated'));
};
