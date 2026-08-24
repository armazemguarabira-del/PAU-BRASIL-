import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Truck, 
  Building2, 
  Calendar, 
  User, 
  FileText, 
  Download, 
  Sparkles, 
  Check, 
  RefreshCw,
  Award,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { 
  CHECKLIST_5S_OFFICIAL_ITEMS, 
  exportChecklist5SOfficialPdf, 
  getDefaultScoresForPercentage 
} from '../utils/exportChecklist5SPdf';
import { SETORES_5S, MAPEAMENTO_RESPONSAVEIS_5S } from './Checklist5SModal';
import { AuditoriaFrotaMensal, DEFAULT_AREA_RESPONSAVEIS } from './QualidadePanel';
import { Usuario } from '../types';

export interface Official5SDigitalAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (savedAudit: AuditoriaFrotaMensal) => void;
  initialAudit?: AuditoriaFrotaMensal | null;
  defaultMonth?: string;
  defaultYear?: string;
  defaultArea?: string;
  defaultAuditor?: string;
  defaultAuditado?: string;
  user?: Usuario;
}

export const Official5SDigitalAuditModal: React.FC<Official5SDigitalAuditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialAudit,
  defaultMonth = '08',
  defaultYear = '2026',
  defaultArea = 'Armazém Geral (Guarabira - PB)',
  defaultAuditor = 'Pedro Bruno (Setor de Frota)',
  defaultAuditado,
  user
}) => {
  if (!isOpen) return null;

  const [mes, setMes] = useState<string>(initialAudit?.mes || defaultMonth);
  const [ano, setAno] = useState<string>(initialAudit?.ano || defaultYear);
  const [areaAuditada, setAreaAuditada] = useState<string>(
    (initialAudit as any)?.areaAuditada || defaultArea
  );
  const [auditor, setAuditor] = useState<string>(
    initialAudit?.auditorResponsavel || defaultAuditor
  );
  const [auditado, setAuditado] = useState<string>(() => {
    if ((initialAudit as any)?.auditadoNome) return (initialAudit as any).auditadoNome;
    if (defaultAuditado) return defaultAuditado;
    if (defaultArea && DEFAULT_AREA_RESPONSAVEIS[defaultArea]) {
      return DEFAULT_AREA_RESPONSAVEIS[defaultArea];
    }
    return 'KATHYEL ROCHA DA SILVA / Equipe de Operações';
  });

  const [dataAuditoria, setDataAuditoria] = useState<string>(() => {
    if (initialAudit?.dataAuditoria) return initialAudit.dataAuditoria;
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  // Scores map for all 25 items (1 = OK, 0 = NOK)
  const [scores, setScores] = useState<Record<number, number>>(() => {
    if ((initialAudit as any)?.scores) {
      return (initialAudit as any).scores;
    }
    const targetPct = initialAudit?.notaPercentualFrota || 88;
    const seed = parseInt(defaultMonth, 10) || 1;
    return getDefaultScoresForPercentage(targetPct, seed);
  });

  const [observacoes, setObservacoes] = useState<string>(
    initialAudit?.observacoes || 'Auditoria 5S mensal realizada conforme padrões e diretrizes DPO.'
  );

  const [pdfFileName, setPdfFileName] = useState<string>(
    initialAudit?.pdfFileName || ''
  );
  const [pdfFileDataUrl, setPdfFileDataUrl] = useState<string | undefined>(
    initialAudit?.pdfFileDataUrl
  );

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Update auditado automatically when area changes (if matched in defaults)
  const handleAreaChange = (newArea: string) => {
    setAreaAuditada(newArea);
    if (DEFAULT_AREA_RESPONSAVEIS[newArea]) {
      setAuditado(DEFAULT_AREA_RESPONSAVEIS[newArea]);
    }
  };

  // Calculate real-time points and percentage
  const totalItems = 25;
  const totalPontos = Object.values(scores).reduce((acc, val) => acc + (val === 1 ? 1 : 0), 0);
  const notaPercentual = Math.round((totalPontos / totalItems) * 100);
  const isConforme = notaPercentual >= 85;

  const handleScoreToggle = (itemId: number, value: number) => {
    setScores(prev => ({
      ...prev,
      [itemId]: value
    }));
  };

  const handleSetAllConforme = () => {
    const allOk: Record<number, number> = {};
    for (let i = 1; i <= 25; i++) {
      allOk[i] = 1;
    }
    setScores(allOk);
  };

  const handleApplyPreset = (targetPct: number) => {
    const seed = parseInt(mes, 10) || 1;
    setScores(getDefaultScoresForPercentage(targetPct, seed));
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPdfFileDataUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleExportPrintPdf = () => {
    const dateParts = dataAuditoria.split('-');
    const dataStr = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : dataAuditoria;

    exportChecklist5SOfficialPdf({
      auditor: auditor.trim(),
      auditado: auditado.trim(),
      areaAuditada: areaAuditada.trim(),
      dataStr,
      scores,
      pontuacaoTotal: totalPontos,
      pontuacaoPercentual: notaPercentual
    });
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    const mesAno = `${mes.padStart(2, '0')}/${ano}`;
    const id = initialAudit?.id || `frota-${ano}-${mes.padStart(2, '0')}`;

    const savedRecord: AuditoriaFrotaMensal & { scores: Record<number, number>; areaAuditada: string; auditadoNome: string } = {
      id,
      mesAno,
      ano,
      mes: mes.padStart(2, '0'),
      dataAuditoria,
      auditorResponsavel: auditor.trim() || 'Pedro Bruno (Setor de Frota)',
      notaPercentualFrota: notaPercentual,
      observacoes: observacoes.trim() || 'Auditoria 5S mensal realizada com sucesso.',
      pdfFileName: pdfFileName || `Auditoria_Frota_Armazem_${mes.padStart(2, '0')}_${ano}_Assinada.pdf`,
      pdfFileDataUrl,
      criadoEm: initialAudit?.criadoEm || new Date().toISOString(),
      scores,
      areaAuditada: areaAuditada.trim(),
      auditadoNome: auditado.trim()
    };

    // 1. Save to LocalStorage
    try {
      const existingStr = localStorage.getItem('auditorias_frota_5s_mensal');
      let existingList: AuditoriaFrotaMensal[] = [];
      if (existingStr) {
        existingList = JSON.parse(existingStr);
      }
      const filtered = existingList.filter(item => item.mesAno !== mesAno && item.id !== id);
      const updatedList = [...filtered, savedRecord].sort((a, b) => a.mesAno.localeCompare(b.mesAno));
      localStorage.setItem('auditorias_frota_5s_mensal', JSON.stringify(updatedList));
    } catch (err) {
      console.warn('Erro ao salvar auditoria no LocalStorage:', err);
    }

    // 2. Dispatch event for global updates
    window.dispatchEvent(new CustomEvent('5s_frota_audit_saved', { detail: savedRecord }));
    window.dispatchEvent(new Event('5s_responsaveis_updated'));

    setIsSaving(false);
    setSavedSuccess(true);

    if (onSave) {
      onSave(savedRecord);
    }

    setTimeout(() => {
      onClose();
    }, 900);
  };

  const sensos = [
    { name: 'Seleção', badge: '1º Senso (Seiri)', color: 'border-blue-500/40 text-blue-400 bg-blue-500/10', items: CHECKLIST_5S_OFFICIAL_ITEMS.filter(i => i.senso === 'Seleção') },
    { name: 'Organização', badge: '2º Senso (Seiton)', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10', items: CHECKLIST_5S_OFFICIAL_ITEMS.filter(i => i.senso === 'Organização') },
    { name: 'Limpeza', badge: '3º Senso (Seiso)', color: 'border-amber-500/40 text-amber-400 bg-amber-500/10', items: CHECKLIST_5S_OFFICIAL_ITEMS.filter(i => i.senso === 'Limpeza') },
    { name: 'Padronização', badge: '4º Senso (Seiketsu)', color: 'border-purple-500/40 text-purple-400 bg-purple-500/10', items: CHECKLIST_5S_OFFICIAL_ITEMS.filter(i => i.senso === 'Padronização') },
    { name: 'Auto-Disciplina', badge: '5º Senso (Shitsuke)', color: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10', items: CHECKLIST_5S_OFFICIAL_ITEMS.filter(i => i.senso === 'Auto-Disciplina') },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-[#0b1222] border-2 border-indigo-500/50 rounded-2xl max-w-4xl w-full my-auto shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* TOP HEADER: OFICIAL DPO 5S */}
        <div className="p-4 bg-[#111a30] border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-lg shadow-sm">
              5S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Formulário Oficial DPO
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                  DISTRIBUTION PROCESS OPTIMISATION
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                Checklist Digital de Auditoria 5S - Setor de Frota / Armazém
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          
          {/* CABEÇALHO DO FORMULÁRIO (DADOS GERAIS) */}
          <div className="bg-[#131d38] border border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
              <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" /> Informações do Cabeçalho da Auditoria
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Padrão Ambev / Guarabira-PB
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {/* Área / Setor */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Área / Setor Auditado *
                </label>
                <div className="space-y-1">
                  <select
                    value={areaAuditada}
                    onChange={(e) => handleAreaChange(e.target.value)}
                    className="w-full bg-[#0b1222] border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Armazém Geral (Guarabira - PB)">Armazém Geral (Guarabira - PB)</option>
                    {SETORES_5S.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Auditor */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Auditor Responsável *
                </label>
                <input
                  type="text"
                  value={auditor}
                  onChange={(e) => setAuditor(e.target.value)}
                  placeholder="Ex: Pedro Bruno (Setor de Frota)"
                  className="w-full bg-[#0b1222] border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Auditado / Responsável */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Colaborador Auditado / Responsável
                </label>
                <input
                  type="text"
                  value={auditado}
                  onChange={(e) => setAuditado(e.target.value)}
                  placeholder="Ex: KATHYEL ROCHA DA SILVA"
                  className="w-full bg-[#0b1222] border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Data da Auditoria */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Data da Realização *
                </label>
                <input
                  type="date"
                  value={dataAuditoria}
                  onChange={(e) => setDataAuditoria(e.target.value)}
                  className="w-full bg-[#0b1222] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Mês de Referência */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Mês de Referência (Ciclo Mensal)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={mes}
                    onChange={(e) => setMes(e.target.value)}
                    className="w-full bg-[#0b1222] border border-slate-700 rounded-xl px-2 py-2 text-white font-bold font-mono focus:outline-none focus:border-indigo-500 text-xs"
                  >
                    <option value="01">01 - Janeiro</option>
                    <option value="02">02 - Fevereiro</option>
                    <option value="03">03 - Março</option>
                    <option value="04">04 - Abril</option>
                    <option value="05">05 - Maio</option>
                    <option value="06">06 - Junho</option>
                    <option value="07">07 - Julho</option>
                    <option value="08">08 - Agosto</option>
                    <option value="09">09 - Setembro</option>
                    <option value="10">10 - Outubro</option>
                    <option value="11">11 - Novembro</option>
                    <option value="12">12 - Dezembro</option>
                  </select>
                  <input
                    type="text"
                    value={ano}
                    onChange={(e) => setAno(e.target.value)}
                    className="w-full bg-[#0b1222] border border-slate-700 rounded-xl px-2 py-2 text-white font-bold font-mono focus:outline-none focus:border-indigo-500 text-xs text-center"
                  />
                </div>
              </div>

              {/* Ações Rápidas de Preenchimento */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Preenchimento Rápido / Padrão
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSetAllConforme}
                    className="px-2.5 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                    title="Marcar todos os 25 itens como Conforme (100%)"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-400" /> 100% (25/25)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(92)}
                    className="px-2.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                    title="Aplicar pontuação DPO 92% (23/25 itens)"
                  >
                    92% DPO
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(88)}
                    className="px-2.5 py-1.5 bg-sky-600/30 hover:bg-sky-600/50 text-sky-300 border border-sky-500/40 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                    title="Aplicar pontuação 88% (22/25 itens)"
                  >
                    88% Frota
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* PLACAR EM TEMPO REAL: PONTUAÇÃO (X / 25) E NOTA PERCENTUAL */}
          <div className="bg-[#111a30] border-2 border-indigo-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-20 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl font-black text-2xl font-mono ${
                isConforme 
                  ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400' 
                  : 'bg-rose-500/20 border-2 border-rose-500 text-rose-400'
              }`}>
                {notaPercentual}%
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-slate-400">
                    Pontuação Calculada:
                  </span>
                  <span className="text-xs font-mono font-bold text-indigo-300">
                    {totalPontos} de {totalItems} itens conformes (OK)
                  </span>
                </div>
                <div className="text-sm font-black text-white flex items-center gap-2">
                  {isConforme ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> CONFORME (Meta DPO ≥ 85% Atingida)
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" /> ABAIXO DA META DPO (Exige Plano de Ação)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleExportPrintPdf}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-500/20"
                title="Exporta o PDF preenchido e formatado para impressão e assinatura manual"
              >
                <Printer className="w-4 h-4 text-slate-950" /> Imprimir / Exportar PDF Preenchido
              </button>
            </div>
          </div>

          {/* LISTA DOS 25 ITENS OFICIAIS DPO AGRUPADOS PELOS 5 SENSOS */}
          <div className="space-y-6">
            {sensos.map((sensoGroup) => (
              <div key={sensoGroup.name} className="bg-[#0e1628] border border-slate-800 rounded-2xl overflow-hidden">
                {/* CABEÇALHO DO SENSO */}
                <div className="p-3 px-4 bg-[#131d38] border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase border ${sensoGroup.color}`}>
                      {sensoGroup.badge}
                    </span>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      Senso de {sensoGroup.name} ({sensoGroup.items.length} Itens de Verificação)
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Pontuação: {sensoGroup.items.filter(i => scores[i.id] === 1).length} / {sensoGroup.items.length} OK
                  </span>
                </div>

                {/* TABELA / CARDS DE ITENS (MOBILE-FIRST) */}
                <div className="divide-y divide-slate-800/70">
                  {sensoGroup.items.map((item) => {
                    const isItemOk = scores[item.id] === 1;

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                          isItemOk ? 'bg-transparent hover:bg-slate-800/30' : 'bg-rose-500/5 hover:bg-rose-500/10'
                        }`}
                      >
                        {/* ITEM E DESCRIÇÃO */}
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-black font-mono flex items-center justify-center shrink-0">
                              {item.id}
                            </span>
                            <strong className="text-xs font-black text-white">
                              {item.checkItem}
                            </strong>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed pl-7">
                            {item.descricao}
                          </p>
                        </div>

                        {/* BOTÕES DE PONTUAÇÃO (1 = OK, 0 = NOK) - TOQUE FÁCIL NO MOBILE */}
                        <div className="flex items-center gap-2 self-end md:self-center shrink-0 pl-7 md:pl-0">
                          <button
                            type="button"
                            onClick={() => handleScoreToggle(item.id, 1)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer min-w-[90px] justify-center ${
                              isItemOk
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400'
                                : 'bg-[#111a30] text-slate-400 border border-slate-700 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" /> 1 (OK)
                          </button>

                          <button
                            type="button"
                            onClick={() => handleScoreToggle(item.id, 0)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer min-w-[90px] justify-center ${
                              !isItemOk
                                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-2 ring-rose-400'
                                : 'bg-[#111a30] text-slate-400 border border-slate-700 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            <X className="w-3.5 h-3.5" /> 0 (NOK)
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* OBSERVAÇÕES DA AUDITORIA */}
          <div className="bg-[#131d38] border border-slate-800 rounded-2xl p-4 space-y-2">
            <label className="block text-xs font-black text-white uppercase tracking-wider">
              Observações & Constatações do Auditor ({auditor})
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Descreva as constatações de 5S no armazém pelo auditor da frota..."
              className="w-full bg-[#0b1222] border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-indigo-500 h-24 resize-none leading-relaxed"
            />
          </div>

          {/* ANEXO DE ARQUIVO PDF ASSINADO MANUALLY */}
          <div className="bg-[#131d38] border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Upload className="w-4 h-4 text-indigo-400" /> Importar Documento PDF Assinado Manualmente
                </h4>
                <p className="text-[10px] text-slate-400">
                  Após imprimir o checklist acima, recolha as assinaturas físicas do Auditor e do Auditado e anexe o arquivo escaneado/foto em PDF.
                </p>
              </div>
            </div>

            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-4 bg-[#0b1222] text-center transition-all cursor-pointer">
              <input
                type="file"
                accept=".pdf"
                onChange={handlePdfUpload}
                className="hidden"
                id="digital-modal-pdf-upload"
              />
              <label htmlFor="digital-modal-pdf-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <div className="p-3 bg-indigo-500/10 rounded-full text-indigo-400">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    {pdfFileName ? `Arquivo Selecionado: ${pdfFileName}` : 'Clique para selecionar o PDF Assinado'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Formato aceito: .pdf (Laudo ou Checklist com assinaturas manuais)
                  </span>
                </div>
              </label>
            </div>

            {pdfFileDataUrl && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-300">
                <span className="flex items-center gap-2 font-bold truncate">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  PDF Carregado: {pdfFileName}
                </span>
                <a
                  href={pdfFileDataUrl}
                  download={pdfFileName || 'Auditoria_5S_Assinada.pdf'}
                  className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Baixar
                </a>
              </div>
            )}
          </div>

        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 bg-[#111a30] border-t border-slate-800 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="text-xs font-mono">
            <span className="text-slate-400">Resultado: </span>
            <strong className="text-indigo-300 font-bold">{totalPontos}/25 ({notaPercentual}%)</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold uppercase text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleExportPrintPdf}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black uppercase text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir PDF
            </button>

            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-white" />
              )}
              {savedSuccess ? 'Gravado com Sucesso!' : 'Salvar Auditoria 5S'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
