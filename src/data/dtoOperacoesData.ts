import { DtoOperacaoConfig, DtoRegistro } from '../types/dto';

export const DTO_OPERACOES_CONFIG: DtoOperacaoConfig[] = [
  {
    id: 'repack',
    nome: 'Repack (Reembalagem de Avarias)',
    tituloCurto: 'Repack',
    sigla: 'RPK',
    icone: 'Package',
    cor: 'purple',
    badge: 'Reembalagem',
    descricao: 'Diagnóstico operacional de reempacotamento de latas e garrafas recuperáveis com foco em cadência e qualidade.',
    focoPrincipal: 'Produtividade de caixas/hora, triagem correta e integridade das embalagens refeitas.',
    itens: [
      {
        id: 'rpk_01',
        numero: '01',
        pergunta: 'Uso integral de EPIs obrigatórios',
        descricaoTecnica: 'O operador está utilizando luvas de proteção anticorte/nitrílicas, óculos de segurança e calçado de bico de aço.',
        categoria: 'Segurança & EPI'
      },
      {
        id: 'rpk_02',
        numero: '02',
        pergunta: 'Organização e 5S da bancada de repack',
        descricaoTecnica: 'A mesa de retrabalho, bancada e o chão ao redor estão desobstruídos, secos e sem acúmulo de papelão rasgado.',
        categoria: 'Registro & 5S'
      },
      {
        id: 'rpk_03',
        numero: '03',
        pergunta: 'Triagem e segregação prévia por SKU e Lote',
        descricaoTecnica: 'Os pacotes avariados são separados previamente por SKU e data de validade antes de iniciar o novo fechamento.',
        categoria: 'Qualidade & FEFO'
      },
      {
        id: 'rpk_04',
        numero: '04',
        pergunta: 'Inspeção visual contra microfissuras e vazamentos',
        descricaoTecnica: 'Nenhuma lata estufada, amassada no vinco ou garrafa trincada é colocada nas embalagens novas de repack.',
        categoria: 'Qualidade & FEFO'
      },
      {
        id: 'rpk_05',
        numero: '05',
        pergunta: 'Padrão de fitamento / fechamento do fardo',
        descricaoTecnica: 'O fardo de repack fica firme, sem folgas nas laterais, com fita padrão e com o código de barras do produto legível.',
        categoria: 'Procedimento & Padrão'
      },
      {
        id: 'rpk_06',
        numero: '06',
        pergunta: 'Apontamento de caixas e perdas em tempo real',
        descricaoTecnica: 'O operador realiza o apontamento imediato das caixas reembaladas e das unidades descartadas no sistema/quadro.',
        categoria: 'Registro & 5S'
      },
      {
        id: 'rpk_07',
        numero: '07',
        pergunta: 'Cadência e ritmo de produção (Meta cx/h)',
        descricaoTecnica: 'O ritmo de trabalho atende à meta estipulada para a embalagem (ex: 20 a 35 caixas/hora conforme padrão).',
        categoria: 'Produtividade & Tempo'
      },
      {
        id: 'rpk_08',
        numero: '08',
        pergunta: 'Identificação e endereçamento de produto liberado',
        descricaoTecnica: 'Os paletes de produtos prontos recebem etiqueta de identificação de repack e são direcionados para o picking.',
        categoria: 'Procedimento & Padrão'
      }
    ]
  },
  {
    id: 'despejo',
    nome: 'Despejo (Descarte de Líquidos e Avarias)',
    tituloCurto: 'Despejo',
    sigla: 'DSP',
    icone: 'Droplets',
    cor: 'rose',
    badge: 'Descarte Líquidos',
    descricao: 'Diagnóstico da drenagem ecológica e descarte de produtos impróprios para comercialização.',
    focoPrincipal: 'Aferição de HL perdidos, segregação de vidro/alumínio/PET e conformidade ambiental.',
    itens: [
      {
        id: 'dsp_01',
        numero: '01',
        pergunta: 'Uso de EPIs específicos para despejo e químicos',
        descricaoTecnica: 'Operador com avental impermeável, bota de borracha, luvas nitrílicas longas e protetor facial/óculos.',
        categoria: 'Segurança & EPI'
      },
      {
        id: 'dsp_02',
        numero: '02',
        pergunta: 'Limpeza e desobstrução da grelha de drenagem',
        descricaoTecnica: 'A grade do canal de despejo está sem acúmulo de cacos de vidro, tampas de garrafa ou plástico.',
        categoria: 'Registro & 5S'
      },
      {
        id: 'dsp_03',
        numero: '03',
        pergunta: 'Segregação de resíduos secos (Vidro, Lata, PET)',
        descricaoTecnica: 'Cada tipo de material descartado é direcionado para a caçamba correta de reciclagem (alumínio, vidro âmbar/verde, PET).',
        categoria: 'Procedimento & Padrão'
      },
      {
        id: 'dsp_04',
        numero: '04',
        pergunta: 'Conferência física de quantidades e HL antes do despejo',
        descricaoTecnica: 'Conferência rigorosa dos lotes apontados para descarte contra a autorização de refugo/quebra.',
        categoria: 'Procedimento & Padrão'
      },
      {
        id: 'dsp_05',
        numero: '05',
        pergunta: 'Controle de vazão e contenção de odores na canaleta',
        descricaoTecnica: 'O despejo ocorre sem transbordamento da canaleta e a válvula de retenção de efluentes está funcional.',
        categoria: 'Procedimento & Padrão'
      },
      {
        id: 'dsp_06',
        numero: '06',
        pergunta: 'Registro de HL despejados no sistema DPO',
        descricaoTecnica: 'O volume em Hectolitros (HL) descartado é computado e conciliado com as baixas fiscais.',
        categoria: 'Registro & 5S'
      },
      {
        id: 'dsp_07',
        numero: '07',
        pergunta: 'Higienização e neutralização química ao fim do processo',
        descricaoTecnica: 'A área é lavada com neutralizante para evitar proliferação de insetos e contaminação cruzada.',
        categoria: 'Registro & 5S'
      },
      {
        id: 'dsp_08',
        numero: '08',
        pergunta: 'Tempo e produtividade da operação de descarte',
        descricaoTecnica: 'O tempo de despejo por lote atende ao tempo padrão programado para a rotina diária.',
        categoria: 'Produtividade & Tempo'
      }
    ]
  },
  {
    id: 'quebras',
    nome: 'Quebras (Tratativa de Avarias e Não Conformidades)',
    tituloCurto: 'Quebras',
    sigla: 'QBR',
    icone: 'AlertTriangle',
    cor: 'amber',
    badge: 'Avarias Armazém',
    descricao: 'Diagnóstico da tratativa imediata de quebras ocorridas nas ruas de picking, pulmão e manobras de empilhadeira.',
    focoPrincipal: 'Isolamento rápido da via, investigação da causa raiz, contenção de perdas e segurança.',
    itens: [
      {
        id: 'qbr_01',
        numero: '01',
        pergunta: 'Sinalização e isolamento imediato da área da quebra',
        descricaoTecnica: 'A área do incidente foi imediatamente isolada com cones ou sinalizadores para evitar acidentes com pedestres e veículos.',
        categoria: 'Segurança & EPI'
      },
      {
        id: 'qbr_02',
        numero: '02',
        pergunta: 'Registro de evidência fotográfica antes da remoção',
        descricaoTecnica: 'A quebra foi fotografada no estado original para auditoria e análise de causa raiz (piso, paletização ou manobra).',
        categoria: 'Registro & 5S'
      },
      {
        id: 'qbr_03',
        numero: '03',
        pergunta: 'Investigação e classificação da Causa Raiz',
        descricaoTecnica: 'A causa real foi identificada na hora (palete frágil, manobra brusca, colisão em coluna, piso molhado, stretch solto).',
        categoria: 'Procedimento & Padrão'
      },
      {
        id: 'qbr_04',
        numero: '04',
        pergunta: 'Segregação imediata de produtos íntegros para Repack',
        descricaoTecnica: 'As unidades não danificadas foram recolhidas e encaminhadas de pronto ao Repack para não acumularem avaria no chão.',
        categoria: 'Qualidade & FEFO'
      },
      {
        id: 'qbr_05',
        numero: '05',
        pergunta: 'Apontamento completo da quebra no sistema (SKU/Qtd/Rua)',
        descricaoTecnica: 'Lançamento detalhado com código do produto, quantidade, operador envolvido, equipamento e setor.',
        categoria: 'Registro & 5S'
      },
      {
        id: 'qbr_06',
        numero: '06',
        pergunta: 'Tempo de limpeza e desobstrução da via (< 15 minutos)',
        descricaoTecnica: 'A remoção dos cacos e secagem do piso foi concluída em menos de 15 minutos, liberando a circulação.',
        categoria: 'Produtividade & Tempo'
      },
      {
        id: 'qbr_07',
        numero: '07',
        pergunta: 'Feedback operacional e orientação ao colaborador',
        descricaoTecnica: 'O operador envolvido recebeu orientação técnica imediata do supervisor ou monitor de processo.',
        categoria: 'Procedimento & Padrão'
      },
      {
        id: 'qbr_08',
        numero: '08',
        pergunta: 'Comunicação e abertura de Gatilho DPO se aplicável',
        descricaoTecnica: 'Caso a quebra exceda o valor de gatilho, foi formalizada a comunicação e aberto o plano de ação correspondente.',
        categoria: 'Registro & 5S'
      }
    ]
  },
  {
    id: 'efc',
    nome: 'EFC (Eficiência de Carregamento / Expedição)',
    tituloCurto: 'EFC',
    sigla: 'EFC',
    icone: 'Truck',
    cor: 'blue',
    badge: 'Carregamento',
    descricao: 'Diagnóstico da montagem e estivação de cargas nas carretas de distribuição e rotas de entrega.',
    focoPrincipal: 'Alinhamento dos paletes, travamento de carga, pontualidade da expedição e conferência fiscal.',
    itens: [
      {
        id: 'efc_01',
        numero: '01',
        pergunta: 'Veículo calçado, desligado e com chaves na portaria',
        descricaoTecnica: 'O caminhão na doca possui calço de roda instalado e o motorista aguarda fora do baú na sala de motoristas.',
        categoria: 'Segurança & EPI'
      },
      {
        id: 'efc_02',
        numero: '02',
        pergunta: 'Inspeção prévia do baú (limpeza, pregos, teto estanque)',
        descricaoTecnica: 'O interior do baú foi checado: sem odores, pregos salientes no piso ou furos que permitam infiltração de chuva.',
        categoria: 'Procedimento & Padrão'
      },
      {
        id: 'efc_03',
        numero: '03',
        pergunta: 'Estabilidade e padrão de stretch dos paletes carregados',
        descricaoTecnica: 'Todos os paletes que entram no caminhão estão compactos, sem inclinação e com filme stretch firme.',
        categoria: 'Qualidade & FEFO'
      },
      {
        id: 'efc_04',
        numero: '04',
        pergunta: 'Sequenciamento de carga conforme ordem de entrega (LIFO)',
        descricaoTecnica: 'A ordem dos paletes respeita estritamente o roteiro de entrega da distribuição.',
        categoria: 'Procedimento & Padrão'
      },
      {
        id: 'efc_05',
        numero: '05',
        pergunta: 'Conferência cega / Bipe de código de barras por pallet',
        descricaoTecnica: 'Conferência de 100% dos volumes físicos contra a lista de picking e nota fiscal de saída.',
        categoria: 'Registro & 5S'
      },
      {
        id: 'efc_06',
        numero: '06',
        pergunta: 'Instalação de travas de carga, airbags ou catracas',
        descricaoTecnica: 'A carga foi travada adequadamente para evitar deslocamento ou tombamento durante o trânsito da rota.',
        categoria: 'Segurança & EPI'
      },
      {
        id: 'efc_07',
        numero: '07',
        pergunta: 'Aderência ao tempo padrão de carregamento (SLA Doca)',
        descricaoTecnica: 'O tempo total de carregamento ficou dentro da meta estipulada em minutos por pallet/caminhão.',
        categoria: 'Produtividade & Tempo'
      },
      {
        id: 'efc_08',
        numero: '08',
        pergunta: 'Lacre de porta aplicado e número registrado na NF',
        descricaoTecnica: 'O número do lacre oficial foi registrado no romaneio e validado com a assinatura do motorista.',
        categoria: 'Registro & 5S'
      }
    ]
  },
  {
    id: 'efd',
    nome: 'EFD (Eficiência de Descarregamento / Recebimento)',
    tituloCurto: 'EFD',
    sigla: 'EFD',
    icone: 'Container',
    cor: 'teal',
    badge: 'Descarregamento',
    descricao: 'Diagnóstico do recebimento de produtos de fábricas e transferência entre centros de distribuição.',
    focoPrincipal: 'Conferência física x NF, verificação de tombamentos, controle FEFO e velocidade de descarregamento.',
    itens: [
      {
        id: 'efd_01',
        numero: '01',
        pergunta: 'Conferência do lacre de fábrica antes de abrir as portas',
        descricaoTecnica: 'Número do lacre do veículo bate 100% com a NF-e emitida pela unidade produtora.',
        categoria: 'Procedimento & Padrão'
      },
      {
        id: 'efd_02',
        numero: '02',
        pergunta: 'Avaliação de risco de tombamento na abertura do baú',
        descricaoTecnica: 'Abertura cuidadosa de uma folha da porta para verificar se há paletes inclinados apoiados contra a porta.',
        categoria: 'Segurança & EPI'
      },
      {
        id: 'efd_03',
        numero: '03',
        pergunta: 'Conferência física de SKUs, lotes e validades (FEFO)',
        descricaoTecnica: 'Conferência de que as datas de validade recebidas estão dentro da regra de recebimento (shelf life padrão).',
        categoria: 'Qualidade & FEFO'
      },
      {
        id: 'efd_04',
        numero: '04',
        pergunta: 'Lavratura imediata de laudo de avarias com transportador',
        descricaoTecnica: 'Caso haja produtos danificados na puxada, o laudo com fotos é preenchido antes de descarregar o lote.',
        categoria: 'Registro & 5S'
      },
      {
        id: 'efd_05',
        numero: '05',
        pergunta: 'Paletização e integridade dos estrados de madeira',
        descricaoTecnica: 'Os paletes recebidos estão íntegros, sem tocos soltos ou deformação que comprometa a estocagem em porta-palete.',
        categoria: 'Qualidade & FEFO'
      },
      {
        id: 'efd_06',
        numero: '06',
        pergunta: 'Tempo padrão de descarregamento (TMR Recebimento)',
        descricaoTecnica: 'A operação de descarregamento da carreta atendeu à meta de tempo padrão (ex: < 45 a 60 min).',
        categoria: 'Produtividade & Tempo'
      },
      {
        id: 'efd_07',
        numero: '07',
        pergunta: 'Etiquetagem de recebimento e destinação para pulmão',
        descricaoTecnica: 'Todos os paletes recebem a etiqueta de pulmão com data/hora e são alocados no endereço correto.',
        categoria: 'Procedimento & Padrão'
      },
      {
        id: 'efd_08',
        numero: '08',
        pergunta: 'Baixa e entrada fiscal concluída no sistema',
        descricaoTecnica: 'A conferência final foi confirmada no sistema para liberação imediata do estoque para venda.',
        categoria: 'Registro & 5S'
      }
    ]
  },
  {
    id: 'montagem',
    nome: 'Montagem (Montagem de Paletes / Picking)',
    tituloCurto: 'Montagem',
    sigla: 'MTG',
    icone: 'Layers',
    cor: 'sky',
    badge: 'Picking / Montagem',
    descricao: 'Diagnóstico da montagem de paletes mistos para entrega em clientes do canal distribuição.',
    focoPrincipal: 'Amarração correta, regra pesado embaixo/leve em cima, stretch correto e produtividade.',
    itens: [
      {
        id: 'mtg_01',
        numero: '01',
        pergunta: 'Conferência do mapa de picking e rota antes de iniciar',
        descricaoTecnica: 'O separador conferiu a sequência de itens e a capacidade de carga do palete a ser montado.',
        categoria: 'Procedimento & Padrão'
      },
      {
        id: 'mtg_02',
        numero: '02',
        pergunta: 'Qualidade do estrado de madeira selecionado',
        descricaoTecnica: 'O palete utilizado está limpo, sem rachaduras centrais, pregos salientes ou tocos soltos.',
        categoria: 'Segurança & EPI'
      },
      {
        id: 'mtg_03',
        numero: '03',
        pergunta: 'Regra de ouro: Pesado na base e leve no topo',
        descricaoTecnica: 'Garrafas e caixas pesadas formam a base; latas, descartáveis e itens leves ficam estritamente no topo.',
        categoria: 'Qualidade & FEFO'
      },
      {
        id: 'mtg_04',
        numero: '04',
        pergunta: 'Amarração cruzada (entrelaçamento) das caixas',
        descricaoTecnica: 'As camadas de caixas são montadas cruzadas para garantir travamento mecânico e evitar colapso da coluna.',
        categoria: 'Procedimento & Padrão'
      },
      {
        id: 'mtg_05',
        numero: '05',
        pergunta: 'Aplicação do filme stretch (base, corpo e topo)',
        descricaoTecnica: 'O palete recebe no mínimo 3 voltas de stretch na base prendendo no estrado e cobertura total com boa tensão.',
        categoria: 'Procedimento & Padrão'
      },
      {
        id: 'mtg_06',
        numero: '06',
        pergunta: 'Ausência de produtos sobressalentes na borda (overhanging)',
        descricaoTecnica: 'Nenhuma caixa ou lata ultrapassa a margem do estrado de madeira, evitando choques nas manobras.',
        categoria: 'Qualidade & FEFO'
      },
      {
        id: 'mtg_07',
        numero: '07',
        pergunta: 'Fixação de etiqueta de identificação da rota/palete',
        descricaoTecnica: 'A etiqueta com número da rota, cliente/carga e quantidade de volumes está afixada na posição padrão visível.',
        categoria: 'Registro & 5S'
      },
      {
        id: 'mtg_08',
        numero: '08',
        pergunta: 'Cadência e produtividade de caixas separadas por hora',
        descricaoTecnica: 'O ritmo do separador atinge a meta de caixas/hora estipulada para o perfil de picking misto.',
        categoria: 'Produtividade & Tempo'
      }
    ]
  },
  {
    id: 'validades',
    nome: 'Recolhimento de Validades (FEFO & Críticos)',
    tituloCurto: 'Validades',
    sigla: 'VAL',
    icone: 'CalendarAlert',
    cor: 'emerald',
    badge: 'FEFO / Validades',
    descricao: 'Diagnóstico da rotina diária de auditoria, sinalização e recolhimento de produtos com vencimento próximo.',
    focoPrincipal: 'Identificação visual FEFO (fitas/etiquetas), priorização de saída e prevenção de perdas por expiração.',
    itens: [
      {
        id: 'val_01',
        numero: '01',
        pergunta: 'Execução da ronda diária de validade nas ruas do CD',
        descricaoTecnica: 'A conferência física de shelf life foi executada em 100% das posições de picking e pulmão programadas.',
        categoria: 'Procedimento & Padrão'
      },
      {
        id: 'val_02',
        numero: '02',
        pergunta: 'Sinalização visual padrão com fitas/etiquetas coloridas',
        descricaoTecnica: 'Os paletes críticos possuem fita amarela/vermelha e etiqueta padrão indicando a data de validade de forma legível.',
        categoria: 'Qualidade & FEFO'
      },
      {
        id: 'val_03',
        numero: '03',
        pergunta: 'Posicionamento prioritário nas posições de picking',
        descricaoTecnica: 'Os lotes mais velhos (vencimento mais próximo) estão obrigatoriamente na frente das posições de apanhe (FEFO).',
        categoria: 'Qualidade & FEFO'
      },
      {
        id: 'val_04',
        numero: '04',
        pergunta: 'Quadro de Gestão à Vista FEFO 100% atualizado',
        descricaoTecnica: 'O quadro operacional de validades na parede do armazém reflete com precisão os SKUs e lotes críticos do dia.',
        categoria: 'Registro & 5S'
      },
      {
        id: 'val_05',
        numero: '05',
        pergunta: 'Notificação formal aos setores de Vendas e Trade',
        descricaoTecnica: 'A lista de produtos com menos de 30/60 dias foi comunicada formalmente para plano de escoamento acelerado.',
        categoria: 'Procedimento & Padrão'
      },
      {
        id: 'val_06',
        numero: '06',
        pergunta: 'Tratativa de produtos com validade extrema (< 15 dias)',
        descricaoTecnica: 'Itens abaixo da regra mínima de entrega para clientes foram bloqueados no sistema e direcionados para doação/descarte.',
        categoria: 'Qualidade & FEFO'
      },
      {
        id: 'val_07',
        numero: '07',
        pergunta: 'Zero produtos vencidos misturados no estoque ativo',
        descricaoTecnica: 'Auditoria comprovou que não existe nenhum SKU vencido misturado com os lotes liberados para faturamento.',
        categoria: 'Qualidade & FEFO'
      },
      {
        id: 'val_08',
        numero: '08',
        pergunta: 'Apontamento e baixa das perdas de validade no sistema',
        descricaoTecnica: 'Todos os ajustes e baixas de estoque foram devidamente lançados no sistema com as justificativas pertinentes.',
        categoria: 'Registro & 5S'
      }
    ]
  },
  {
    id: 'blitz-puxada',
    nome: 'Blitz Puxada (Carretas de Transferência entre Fábricas/CD)',
    tituloCurto: 'Blitz Puxada',
    sigla: 'PUX',
    icone: 'ShieldCheck',
    cor: 'indigo',
    badge: 'Auditoria Puxada',
    descricao: 'Auditoria e blitz técnica no momento da chegada de transferências fabris para rastrear quebras de transporte.',
    focoPrincipal: 'Laudo conjunto com transportador, medição de perdas em trânsito e qualidade da estivação fabril.',
    itens: [
      {
        id: 'pux_01',
        numero: '01',
        pergunta: 'Presença do motorista durante toda a inspeção inicial',
        descricaoTecnica: 'A abertura do veículo e a primeira avaliação visual são realizadas conjuntamente com o motorista do veículo.',
        categoria: 'Procedimento & Padrão'
      },
      {
        id: 'pux_02',
        numero: '02',
        pergunta: 'Avaliação das travas, cintas e barras de contenção',
        descricaoTecnica: 'As travas e barras de contenção de fábrica foram checadas: estavam firmes ou soltas durante o trajeto?',
        categoria: 'Segurança & EPI'
      },
      {
        id: 'pux_03',
        numero: '03',
        pergunta: 'Inspeção de tombamento lateral e esmagamento de base',
        descricaoTecnica: 'Verificação visual de fileiras inclinadas, caixas rasgadas por vibração de estrada ou paletes quebrados no trânsito.',
        categoria: 'Qualidade & FEFO'
      },
      {
        id: 'pux_04',
        numero: '04',
        pergunta: 'Lavratura do Termo de Avaria de Transporte assinado',
        descricaoTecnica: 'Em caso de qualquer quebra ou amassamento, o termo formal de avaria é assinado por ambas as partes.',
        categoria: 'Registro & 5S'
      },
      {
        id: 'pux_05',
        numero: '05',
        pergunta: 'Registro fotográfico com ângulo aberto e detalhe da avaria',
        descricaoTecnica: 'Fotos nítidas da placa do veículo, vista geral do baú e das caixas quebradas são anexadas ao laudo.',
        categoria: 'Registro & 5S'
      },
      {
        id: 'pux_06',
        numero: '06',
        pergunta: 'Segregação das avarias da puxada no ato do descarregamento',
        descricaoTecnica: 'Nenhum produto avariado em trânsito entra nas posições normais de pulmão do armazém.',
        categoria: 'Qualidade & FEFO'
      },
      {
        id: 'pux_07',
        numero: '07',
        pergunta: 'Preenchimento da planilha / sistema de qualidade da puxada',
        descricaoTecnica: 'Lançamento dos dados no indicador corporativo de qualidade da puxada em até 2 horas após a descarga.',
        categoria: 'Registro & 5S'
      },
      {
        id: 'pux_08',
        numero: '08',
        pergunta: 'Comunicação imediata à fábrica de origem sobre desvios',
        descricaoTecnica: 'A fábrica emissora foi notificada formalmente por e-mail/sistema caso o índice de quebra ultrapasse o padrão.',
        categoria: 'Procedimento & Padrão'
      }
    ]
  },
  {
    id: 'blitz-refugo',
    nome: 'Blitz Refugo (Área de Refugo, Quebras e Descarte)',
    tituloCurto: 'Blitz Refugo',
    sigla: 'REF',
    icone: 'Trash2',
    cor: 'amber',
    badge: 'Auditoria Refugo',
    descricao: 'Auditoria presencial na área de segregação de perdas, vasilhames avariados e refugos para evitar desvios.',
    focoPrincipal: '5S da área de perdas, triagem para recuperação no Repack, pesagem de cacos e segurança patrimonial.',
    itens: [
      {
        id: 'ref_01',
        numero: '01',
        pergunta: 'Delimitação e identificação visual da área de refugo',
        descricaoTecnica: 'O setor está delimitado com faixas amarelas no piso e placas de sinalização de perdas operacionais.',
        categoria: 'Registro & 5S'
      },
      {
        id: 'ref_02',
        numero: '02',
        pergunta: 'Etiquetagem de todos os lotes com data de entrada',
        descricaoTecnica: 'Todos os produtos e paletes no refugo possuem etiqueta identificando a data da quebra, SKU e responsável.',
        categoria: 'Procedimento & Padrão'
      },
      {
        id: 'ref_03',
        numero: '03',
        pergunta: 'Tempo de permanência de itens recuperáveis (< 24 horas)',
        descricaoTecnica: 'Produtos com possibilidade de reaproveitamento/reembalagem não permanecem mais de 24 horas parados no refugo.',
        categoria: 'Produtividade & Tempo'
      },
      {
        id: 'ref_04',
        numero: '04',
        pergunta: 'Empilhamento seguro de caixas plásticas e garrafeiras',
        descricaoTecnica: 'As caixas vazias e garrafeiras avariadas respeitam a altura máxima permitida de empilhamento.',
        categoria: 'Segurança & EPI'
      },
      {
        id: 'ref_05',
        numero: '05',
        pergunta: 'Organização e fechamento dos recipientes de cacos e latas',
        descricaoTecnica: 'Os tambores e caçambas de cacos de vidro estão protegidos e sem risco de corte para a equipe.',
        categoria: 'Segurança & EPI'
      },
      {
        id: 'ref_06',
        numero: '06',
        pergunta: 'Piso limpo, desengordurado e 5S aplicado no setor',
        descricaoTecnica: 'Ausência de poças de cerveja/refrigerante, piso higienizado sem odores ou atração de pragas.',
        categoria: 'Registro & 5S'
      },
      {
        id: 'ref_07',
        numero: '07',
        pergunta: 'Conciliação física x contábil das baixas de refugo',
        descricaoTecnica: 'A pesagem ou contagem física confere exatamente com as ordens de descarte emitidas no sistema.',
        categoria: 'Registro & 5S'
      },
      {
        id: 'ref_08',
        numero: '08',
        pergunta: 'Controle de acesso restrito ao setor de refugo',
        descricaoTecnica: 'Acesso restrito apenas aos operadores autorizados, prevenindo perdas patrimoniais.',
        categoria: 'Procedimento & Padrão'
      }
    ]
  }
];

