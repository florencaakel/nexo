# Nexo — voz, encaminhamento e retorno da banca

Atualização local em 17/11/2026. **Ainda não publicada.** O endereço https://aps-nexo.vercel.app continua na versão anterior. A autorização daquele deploy foi usada; esta atualização exige confirmação específica. Fonte funcional: `98abab0` na branch `continue-nexo-project`.

## O que mudou

O público inicial passou a ser escritórios que atuam pelo consumidor em demandas repetitivas de cobrança, cancelamento e produtos ou serviços. A dor descrita é a repetição da coleta e organização de informações antes da avaliação profissional. Não há números de economia, clientes, resultados ou depoimentos inventados.

O Nexo aparece como apoio à secretaria/paralegal: prepara a conversa humana. Família e situações sensíveis não são o foco. A apresentação não promete atendimento real na demonstração.

A home tem acesso direto ao aplicativo, exemplo em áudio, transcrição e quatro etapas comandadas pelo visitante. O áudio é fictício, com voz sintetizada localmente pelo macOS, sem serviço pago. O mesmo texto pode ser preenchido no aplicativo por `/relato?exemplo=cancelamento`, mas só é salvo por ação do visitante.

Foram preservados logo e cores. Os X decorativos, slogans pequenos, efeitos diferentes de botões, rotação automática, “Contato em breve”, FAQ genérico de pro bono e pergunta sobre disponibilidade saíram da página. Os arquivos históricos do site permanecem no repositório; os efeitos antigos não são carregados pela nova home. Nenhum contato fictício foi criado.

## Voz

`VoiceInput` usa a Web Speech API nativa (`SpeechRecognition` ou `webkitSpeechRecognition`), em português do Brasil. É **ditado ao vivo que vira texto**, não upload de arquivos nem armazenamento de gravações. Não há chave, conta, nova dependência ou API paga no Nexo.

A pessoa precisa marcar a ciência sobre o processamento pelo fornecedor do navegador e clicar para iniciar. Alguns navegadores usam serviço remoto; esta opção **não tem garantia de processamento local ou offline**. Textos da home, formulário e aviso geral explicam a diferença entre texto salvo localmente e áudio processado pelo navegador. Referência primária: [MDN SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).

O texto existente fica protegido. Resultados provisórios são mostrados sem gravação; apenas finais são acrescentados, sem duplicação, ao encerrar. Salvar a resposta continua sendo uma ação separada. Limite de dois minutos, limite de caracteres, parada/cancelamento e troca de aba tratados. Falhas de permissão, rede, idioma ou microfone oferecem saída por escrita. Se há falha de serviço após resultados finais, esses resultados são preservados no rascunho.

Pendente: testar captação e reconhecimento reais no navegador/dispositivo que será usado na apresentação. Nesta rodada não foi acionado microfone real nem enviado áudio a um provedor. Uma pergunta sobre preferência por serviço de voz do navegador foi apresentada ao Florença; até este registro não houve resposta. O código fica preparado para revisão, com opção desmarcada por padrão.

## Indicação de encaminhamento

O resultado administrativo usa três escolhas explícitas: tipo de demanda, objetivo e necessidade percebida de atenção humana por urgência/assunto sensível. Não infere direito ou chance de ação por palavras-chave no relato. Não há conclusão “não cabe ação”.

- Atenção humana indicada: priorizar conversa com uma pessoa.
- Qualquer resposta “Não sei”: esclarecer com uma pessoa, sem descartar o relato.
- Outro assunto: conversar sobre outra especialidade.
- Consumo e pedido de informação: informações iniciais, mantendo opção de avaliação humana.
- Consumo e pedido de avaliação: levar para avaliação jurídica de consumidor.

Regras fixas `nexo-encaminhamento-v1`; não utilizam o texto livre de critérios do painel. A base fica disponível. Um botão separado adiciona perguntas, respostas e orientação ao relato, para conferência/correção. Nada é enviado a uma equipe.

O registro auxiliar gerado não ocupa os trechos da ficha: permanece no original e no recibo. Só registros canônicos exatos são tratados como auxiliares; alterações livres da pessoa continuam nos trechos, evitando perda de informações. A ficha é gerada automaticamente depois da confirmação do caso; se falhar ou estiver pausada, o relato continua salvo e a geração manual permanece disponível.

## Verificações

- 119/119 testes passaram; TypeScript passou.
- 45 combinações de encaminhamento verificadas, desconhecidos sem recusa e atenção humana prevalecendo.
- Testes de transcrição: finais/intermediários, repetição, cancelamento, conflito de rascunho, Unicode e limites.
- Dois testes de regressão distinguem orientação auxiliar de informação livre na ficha.
- Build estático passou. Build Worker preservado passou antes do último ajuste de separação dos registros; o ajuste tem cobertura por testes reais do motor e TypeScript.
- Jornada no navegador com CSP da hospedagem: exemplo preenchido, ditado **simulado por adaptador de teste**, final repetido sem duplicação, texto provisório não incorporado, gravação, orientação, confirmação, geração automática, revisão e recarga preservando tudo.
- Caso local de QA: `1f57c9b1-6ea3-4a63-9e12-056f3827551e`, registro v4. É anterior ao ajuste de separação da orientação; o ajuste está coberto pelos testes novos. Não é um registro remoto.
- Áudio ilustrativo: 20,29 s, reprodução observada com `readyState=4`, sem erro. Não é teste de captação de microfone.
- Home e detalhe observados em 1440 e 390 px; nenhum extravasamento lateral observado a 390. Menu móvel e etapas manuais funcionaram. Não é auditoria completa de desempenho/acessibilidade.
- Falhas da captura longa do navegador geraram imagens repetidas/incompletas; não são usadas como evidência. Capturas de viewport abaixo foram inspecionadas.

Capturas locais: [home desktop](evidencias/banca-home-desktop.png), [home mobile](evidencias/banca-home-mobile.png), [como funciona](evidencias/banca-como-funciona.png), [FAQ](evidencias/banca-faq.png).

## Para a apresentação

“O Nexo prepara o primeiro atendimento de escritórios que recebem muitas demandas parecidas de consumo. Ele faz a coleta e a organização que hoje tomam tempo da secretaria ou da paralegal. O advogado recebe o relato e os pontos a esclarecer para começar uma conversa mais informada. A avaliação jurídica e a decisão de atender continuam com uma pessoa.”

A economia de tempo/custo é uma hipótese a validar, não um resultado medido. A demo não cria petição, não analisa documentos e não presta atendimento real.

## Candidato para publicação, se autorizado

Pasta limpa: `outputs/nexo-vercel-6oGVPJ`, 28 arquivos (1.501.273 bytes), fonte `98abab0ec3b085cf1c209eb2f73a13cf97a59909`. Preparada por `npm run package:vercel`, selecionando manifesto e assets públicos versionados, sem abrir arquivos de ambiente. Não publicar `dist/browser` bruto. Destino proposto: projeto Vercel existente `aps-nexo`, time de hospedagem (identificador pessoal omitido), sem serviço adicional.

Antes de publicar, receber aprovação específica da Florença sobre esta atualização e a opção de ditado. Nenhum push, PR, merge ou deploy foi executado nesta rodada. A versão anteriormente publicada permanece disponível para reversão por novo deploy autorizado.
