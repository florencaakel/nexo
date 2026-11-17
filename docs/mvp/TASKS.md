# Nexo — tarefas da versão sem IA paga

> Atualização final de 17/11/2026: a demo por navegador foi autorizada e publicada em https://aps-nexo.vercel.app, sem login, banco remoto ou IA paga. Dados só no navegador; 99 testes passaram. [VERCEL.md](VERCEL.md) é a referência atual de publicação, arquitetura, comandos e QA. O restante preserva o contexto da versão Worker/D1 anterior.


Atualizado em 17/11/2026. A1 e o novo pedido da Florença autorizam desenvolvimento/testes locais. A proposta A2 paga foi substituída; A3 continua não solicitada. A tabela anterior está no [histórico](../history/PRE-REGRAS-TASKS.md).

| Item | Estado | Evidência ou próxima ação |
| --- | --- | --- |
| Base, apresentação e contratos | Concluído local | Vinext, Worker, D1; original preservado |
| Sessões, autorização e recibo | Concluído local | Persistência, idempotência e isolamento por organização |
| Perguntas e ficha sem IA paga | Concluído local | `ai/rules.ts`, rota fixa, custo/tokens zero, sem credenciais |
| Interface e revisão humana | Concluído local | Rótulos de regras, trechos e decisão humana; sem orçamento/ativação de IA |
| Testes automatizados | Ver QA atual | Motor real, 12 relatos, zero rede, fluxo de API e testes de segurança |
| Navegador desktop/mobile | Ver QA navegador regras | Relato novo, perguntas, ficha, decisão e recarga |
| Documentação local | Concluída | README, plano, runbook, aprovação substituída e limitações |
| Remoto do Site | Pendente externo | Recuperar acesso e reconciliar antes de sincronizar |
| Publicação/QA hospedado | Não autorizado | A3 específica e hospedagem compatível com não gastar |
| Piloto real | Fora do escopo | Não executar ou pedir A4 nesta entrega |

## Propriedade nesta adaptação

- Coordenador: contratos, rota, `ai/rules.ts`, integração, build, navegador e documentação geral.
- S2: `server/`, testes de backend e `tests/rules-backend.test.ts`.
- S4: páginas, componentes, estilos e textos da interface.
- S5: revisão independente, `tests/no-paid-ai.test.ts` e `docs/mvp/QA-SEM-IA-PAGA.md`.

Sem subdelegação recursiva. Uma única instalação, migração e integração. Não alterar arquivos de outro autor ativo sem coordenação. Nenhuma chamada paga, credencial de IA, push ou publicação nesta etapa.
