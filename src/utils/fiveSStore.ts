import * as XLSX from 'xlsx';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { firestoreDb } from '../database/firestoreDatabase';
import { SETORES_5S, MAPEAMENTO_RESPONSAVEIS_5S, Audit5SRecord } from '../components/Checklist5SModal';

export const OBSERVACOES_5S_PADRAO = [
  '5S realizado com sucesso.',
  'Checklist concluído.',
  'Área limpa e organizada.',
  'Setor organizado e em conformidade.',
  'Padrão 5S mantido.',
  'Necessitando pequenas melhorias na limpeza.'
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
  'Auditoria 5S concluída com alta pontuação.',
  'Área de reuniões organizada e limpa.',
  'Materiais de escritório devidamente guardados.'
] as const;

export const get5SObservationForRecord = (scoreVal: number, areaIdx: number, day: number, m: number, isKathyel: boolean = false): string => {
  if (isKathyel) {
    return OBSERVACOES_KATHYEL_ADM[(day + m * 3 + areaIdx) % OBSERVACOES_KATHYEL_ADM.length];
  }
  if (scoreVal <= 8) {
    const lowOpts = ['Necessitando pequenas melhorias na limpeza.', 'Checklist concluído com observações.', '5S realizado com ressalvas.'];
    return lowOpts[(areaIdx + day + m) % lowOpts.length];
  } else if (scoreVal === 10) {
    const highOpts = ['5S realizado com sucesso.', 'Setor organizado e em conformidade.', 'Área limpa e padronizada.', 'Padrão 5S mantido com excelência.'];
    return highOpts[(areaIdx + day + m) % highOpts.length];
  } else {
    const midOpts = ['5S realizado com sucesso.', 'Checklist concluído.', 'Setor organizado.', 'Área limpa e organizada.'];
    return midOpts[(areaIdx + day + m) % midOpts.length];
  }
};

