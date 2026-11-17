# Nexo — revisão independente antes de A2

Data: 17/11/2026. Responsável: S5, sem autoria dos módulos de servidor, IA ou interface revisados. Esta revisão cobre o candidato local, não a publicação v2 nem a qualidade de um modelo real.

Referências da rodada: servidor `cf549d8`, ajustes `6d112a3`, `e89c3c9` e `0a5c6ca`; adaptador `8a941e0`; interface `69d6af9`, `b34ffc3`, `30c6fee` e `0f5c542`. Testes independentes em `41ac005`. Nenhuma chamada real de IA, credencial de provedor ou acesso ao Site remoto foi usado por S5.

## Execução reproduzível

Ambiente observado: Node v24.15.0, SQLite local em arquivo via auxiliar D1. As identidades, organizações, relatos e respostas de provedor dos testes são fictícios. O transporte dos testes de IA é injetado; não há consumo real.

```sh
node --experimental-strip-types --test tests/security.test.ts tests/ai.test.ts tests/backend.test.ts tests/helpers/d1.test.ts
npm run check -- --incremental false
```

| Verificação executada por S5 | Resultado | Evidência |
| --- | --- | --- |
| Testes independentes de segurança | PASS | 17/17 em `tests/security.test.ts` |
| Testes de servidor do autor, reexecutados por S5 | PASS | 17/17 em `tests/backend.test.ts` |
| Adaptador de IA com transporte simulado | PASS limitado | 28/28, incluindo 12 subcasos de contrato; não são pontuações de qualidade F/L/P/R |
| Auxiliar D1/SQLite | PASS limitado | 3/3: persistência em arquivo, parâmetros e rollback de batch |
| Total automatizado desta rodada | PASS | 65/65; zero falhas, skips ou cancelamentos; saída 0 |
| TypeScript | PASS | `npm run check -- --incremental false`, saída 0 |

O helper preserva SQL real e atomicidade de transações SQLite, mas não emula replicação, sessões de leitura, autenticação ou limites de execução hospedados do D1. Resultados locais não provam essas propriedades em produção.

## Cobertura independente

| Controle | Resultado e escopo |
| --- | --- |
| Anônimo e primeiro visitante | PASS: APIs protegidas recusam ausência de identidade; login sem associação não cria papel nem administração |
| Organização e titularidade | PASS: IDs de caso/sessão não permitem leitura ou mutação por outra organização; administrador também não usa sessão de entrevista de outro titular |
| Papéis e coleta real | PASS: campos de organização, titular e papéis enviados pelo cliente são rejeitados; modo real e ativação de coleta real são recusados |
| CSRF e tamanho | PASS: origem diferente/ausente, cabeçalho de intenção ausente, tipo de conteúdo incorreto, chave inválida e corpo excessivo são recusados antes de gravar |
| Notas internas | PASS: participante recebe apenas sua conversa e recibo restrito; ficha e notas do revisor não aparecem no DTO da sessão |
| Replay e revogação | PASS: associação ativa, papel e acesso ao recurso são novamente verificados antes de devolver resposta idempotente |
| Exclusão sintética | PASS na API: remove caso, sessão, mensagens, análises, revisões e cache relacionado; preserva contabilização agregada com vínculo ao recurso removido |
| Duplo envio | PASS: uma sessão persistida em pedidos concorrentes com mesma chave; conteúdo diferente com a mesma chave é conflito |
| Orçamento simultâneo | PASS: com teto para uma reserva, segundo caso não chama provedor; gasto e reserva permanecem dentro do limite |
| Falha após despacho | PASS: timeout simulado mantém original, grava falha, assume teto de custo conservador e replay não cria nova chamada |
| Revisão simultânea | PASS: somente uma escrita vence para a versão esperada; outra recebe conflito; original permanece intacto |
| Administração simultânea | PASS: dois administradores tentando revogar um ao outro não deixam a organização sem administração ativa |
| Lease interrompido | PASS: consulta autorizada recupera estado vencido, sem chamada ao provedor; resposta tardia não sobrescreve decisão humana nem devolve custo incerto |
| Limite de tentativas | PASS: três falhas explícitas por análise bloqueiam uma quarta tentativa mesmo usando novas chaves |
| Pausa administrativa | PASS: impede novas entrevistas/chamadas e mantém leitura/revisão autorizadas |
| Comandos dentro do relato | PASS limitado: texto pedindo papel não modifica associação; pedido de encerrar perguntas impede transporte; não é avaliação adversarial de modelo real |

