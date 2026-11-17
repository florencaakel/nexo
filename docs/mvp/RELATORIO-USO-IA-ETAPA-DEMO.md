# RELATÓRIO DE DESENVOLVIMENTO E USO DE INTELIGÊNCIA ARTIFICIAL

NEXO

Maria Fernanda Venturin, Joana Senra, Florença Akel, Mariana Campos, Henrique Paiva

Demonstração funcional e revisão após a banca | 17/11/2026

## 1. Objetivo Inicial

Nesta etapa, precisávamos avançar do site de apresentação para uma demonstração que permitisse experimentar o fluxo do Nexo: registrar um relato, organizar as informações em uma ficha e simular a revisão humana. Também recebemos comentários sobre a apresentação e sobre uma preocupação central da banca: a possibilidade de a ferramenta afastar a pessoa do contato com um advogado.

O objetivo era tornar a demonstração utilizável pelo navegador, sem login, banco contratado ou dependência de IA paga, e explicar melhor para quem ela foi pensada. Definimos como foco inicial escritórios que atuam pelo consumidor em demandas repetitivas, como cobranças e cancelamentos, com o Nexo apoiando a organização anterior à conversa profissional.

Este relatório trata do uso de IA para desenvolver, revisar e testar essa versão. Há uma distinção importante: usamos um assistente de IA durante a construção, mas a entrevista e a organização da ficha na demonstração publicada funcionam por regras programadas, sem chamadas a um modelo generativo. O produto apresentado continua sendo uma demonstração com dados fictícios, sem atendimento jurídico real.

## 2. Ferramentas: o que exploramos e o que ficou

### Codex: da continuidade do projeto à implementação

Usamos o Codex para ler os arquivos de continuidade, examinar o código existente, propor ajustes e implementar as funcionalidades. O trabalho incluiu a adaptação das telas, a organização da ficha por regras, os testes automatizados, a revisão dos textos e a preparação da publicação. As instruções humanas definiram os limites: não depender de IA paga, preservar a decisão profissional e pedir autorização antes de publicar.

O projeto veio de uma etapa realizada com ChatGPT e Sites. Nesta fase, trabalhamos sobre os arquivos do projeto, com alterações registradas no Git e publicação na Vercel. Não fizemos uma comparação documentada entre modelos ou plataformas de IA; a escolha do Codex não é apresentada como resultado de um teste entre fornecedores.

### Regras programadas no lugar de uma API paga

Havia uma proposta de integração com IA paga, mas a orientação foi substituí-la por uma versão sem essa dependência. A entrevista passou a usar perguntas predefinidas, e a ficha passou a reunir trechos do relato, referências ao original e pontos a esclarecer com base em regras do aplicativo. Não houve chamada paga de IA para executar esse fluxo.

Essa escolha limita o que podemos prometer: a demonstração organiza informações em um fluxo delimitado, sem compreender livremente qualquer história ou produzir análise jurídica. Usar IA para escrever o código não torna todas as funções do programa funções de IA. A restrição de custos se refere ao funcionamento da demonstração.

### Voz e hospedagem: funções diferentes da IA de desenvolvimento

Para falar em vez de digitar, foi implementado o reconhecimento de voz disponível em navegadores compatíveis. O ditado vira texto editável, que a pessoa confere antes de salvar. Não foi criado um serviço de upload de gravações nem contratada uma API de transcrição. Como o navegador pode processar a voz por um serviço do seu fornecedor, a opção exige ciência do visitante e não é apresentada como necessariamente local ou disponível sem internet.

O áudio ilustrativo da página foi produzido com a voz sintetizada do macOS, a partir de um caso fictício identificado. Já a publicação foi feita na Vercel, no projeto aps-nexo. Entrevista, ficha e revisão simulada ficam armazenadas apenas naquele navegador, sem banco remoto contratado ou envio dos relatos a uma equipe. Isso viabiliza a apresentação, mas não constitui uma operação compartilhada de escritório.

## 3. O que deu errado e o que fizemos

