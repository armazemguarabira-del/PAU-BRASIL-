import { AcaoCorretiva } from '../utils/simulacaoAcoesUtils';

/**
 * 20 AÇÕES OFICIAIS DE GESTÃO DE LAYOUT E CAPACIDADE (DPO 2026)
 * Foco: Análise e otimização de layout, atualização da curva ABC de produtos,
 * posicionamento estratégico dos pallets de Curva A no pulmão central e picking,
 * dimensionamento do pulmão e controle da quantidade de pallets no picking para evitar sobreposições.
 */

const GESTORES_LAYOUT = [
  'DJEANDERSON SOARES (Supervisor de Operações)',
  'CICERO MATHEU DE OLIVEIRA SILVA (Conferente Líder)',
  'GILSON ROSA DA SILVA (Conferente)',
  'MATEUS HENRIQUE DE SOUZA (Conferente)'
];

interface BaseLayoutConfig {
  idNum: number;
  data: string;
  dataISO: string;
  hora: string;
  gestorIdx: number;
  setor: string;
  indicador: string;
  meta: string;
  desvio: string;
  causa: 'Método' | 'Mão de Obra' | 'Material' | 'Máquina';
  detalheCausa: string;
  contramedida: string;
  comentario: string;
  porque1: string;
  porque2: string;
  porque3: string;
  porque4: string;
  porque5: string;
}

function buildLayoutAcao(cfg: BaseLayoutConfig): AcaoCorretiva {
  const resp = GESTORES_LAYOUT[cfg.gestorIdx % GESTORES_LAYOUT.length];
  const id = `ACAO_LAYOUT_${String(cfg.idNum).padStart(2, '0')}`;

  return {
    id,
    data: cfg.data,
    dataISO: cfg.dataISO,
    hora: cfg.hora,
    processo: 'Gestão de Capacidade',
    setor: cfg.setor,
    colaboradorResponsavel: resp,
    indicador: cfg.indicador,
    meta: cfg.meta,
    resultadoObtido: 'Oportunidade de melhoria no layout/capacidade identificada',
    desvioEncontrado: cfg.desvio,
    causaRaiz: cfg.causa,
    causaRaizDetalhe: cfg.detalheCausa,
    status: 'Concluído',
    responsavelTratativa: 'Gerente de Logística / DPO',
    prazo: cfg.dataISO,
    evidencias: `Auditoria de layout e capacidade concluída com mapa atualizado em ${cfg.data}.`,
    comentarioOperador: cfg.comentario,
    simulado: false,
    criadoEm: `${cfg.dataISO}T${cfg.hora}:00.000Z`,
    tipoAcao: 'Melhoria',
    prioridade: 'Alta',
    dashboardDestino: 'gestao-capacidade',
    contramedida: cfg.contramedida,
    aprovacaoGestor: 'Aprovado',
    aceiteColaborador: true,
    abertoPor: 'Supervisor DPO',
    dataAbertura: `${cfg.data} ${cfg.hora}`,
    fechadoPor: resp,
    dataFechamento: `${cfg.data} 18:00`,
    concluidoNoPrazo: true,
    cincoPorques: {
      porque1: cfg.porque1,
      porque2: cfg.porque2,
      porque3: cfg.porque3,
      porque4: cfg.porque4,
      porque5: cfg.porque5
    },
    historicoAlteracoes: [
      { dataHora: `${cfg.data} ${cfg.hora}`, usuario: 'Supervisor DPO', alteracao: `Abertura de ação: ${cfg.indicador}.` },
      { dataHora: `${cfg.data} 18:00`, usuario: resp, alteracao: 'Otimização de layout e capacidade concluída com sucesso.' }
    ]
  };
}

