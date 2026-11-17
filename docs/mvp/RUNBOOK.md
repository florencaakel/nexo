# Nexo — operação e retomada local

> Atualização local posterior ao retorno da banca: [voz, encaminhamento, apresentação e pendências](RETORNO-BANCA.md). Fonte `98abab0`, 119 testes. Ainda não publicada; o registro do deploy anterior abaixo permanece histórico.

> Atualização final de 17/11/2026: a demo por navegador foi autorizada e publicada em https://aps-nexo.vercel.app, sem login, banco remoto ou IA paga. Dados só no navegador; 99 testes passaram. [VERCEL.md](VERCEL.md) é a referência atual de publicação, arquitetura, comandos e QA. O restante preserva o contexto da versão Worker/D1 anterior.


Atualizado em 17/11/2026. Versão por regras, sem IA paga; nenhuma chamada paga, sincronização remota ou publicação nesta etapa.

## Projeto e aprovações

Site preservado: `appgprj_6ac5417ab1088191936830568f12e4a8`, https://nexo-triagem-juridica.insper-1495.chatgpt.site, versão 2 conhecida. A1 e o pedido posterior autorizam os módulos e testes locais por regras. A proposta A2 foi recusada e substituída; não há credencial, modelo ou orçamento de IA a configurar. A3 autoriza somente uma publicação concreta. Push, PR, merge e deploy precisam de confirmação específica da Florença. Não criar outro Site.

Nesta sessão, get_site retornou metadados v2, mas credencial do repositório falhou com “Sites project not found”. A cópia local vem do pacote em Downloads e foi preservada numa branch. Antes de sincronizar, obter acesso autorizado e comparar com o código remoto sem sobrescrever mudanças posteriores.

## Preparação

Node 24, dependências do package-lock. Não abrir arquivos `.env` ou variantes. Nenhuma credencial é necessária para os testes locais.

```sh
npm ci
npm run check -- --incremental false
npm test
npm run build
npm run dev
```

O servidor imprime a URL (porta inicial 5173). O build gera Worker em `dist/server/index.js`. Os arquivos estáticos históricos de `src/` e os relatórios em `qa/` não representam a aplicação atual.

O starter oferece login fictício oficial apenas na prévia local, restrito a loopback. A identidade local é `local_seedy`. A configuração `.dev.vars` criada na preparação é ignorada pelo Git e define o bootstrap dessa identidade. Os campos antigos de aprovação de IA falsa e orçamento zero não são lidos pela rota ativa. Ela não é credencial hospedada e não deve ser transferida para produção. Em outra máquina, criar configuração local equivalente com `NEXO_BOOTSTRAP_ADMIN_ID=local_seedy`; nunca usar o primeiro visitante como administrador.

## Migrações locais

Antes de aplicar, conferir a existência das tabelas no banco local e o histórico conhecido. A migração inicial já foi aplicada nesta workspace em 17/11/2026. Não repeti-la no mesmo banco.

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --command "SELECT name FROM sqlite_master WHERE type='table'"
```

Somente se a migração inicial ainda não tiver sido aplicada e as tabelas não existirem:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_perfect_khan.sql
```

Isso não aplica migrações hospedadas. Não alterar SQL histórico aplicado; mudanças futuras usam novas migrações.

## Testar sem IA paga

1. Abrir `/relato` e entrar pelo login da prévia local.
2. Iniciar relato fictício, escrever e salvar. “Pedir próxima pergunta” escolhe uma pergunta predefinida por campos/palavras-chave; nenhuma API de IA é chamada. Responder ou encerrar, conferir e corrigir antes de enviar.
3. Confirmar que todos os dados são fictícios e enviar. Guardar o link da sessão; o identificador aparece somente após persistência.
4. Organizar a ficha no recibo ou abrir o caso em `/painel` e usar a ação correspondente. A ficha extrai trechos do relato novo, com fontes. Não é um exemplo fixo nem um resumo por IA.
5. Conferir o original e as fontes. Corrigir a ficha se necessário, classificar e registrar uma decisão humana com notas. A decisão e seu autor/horário ficam no histórico.
6. Recarregar e verificar a persistência. Testadores não recebem ficha nem notas internas na sessão/recibo.
7. Em `/painel/configuracoes`, pausar a coleta (também pausa a organização por regras), editar critérios em nova versão ou gerenciar associações explícitas. A tela não oferece ativação de IA paga, orçamento ou tokens.

Não instalar plugin de IA, fornecer chave ou ativar cobrança. A rota fixa `createRulesProvider()` e custo zero. A aplicação rejeita ativação de IA paga e orçamento positivo pela configuração. Contabilidade antiga, se houver, é preservada; não representa custo desta execução por regras.

As sessões expiram após 24 horas. A política de retenção configurável não é um serviço automático de expurgo: a exclusão de caso sintético é manual pelo administrador; agendamento hospedado permanece pendente. A exclusão remove conteúdo e caches correlatos, preservando contabilidade sem relato para não zerar orçamento. Não apagar dados do usuário sem a confirmação aplicável.

## Falhas, concorrência e limites

- Uma ação usa chave de idempotência. Em erro de rede, consultar estado salvo antes de repetir; a interface preserva a chave da mesma ação enquanto montada.
- Correções e decisões exigem a versão observada. Conflitos não sobrescrevem outra revisão.
- O relato é salvo antes da ficha. Organização é uma ação explícita autorizada e disponível com a coleta ativa; não depende de aprovação paga ou saldo.
- Há trava por operação e até três tentativas, sem repetição automática. Interrupções deixam o original salvo; a recuperação libera o estado vencido. Operações por regras têm reserva/custo zero. Histórico de reservas externas não é apagado.
- Pausa mantém leitura autorizada. Login posterior não desfaz a pausa do administrador.
- Regras não compreendem todo o contexto; datas são copiadas, grupos vazios não provam ausência e o trecho de abertura não é um resumo. Área, compatibilidade e prioridade exigem revisão humana.
- Frases com identificadores comuns/marcação podem ser omitidas, com aviso; o original permanece disponível. Sem trecho adequado, a ficha falha explicitamente e a revisão manual continua possível. Não há garantia de anonimização.

## Publicação futura

O trabalho atual funciona localmente sem serviço pago de IA. Não foi publicada nova versão. Antes de qualquer ação remota: reconciliar o repositório autorizado, confirmar hospedagem compatível com o pedido de não gastar, identidade/associações e persistência D1, preparar candidato e recuperação. Não contratar serviços ou criar recursos cobrados.

Não há backup hospedado validado nem migração remota nesta entrega. Reverter código não desfaz banco. Sitemap só da apresentação; rotas operacionais têm noindex. A prévia local não comprova identidade/isolamento do ambiente hospedado. Push, PR, merge, deploy e exclusões exigem confirmação específica.

Dados reais e piloto real continuam fora do escopo. A aplicação organiza informação e não é parecer jurídico.
