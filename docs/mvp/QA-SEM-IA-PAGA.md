# Nexo — revisão independente da versão sem IA paga

Data: 17/11/2026. Responsável: S5, sem autoria do motor, servidor ou interface revisados. Escopo atualizado por Florença: entrevista guiada e ficha determinística por regras, sem provedor externo de inteligência artificial. Não é uma entrega de IA real.

Base revisada: contratos `1ce13aa`, servidor `354affb`, motor/rota `d2ae7ef`, interface `9791eea` e textos de estados `77e1d6b`. Testes independentes: `9c5e226` e `f4bc091`; testes adicionais do servidor: `bde7f1a`.

## Evidências executadas por S5

Ambiente: Node v24.15.0. Persistência testada em arquivo SQLite pelo auxiliar D1. Nenhuma chave ou arquivo de ambiente foi aberto; nenhuma chamada paga foi feita.

```sh
node --experimental-strip-types --test tests/no-paid-ai.test.ts
npm run check -- --incremental false
npm test
```

| Verificação | Resultado |
| --- | --- |
| Suite independente sem IA paga | PASS, 21/21 em `tests/no-paid-ai.test.ts` |
| TypeScript | PASS, sem diagnósticos |
| Suite completa | PASS, 91/91, zero falhas, skips ou cancelamentos |
| Rede durante motor e fluxo de regras | PASS: sentinela de `fetch` registrou zero chamadas |
| Rota e dependências de código do processamento | PASS: somente `createRulesProvider`, sem caminho alcançável ao adaptador pago, endpoint OpenAI ou configuração de credencial |

A suite completa inclui 21 testes independentes deste escopo, cinco testes do servidor com regras, 17 testes gerais do servidor, 17 de segurança, três do auxiliar D1 e 28 do adaptador externo preservado. Esses últimos continuam usando transporte simulado e não tornam o adaptador externo parte do produto ativo.

## Motor real, sem resposta simulada

`tests/no-paid-ai.test.ts` instancia o mesmo `createRulesProvider` da rota. Nenhuma ficha ou resposta de pergunta é substituída por mock. A única substituição é uma sentinela de rede que falharia caso fosse chamada; não fornece resposta de API.

- Os 12 casos fictícios documentados em `TEST-CASES.md` foram processados pelo motor real. Todas as fichas passaram na validação de schema e tiveram seus IDs/trechos confrontados com mensagens originais do participante.
- Entradas diferentes produziram fichas diferentes. Texto de uma pergunta do assistente não virou evidência nem introduziu valor ou data no resultado.
- Datas relativas permaneceram relativas; nenhuma data corrente foi acrescentada como fato. As referências são trechos literais do original.
- O caso de identificadores sintéticos não reproduziu os marcadores pessoais na ficha. Frases com marcação executável foram omitidas.
- Pedido para terminar encerrou as perguntas. Comandos dentro do relato não alteraram associação, organização, critérios ou decisão, e não dispararam rede.
- Identificada uma pergunta redundante no caso C09: o padrão de situação não reconhecia a forma “cobrou”. O autor ampliou as flexões de cobrança; teste independente confirma que a descrição já fornecida não é pedida novamente. Os 12 subcasos foram reexecutados após esse ajuste e passaram.
- A ficha não recebe aceitação ou encerramento automático: o processamento termina aguardando revisão. Classificação e compatibilidade ficam inconclusivas para decisão humana.

Esses 12 casos são agora dados de teste do organizador por regras. Não foi aplicada a antiga nota F/L/P/R de modelo de IA, nem afirmado que o sistema compreende semanticamente os relatos. Duas expectativas preliminares foram ajustadas ao novo escopo explícito: C07 não exige classificação automática de área, e C09 pode conservar comandos como trechos literais inertes. Permaneceram obrigatórios zero efeitos de autorização, zero decisão automática, zero rede e ausência de HTML executável na ficha.

## Fluxo persistente e controles

| Cenário com motor real | Resultado |
| --- | --- |
| `aiApproved:false`, teto de orçamento zero e configuração legada desativada | PASS: entrevista e ficha funcionam sem autorização de consumo externo |
| Pergunta guiada | PASS: pergunta produzida por regras persiste na conversa |
| Salvar relato → gerar ficha → revisar → consultar novamente | PASS: caso, ficha e decisão persistem; original permanece intacto |
| Consumo | PASS: tokens de entrada/saída, custo e reserva iguais a zero |
| Ativar IA paga, orçamento positivo ou modo externo por PATCH | PASS: servidor recusa essas alterações |
| Pausa administrativa | PASS: impede nova coleta e processamento; mantém consulta autorizada |
| Participante/anônimo consultando painel | PASS: acesso negado |
| Relato contendo apenas trechos inadequados para a ficha | PASS: falha explícita `RULES_NO_SAFE_TEXT`, original preservado e revisão manual disponível sem gasto |
| Comandos de injeção no relato | PASS: nenhuma alteração de papéis, critérios ou decisão; texto permanece dado sem autoridade |

Os testes do servidor também confirmaram que o histórico de contabilidade anterior não é apagado nem bloqueia as regras, que a pausa permanece após nova consulta de identidade e que metadados de custo positivo são rejeitados no modo local.

## Limites do aceite

- O motor copia e agrupa trechos por padrões simples. Pode omitir frases, repetir perguntas ou classificar um trecho em uma seção pouco útil. O trecho inicial não é um resumo completo. A interface e a ficha devem continuar comunicando isso.
- Referência literal comprova origem do texto, não verdade dos acontecimentos. Não há inferência jurídica, classificação de mérito, prioridade clínica ou aconselhamento validado.
- A seleção de trechos com identificadores é heurística; o original continua restrito. A demonstração deve usar somente dados fictícios.
- A ausência de chamadas de IA paga está verificada no código ativo e nos testes executados. Isto não representa garantia de gratuidade da hospedagem ou de outros serviços: nenhuma contratação/publicação foi efetuada por S5.
- Autenticação e persistência hospedadas, reconciliação com o repositório remoto, build final e testes de navegador pertencem às evidências do coordenador. S5 não operou o navegador nem o Site remoto nesta rodada.
- A retenção automática continua não implementada. O prazo configurado é uma política de exclusão manual; não afirmar limpeza automática.

Conclusão: o fluxo local testado funciona com processamento determinístico, sem credencial, chamada ou cobrança de IA externa. Este relatório substitui os bloqueios de A2 do relatório prévio apenas para o escopo sem IA paga; não concede autorização de push, publicação ou atendimento real.