export const ACOES_OFICIAIS_LAYOUT_CAPACIDADE_20: AcaoCorretiva[] = [
  buildLayoutAcao({
    idNum: 1, data: '07/01/2026', dataISO: '2026-01-07', hora: '09:00', gestorIdx: 0,
    setor: 'Pulmão Central / Ruas 01 a 03',
    indicador: 'Localização dos Pallets Curva A no Central',
    meta: '100% SKUs Curva A nas Ruas Próximas ao Picking (< 30m)',
    desvio: 'Produtos de altíssimo giro (Curva A) alocados no fundo do galpão, gerando percursos longos de empilhadeira.',
    causa: 'Método', detalheCausa: 'Falta de readequação periódica dos blocos centrais conforme giro real de vendas.',
    contramedida: 'Melhorar a localização dos pallets de Curva A no central, posicionando-os nas primeiras ruas em frente ao picking.',
    comentario: 'Reendereçamento executado: SKUs Curva A realocados nas Ruas 01 e 02. Redução de 40% na distância de percurso.',
    porque1: 'Por que o empilhador percorria 120 metros por viagem? O produto Curva A estava na última rua.',
    porque2: 'Por que estava na última rua? Foi guardado lá quando o giro ainda era baixo.',
    porque3: 'Por que não mudou com o aumento de vendas? Não havia rotina de realocação dinâmica.',
    porque4: 'Por que faltou rotina? Análise de Curva ABC era feita apenas trimestralmente.',
    porque5: 'Por que a causa é método? Necessidade de atualização quinzenal da Curva ABC no layout.'
  }),
  buildLayoutAcao({
    idNum: 2, data: '14/01/2026', dataISO: '2026-01-14', hora: '10:30', gestorIdx: 1,
    setor: 'Sistema WMS & Layout Geral',
    indicador: 'Atualização da Curva ABC de Produtos',
    meta: '100% Curva ABC Atualizada Quinzenalmente',
    desvio: 'Curva ABC defasada com 5 SKUs sazonais de alto volume classificados incorretamente como Curva C.',
    causa: 'Método', detalheCausa: 'Relatório de vendas de verão não foi integrado ao cadastro de volumetria do armazém.',
    contramedida: 'Atualizar a Curva ABC de produtos e reclassificar as posições de armazenagem no sistema.',
    comentario: 'Curva ABC recalculada no sistema. 12 SKUs reclassificados para Curva A com posições dedicadas.',
    porque1: 'Por que havia gargalo no ressuprimento desses 5 SKUs? Faltava espaço dedicado para eles no picking.',
    porque2: 'Por que faltava espaço? Estavam cadastrados como Curva C com apenas 1 caixa no box.',
    porque3: 'Por que estavam como Curva C? Cadastro inicial antes da campanha de verão.',
    porque4: 'Por que não atualizaram? Falha no processo de comunicação comercial x logística.',
    porque5: 'Por que a causa é método? Criação de gatilho automático de atualização da Curva ABC.'
  }),
  buildLayoutAcao({
    idNum: 3, data: '21/01/2026', dataISO: '2026-01-21', hora: '14:00', gestorIdx: 2,
    setor: 'Pulmão de Armazenagem / Bloco B',
    indicador: 'Melhoria da Localização do Pulmão',
    meta: 'Ocupação do Pulmão entre 80% e 90% (Faixa Ideal)',
    desvio: 'Pulmão secundário operando com 98% de ocupação gerando bloqueio de ruas e manobras excessivas.',
    causa: 'Método', detalheCausa: 'Distribuição desbalanceada de cargas entre os armazéns 01 e 02.',
    contramedida: 'Melhorar a localização e distribuição do pulmão transferindo 120 pallets para o armazém 02.',
    comentario: 'Balanceamento de pulmão concluído: ocupação estabilizada em 84% em ambos os armazéns.',
    porque1: 'Por que o armazém 01 travou? Havia 40 pallets de vasilhames ocupando vagas de produto acabado.',
    porque2: 'Por que estavam ali? O pátio de vasilhames estava sem espaço demarcado.',
    porque3: 'Por que faltava demarcação? Demora na pintura de solo.',
    porque4: 'Por que demorou a pintura? Não aprovaram o serviço de sinalização.',
    porque5: 'Por que a causa é método/layout? Redefinição física das zonas de pulmão e vasilhames.'
  }),
  buildLayoutAcao({
    idNum: 4, data: '28/01/2026', dataISO: '2026-01-28', hora: '11:15', gestorIdx: 3,
    setor: 'Área de Picking / Linha 01',
    indicador: 'Análise da Quantidade de Pallets no Picking',
    meta: 'Quantidade de Pallets no Picking = Demanda de 1 Turno (Sem Ruptura)',
    desvio: 'Box de picking de lata com apenas 1/2 pallet gerando necessidade de 4 ressuprimentos no mesmo turno.',
    causa: 'Método', detalheCausa: 'Subdimensionamento do box de picking para itens de alta demanda horária.',
    contramedida: 'Analisar a quantidade de pallets no picking e expandir o box de lata de 1 para 3 posições contíguas.',
    comentario: 'Box ampliado para 3 pallets. Número de ressuprimentos diários caiu de 8 para apenas 2.',
    porque1: 'Por que o picking ficava sem produto toda hora? O box era pequeno demais para o volume faturado.',
    porque2: 'Por que o box era pequeno? Foi projetado quando o SKU vendia 30% menos.',
    porque3: 'Por que não aumentaram antes? Não queriam mexer na posição vizinha.',
    porque4: 'Por que a vizinha tinha espaço sobrando? Era um produto de baixo giro (Curva C).',
    porque5: 'Por que a causa é método/layout? Troca de posições entre Curva A e Curva C.'
  }),
  buildLayoutAcao({
    idNum: 5, data: '04/02/2026', dataISO: '2026-02-04', hora: '09:30', gestorIdx: 0,
    setor: 'Layout Geral do Armazém / Corredores Principais',
    indicador: 'Análise de Layout & Melhoria do Posicionamento',
    meta: '100% Corredores com Largura Mínima de 3.20m para Trânsito Duplo',
    desvio: 'Estruturas provisórias de madeira estreitando o corredor principal para 2.60m, gerando gargalo de empilhadeiras.',
    causa: 'Material', detalheCausa: 'Acúmulo de estrados não desmontados na lateral das colunas.',
    contramedida: 'Analisar o layout e melhorar o posicionamento removendo qualquer estrutura provisória dos corredores.',
    comentario: 'Corredor liberado com 3.40m de vão livre. Trânsito duplo de empilhadeiras normalizado sem risco.',
    porque1: 'Por que as empilhadeiras paravam para dar passagem? Apenas uma máquina conseguia passar por vez.',
    porque2: 'Por que o corredor ficou estreito? Colocaram pilhas de madeira encostadas nas colunas.',
    porque3: 'Por que colocaram ali? Falta de área demarcada para descarte de madeira.',
    porque4: 'Por que não descartaram? Caçamba externa estava cheia.',
    porque5: 'Por que a causa é método/layout? Criação de baia específica de descarte sem invasão de corredor.'
  }),
  buildLayoutAcao({
    idNum: 6, data: '11/02/2026', dataISO: '2026-02-11', hora: '14:45', gestorIdx: 1,
    setor: 'Pulmão Central / Ruas 04 e 05',
    indicador: 'Localização dos Pallets Curva A no Central',
    meta: 'Zero Cruzamento de Rotas no Central',
    desvio: 'Pallets de garrafa 600ml (Curva A) colocados em ruas sem saída no central, dificultando o fluxo FIFO.',
    causa: 'Método', detalheCausa: 'Alocação de itens de alto giro em ruas que exigem manobra de ré para saída.',
    contramedida: 'Melhorar a localização dos pallets de Curva A no central transferindo-os para ruas de fluxo contínuo.',
    comentario: 'Curva A transferida para ruas com entrada e saída diretas. Agilidade de coleta duplicada.',
    porque1: 'Por que o empilhador perdia 3 minutos na saída? Precisava manobrar de ré por 40 metros.',
    porque2: 'Por que a rua não tem saída? É um bolsão fechado na parede lateral.',
    porque3: 'Por que colocaram Curva A lá? O operador não sabia que Curva A deve ficar em ruas passantes.',
    porque4: 'Por que não sabia? Falta de critério de alocação no mapa de layout.',
    porque5: 'Por que a causa é método? Definição de ruas passantes exclusivas para Curva A.'
  }),
  buildLayoutAcao({
    idNum: 7, data: '18/02/2026', dataISO: '2026-02-18', hora: '10:15', gestorIdx: 2,
    setor: 'Cadastro de Produtos & WMS',
    indicador: 'Atualização da Curva ABC de Produtos',
    meta: '100% Conformidade entre Giro Real e Classificação ABC',
    desvio: 'Cerveja Puro Malte teve aumento de 80% nas vendas mas permaneceu com status de Curva B no layout.',
    causa: 'Método', detalheCausa: 'Demora na consolidação dos dados de faturamento do mês anterior.',
    contramedida: 'Atualizar a Curva ABC de produtos e reposicionar o SKU Puro Malte para a zona de acesso rápido.',
    comentario: 'Puro Malte promovido a Curva A e movido para a primeira linha do central. Tempo de ressuprimento reduzido.',
    porque1: 'Por que o produto ficava longe? Foi cadastrado no lançamento em posição secundária.',
    porque2: 'Por que não mudou com as vendas? Não rodaram a rotina de rebalanceamento ABC.',
    porque3: 'Por que não rodaram? A rotina era manual em planilha Excel.',
    porque4: 'Por que não automatizaram? Falta de script de sincronização.',
    porque5: 'Por que a causa é método? Automatização do cálculo ABC no sistema integrado.'
  }),
  buildLayoutAcao({
    idNum: 8, data: '25/02/2026', dataISO: '2026-02-25', hora: '15:20', gestorIdx: 3,
    setor: 'Pulmão de Armazenagem / Bloco C',
    indicador: 'Melhoria da Localização do Pulmão',
    meta: '100% Integração Visual das Ruas de Pulmão',
    desvio: 'Dificuldade de localizar pallets de reserva no pulmão C devido à ausência de numeração nas colunas.',
    causa: 'Material', detalheCausa: 'Etiquetas de numeração das colunas apagadas por poeira e desgaste de tempo.',
    contramedida: 'Melhorar a localização do pulmão instalando novas placas suspensas e numeração refletiva nas colunas.',
    comentario: 'Todas as colunas do Pulmão C identificadas com placas refletivas. Localização instantânea de lotes.',
    porque1: 'Por que o empilhador errava a coluna? Não conseguia ler o número de longe.',
    porque2: 'Por que não lia? A tinta estava desbotada há mais de 1 ano.',
    porque3: 'Por que não repintaram? Não havia solicitação aberta.',
    porque4: 'Por que não abriram? Achavam que a reforma geral resolveria.',
    porque5: 'Por que a causa é material/manutenção? Instalação de placas duráveis de alumínio refletivo.'
  }),
  buildLayoutAcao({
    idNum: 9, data: '04/03/2026', dataISO: '2026-03-04', hora: '09:40', gestorIdx: 0,
    setor: 'Área de Picking / Linha 02',
    indicador: 'Análise da Quantidade de Pallets no Picking',
    meta: 'Zero Acúmulo de Pallets Excedentes no Picking',
    desvio: 'Operador colocou 2 pallets a mais de refrigerante no picking bloqueando a calha de separação.',
    causa: 'Mão de Obra', detalheCausa: 'Ressuprimento em excesso sem conferência do limite máximo de caixas do box.',
    contramedida: 'Analisar a quantidade de pallets no picking e limitar o abastecimento à capacidade visual demarcada.',
    comentario: 'Demarcação de solo "CAPACIDADE MÁXIMA: 2 PALLETS" pintada em amarelo zebrado no box.',
    porque1: 'Por que colocou pallets excedentes? O operador descarregou o pallet inteiro para não devolver ao central.',
    porque2: 'Por que não devolveu? Achou que seria retrabalho.',
    porque3: 'Por que causou bloqueio? Invadiu o espaço do SKU vizinho.',
    porque4: 'Por que não havia limite visível? Falta de linha de contenção no piso.',
    porque5: 'Por que a causa é mão de obra/método? Pintura de limite máximo de capacidade por box.'
  }),
  buildLayoutAcao({
    idNum: 10, data: '11/03/2026', dataISO: '2026-03-11', hora: '11:00', gestorIdx: 1,
    setor: 'Layout Geral do Armazém / Bloco A e B',
    indicador: 'Análise de Layout & Melhoria do Posicionamento',
    meta: '100% Fluxo Direcionado (Entrada por Doca 1-2 / Saída por Doca 3-4)',
    desvio: 'Cruzamento constante de empilhadeiras no meio do armazém por falta de segregação de docas de entrada e saída.',
    causa: 'Método', detalheCausa: 'Descarga e carregamento acontecendo simultaneamente nas mesmas docas.',
    contramedida: 'Analisar o layout e reposicionar as operações: Docas 1-2 exclusivas para entrada e 3-4 para expedição.',
    comentario: 'Segregação de docas implantada. Eliminação de 90% dos cruzamentos de máquinas no centro do galpão.',
    porque1: 'Por que havia risco de colisão no centro? Empilhadeiras de descarga e carregamento disputavam a mesma rua.',
    porque2: 'Por que disputavam a rua? As carretas eram atracadas aleatoriamente em qualquer doca vaga.',
    porque3: 'Por que atracavam aleatório? Não havia setorização de docas por processo.',
    porque4: 'Por que não havia setorização? Regra antiga quando o armazém tinha metade do volume.',
    porque5: 'Por que a causa é método/layout? Redefinição do fluxo direcional de armazém.'
  }),
  buildLayoutAcao({
    idNum: 11, data: '18/03/2026', dataISO: '2026-03-18', hora: '14:20', gestorIdx: 2,
    setor: 'Pulmão Central / Ruas 01 e 02',
    indicador: 'Localização dos Pallets Curva A no Central',
    meta: '100% Acesso sem Bloqueio Frontal para Curva A',
    desvio: 'Pallet de Curva A bloqueado por pallet de produto Curva C colocado na frente provisoriamente.',
    causa: 'Mão de Obra', detalheCausa: 'Operador guardou produto de baixo giro na frente da pilha de alto giro por comodidade.',
    contramedida: 'Melhorar a localização dos pallets de Curva A no central proibindo o bloqueio frontal por qualquer outro item.',
    comentario: 'Regra de ouro de layout: posições de Curva A têm acesso 100% livre e frontal sem obstáculos.',
    porque1: 'Por que o empilhador demorou para ressuprir o picking? Teve que retirar o pallet de Curva C da frente.',
    porque2: 'Por que o Curva C estava lá? Foi deixado temporariamente durante a descarga matinal.',
    porque3: 'Por que não moveram de volta? O operador esqueceu de recolocar na vaga certa.',
    porque4: 'Por que toleraram o esquecimento? Falta de fiscalização de layout.',
    porque5: 'Por que a causa é mão de obra/método? Proibição estrita de bloqueio de SKUs prioritários.'
  }),
  buildLayoutAcao({
    idNum: 12, data: '25/03/2026', dataISO: '2026-03-25', hora: '10:45', gestorIdx: 3,
    setor: 'Classificação de Estoque / WMS',
    indicador: 'Atualização da Curva ABC de Produtos',
    meta: '100% Aderência entre Curva ABC de Volume e Curva ABC de Faturamento',
    desvio: 'Divergência entre Curva ABC de faturamento e de giro físico de caixas no picking.',
    causa: 'Método', detalheCausa: 'Classificação no armazém utilizava valor em reais ao invés de hectolitros/caixas movimentadas.',
    contramedida: 'Atualizar a Curva ABC do armazém baseando-se estritamente na movimentação física (caixas e pallets).',
    comentario: 'Curva ABC física implantada. Otimização perfeita do espaço conforme a demanda de movimentação real.',
    porque1: 'Por que um produto caro com pouca saída ocupava vaga nobre? Estava como Curva A por valor financeiro.',
    porque2: 'Por que usavam valor financeiro no layout? O relatório foi extraído do módulo contábil.',
    porque3: 'Por que usaram o contábil? O relatório logístico estava sem filtro configurado.',
    porque4: 'Por que não corrigiram o filtro? Falta de parametrização no WMS.',
    porque5: 'Por que a causa é método? Parametrização da Curva ABC operacional por volume de caixas.'
  }),
  buildLayoutAcao({
    idNum: 13, data: '01/04/2026', dataISO: '2026-04-01', hora: '15:10', gestorIdx: 0,
    setor: 'Pulmão de Armazenagem / Área Externa Coberta',
    indicador: 'Melhoria da Localização do Pulmão',
    meta: 'Zero Umidade ou Calor Excessivo em Pallets do Pulmão',
    desvio: 'Pallets de lata alocados próximos à lateral aberta do galpão recebendo incidência solar direta.',
    causa: 'Material', detalheCausa: 'Falta de cortinas térmicas de proteção contra sol na lateral sul do armazém.',
    contramedida: 'Melhorar a localização do pulmão instalando cortinas de proteção e remanejando latas para o miolo do galpão.',
    comentario: 'Cortinas instaladas e latas realocadas para área com temperatura controlada (< 25°C).',
    porque1: 'Por que a carga esquentava? O sol da tarde batia diretamente nos fardos externos.',
    porque2: 'Por que colocaram latas ali? Vagas livres no momento da descarga.',
    porque3: 'Por que não avaliaram o calor? Falta de mapa de criticidade térmica de layout.',
    porque4: 'Por que não havia mapa? Não era exigido no padrão antigo.',
    porque5: 'Por que a causa é método/qualidade? Zoneamento térmico de layout para bebidas.'
  }),
  buildLayoutAcao({
    idNum: 14, data: '08/04/2026', dataISO: '2026-04-08', hora: '09:15', gestorIdx: 1,
    setor: 'Área de Picking / Linha 03',
    indicador: 'Análise da Quantidade de Pallets no Picking',
    meta: '100% Boxes de Picking Dimensionados por Tempo de Reposição',
    desvio: 'Falta constante de garrafa 1L no picking durante o pico das 14h por capacidade insuficiente no solo.',
    causa: 'Método', detalheCausa: 'Tempo de reposição pelo empilhador era maior que a velocidade de coleta dos conferentes.',
    contramedida: 'Analisar a quantidade de pallets no picking e duplicar o box de 1L com alimentação por fluxo dinâmico.',
    comentario: 'Box de 1L duplicado. Tempo de ressuprimento absorvido pelo pulmão do box sem parar os conferentes.',
    porque1: 'Por que os conferentes paravam às 14h? O box de 1L esvaziava em 20 minutos.',
    porque2: 'Por que o empilhador não repunha a tempo? Estava atendendo descarregamento de carretas na doca.',
    porque3: 'Por que havia conflito de tarefas? Box não tinha capacidade para aguentar 1 hora de pico.',
    porque4: 'Por que o box era pequeno? Dimensionado para volume médio e não para pico.',
    porque5: 'Por que a causa é método? Dimensionamento de box com base no volume de pico horário.'
  }),
  buildLayoutAcao({
    idNum: 15, data: '15/04/2026', dataISO: '2026-04-15', hora: '11:30', gestorIdx: 2,
    setor: 'Layout Geral do Armazém / Área de Manobra',
    indicador: 'Análise de Layout & Melhoria do Posicionamento',
    meta: '100% Vagas de Carregamento de Baterias Fora da Rota Operacional',
    desvio: 'Estação de recarga de baterias localizada em frente ao acesso do picking atrapalhando a circulação.',
    causa: 'Método', detalheCausa: 'Posicionamento histórico da sala de baterias em ponto de alto tráfego de pedestres e máquinas.',
    contramedida: 'Analisar o layout e relocar a sala de baterias para a lateral norte, desobstruindo a entrada do picking.',
    comentario: 'Relocação da sala de baterias concluída. Área de entrada do picking 100% livre e segura.',
    porque1: 'Por que havia aglomeração na entrada do picking? Empilhadeiras paravam para plugar fios de bateria.',
    porque2: 'Por que plugavam ali? As tomadas industriais foram instaladas na coluna central.',
    porque3: 'Por que na coluna central? Custo menor de fiação elétrica na época da obra.',
    porque4: 'Por que prejudicava a operação? Bloqueava 2 metros da entrada da rua.',
    porque5: 'Por que a causa é método/layout? Extensão da rede elétrica para lateral segura do armazém.'
  }),
  buildLayoutAcao({
    idNum: 16, data: '22/04/2026', dataISO: '2026-04-22', hora: '14:40', gestorIdx: 3,
    setor: 'Pulmão Central / Ruas 01 a 03',
    indicador: 'Localização dos Pallets Curva A no Central',
    meta: '100% Pallets de Curva A com Rótulo e Lote Voltados para a Rua',
    desvio: 'Pallets de Curva A armazenados com as etiquetas voltadas para a parede dificultando a leitura rápida.',
    causa: 'Mão de Obra', detalheCausa: 'Operador colocou os pallets de ré sem girar a base de madeira para o lado do corredor.',
    contramedida: 'Melhorar a localização dos pallets de Curva A no central garantindo etiquetas 100% visíveis para o corredor.',
    comentario: 'Padrão de estocagem reforçado: etiqueta de identificação voltada obrigatoriamente para a rua de circulação.',
    porque1: 'Por que o operador demorou para checar o lote? Precisou descer da máquina para ver a etiqueta atrás.',
    porque2: 'Por que a etiqueta estava atrás? O pallet foi guardado invertido.',
    porque3: 'Por que guardou invertido? Pegou o pallet pela lateral do caminhão sem girar.',
    porque4: 'Por que não girou antes de guardar? Falta de atenção ao padrão de visibilidade.',
    porque5: 'Por que a causa é mão de obra/método? Treinamento de orientação de pallets no pulmão.'
  }),
  buildLayoutAcao({
    idNum: 17, data: '29/04/2026', dataISO: '2026-04-29', hora: '10:00', gestorIdx: 0,
    setor: 'Cadastro de Produtos & Curva ABC',
    indicador: 'Atualização da Curva ABC de Produtos',
    meta: '100% Integração de SKUs Novos com Definição Prévia de Layout',
    desvio: 'Lançamento de 2 novos SKUs de cerveja artesanal sem definição prévia de endereçamento no armazém.',
    causa: 'Método', detalheCausa: 'Falta de procedimento de "Cadastro de Novos SKUs" alinhando logística antes da chegada física.',
    contramedida: 'Atualizar a Curva ABC e criar protocolo obrigatório de definição de layout antes da descarga de novos produtos.',
    comentario: 'Protocolo de Novos SKUs ativado: nenhum produto chega ao armazém sem box e pulmão pré-definidos no WMS.',
    porque1: 'Por que os novos SKUs ficaram no corredor? Não havia vaga cadastrada no sistema para eles.',
    porque2: 'Por que não havia vaga? A logística foi avisada no momento em que a carreta chegou.',
    porque3: 'Por que avisaram em cima da hora? Falta de fluxo integrado de lançamentos.',
    porque4: 'Por que não integraram? Ausência de checklist de novos SKUs.',
    porque5: 'Por que a causa é método? Implantação do checklist de prontidão logística para novos SKUs.'
  }),
  buildLayoutAcao({
    idNum: 18, data: '06/05/2026', dataISO: '2026-05-06', hora: '15:30', gestorIdx: 1,
    setor: 'Pulmão de Armazenagem / Bloco A',
    indicador: 'Melhoria da Localização do Pulmão',
    meta: '100% Demarcação de Piso com Tinta Epóxi de Alta Resistência',
    desvio: 'Faixas de demarcação do pulmão desgastadas causando empilhamento irregular fora do esquadro.',
    causa: 'Material', detalheCausa: 'Tinta comum utilizada na última pintura apagou com o atrito das rodas de poliuretano.',
    contramedida: 'Melhorar a localização do pulmão repintando todas as baias com tinta epóxi industrial de alta durabilidade.',
    comentario: 'Pintura em epóxi concluída em todas as baias do Bloco A. Alinhamento visual perfeito dos pallets.',
    porque1: 'Por que os pallets estavam tortos? As linhas do chão tinham desaparecido.',
    porque2: 'Por que desapareceram? A tinta durou apenas 2 meses.',
    porque3: 'Por que durou pouco? Utilizaram tinta acrílica de parede por economia.',
    porque4: 'Por que compraram tinta errada? Falta de especificação técnica no pedido de compras.',
    porque5: 'Por que a causa é material? Aplicação de epóxi bicomponente resistente ao tráfego pesado.'
  }),
  buildLayoutAcao({
    idNum: 19, data: '13/05/2026', dataISO: '2026-05-13', hora: '09:20', gestorIdx: 2,
    setor: 'Área de Picking / Linha 01 e 02',
    indicador: 'Análise da Quantidade de Pallets no Picking',
    meta: '100% Pallets de Picking com Altura Máxima de 1.40m para Ergonomia de Coleta',
    desvio: 'Pallet colocado no picking com 1.80m de altura forçando o conferente a esticar os braços acima do ombro.',
    causa: 'Método', detalheCausa: 'Pallet veio direto da descarga sem ajuste da última camada para altura ergonômica de separação.',
    contramedida: 'Analisar a quantidade e altura de pallets no picking limitando a 1.40m para garantir ergonomia dos ajudantes.',
    comentario: 'Padrão de altura ergonômica estabelecido: pallets de picking são desdobrados em 1.40m antes da entrada no box.',
    porque1: 'Por que o conferente sentiu dor no ombro? Precisava pegar caixas a 1.80m de altura.',
    porque2: 'Por que o pallet estava com 1.80m? Veio de fábrica com 6 camadas.',
    porque3: 'Por que não desdobraram? O empilhador colocou direto no box para economizar tempo.',
    porque4: 'Por que ignorou a ergonomia? Não havia batente visual de altura máxima.',
    porque5: 'Por que a causa é método/ergonomia? Instalação de gabarito de altura máxima de picking.'
  }),
  buildLayoutAcao({
    idNum: 20, data: '20/05/2026', dataISO: '2026-05-20', hora: '14:15', gestorIdx: 3,
    setor: 'Layout Geral do Armazém / Matriz de Blocos',
    indicador: 'Análise de Layout & Melhoria do Posicionamento',
    meta: '100% Conformidade do Layout Físico com a Matriz Digital',
    desvio: 'Discrepância de 8 posições entre o mapa físico do armazém e a matriz de blocos do sistema.',
    causa: 'Método', detalheCausa: 'Mudanças físicas de posições realizadas pela operação sem atualização correspondente no sistema.',
    contramedida: 'Analisar o layout e sincronizar 100% da matriz de blocos física e digital com auditoria mensal.',
    comentario: 'Auditoria e sincronização concluídas: matriz digital 100% idêntica ao layout real do armazém.',
    porque1: 'Por que o sistema mandava para uma vaga ocupada? A vaga foi convertida em área de passagem.',
    porque2: 'Por que foi convertida sem registro? Decisão verbal do turno da noite.',
    porque3: 'Por que não registraram no sistema? O supervisor não tinha acesso para editar o mapa.',
    porque4: 'Por que não tinha acesso? Falta de perfil de gestor de layout.',
    porque5: 'Por que a causa é método/governança? Criação de comitê mensal de aprovação de alterações de layout.'
  })
];
