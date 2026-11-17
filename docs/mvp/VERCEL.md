# Nexo na Vercel — demonstração por navegador

Destino solicitado: https://aps-nexo.vercel.app. Publicação autorizada expressamente pela Florença; adaptação em andamento. Conta e time de hospedagem com identificadores pessoais omitidos; plano Hobby confirmado pela CLI. Nenhum recurso de banco estava contratado nesse escopo. Não criar recurso pago, instalar integração de IA ou ativar trial.

## Arquitetura escolhida

Build Vite/React estático que reaproveita as páginas, o motor `nexo-regras-v1`, o schema e as operações do aplicativo. SQLite WebAssembly (`sql.js`) executa no navegador e grava snapshots no IndexedDB. Web Locks serializa operações entre abas, preservando versões/idempotência. Não há backend ou endpoint de gravação na Vercel. Arquivos JavaScript/WASM são servidos junto do site, sem CDN externo de dependência.

A identidade é apenas um rótulo local da demonstração. Não representa autenticação nem conta real. A mesma pessoa pode experimentar participante e revisor; todos que usam aquele perfil de navegador podem ver seus casos fictícios. Gestão de contas remotas fica oculta/desabilitada. Os critérios e a pausa também são locais.

Dados não viajam para a equipe, outro navegador ou dispositivo. Limpar dados do site/perfil pode apagá-los, e não há backup remoto. O navegador deve oferecer IndexedDB, WebAssembly e Web Locks; armazenamento indisponível ou cheio deve gerar erro em vez de confirmar salvamento. A versão Worker/D1 anterior foi preservada para outro contexto, sem publicar seu banco ou identidade local.

## Comandos

```sh
npm run check -- --incremental false
npm test
npm run build:vercel
npm run preview:vercel
```

A prévia estática usa loopback na porta 5180. Publicar somente `dist/browser` com `browser/vercel-static.json` emitido como `vercel.json`. O diretório não deve conter .env, .dev.vars, banco, .git, node_modules ou fontes de outros projetos. Não publicar a raiz do projeto com a detecção automática Next.js. Não vincular repositório remoto nem executar push como parte deste deploy.

O plano Hobby é gratuito e limitado: https://vercel.com/docs/plans/hobby. Esta demonstração não contrata serviços adicionais. Plano e estado da publicação serão registrados abaixo após a verificação.
