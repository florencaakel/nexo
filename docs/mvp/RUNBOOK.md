# Nexo — operação e retomada local

Atualizado em 17/11/2026. Desenvolvimento pré-A2; nenhuma chamada paga, sincronização remota ou publicação nesta etapa.

## Projeto e aprovações

Site preservado: `appgprj_6ac5417ab1088191936830568f12e4a8`, https://nexo-triagem-juridica.insper-1495.chatgpt.site, versão 2 conhecida. A1 autoriza os módulos e testes locais. [A2](A2-PROPOSTA.md) propõe IA e orçamento; A3 autoriza uma publicação concreta. Push, PR, merge e deploy precisam de confirmação específica da Florença. Não criar outro Site.

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

O starter oferece login fictício oficial apenas na prévia local, restrito a loopback. A identidade local é `local_seedy`. A configuração `.dev.vars` criada nesta sessão é ignorada pelo Git e contém somente bootstrap dessa identidade, aprovação de IA falsa e orçamento zero. Ela não é credencial hospedada e não deve ser transferida para produção. Em outra máquina, criar configuração local equivalente explicitamente; nunca usar o primeiro visitante como administrador.

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
2. Iniciar relato fictício, escrever, salvar e conferir as respostas.
3. Confirmar que todos os dados são fictícios e enviar. Guardar o link da sessão; o identificador do caso aparece somente após persistência.
4. Abrir `/painel`, filtrar os casos e abrir o caso salvo. Conferir o relato original. Sem IA configurada, a tela informa ausência de ficha; não há resposta fixa no produto.
5. Registrar decisão humana com notas. Sem ficha, a revisão é apenas do relato original; uma ficha real poderá ser revisada após A2. A decisão e seu autor/horário ficam no histórico.
6. Recarregar e verificar a persistência. Testadores não recebem ficha nem notas internas na sessão/recibo.
7. Em `/painel/configuracoes`, pausar novos relatos, editar critérios (nova versão), gerenciar associações explícitas e consultar consumo.

As sessões expiram após 24 horas. A política de retenção configurável não é um serviço automático de expurgo: a exclusão de caso sintético é manual pelo administrador; agendamento hospedado permanece pendente. A exclusão remove conteúdo e caches correlatos, preservando contabilidade sem relato para não zerar orçamento. Não apagar dados do usuário sem a confirmação aplicável.

## Falhas e concorrência

- Uma ação usa chave de idempotência. Em erro de rede, consultar estado salvo antes de repetir; a interface preserva a chave da mesma ação enquanto montada.
- Correções e decisões exigem a versão observada. Conflitos não sobrescrevem outra revisão; atualizar e conferir antes de reenviar.
- O relato é salvo antes da análise final. Análise é ação explícita e só pode ocorrer com aprovação, configuração, acesso e orçamento.
- Reserva é atômica. Timeout/falha incerta consome conservadoramente o teto reservado. Nenhuma repetição automática; até três tentativas por operação lógica.
- Interrupção de processo preserva relato e reserva; recuperação de lease vencido deve atualizar o estado sem acionar IA. Não interpretar reserva como chamada gratuita nem zerar contabilidade para permitir novas tentativas.
- Pausar coleta e IA mantém leitura autorizada dos registros.

## Depois de A2 e antes de A3

Instalar OpenAI Developers e seguir o fluxo protegido exigido pela skill de Sites. Não copiar chave para chat, arquivo versionado, frontend ou relatório. Configurar o modelo e preços aprovados no servidor, com teto inicialmente US$ 10 se essa proposta for aprovada. A proposta completa define fase de demonstração e teto global.

Executar os 12 casos da rubrica com modelo real; guardar resultados e consumo sem tratar mocks como avaliação. Confirmar identidade hospedada, associação do administrador por ID verificado, ausência de acesso indevido e persistência D1. A prévia local não comprova esses itens.

Não há backup hospedado validado nem migração remota nesta entrega. Antes de A3, reconciliar o repositório, confirmar custo de hospedagem, preparar cópia de segurança quando aplicável e plano de recuperação. Reverter código não desfaz banco. O sitemap contém apenas a apresentação; rotas de operação têm noindex e não devem ser indexadas.

Dados reais e piloto real continuam fora do escopo. O aplicativo não é parecer jurídico e não decide atendimento automaticamente.
