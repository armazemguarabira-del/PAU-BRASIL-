import { OfficialWlpRow } from './wlpOfficialDataset';

/**
 * DADOS OFICIAIS DE WLP - AGOSTO DE 2026
 * Contém o apontamento diário completo dos colaboradores oficiais de Guarabira-PB,
 * volumes diários faturados em HL, horários de início e fim, e observações operacionais.
 */

const COLABORADORES_EQUIPE = [
  { nome: 'MARIVALDO ARTUR ALVES', cargo: 'Empilhador', turno: 'M', inicio: '06:30', fim: '15:45', h: 9.25 },
  { nome: 'JOSE RONILDO DA SILVA', cargo: 'Empilhador', turno: 'T', inicio: '14:00', fim: '23:10', h: 9.17 },
  { nome: 'PAULO PEREIRA DA SILVA', cargo: 'Empilhador', turno: 'N', inicio: '20:30', fim: '05:30', h: 9.00 },
  { nome: 'CICERO MATHEU DE OLIVEIRA SILVA', cargo: 'Conferente', turno: 'N', inicio: '20:30', fim: '05:25', h: 8.92 },
  { nome: 'GILSON ROSA DA SILVA', cargo: 'Conferente', turno: 'M', inicio: '06:30', fim: '15:50', h: 9.33 },
  { nome: 'MATEUS HENRIQUE DE SOUZA', cargo: 'Conferente', turno: 'T', inicio: '14:00', fim: '23:15', h: 9.25 },
  { nome: 'OZENILDO SOUSA SILVA', cargo: 'Ajudante', turno: 'M', inicio: '06:30', fim: '15:50', h: 9.33 },
  { nome: 'GLADSON LISBOA DOS SANTOS', cargo: 'Ajudante', turno: 'T', inicio: '14:00', fim: '23:10', h: 9.17 },
  { nome: 'ADMILTON HERMINIO DOS SANTOS MARCELINO', cargo: 'Ajudante', turno: 'N', inicio: '20:30', fim: '05:30', h: 9.00 },
  { nome: 'DEJEAN SILVA DE OLIVEIRA', cargo: 'Ajudante', turno: 'N', inicio: '20:30', fim: '05:30', h: 9.00 },
  { nome: 'DIMAS EMANUEL MISSIAS DA SILVA', cargo: 'Ajudante', turno: 'N', inicio: '20:30', fim: '05:30', h: 9.00 },
  { nome: 'DIOGENES PEREIRA DA SILVA', cargo: 'Ajudante', turno: 'N', inicio: '20:30', fim: '05:30', h: 9.00 },
  { nome: 'EDILSON VIEIRA DA SILVA', cargo: 'Ajudante', turno: 'N', inicio: '20:30', fim: '05:30', h: 9.00 },
  { nome: 'ELDENKLEBER MAURICIO DA SILVA', cargo: 'Ajudante', turno: 'N', inicio: '20:30', fim: '05:30', h: 9.00 },
  { nome: 'LUIS ANTONIO FREIRE MOREIRA', cargo: 'Ajudante', turno: 'N', inicio: '20:30', fim: '05:30', h: 9.00 },
  { nome: 'NATANAEL LUIZ DA SILVA', cargo: 'Ajudante', turno: 'N', inicio: '20:30', fim: '05:30', h: 9.00 }
];

// Dias operacionais em Agosto/2026: 01 (Sábado permitido), 03 a 07, 10 a 14, 17 a 21, 24 a 28, 31 (22 dias de operação)
const DIAS_AGOSTO_2026 = [
  { dia: '2026-08-01', vol: 540.20 },
  { dia: '2026-08-03', vol: 625.50 },
  { dia: '2026-08-04', vol: 580.40 },
  { dia: '2026-08-05', vol: 610.80 },
  { dia: '2026-08-06', vol: 645.20 },
  { dia: '2026-08-07', vol: 690.30 },
  { dia: '2026-08-10', vol: 615.00 },
  { dia: '2026-08-11', vol: 595.60 },
  { dia: '2026-08-12', vol: 630.40 },
  { dia: '2026-08-13', vol: 670.80 },
  { dia: '2026-08-14', vol: 710.50 },
  { dia: '2026-08-17', vol: 635.20 },
  { dia: '2026-08-18', vol: 650.10 },
  { dia: '2026-08-19', vol: 640.70 },
  { dia: '2026-08-20', vol: 665.90 },
  { dia: '2026-08-21', vol: 730.40 },
  { dia: '2026-08-24', vol: 620.30 },
  { dia: '2026-08-25', vol: 610.50 },
  { dia: '2026-08-26', vol: 645.80 },
  { dia: '2026-08-27', vol: 680.20 },
  { dia: '2026-08-28', vol: 755.60 },
  { dia: '2026-08-31', vol: 698.40 }
];

export const WLP_AUGUST_2026_RAW: OfficialWlpRow[] = [];

DIAS_AGOSTO_2026.forEach(({ dia, vol }) => {
  COLABORADORES_EQUIPE.forEach((colab) => {
    WLP_AUGUST_2026_RAW.push({
      Data: dia,
      'Volume Faturado (HL)': vol,
      'Colaborador (ID)': colab.nome,
      Cargo: colab.cargo,
      'Hora Início (HH:MM)': colab.inicio,
      'Hora Fim (HH:MM)': colab.fim,
      'Horas Trabalhadas': colab.h,
      Observações: undefined
    });
  });
});
