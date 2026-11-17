# Nexo — decisões e aprovações

Data de registro: 16/11/2026, America/Sao_Paulo.
Este arquivo registra apenas autorizações realmente recebidas. Não inclui credenciais, identidade pessoal ou relatos reais.

## Autorizações recebidas

### Execução da auditoria e preparação

A usuária pediu para seguir o prompt anexado. O prompt autoriza T00, preparação de A1 e uso de coordenador e especialistas, e exige aprovação explícita de A1 antes das funcionalidades. Foram realizadas auditoria e preparação; A1 não foi inferida dessa instrução geral.

### Dados fictícios e finalidade demonstrativa

Instrução da usuária: “esses dados, vc pode forja-los, pois se trata apenas de uma demosntração, e nao uso na pratica.”

Efeito: nomes de personagens, organização e relatos podem ser sintéticos e devem ser identificados como demonstração. A entrega atual não inclui piloto de atendimento real. A autorização não torna fictícios os resultados de testes, a integração da IA ou as permissões técnicas; esses devem ser verificados.

## Gates

| ID | Estado | Escopo | Próxima condição |
| --- | --- | --- | --- |
| A1 | APROVADA | Escopo e arquitetura de PLAN.md; demo de consumidor; própria usuária como administradora/revisora/testadora por identidade verificada | Recebida: “Sim, eu aprovo, pode começar, seguindo o prompt.” |
| A2 | RECUSADA E SUBSTITUÍDA | Não usar IA paga; implementar entrevista e ficha por regras | Pedido expresso de Florença em 17/11/2026; não depende de nova aprovação de IA |
| A3 | NÃO SOLICITADA | Publicação do candidato testado no Site existente | Integração, QA, limitações, público e recuperação apresentados |
| A4 | FORA DO ESCOPO ATUAL | Operação com relatos reais | Somente novo pedido expresso; coleta real permanece desabilitada |

## Limites vigentes

- A1 e o pedido posterior autorizam implementação e testes locais da versão por regras, sem IA paga.
- Não chamar IA paga, configurar credencial de provedor ou provisionar recurso cobrado. A Florença recusou gastos.
- Não publicar uma versão nova antes de A3, inclusive pendências antigas de indexação.
- Não criar outro Site, liberar coleta real, inventar canal operacional ou adicionar terceiros sem autorização apropriada.
- Pode registrar, versionar e preservar a auditoria e o plano no repositório, sem publicação.

Para registrar uma aprovação futura, acrescentar a instrução real, seu escopo e condições. Não marcar como aprovada uma decisão apenas porque foi proposta, nem pedir novamente autorização que já cubra exatamente a ação.

## Registro A1

A usuária respondeu à proposta A1: “Sim, eu aprovo, pode começar, seguindo o prompt.” Escopo: demonstração fictícia de consumidor, arquitetura Worker/D1, login nativo, painel e desenvolvimento com subagentes. Mantidos gates A2 para custos/IA e A3 para publicação; nenhum piloto real.

## Histórico da proposta paga em 17/11/2026 (substituído)

A1 reutilizada para implementação e testes locais; não houve mudança de escopo nem aprovação inferida. Proposta A2 concreta em A2-PROPOSTA.md: OpenAI GPT-5.4 mini, US$ 10 para avaliação e US$ 5 adicionais para demo, teto global US$ 15. A proposta aguardava resposta; foi substituída pela instrução abaixo. Nunca autorizou publicação ou custo de hospedagem desconhecido. Nenhuma chamada paga foi feita. A3 permanece não solicitada, e push/PR/merge/deploy continuam dependentes de confirmação específica conforme AGENTS.md.

## Instrução vigente — versão sem gastos de IA

Florença: “nao quero ter gastos com isso, faça uma versão que não precise de nenhuma IA paga.”

Efeito: substituir a dependência de IA paga por perguntas predefinidas e ficha organizada por regras locais do aplicativo. Sem modelo, chave, assinatura, API de IA ou nova contratação. Não foi interpretado como autorização para instalar um modelo local pesado ou recorrer a um serviço externo com cota temporária gratuita. A versão funciona com orçamento zero e preserva revisão humana, banco e controle de acesso.

A2 deixa de ser pendência desta entrega. O documento A2-PROPOSTA.md é histórico, não instrução ativa. Publicação, push, PR, merge, deploy e exclusões continuam exigindo confirmação específica. Gratuidade de hospedagem não foi presumida; não provisionar recursos pagos. Nenhuma aprovação A3 foi recebida.