### Explicar a função não bastava para explicar a dor

O retorno recebido mostrou que o site explicava o que o produto fazia, mas ainda deixava amplo demais quem o usaria e por quê. Expressões como “equipes que recebem demandas jurídicas” abrangiam situações muito diferentes. Além disso, a banca havia demonstrado resistência à ideia de substituir por um robô um contato que muitas pessoas procuram justamente por ser humano.

A correção foi posicionar o Nexo como apoio à secretaria ou à paralegal no primeiro atendimento de demandas repetitivas de consumo. A abertura passou a dizer “Mais tempo para ouvir. Menos tempo para organizar.” O papel proposto é preparar a conversa, reunindo o relato e as informações que precisam ser esclarecidas. A avaliação jurídica e a decisão de atender permanecem com uma pessoa. Assuntos de família e situações sensíveis deixaram de aparecer como um público genérico para a mesma solução.

A IA ajudou a transformar esse direcionamento em textos e interface. O problema e o critério para a mudança, porém, vieram do retorno humano. Também evitamos apresentar economia de tempo ou custo como resultado comprovado: essa é uma hipótese do projeto, ainda sem medição com usuários reais.

### O visitante não encontrava o aplicativo

Um dos comentários mais concretos foi a dificuldade de chegar ao aplicativo para ver um exemplo funcionando. A página de apresentação não deixava suficientemente claro esse caminho. Acrescentamos acesso direto à demonstração e um exemplo de cancelamento, com áudio fictício, transcrição e opção de levar o mesmo texto ao formulário.

Também mudamos o passo a passo para quatro etapas controladas pelo visitante, sem avanço automático. Os comentários indicavam que a sequência passava rápido demais. A solução desta etapa foi dar à pessoa o controle do ritmo. Simplificamos os efeitos dos botões, retiramos X decorativos, frases pequenas repetidas e perguntas que pouco ajudavam a entender a proposta. O bloco “Contato em breve” foi removido; não inventamos um canal de atendimento para preencher a ausência.

### “Mandar áudio” precisava virar um comportamento definido

O pedido de áudio podia significar enviar um arquivo, guardar uma gravação ou falar para preencher o texto. A implementação escolhida foi o ditado ao vivo. Essa diferença precisou aparecer na interface para que a pessoa soubesse o que esperar. O resultado pode ser corrigido antes de entrar no relato, e escrever continua disponível quando o recurso não funciona no navegador.

A implementação e os testes consideraram resultados provisórios, repetição de trechos e interrupções. Apenas resultados finais entram no rascunho; uma transcrição repetida não deve duplicar a frase. Também foram tratados cancelamento, limites de uso e falhas de permissão ou de rede. O teste no navegador usou reconhecimento simulado. Assim, sabemos que o fluxo foi exercitado, mas ainda precisamos testar captação e reconhecimento reais no dispositivo da apresentação.

### Uma indicação de encaminhamento não podia virar uma decisão jurídica

Também pedimos uma resposta inicial sobre levar ou não o caso ao jurídico. Uma resposta automática de “cabe” ou “não cabe ação” daria à demonstração uma responsabilidade que ela não tem condições de assumir. O resultado implementado foi uma indicação administrativa baseada em três escolhas explícitas: assunto, objetivo da pessoa e necessidade percebida de atenção humana.

Em um assunto de consumo com pedido de avaliação, o sistema sugere levar o relato para avaliação jurídica de consumidor. Se houver urgência ou assunto sensível indicado, prioriza a conversa com uma pessoa. Respostas “não sei” levam ao esclarecimento humano; outros assuntos indicam buscar a especialidade adequada. Nenhuma dessas saídas conclui que a pessoa não tem direito ou deve abandonar uma demanda. A orientação pode ser adicionada ao relato por uma ação separada e conferida pelo visitante.

### A orientação gerada aparecia de novo na ficha

