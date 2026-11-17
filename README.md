# Nexo — demonstração em desenvolvimento

Continuação local do pacote de 17/11/2026. A página institucional publicada continua na versão 2; esta branch prepara o aplicativo com entrevista, persistência, análise assistida e revisão humana.

Site existente: https://nexo-triagem-juridica.insper-1495.chatgpt.site
Projeto: `appgprj_6ac5417ab1088191936830568f12e4a8`. Não criar outro Site.

## Desenvolvimento

Requer Node 24 e as dependências do lockfile:

```sh
npm ci
npm run check -- --incremental false
npm test
npm run build
npm run dev
```

Use o endereço impresso pelo servidor (porta inicial 5173). O código ativo do aplicativo está em `app/`, `components/nexo/`, `server/`, `ai/`, `db/` e `lib/`. `src/`, `qa/` e os relatórios históricos documentam a apresentação anterior; não validam o MVP.

A construção e os testes locais estão autorizados por A1. IA paga, credencial e limites dependem de A2; publicação depende de A3. A demonstração aceita apenas dados fictícios e acesso expressamente autorizado. Login não concede papel automaticamente.

Leia [RUNBOOK](docs/mvp/RUNBOOK.md), [TASKS](docs/mvp/TASKS.md), [APPROVALS](docs/mvp/APPROVALS.md) e [QA](docs/mvp/QA.md) para estado, comandos e limites. As orientações antigas foram preservadas em `docs/history/`.

O acesso ao repositório remoto do Sites não foi concedido nesta sessão; a reconciliação com o remoto permanece pendente. O pacote original em Downloads foi preservado. Não publicar esta cópia sem antes comparar o código remoto autorizado.
