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
| A2 | PROPOSTA PREPARADA; AGUARDA RESPOSTA | Provedor/modelo, dados enviados, custos/limites e configuração protegida | Adaptador, contratos e testes locais preparados; proposta concreta de custos |
| A3 | NÃO SOLICITADA | Publicação do candidato testado no Site existente | Integração, QA, limitações, público e recuperação apresentados |
| A4 | FORA DO ESCOPO ATUAL | Operação com relatos reais | Somente novo pedido expresso; coleta real permanece desabilitada |

## Limites vigentes

- A1 autoriza a implementação e testes locais do plano apresentado; seguir até A2.
- Não chamar IA paga ou provisionar recurso cobrado antes de A2.
- Não publicar uma versão nova antes de A3, inclusive pendências antigas de indexação.
- Não criar outro Site, liberar coleta real, inventar canal operacional ou adicionar terceiros sem autorização apropriada.
- Pode registrar, versionar e preservar a auditoria e o plano no repositório, sem publicação.

Para registrar uma aprovação futura, acrescentar a instrução real, seu escopo e condições. Não marcar como aprovada uma decisão apenas porque foi proposta, nem pedir novamente autorização que já cubra exatamente a ação.

## Registro A1

A usuária respondeu à proposta A1: “Sim, eu aprovo, pode começar, seguindo o prompt.” Escopo: demonstração fictícia de consumidor, arquitetura Worker/D1, login nativo, painel e desenvolvimento com subagentes. Mantidos gates A2 para custos/IA e A3 para publicação; nenhum piloto real.

## Continuidade em 17/11/2026

A1 reutilizada para implementação e testes locais; não houve mudança de escopo nem aprovação inferida. Proposta A2 concreta em A2-PROPOSTA.md: OpenAI GPT-5.4 mini, US$ 10 para avaliação e US$ 5 adicionais para demo, teto global US$ 15. Aguardando resposta explícita; não autoriza publicação ou custo de hospedagem desconhecido. Nenhuma chamada paga foi feita. A3 permanece não solicitada, e push/PR/merge/deploy continuam dependentes de confirmação específica conforme AGENTS.md.
