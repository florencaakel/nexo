# Nexo na Vercel — demonstração por navegador

> Atualização local posterior ao retorno da banca: [voz, encaminhamento, apresentação e pendências](RETORNO-BANCA.md). Fonte `98abab0`, 119 testes. Ainda não publicada; o registro do deploy anterior abaixo permanece histórico.

Destino solicitado: https://aps-nexo.vercel.app. Publicado e verificado em 17/11/2026, mediante autorização expressa da Florença. Conta e time de hospedagem com identificadores pessoais omitidos; plano Hobby confirmado pela CLI. Nenhum recurso de banco estava contratado nesse escopo. Não criar recurso pago, instalar integração de IA ou ativar trial.

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
npm run package:vercel
```

A prévia estática usa loopback na porta 5180. O build fica em `dist/browser`; publicar somente o diretório novo informado por `npm run package:vercel`, que seleciona os arquivos do manifesto atual e os assets públicos versionados. Não enviar o diretório bruto do build: a CLI pode criar arquivos locais de ambiente ao vinculá-lo. Esses arquivos não são lidos pelo empacotador nem entram na publicação. `browser/vercel-static.json` é emitido como `vercel.json`. O diretório não deve conter .env, .dev.vars, banco, .git, node_modules ou fontes de outros projetos. Não publicar a raiz do projeto com a detecção automática Next.js. Não vincular repositório remoto nem executar push como parte deste deploy.

O plano Hobby é gratuito e limitado: https://vercel.com/docs/plans/hobby. Esta demonstração não contrata serviços adicionais. Estado e evidências abaixo.

## Publicação executada

- URL pública verificada sem autenticação: https://aps-nexo.vercel.app.
- Projeto: `prj_RRCpKug9VaZ8ZcAW2pHauvNNsO9z`, nome `aps-nexo`, time de hospedagem (identificador pessoal omitido), plano Hobby.
- Deployment: `dpl_3V6mou3RT1CFzihkjcxu1ZGPD8FH`, estado READY, produção.
- Inspeção: [endereço de inspeção omitido; consultar o ID do deployment].
- Fonte: `b4fc76019ad7548bcc4f77eda1039c7e8b5f2e72`. Commits posteriores apenas registram documentação/evidências.
- Candidato: `outputs/nexo-vercel-48FyCK`, 24 arquivos, 1.314.914 bytes. Dry-run reconheceu framework Other e confirmou exatamente essa lista. Sem arquivos de ambiente, banco, node_modules, fontes do servidor, .git ou dados dos testes.
- Deploy direto pela CLI, sem push, PR, merge ou publicação no Sites. Nenhum serviço de banco/IA, trial ou recurso cobrado foi contratado.

A autorização específica foi utilizada neste deploy. Publicações futuras exigem nova confirmação conforme preferência da Florença. O pacote local e os snapshots de navegador foram preservados; nada foi apagado.

## Verificações

`npm test`: 99/99 PASS. `npm run check -- --incremental false`: PASS. Build Vercel e build Worker/D1 preservado: PASS. Os oito testes novos usam sql.js e fake-indexeddb reais: persistência, lock entre instâncias, transação, quota, abort assíncrono, corrupção e schema incompatível. Falha de gravação não devolve sucesso.

QA local com a mesma CSP da publicação: relato novo da Loja Exemplo Verde, pergunta sobre data, ficha literal, decisão simulada e recarga com registro preservado. Caso local `5b8bd10b-4e0b-468f-9af5-b3d855c5c9f7`. O teste descobriu remoção do header Origin pelo navegador; corrigida no transporte local em `1b71ef7`, sem relaxar o servidor.

QA no endereço público: abertura sem login, exemplo fictício editável, salvamento local, ficha calculada por regras, revisão e recarga preservando estado v4 e nota “Teste publicado: pedir datas e valor da cobrança fictícia. Revisão simulada, sem conclusão jurídica.” Caso `efa489fa-c3e5-4b67-b65f-f2fb4626929f`, armazenado apenas no navegador do teste, sem upload de relato.

Console sem entradas de erro no estado final. Recursos observados no detalhe: CSS, JavaScript e WASM do próprio domínio; nenhuma requisição HTTP às APIs do aplicativo. `/api/me` retorna 404 na hospedagem estática. Dados permanecem locais.

HTTP público: apresentação, /relato, /painel, /painel/configuracoes, favicon, robots e sitemap retornaram 200; rota desconhecida retornou 404. Rotas operacionais com X-Robots-Tag noindex/nofollow. Sitemap só inclui a apresentação. CSP aplicada e SQLite WASM funcionando sob ela.

Capturas reais inspecionadas: [home desktop](evidencias/vercel-home-desktop.png), [home mobile](evidencias/vercel-home-mobile.png), [caso desktop](evidencias/vercel-caso-desktop.png), [caso mobile](evidencias/vercel-caso-mobile.png). Larguras 1440 e 390, sem extravasamento horizontal observado (mobile viewport/scrollWidth 390/390). Não é auditoria completa de acessibilidade.

O relato continua sendo demonstração fictícia, sem compreensão jurídica automática. Não há login, sincronização, compartilhamento ou backup remoto. Os testes não garantem conservação após limpeza/expurgo pelo navegador. A prévia local foi encerrada; o endereço público permanece disponível.
