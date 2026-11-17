# Nexo — tarefas do MVP demonstrativo

Data: 17/11/2026, America/Sao_Paulo. Estados: TODO, IN_PROGRESS, BLOCKED, REVIEW, DONE.
A1 explicitamente aprovada; desenvolvimento local autorizado. A2 e A3 pendentes.

| ID | Responsável | Dependências | Estado | Entrega e aceite |
| --- | --- | --- | --- | --- |
| T00 | Coordenador + S1/S5 em leitura | Nenhuma | DONE | Código, remoto, publicação, lacunas e plano A1 identificados; check/build e navegação atual verificados; PLAN e QA |
| T01 | Coordenador + S1 | T00 + A1 | DONE | Contratos, jornadas, estados, permissões e divisão de arquivos; A1 real registrada |
| T02 | Coordenador | T01 | DONE (local) | Estrutura Worker suportada, desenvolvimento e landing preservada; build local executável |
| T03 | S2 | T02 | DONE (local) | D1, migrações, membership, sessões, autorização e endpoints; persistência e testes negativos |
| T04 | S4 + integração S2 | T01; integrar T03 | DONE (local) | Entrevista, correção, confirmação, recibo verdadeiro e recuperação de falha |
| T05 | S3 | T01 | DONE (local) | Adaptador, prompt/schema versionados, validação e limites; fixtures e falhas testadas sem chamada paga |
| T06 | S4 + S2 | T03 + contratos T05 | DONE (local) | Painel, filtros, original/ficha, revisão versionada, decisão e configurações |
| T07 | Coordenador + S3 | T05 + A2 | BLOCKED | IA real com dado fictício, segredo protegido, consumo medido e limites ativos; A2 ausente |
| T08 | Coordenador | T03/T04/T06/T07 | TODO | Fluxo completo sem resposta fixa nem edição manual do banco |
| T09 | S4 + S2 | T08 | REVIEW | Falhas de rede, repetição, expiração, permissão e uso em celular/teclado |
| T10 | S5, independente dos autores | T08/T09 | REVIEW | Relatório PASS/FAIL/BLOCKED com evidências, testes negativos e 12 casos de IA |
| T11 | Coordenador + autores | T10 | TODO | Correções, candidato e plano A3; nenhum defeito crítico/alto conhecido aberto |
| T12 | Coordenador | T11 + A3 | BLOCKED | Publicação no mesmo Site e testes hospedados de identidade/persistência; A3 ausente |
| T13 | Coordenador + responsável humano | T12 + A4 | BLOCKED | Piloto real fora do pedido atual; não executar nem solicitar A4 para esta entrega |
| T14 | Coordenador | T12 | TODO | Instruções de demonstração, limitações, custos medidos e teste final reproduzível |

## Atribuições executadas em T00

- S1 (`s1_produto_t00`): leitura do prompt, landing, documentação e exemplos; comparou promessas com capacidades; propôs jornadas e recorte. Nenhuma alteração, build, acesso remoto ou publicação.
- S5 (`s5_qa_t00`): auditoria independente de código, histórico QA, hashes e sintaxe; nenhuma alteração, build, acesso remoto ou publicação.
- Coordenador: leu o prompt e referências atuais, consultou Site/versões/publicação, abriu o código autorizado, comparou HEAD e FETCH_HEAD, executou check/build e verificou navegação pública. Criou apenas registros de auditoria/planejamento.

## Divisão de arquivos proposta para T01

Divisão ativada após A1; starter Vinext preparado. Integração e aceite de T02 dependem do build.

| Proprietário | Área exclusiva proposta | Não alterar |
| --- | --- | --- |
| Coordenador | Manifesto, package/lockfile, configuração, contratos comuns, integração, docs/mvp | Arquivos atribuídos a especialistas enquanto ativos |
| S1 | Propostas de produto e casos de aceitação, integradas pelo coordenador | Implementação e configuração |
| S2 | Banco/migrações e módulos de servidor/autorização | UI, adaptador IA, manifesto e dependências |
| S3 | Serviço IA, prompts, schemas e fixtures atribuídos | Credenciais, autorização, banco irrestrito e UI |
| S4 | Páginas/componentes/estilos atribuídos | Schema, contratos e servidor de negócio |
| S5 | Testes/evidências atribuídos; leitura da implementação | Código que estiver revisando |

Uma única instalação e um único responsável por migrações. Contratos estabilizados antes da escrita paralela; sem subdelegação recursiva. Instrução de leitura é uma restrição de tarefa, não afirmação de sandbox técnica.

## Arquivos exclusivos na implementação

Coordenador: lib/contracts.ts, lib/ai-contract.ts, lib/server-contract.ts, app/api/, worker/, configurações/dependências/manifesto e docs/mvp exceto os atribuídos abaixo.
S1: docs/mvp/TEST-CASES.md (rubrica entregue antes dos testes de IA).
S2: server/, db/schema.ts, drizzle/, tests/backend.test.ts.
S3: ai/, tests/ai.test.ts.
S4: app/page.tsx, app/layout.tsx, app/globals.css, app/relato/, app/painel/, components/nexo/, public/nexo/.
S5: tests/helpers/, tests/security.test.ts, docs/mvp/QA-PRE-A2.md.

## Retomada local de 17/11/2026

T02–T06 concluídas no escopo local anterior a A2. S2 implementou servidor e 17 testes; S3 implementou adaptador e 28 testes simulados; S4 implementou as telas; S5 escreveu 17 testes independentes e reexecutou 65 testes totais (incluindo 3 do auxiliar). Coordenador importou/preservou base, instalou dependências, integrou, aplicou migração somente local, verificou build e fluxo no navegador e preparou proposta A2. Sem subdelegação recursiva.

T09/T10 têm evidências locais em QA-BROWSER-LOCAL e QA-PRE-A2; permanecem incompletas para IA real e ambiente hospedado. T08 depende de T07. Nenhuma aprovação de qualidade do modelo foi inferida dos testes com fixtures. Retenção em dias é política e exclusão manual; expurgo automático hospedado não implementado.

Próxima ação dependente de Florença: A2 para modelo/limites e configuração protegida. Resolver acesso à fonte do Site existente antes de sincronização/configuração hospedada. A3 só após testes reais e revisão do candidato.