export const INITIAL_DTO_HISTORICO_MOCK: DtoRegistro[] = [
  {
    id: 'dto-reg-101',
    data: '2026-08-19',
    hora: '15:30',
    dataHoraISO: '2026-08-19T15:30:00.000Z',
    operacaoId: 'repack',
    operacaoNome: 'Repack (Reembalagem de Avarias)',
    motivoDto: 'meta_nao_batida',
    metaEsperada: '28 cx/h',
    resultadoRealizado: '17 cx/h (-39%)',
    indicadorOfensor: 'Cadência de Reembalagem de Latas 350ml',
    avaliadorNome: 'Carlos Eduardo (Supervisor DPO)',
    avaliadorCargo: 'Supervisor de Logística',
    colaboradorNome: 'Marcos Vinícius Silva',
    turno: '1º Turno',
    linhaOuBox: 'Bancada 02 - Repack Latas',
    respostas: {
      rpk_01: { itemId: 'rpk_01', conforme: true },
      rpk_02: { itemId: 'rpk_02', conforme: false, observacao: 'Bancada com excesso de papelão rasgado obstruindo a passagem' },
      rpk_03: { itemId: 'rpk_03', conforme: false, observacao: 'Latas misturadas de lotes diferentes na mesma caixa' },
      rpk_04: { itemId: 'rpk_04', conforme: true },
      rpk_05: { itemId: 'rpk_05', conforme: false, observacao: 'Fita adesiva com folga lateral gerando retrabalho' },
      rpk_06: { itemId: 'rpk_06', conforme: true },
      rpk_07: { itemId: 'rpk_07', conforme: false, observacao: 'Falta de suprimento de fita causou 25 min de máquina parada' },
      rpk_08: { itemId: 'rpk_08', conforme: true }
    },
    totalItens: 8,
    itensConformes: 4,
    itensNaoConformes: 4,
    percentualConformidade: 50.0,
    classificacao: 'critico',
    observacaoGeral: 'Operação não atingiu a meta por falta de insumos (fitas e caixas) e bancada desorganizada.',
    planoAcao: {
      oQueFazer: 'Padronizar abastecimento prévio de insumos na bancada e reciclagem no procedimento POP-RPK-02.',
      responsavel: 'Carlos Eduardo / Marcos Vinícius',
      prazo: '2026-08-21',
      comoFazer: 'Checklist de abertura de turno e 5S antes de iniciar o primeiro lote de repack.',
      status: 'em_andamento'
    },
    criadoEm: '2026-08-19T15:45:00.000Z'
  },
  {
    id: 'dto-reg-102',
    data: '2026-08-18',
    hora: '11:20',
    dataHoraISO: '2026-08-18T11:20:00.000Z',
    operacaoId: 'efc',
    operacaoNome: 'EFC (Eficiência de Carregamento / Expedição)',
    motivoDto: 'meta_nao_batida',
    metaEsperada: 'Tempo máx: 40 min',
    resultadoRealizado: '68 min (+70% de atraso)',
    indicadorOfensor: 'Tempo de Carregamento Rota 14',
    avaliadorNome: 'Fernanda Lima (Coordenadora)',
    avaliadorCargo: 'Coordenadora de Expedição',
    colaboradorNome: 'Equipe Noturna Doca 04',
    turno: '2º Turno',
    linhaOuBox: 'Doca 04',
    respostas: {
      efc_01: { itemId: 'efc_01', conforme: true },
      efc_02: { itemId: 'efc_02', conforme: true },
      efc_03: { itemId: 'efc_03', conforme: false, observacao: 'Dois paletes com inclinação lateral exigiram refazer o stretch' },
      efc_04: { itemId: 'efc_04', conforme: true },
      efc_05: { itemId: 'efc_05', conforme: true },
      efc_06: { itemId: 'efc_06', conforme: false, observacao: 'Falta de barras de travamento na doca causou espera de 18 min' },
      efc_07: { itemId: 'efc_07', conforme: false, observacao: 'Atraso geral no ciclo de expedição' },
      efc_08: { itemId: 'efc_08', conforme: true }
    },
    totalItens: 8,
    itensConformes: 5,
    itensNaoConformes: 3,
    percentualConformidade: 62.5,
    classificacao: 'critico',
    observacaoGeral: 'Carregamento atrasou por necessidade de refazer o filme stretch de 2 paletes que saíram tortos da montagem.',
    planoAcao: {
      oQueFazer: 'Auditar máquina envolvedora de stretch e reforçar conferência de paletes antes de levar para a doca.',
      responsavel: 'Fernanda Lima',
      prazo: '2026-08-20',
      comoFazer: 'Ajuste na tensão do filme stretch e comunicação imediata à equipe de montagem.',
      status: 'concluido'
    },
    criadoEm: '2026-08-18T11:40:00.000Z'
  },
  {
    id: 'dto-reg-103',
    data: '2026-08-17',
    hora: '09:00',
    dataHoraISO: '2026-08-17T09:00:00.000Z',
    operacaoId: 'validades',
    operacaoNome: 'Recolhimento de Validades (FEFO & Críticos)',
    motivoDto: 'auditoria_rotina',
    metaEsperada: '100% FEFO Auditado',
    resultadoRealizado: '95% Conforme',
    indicadorOfensor: 'Auditoria Semanal de Shelf Life',
    avaliadorNome: 'Roberto Santos (Auditor de Qualidade)',
    avaliadorCargo: 'Auditor de Qualidade',
    colaboradorNome: 'Juliano Ferreira',
    turno: '1º Turno',
    linhaOuBox: 'Ruas 03 a 08 - Armazém Central',
    respostas: {
      val_01: { itemId: 'val_01', conforme: true },
      val_02: { itemId: 'val_02', conforme: true },
      val_03: { itemId: 'val_03', conforme: true },
      val_04: { itemId: 'val_04', conforme: true },
      val_05: { itemId: 'val_05', conforme: true },
      val_06: { itemId: 'val_06', conforme: true },
      val_07: { itemId: 'val_07', conforme: true },
      val_08: { itemId: 'val_08', conforme: false, observacao: 'Falta de baixa imediata de 3 caixas avariadas na planilha' }
    },
    totalItens: 8,
    itensConformes: 7,
    itensNaoConformes: 1,
    percentualConformidade: 87.5,
    classificacao: 'atencao',
    observacaoGeral: 'Rotina de FEFO muito bem executada, apenas ajuste no fluxo de baixa imediata.',
    planoAcao: {
      oQueFazer: 'Garantir baixa no sistema no mesmo turno do recolhimento.',
      responsavel: 'Juliano Ferreira',
      prazo: '2026-08-18',
      comoFazer: 'Uso do coletor móvel no momento da inspeção.',
      status: 'concluido'
    },
    criadoEm: '2026-08-17T09:30:00.000Z'
  }
];
