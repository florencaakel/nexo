# Nexo — plano A1 para demonstração funcional

## Atualização de continuidade — 17/11/2026

T02–T06 implementadas e verificadas localmente na branch `continue-nexo-project`: APIs, adaptador sem chamadas pagas, entrevista persistente, painel, revisão manual/versionada e administração. TypeScript e build passaram; 65 testes passaram na revisão independente. Fluxo de relato → recibo → painel → decisão → recarga confirmado no navegador local. [QA-PRE-A2](QA-PRE-A2.md) e [QA-BROWSER-LOCAL](QA-BROWSER-LOCAL.md) delimitam as evidências.

A2 está preparada em [A2-PROPOSTA](A2-PROPOSTA.md), ainda não aprovada. A3 não foi solicitada. IA real, avaliação dos 12 casos, orientação C10 validada, acesso ao repositório do Site e testes hospedados permanecem pendentes. Retenção automática não existe; exclusão sintética é manual.

A consulta de metadados retornou Nexo v2, mas a emissão de acesso ao repositório falhou com “Sites project not found”. O original em Downloads foi preservado e a implementação foi importada no repositório local vazio; a reconciliação remota não foi realizada. OpenAI Developers está disponível para instalação, diferentemente do bloqueio administrativo relatado no pacote. Nenhuma credencial foi criada, chamada paga executada ou nova versão publicada.

## Plano e fotografia histórica de T00/A1

Data: 16 de novembro de 2026, America/Sao_Paulo.
Estado: T00 concluída; A1 aprovada pela usuária. Implementação local iniciada; A2 e A3 pendentes.

## Decisão para a usuária

A proposta é transformar o Site existente em uma demonstração funcional de triagem de consumidor: entrevista por texto, salvamento do caso, ficha produzida por IA e revisão humana em painel restrito. A identidade branca, azul e laranja será preservada.

A usuária autorizou expressamente inventar os dados porque o uso será apenas demonstrativo. Por isso, a entrega usará uma organização fictícia, pessoas fictícias e relatos sintéticos, identificados como demonstração. Não haverá atendimento real nem pedido de aprovação para abrir um piloto real nesta entrega.

**Aprovação A1 recebida:** autorizar o escopo e a arquitetura abaixo, incluindo desenvolvimento local, contratos, testes e documentação. Custos de API/recursos e publicação dependem, respectivamente, de A2 e A3. A autorização de dados fictícios e a aprovação explícita de A1 foram recebidas e registradas em APPROVALS.md.

## O que existe e o que falta

| Item | Estado confirmado na T00 |
| --- | --- |
| Site existente | Nexo, público, versão 2, publicação com status `succeeded` |
| Endereço | https://nexo-triagem-juridica.insper-1495.chatgpt.site |
| Apresentação | HTML/CSS/JavaScript, menu, FAQ e animação; branco, azul e laranja |
| Botão principal | Leva à seção de contato, que informa “Contato em breve” |
| Entrevista e envio | Não existem |
| IA operacional | Não existe; a ficha visível é um exemplo fixo |
| Banco e persistência | Não existem |
| Login e autorização do aplicativo | Não existem |
| Painel e revisão gravada | Não existem |
| Servidor de negócio | Não existe; a hospedagem atual é estática |

Identidade preservada: `appgprj_6ac5417ab1088191936830568f12e4a8`.
Código publicado v2: `6e1e3486dfac3d4efb8c8ba7dabfa047f85926d6`.
Código local e remoto antes desta auditoria: `4e49b32625526103f228ffd51b1fecf44835280f`.
Diferença anterior à auditoria: apenas `robots.txt` e `sitemap.xml` em `src/` e `dist/`. Essas pendências de indexação estão preservadas e ainda não foram publicadas.

O build atual recompilou sem alterar nenhum arquivo de `dist/`. A abertura da página pública e o clique em “Conheça a Nexo” confirmaram a apresentação e o destino de contato. Isso não representa teste de um MVP, que ainda não existe. Evidências completas em [QA.md](QA.md).

## Escopo proposto

- Uma organização: “Nexo — Ambiente de Demonstração”, explicitamente fictícia.
- Português do Brasil; entrevista textual de consumidor: cobrança contestada, cancelamento e problema com produto ou serviço.
- Relatos de outra área identificados para revisão humana, sem descarte automático.
- Até oito perguntas de esclarecimento; até 10.000 caracteres do participante por atendimento, com aviso de limite. Pode responder “não sei” ou encerrar antes.
- Revisão das respostas antes de enviar; recibo somente após gravação no servidor.
- IA real, de um único provedor a escolher em A2, com resultado validado e referências às mensagens originais.
- Painel com lista, filtro por estado, original, ficha, correção versionada e decisão humana.
- Critérios simples e versionados: área atendida, assuntos do recorte e sinais relatados para revisão. Não criar critérios de renda, localização ou capacidade sem definição posterior.
- Administração de testadores/revisores, pausa de novas entrevistas e chamadas, limites e acompanhamento de consumo.
- Somente usuários expressamente autorizados testam a demonstração. A página institucional continua pública.