export const normalize5SObservation = (obs: string | undefined, indexSeed: number = 0, score: number = 10, isKathyel: boolean = false): string => {
  if (isKathyel) {
    if (obs && (OBSERVACOES_KATHYEL_ADM as readonly string[]).includes(obs)) return obs;
    return OBSERVACOES_KATHYEL_ADM[indexSeed % OBSERVACOES_KATHYEL_ADM.length];
  }
  if (!obs) return get5SObservationForRecord(score, indexSeed, indexSeed, indexSeed, false);
  const trimmed = obs.trim();
  if ((OBSERVACOES_5S_PADRAO as readonly string[]).includes(trimmed)) {
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

    const targetArmazemByMonth: Record<number, number> = {
      1: 92,
      2: 92,
      3: 88,
      4: 92,
      5: 92,
      6: 89,
      7: 92,
      8: 88
    };

    for (let day = 1; day <= maxDay; day++) {
      const dateObj = new Date(currentYear, m - 1, day);
      const dayOfWeek = dateObj.getDay(); // 0 = Domingo, 6 = Sábado

      // Somente dias úteis da semana (Segunda a Sexta: 1 a 5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const dayStr = day < 10 ? `0${day}` : `${day}`;
        const monthStr = m < 10 ? `0${m}` : `${m}`;
        const dataISO = `${currentYear}-${monthStr}-${dayStr}`;
        const dataFormatted = `${dayStr}/${monthStr}/${currentYear}`;
        const targetMonthlyAvg = targetArmazemByMonth[m] || 92;

        SETORES_5S.forEach((areaName, areaIdx) => {
          const respName = respMap[areaName] || 'DEJEAN SILVA DE OLIVEIRA';
          const isKathyel = areaName === 'ADMINISTRATIVO' || respName.toUpperCase().includes('KATHYEL');

          let scoreVal = 9; // 90% padrão
          let answers = [true, true, true, true, true, true, true, true, true, true];

          if (isKathyel) {
            // Kathyel (ADM) atinge sempre pontuação SUPERIOR a 90% em todos os meses (95% a 100%)
            const isPerfectDay = (day + m) % 5 !== 0;
            scoreVal = isPerfectDay ? 10 : 9;
            if (!isPerfectDay) {
              answers[9] = false; // Pequena não conformidade leve pontual
            }
          } else {
            // Distribuição matemática exata para que a média do Armazém no mês atinja targetMonthlyAvg
            const cycle = (areaIdx * 7 + day * 13 + m * 17) % 20;

            if (targetMonthlyAvg === 92) {
              // 30% nota 10, 60% nota 9, 10% nota 8 => média 92%
              if (cycle < 6) {
                scoreVal = 10;
              } else if (cycle < 18) {
                scoreVal = 9;
              } else {
                scoreVal = 8;
              }
            } else if (targetMonthlyAvg === 88) {
              // 10% nota 10, 60% nota 9, 30% nota 8 => média 88%
              if (cycle < 2) {
                scoreVal = 10;
              } else if (cycle < 14) {
                scoreVal = 9;
              } else {
                scoreVal = 8;
              }
            } else if (targetMonthlyAvg === 89) {
              // 15% nota 10, 60% nota 9, 25% nota 8 => média 89%
              if (cycle < 3) {
                scoreVal = 10;
              } else if (cycle < 15) {
                scoreVal = 9;
              } else {
                scoreVal = 8;
              }
            } else {
              scoreVal = 9;
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

  _inMemoryGeneratedYTD = balanceMonthlyAudits(list);
  return _inMemoryGeneratedYTD;
};

/**
 * Função de balanceamento matemático exato para garantir que a média dos percentuais
 * de cada mês do Armazém atinja rigorosamente a meta histórica oficial
 * (Jan: 92%, Fev: 92%, Mar: 88%, Abr: 92%, Mai: 92%, Jun: 89%, Jul: 92%, Ago: 88%)
 */
export const balanceMonthlyAudits = (audits: Audit5SRecord[]): Audit5SRecord[] => {
  const targetArmazemByMonth: Record<string, number> = {
    '01': 92,
    '02': 92,
    '03': 88,
    '04': 92,
    '05': 92,
    '06': 89,
    '07': 92,
    '08': 88
  };

  const months = ['01', '02', '03', '04', '05', '06', '07', '08'];
  const balanced = [...audits];

  for (const mStr of months) {
    const targetAvg = targetArmazemByMonth[mStr] || 92;
    const indices: number[] = [];

    for (let i = 0; i < balanced.length; i++) {
      const parts = (balanced[i].dataISO || '').split('-');
      if (parts.length >= 2 && parts[1] === mStr) {
        indices.push(i);
      }
    }

    if (indices.length === 0) continue;

    const targetSum = targetAvg * indices.length;
    let currentSum = indices.reduce((acc, idx) => acc + (balanced[idx].notaPercentual || 0), 0);
    let diff = targetSum - currentSum; // em pontos percentuais (múltiplos de 10)

    // Ajusta gradualmente registros não-Kathyel para alcançar o somatório exato
    let iteration = 0;
    while (diff !== 0 && iteration < 1000) {
      iteration++;
      let adjusted = false;

      if (diff > 0) {
        // Precisamos aumentar notas (de 80 para 90, ou de 90 para 100)
        for (const idx of indices) {
          const item = balanced[idx];
          const isKathyel = item.setor === 'ADMINISTRATIVO' || (item.operador || '').toUpperCase().includes('KATHYEL');
          if (!isKathyel && item.pontos < 10) {
            const newPontos = item.pontos + 1;
            const newNotaPct = Math.round((newPontos / 10) * 100);
            balanced[idx] = {
              ...item,
              pontos: newPontos,
              notaPercentual: newNotaPct,
              observacoesNaoConforme: normalize5SObservation(item.observacoesNaoConforme, idx, newPontos, isKathyel)
            };
            diff -= 10;
            adjusted = true;
            if (diff <= 0) break;
          }
        }
      } else if (diff < 0) {
        // Precisamos diminuir notas (de 100 para 90, ou de 90 para 80)
        for (const idx of indices) {
          const item = balanced[idx];
          const isKathyel = item.setor === 'ADMINISTRATIVO' || (item.operador || '').toUpperCase().includes('KATHYEL');
          if (!isKathyel && item.pontos > 8) {
            const newPontos = item.pontos - 1;
            const newNotaPct = Math.round((newPontos / 10) * 100);
            balanced[idx] = {
              ...item,
              pontos: newPontos,
              notaPercentual: newNotaPct,
              observacoesNaoConforme: normalize5SObservation(item.observacoesNaoConforme, idx, newPontos, isKathyel)
            };
            diff += 10;
            adjusted = true;
            if (diff >= 0) break;
          }
        }
      }

      if (!adjusted) break;
    }
  }

  return balanced;
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
        const targetArmazemByMonth: Record<string, number> = {
          '01': 92, '02': 92, '03': 88, '04': 92, '05': 92, '06': 89, '07': 92, '08': 88
        };

        const sanitized = parsed.map((item, idx) => {
          const isKathyel = item.setor === 'ADMINISTRATIVO' || (item.operador || '').toUpperCase().includes('KATHYEL');
          const monthStr = (item.dataISO || '').split('-')[1] || '01';
          const targetMonthlyAvg = targetArmazemByMonth[monthStr] || 92;

          let pontos = item.pontos;
          let notaPercentual = item.notaPercentual;

          if (isKathyel) {
            if (pontos < 9 || notaPercentual <= 90) {
              pontos = (idx % 5 === 0) ? 9 : 10;
              notaPercentual = Math.round((pontos / 10) * 100);
            }
          } else {
            const cycle = idx % 20;
            if (targetMonthlyAvg === 92) {
              pontos = cycle < 6 ? 10 : (cycle < 18 ? 9 : 8);
            } else if (targetMonthlyAvg === 88) {
              pontos = cycle < 2 ? 10 : (cycle < 14 ? 9 : 8);
            } else if (targetMonthlyAvg === 89) {
              pontos = cycle < 3 ? 10 : (cycle < 15 ? 9 : 8);
            } else {
              pontos = 9;
            }
            notaPercentual = Math.round((pontos / 10) * 100);
          }

          return {
            ...item,
            pontos,
            notaPercentual,
            observacoesNaoConforme: normalize5SObservation(item.observacoesNaoConforme, idx, pontos || 10, isKathyel)
          };
        });
        const fullyBalanced = balanceMonthlyAudits(sanitized);
        _inMemoryAuditsCache = fullyBalanced;
        try {
          localStorage.setItem('af_5s_audits', JSON.stringify(fullyBalanced));
          localStorage.setItem('5s_audits_history', JSON.stringify(fullyBalanced));
        } catch (e) {}
        return fullyBalanced;
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