Na integração, o registro auxiliar de encaminhamento podia ocupar os trechos destinados às informações do relato. Corrigimos essa separação: o texto gerado continua disponível no original, mas não é repetido como se fosse um novo fato contado pela pessoa. Se o visitante alterar livremente esse registro, a alteração continua sendo considerada, evitando descartar informação acrescentada por ele.

Também foi incluída a geração automática da ficha depois da confirmação do relato. Caso a geração falhe, o relato permanece salvo e existe a possibilidade de tentar novamente. Esse cuidado evita que uma falha na organização seja confundida com perda do que a pessoa escreveu.

### Publicar com sucesso não encerrava a verificação

Os registros desta versão mostram 119 testes automatizados aprovados, checagem de TypeScript e compilação da versão estática. Entre os testes estão 45 combinações de encaminhamento e situações de repetição, cancelamento e conflito do rascunho no ditado. Esses resultados verificam comportamentos do programa; não comprovam qualidade de avaliação jurídica, satisfação de usuários ou compreensão de qualquer relato.

Depois da autorização para publicar, o fluxo também foi conferido em aps-nexo.vercel.app: abertura do aplicativo, uso do exemplo fictício, sugestão de encaminhamento, confirmação, ficha automática e manutenção do registro após recarregar a página. O áudio de exemplo foi reproduzido, e a apresentação foi observada em tamanhos de desktop e celular. A revisão simulada havia sido exercitada na verificação local.

Ainda não houve teste real de microfone no dispositivo da apresentação, atendimento com usuários reais ou auditoria completa de acessibilidade e desempenho. Registrar esses limites foi parte da revisão: a existência de testes não permite afirmar que tudo foi validado.

## 4. O que faríamos diferente

### 1. Definir o público e o papel humano antes de pedir novas funções

Começaríamos com uma situação concreta de atendimento e descreveríamos o trabalho da pessoa atendida, do apoio administrativo e do advogado. Isso ajudaria a evitar uma apresentação ampla demais e a avaliar cada sugestão da IA pelo problema que ela resolve.

Também separaríamos desde o início a proposta futura do Nexo, o que a demonstração já executa e o que depende de validação. Isso teria esclarecido mais cedo a diferença entre construir com IA e oferecer uma análise jurídica por IA.

### 2. Traduzir pedidos gerais em critérios de funcionamento

Antes de pedir “áudio”, definiríamos se queremos ditado ou envio de arquivo, onde ocorre o processamento, o que é salvo e como a pessoa corrige o resultado. Antes de pedir uma resposta sobre encaminhamento, definiríamos quais informações sustentam a indicação e em quais situações a ferramenta deve chamar uma pessoa. Isso reduz o risco de aprovar uma interface convincente que promete mais do que o código faz.

Reservaríamos também um teste no mesmo computador e navegador da apresentação, com microfone real, além dos testes simulados. E pediríamos a alguém de fora do grupo que encontrasse a demonstração e explicasse, sem ajuda, quem toma a decisão final. Essa verificação de entendimento ainda precisa ser realizada; não a tratamos como resultado desta etapa.

### 3. Tratar registros e evidências como parte da entrega

Manteríamos desde o começo um registro curto de pedido, mudança, teste e pendência. Nesta etapa, os commits, as instruções de continuidade e os relatórios de verificação ajudaram a distinguir o que foi apenas proposto do que chegou à versão publicada. Também deixaram explícito que a publicação dependia de aprovação humana.

A experiência mostrou que a contribuição da IA precisa ser descrita por tarefas concretas: escrever e adaptar código, revisar textos, preparar testes e investigar falhas. A contribuição humana inclui escolher o problema, restringir o escopo, questionar promessas e decidir o que pode ser apresentado.

<!-- Base factual: conversa desta etapa; docs/mvp/RETORNO-BANCA.md, APPROVALS.md, PLAN.md e TASKS.md; histórico Git até 76899f9. Modelo de estilo e autoria: PDF “Nexo - Relatório de uso de IA” fornecido pelo usuário. O conteúdo desta nota não integra o PDF. -->