Ficam fora: relatos reais, WhatsApp, áudio, anexos, OCR, pagamentos, assinatura, marketplace, encaminhamento automático a terceiros, consultas a tribunais, petições, jurisprudência e treinamento próprio. Documentos mencionados não serão recebidos ou analisados.

Não pedir CPF, dados bancários ou endereço completo. Contato será opcional e fictício, quando necessário ao exemplo, com domínio reservado `.example`. Não inventar registro profissional, contato operacional, cliente real, depoimento ou resultado comercial.

Exemplo sintético proposto: “Pessoa Exemplo 01” relata uma cobrança após cancelar um serviço fictício. Datas, valores e documentos usados no gabarito deverão constar do próprio relato. A ficha será gerada durante o teste; os dados fixos históricos não serão usados como prova de IA.

## Como a demonstração será usada

**Participante:** entra com identidade autorizada; vê o aviso de demonstração; relata um caso fictício; responde uma pergunta por vez; confere e corrige; confirma o envio; recebe identificador e estado do caso após salvamento. Se a IA falhar, o relato permanece salvo e o estado informa a pendência. Não recebe notas internas nem conclusão jurídica automática.

**Revisor:** entra no painel; escolhe o caso; lê original e pré-análise; verifica as referências; corrige campos; registra “pedir informações”, “aceitar para atendimento” ou “encerrar”; reabre o caso e encontra a decisão preservada. Aceitar é uma decisão humana simulada de atendimento, não reconhecimento de direito.

**Administrador:** gerencia quem testa e revisa, altera critérios criando uma nova versão e suspende novas entrevistas/chamadas sem perder acesso aos registros existentes.

A proposta é que a conta da própria usuária exerça os papéis de administradora, revisora e testadora na demonstração. A associação será feita por identidade verificada no Site, antes da abertura hospedada. Nenhum visitante ganha administração por ser o primeiro a entrar. Nomes fictícios de personagens não substituem contas autenticadas. Outros testadores só serão adicionados quando indicados pela usuária.

## Arquitetura proposta

| Camada | Escolha e finalidade |
| --- | --- |
| Interface | Vinext/React/TypeScript no modelo suportado por Sites, reaproveitando a apresentação e seus estilos |
| Servidor | Cloudflare Worker com APIs da entrevista, revisão, autorização e consumo |
| Dados | D1, com migrações versionadas; relato, mensagens, análise, revisão, critérios, acesso e consumo |
| Identidade | Login nativo com ChatGPT; autorização adicional por organização e papel em cada operação |
| IA | Adaptador chamado apenas pelo servidor; segredo protegido; schema e prompt versionados |
| Arquivos | Sem upload e sem armazenamento R2 no escopo |
| Hospedagem | Mesmo projeto, endereço e público da apresentação; rotas operacionais protegidas no servidor |

Essa escolha é baseada nas capacidades documentadas do ambiente atual. A construção e a validação da combinação ocorrerão após A1. A migração partirá de um starter separado; o repositório e a apresentação serão preservados. Nenhuma instalação ou migração foi executada na T00.

Rotas propostas: `/`, `/relato`, `/painel`, `/painel/casos/:id` e `/painel/configuracoes`.
Entidades: Organization, Membership, IntakeSession, Case, Message, Analysis, Review, CriteriaVersion, AuditEvent e AIUsage.

Regras essenciais:

- Organização e permissões são determinadas no servidor, nunca aceitas como autoridade do navegador.
- Salvar antes da geração final; autenticar e autorizar toda leitura e escrita.
- Identificador de caso não concede acesso. Participantes só acessam sua sessão e recibo, sem lista de casos ou notas internas.
- Original e correção humana são separados; edição concorrente gera conflito explícito.
- Idempotência por operação e trava de processamento por caso impedem análises simultâneas acidentais.
- Orçamento reservado atomicamente antes da chamada; teto de tentativas, tokens e consumo definido em A2. Timeout com cobrança incerta será registrado, sem repetição ilimitada.
- Fluxo de análise limitado por requisição, com retomada autorizada; não depender de tarefas em segundo plano sem suporte verificado.
- Saída da IA validada em formato e conteúdo, incluindo referências e trechos. Relato é dado não confiável; não altera instruções, acesso ou critérios.
- A IA não recebe ferramentas para executar SQL, shell, navegar, enviar mensagens ou alterar permissões.
- Coleta real permanece desabilitada no servidor. Não é possível garantir que alguém nunca digite informação real: interface, casos orientados e acesso restrito reduzem esse risco, sem transformar a demo em canal operacional.

## Execução e equipe

