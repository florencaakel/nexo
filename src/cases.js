// Dados exclusivamente fictícios. Nenhum relato é coletado ou enviado pelo site.
export const cases = [
  {
    id: 'trabalho', label: 'Trabalho', reference: 'Exemplo fictício 01', title: 'Jornada e pagamentos a esclarecer',
    story: '“Trabalhei até mais tarde em alguns dias e não entendi os valores do último pagamento. Tenho mensagens sobre os horários, mas não sei quais documentos preciso separar.”',
    summary: 'Pessoa relata extensão de jornada e dúvidas sobre valores recebidos. As condições do vínculo e os horários precisam ser confirmados.',
    areas: ['Direito do Trabalho'],
    timeline: [['Janeiro de 2026', 'Início do vínculo informado.'], ['Março e abril de 2026', 'Relato de jornadas além do horário habitual.'], ['Maio de 2026', 'Dúvida sobre o pagamento recebido.']],
    facts: ['Há relato de trabalho além do horário habitual.', 'Foram mencionadas mensagens sobre a jornada.', 'A composição do último pagamento não foi esclarecida.'],
    documents: ['Mensagens sobre horários', 'Comprovante de pagamento'],
    pending: ['Contrato ou registro do vínculo', 'Registros da jornada e recibos anteriores'],
    questions: ['Qual era o horário combinado e quais dias tiveram jornada estendida?', 'Havia pausas e registro dos horários?', 'Quais valores aparecem no comprovante de pagamento?'],
    points: ['Condições do vínculo e da jornada relatada.', 'Correspondência entre documentos, horários e pagamentos.'],
    urgency: 'Urgência não determinada', urgencyReason: 'Não foi informado prazo iminente. Datas e contexto precisam de revisão para avaliar a prioridade.',
    uncertainty: 'O relato não esclarece o tipo de vínculo, a frequência da jornada estendida nem a composição dos pagamentos. Não é possível concluir sobre valores ou direitos.',
    next: 'Completar as informações e reunir os registros disponíveis. Uma pessoa qualificada poderá revisar os pontos e avaliar o atendimento conforme os critérios da organização.'
  },
  {
    id: 'consumo', label: 'Consumo', reference: 'Exemplo fictício 02', title: 'Produto com defeito e contato sem solução',
    story: '“Comprei uma máquina de lavar. Ela parou de funcionar logo depois. Falei com a loja duas vezes, tenho o protocolo, mas ainda não recebi uma resposta sobre o reparo.”',
    summary: 'Pessoa descreve falha em produto recém-adquirido e tentativas de contato com a loja. A natureza do defeito e o histórico do atendimento precisam ser esclarecidos.',
    areas: ['Direito do Consumidor'],
    timeline: [['04 de abril de 2026', 'Compra mencionada no relato.'], ['18 de abril de 2026', 'Primeiro registro informado do defeito.'], ['20 e 27 de abril de 2026', 'Contatos relatados com a loja.']],
    facts: ['O produto teria parado de funcionar após a compra.', 'Foram relatados dois contatos com a loja.', 'Um protocolo de atendimento foi mencionado.'],
    documents: ['Comprovante de compra', 'Protocolo de atendimento'],
    pending: ['Respostas recebidas da loja', 'Ordem de serviço ou registro técnico do defeito'],
    questions: ['Quando o defeito foi comunicado e qual resposta foi recebida?', 'O produto foi encaminhado para avaliação ou reparo?', 'Há fotos, vídeos ou uma ordem de serviço sobre a falha?'],
    points: ['Cronologia da compra, do defeito e dos contatos.', 'Documentação do problema e das medidas propostas pela loja.'],
    urgency: 'Urgência não determinada', urgencyReason: 'O exemplo não informa risco imediato ou prazo em curso. O histórico deverá ser conferido na revisão.',
    uncertainty: 'Não há confirmação técnica da falha nem informação completa sobre as providências da loja. As datas são as relatadas no exemplo e não foram verificadas.',
    next: 'Organizar os comprovantes e esclarecer as respostas do atendimento. Submeter o material à revisão profissional para avaliar possíveis caminhos.'
  },
  {
    id: 'moradia', label: 'Moradia', reference: 'Exemplo fictício 03', title: 'Pedido de saída do imóvel em prazo curto',
    story: '“Moro de aluguel. Recebi uma mensagem pedindo que eu saísse em sete dias. Tenho contrato e recibos, mas não entendi o motivo e não sei se existe alguma notificação.”',
    summary: 'Pessoa informa pedido de saída do imóvel em sete dias, recebido por mensagem. A origem da solicitação, o contrato e a existência de notificação precisam ser verificados.',
    areas: ['Direito Civil', 'Moradia e locação'],
    timeline: [['Fevereiro de 2026', 'Início da locação informado.'], ['02 de junho de 2026', 'Mensagem com pedido de saída recebida.'], ['09 de junho de 2026', 'Data de saída indicada na mensagem fictícia.']],
    facts: ['A pessoa relata residir em imóvel alugado.', 'Uma mensagem solicita a saída em sete dias.', 'Contrato e recibos foram mencionados.'],
    documents: ['Contrato de locação', 'Recibos de aluguel', 'Mensagem recebida'],
    pending: ['Texto completo e autoria da mensagem', 'Eventual notificação ou documento judicial'],
    questions: ['Quem enviou a mensagem e qual motivo foi apresentado?', 'Qual é o prazo e o conteúdo do contrato?', 'Existe notificação formal ou documento judicial relacionado?'],
    points: ['Conteúdo do contrato e da solicitação de saída.', 'Existência de documentos formais e prazos que mereçam avaliação.'],
    urgency: 'Atenção ao prazo informado', urgencyReason: 'O pedido de saída em sete dias pode afetar a moradia. A prioridade e a validade do prazo exigem avaliação profissional.',
    uncertainty: 'Não há confirmação da autoria da mensagem, do fundamento da solicitação ou de procedimento formal. O exemplo não permite concluir sobre a validade do pedido.',
    next: 'Priorizar a revisão humana da mensagem e do contrato. O encaminhamento dependerá da área de atuação e da capacidade de atendimento da organização.'
  }
];
