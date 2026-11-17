# Nexo — demonstração sem IA paga

Entrevista guiada, relato persistente, ficha organizada por regras e revisão humana. O processamento atual não usa modelo de IA, API paga, credencial de provedor ou assinatura. Funciona localmente com orçamento zero.

A ficha copia trechos das respostas e mantém suas referências. Não interpreta juridicamente o relato nem classifica área, compatibilidade ou prioridade; essas decisões ficam com o revisor. Demonstração somente com casos fictícios e acesso autorizado.

## Executar localmente

Node 24 e dependências do lockfile:

```sh
npm ci
npm run check -- --incremental false
npm test
npm run build
npm run dev
```

Nesta workspace, o banco local e o login de demonstração já estão preparados. Abra o endereço impresso pelo servidor (porta inicial 5173), entre e use `/relato`. Consulte [RUNBOOK](docs/mvp/RUNBOOK.md) para preparar outra máquina, sem credencial de IA.

O código ativo está em `app/`, `components/nexo/`, `server/`, `ai/rules.ts`, `db/` e `lib/`. O adaptador externo em `ai/provider.ts` foi preservado como histórico inativo; não faz parte da rota nem do bundle atual. Os nomes internos `analysis`/`ai_usage` foram mantidos para compatibilidade do banco, com custo e tokens zero nas regras.

## Estado do projeto

A proposta A2 de IA paga foi recusada e substituída pelo pedido da Florença em 17/11/2026. Nenhuma compra, chamada paga ou publicação foi executada. A execução local não requer serviço pago de IA; hospedagem não foi contratada nem declarada gratuita.

Site existente: https://nexo-triagem-juridica.insper-1495.chatgpt.site, projeto `appgprj_6ac5417ab1088191936830568f12e4a8`, última versão conhecida 2. As mudanças estão somente na branch local. Não criar outro Site. O acesso ao repositório do Sites e a reconciliação remota permanecem pendentes antes de qualquer sincronização. O pacote original em Downloads foi preservado.

Leia [plano](docs/mvp/PLAN.md), [tarefas](docs/mvp/TASKS.md), [aprovações](docs/mvp/APPROVALS.md) e [QA](docs/mvp/QA.md). Push, PR, merge, deploy e exclusões exigem confirmação específica. Histórico anterior em `docs/history/` e relatórios identificados como históricos.