O coordenador mantém identidade do Site, contratos, dependências, integração e publicação. S1 detalha produto/contratos; S2 cuida de servidor/dados/acesso; S3, de IA/avaliação; S4, de interface; S5 faz revisão independente. Na T00 atuaram apenas S1 e S5, em leitura, sem subdelegação.

Após A1: T01 fixa contratos; T02 prepara servidor; T03–T06 implementam módulos com propriedade de arquivos definida; T07 conecta IA após A2; T08–T11 integram e verificam; T12 publica após A3; T14 entrega instruções. T13, piloto real, não será executada no escopo atual. [TASKS.md](TASKS.md) contém responsáveis, dependências e critérios.

## O que precisa passar antes da entrega

1. Caso fictício novo percorre entrevista, correção, salvamento, IA real e revisão humana sem edição manual de banco.
2. Caso e decisão persistem após recarga e em outra sessão autorizada.
3. Anônimo, usuário sem papel e usuário de outra organização não acessam casos; participante não recebe notas internas.
4. Duplicação, falha de rede, recusa/erro da IA e limite de consumo preservam relato e comunicam o estado verdadeiro.
5. Revisões simultâneas não sobrescrevem silenciosamente; pausa administrativa e bloqueio de coleta real funcionam.
6. Interface e navegação por teclado verificadas em celular e desktop.
7. Doze casos sintéticos com rubrica prévia: todas as respostas aceitas válidas no schema; zero fatos/referências inventados aceitos como confirmados; zero decisões automáticas; ao menos 10/12 aprovados na rubrica e cada cenário crítico aprovado individualmente.
8. Publicação confirmada e testes hospedados de identidade, autorização e persistência concluídos. Se um teste exigir publicação antecipada, pedir autorização limitada para esse teste.

## Pendências por aprovação

| Decisão | Quando é necessária |
| --- | --- |
| A1: escopo, recorte de consumidor e arquitetura desta proposta | Antes de implementar funcionalidades |
| A2: provedor/modelo, credencial protegida e tetos de custo | Antes de chamadas pagas ou recursos com cobrança; preparar código/testes locais primeiro |
| Identidade da administradora e lista de testadores/revisores | Antes de abrir a demonstração hospedada; não bloqueia os contratos locais |
| A3: versão concreta, evidências, público e reversão | Antes de publicar a versão testável |
| A4: operação com dados reais | Não solicitada; fora desta entrega demonstrativa |

Não foi executada chamada de API de IA nem provisionado recurso de MVP com cobrança nesta auditoria. Preços e modelos não foram estimados nesta etapa; serão verificados em A2. Nenhuma chave deve ser enviada pelo chat. Se OpenAI for escolhido, será necessário disponibilizar seu fluxo oficial de configuração protegida antes da integração.

## Pendências antigas a tratar no desenvolvimento

- Atualizar orientações de README e PROMPT-PARA-O-CHAT que ainda descrevem uma cópia para criação de outro Site.
- Trocar o exemplo editorial de Trabalho por Consumidor, se A1 for aprovada, preservando a apresentação.
- Manter o histórico QA como histórico; criar evidências do novo candidato. Reconciliar o manifesto de hashes antigo antes de usá-lo como verificação de integridade.
- Preservar `robots.txt`/`sitemap.xml`; revisar o pacote A3 para indexar apenas a apresentação, sem inserir rotas ou casos privados no sitemap. Não publicar essas pendências automaticamente.

## Referências oficiais consultadas

As orientações abaixo foram consultadas na T00. O recorte de consumidor e os gates A1–A4 são decisões do prompt da Nexo, não exigências ou certificações dessas empresas.

- [OpenAI — Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents): tarefas independentes em leitura; cuidado com escrita concorrente e permissões.
- [OpenAI — AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md): instruções locais inspecionadas antes de trabalhar; não foram encontrados AGENTS.md/CLAUDE.md aplicáveis no projeto ou nos ancestrais verificados.
- [OpenAI — Structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs): formato estruturado não garante exatidão; tratar recusa e saída incompleta.
- [OpenAI — Safety in building agents](https://developers.openai.com/api/docs/guides/agent-builder-safety): separar entrada não confiável de instruções e restringir efeitos possíveis da saída.
- [Anthropic — Building effective agents](https://www.anthropic.com/research/building-effective-agents): preferir o fluxo mais simples que resolva a tarefa. O artigo é de 2024 e contém aviso de evolução das ferramentas; foi usado apenas para esse princípio.
- [Anthropic — Sub-agents](https://code.claude.com/docs/en/sub-agents): responsabilidades e limites explícitos. Não foram criadas configurações de Claude Code neste ambiente.

Os mecanismos de Worker, D1 e identidade foram conferidos nas referências atuais da hospedagem. Não há promessa de conformidade jurídica nem de desempenho ainda não medido.