## Achados e correções

| ID | Achado | Estado final |
| --- | --- | --- |
| QA-01 | Corrigir uma resposta após `ready` não reabria a possibilidade de esclarecimento | Corrigido em `6d112a3`; regressão do backend reexecutada com PASS |
| QA-02 | Após interrupção do Worker, recibo ficava `EM_ANALISE`; atualizar a página não recuperava lease vencido e a interface não oferecia retomada | FAIL reproduzido em teste independente; corrigido em `0a5c6ca`; teste passou sem iniciar chamada adicional |
| QA-03 | Interface exigia ficha de IA para registrar decisão, embora o servidor permitisse revisão manual | Corrigido em `30c6fee` por S4; conferido no código. Navegação efetiva é evidência do coordenador, não deste relatório |
| QA-04 | Campo de retenção podia sugerir limpeza automática, mas servidor apenas salva a política | Texto esclarecido em `0f5c542`. Retenção automática continua não implementada; não contá-la como PASS |
| QA-05 | Inicialização da apresentação falhava no TypeScript ao passar elemento a `document.body.append` | Corrigido para `appendChild` por S4; check reexecutado com saída 0 |

## Auditoria de IA e interface

- O adaptador tem endpoint fixo, configuração obrigatória, uma chamada por operação, limite de corpo e timeout incluindo leitura. Credencial fica no argumento de servidor; nenhum módulo de interface importa o provedor.
- A entrada enviada separa instruções de texto não confiável, omite identidade da conta e não concede ferramentas. O provedor usa `store:false`; isto não demonstra retenção zero pelo serviço externo.
- O validador verifica formato fechado, IDs e trechos literais de mensagens do participante, além de algumas datas/quantias e incertezas. Uma citação existente não prova que toda paráfrase decorre dela. Exatidão semântica, pertinência das perguntas e classificação permanecem sujeitas à rubrica e à revisão humana.
- A minimização de identificadores é heurística. Não garante remoção de qualquer dado pessoal que alguém digite. A demonstração continua restrita e deve usar somente relatos sintéticos.
- Leitura dos componentes confirmou renderização de relatos/fichas como texto React e correções separadas da ficha original. Não foi encontrado uso de HTML executável para esses conteúdos nos componentes revisados.
- A identidade entra no servidor pelo helper da plataforma. Os testes injetam identidades verificadas no contexto de teste; não provam que a plataforma hospedada remove cabeçalhos forjados. O mock oficial de login local não é evidência de login real.

## Pendências que impedem aceite completo

| Item | Estado |
| --- | --- |
| IA real, modelo disponível para a conta, consumo e latência observados | BLOCKED por A2 e configuração protegida |
| Rubrica F/L/P/R, pelo menos 10/12 e cada caso crítico aprovado | BLOCKED; os 12 transportes simulados não são avaliação de modelo |
| C10: orientação genérica validada pelo responsável humano | BLOCKED; não há validação profissional documentada nesta revisão |
| Autenticação, autorização e persistência hospedadas | BLOCKED por acesso ao projeto remoto e etapa hospedada autorizada |
| Reconciliação de fonte com o repositório do Site | BLOCKED; não foi executada por S5 |
| Browser, mobile, teclado, layout e fluxo visual | Não executados por S5; coordenador mantém evidências próprias |
| Exclusão automática por retenção | Não implementada; política em dias não apaga registros. Operação de exclusão manual da API foi testada |
| Build, pacote, migração hospedada e recuperação operacional | Fora desta execução de S5; exigir evidências do coordenador antes de A3 |

Conclusão técnica limitada: os controles locais acima passaram nos cenários executados após as correções. Esta revisão não aprova A2, A3, atendimento real, publicação nem qualidade jurídica. Não há um PASS para o fluxo completo com IA real.
