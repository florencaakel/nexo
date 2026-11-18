# Nexo — demonstração sem IA paga

Código e histórico: [florencaakel/nexo](https://github.com/florencaakel/nexo), repositório público. Branch de continuidade: `continue-nexo-project`. O [relatório de uso de IA desta etapa](output/pdf/Nexo-Relatorio-Uso-IA-Etapa-Demo-2026-11-17.pdf) acompanha o projeto.

Identidade do projeto: **Florença Akel**, conta GitHub `florencaakel`. As referências pessoais foram normalizadas também nos registros históricos. Endereços antigos que expunham identificadores pessoais estão marcados como omitidos, e os caminhos das capturas são relativos ao projeto; isso não representa nova execução dos testes nem transferência da hospedagem.

## Atualização publicada após o retorno da banca

Voz por ditado opcional, indicação administrativa de encaminhamento, ficha automática e apresentação focada no atendimento humano de consumo. **Publicada em https://aps-nexo.vercel.app.** Veja [mudanças, evidências e pendências](docs/mvp/RETORNO-BANCA.md). 119 testes passaram. O ditado pode processar áudio pelo fornecedor do navegador, mediante ciência do visitante; apenas o texto confirmado é salvo pelo Nexo.

## Vercel: demonstração por navegador

**Publicado:** https://aps-nexo.vercel.app — [registro e testes](docs/mvp/VERCEL.md).

Por escolha expressa da Florença, a edição para `aps-nexo.vercel.app` funciona sem login e sem banco contratado. Entrevista, ficha e revisão simulada rodam no navegador; os relatos ficam no armazenamento local desse navegador. Não há sincronização entre dispositivos, envio à equipe ou controle de acesso entre pessoas que usam o mesmo perfil. Limpar os dados do site remove os registros. Use apenas casos fictícios.

```sh
npm ci
npm run build:vercel
npm run preview:vercel
```

Prévia estática em `http://127.0.0.1:5180`. O build publicável fica em `dist/browser`, incluindo configuração Vercel. Para publicar, use `npm run package:vercel` e somente a pasta de arquivos selecionados informada pelo comando. Não contém banco local, credenciais ou código servidor hospedado. O ditado usa o recurso nativo do navegador, sem API paga do Nexo. A versão anterior Worker/D1 permanece disponível pelos comandos abaixo.

## Versão Worker/D1 preservada

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

A proposta A2 de IA paga foi recusada e substituída pelo pedido da Florença em 17/11/2026. Nenhuma compra ou chamada paga de IA foi executada. A Florença autorizou a publicação gratuita da demo por navegador na Vercel. A execução local não requer serviço pago de IA; hospedagem não foi contratada nem declarada gratuita.

Site existente: https://nexo-triagem-juridica.insper-1495.chatgpt.site, projeto `appgprj_6ac5417ab1088191936830568f12e4a8`, última versão conhecida 2. A publicação solicitada para a Vercel é separada do projeto Sites; consulte docs/mvp/VERCEL.md para o resultado atual. Não criar outro Site. O acesso ao repositório do Sites e a reconciliação remota permanecem pendentes antes de qualquer sincronização. O pacote original em Downloads foi preservado.

Leia [plano](docs/mvp/PLAN.md), [tarefas](docs/mvp/TASKS.md), [aprovações](docs/mvp/APPROVALS.md) e [QA](docs/mvp/QA.md). Push, PR, merge, deploy e exclusões exigem confirmação específica. Histórico anterior em `docs/history/` e relatórios identificados como históricos.
