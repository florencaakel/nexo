# Nexo — evidências da T00

Data: 16/11/2026, America/Sao_Paulo. Escopo: auditoria, sem alteração da produção.
Base auditada: commit `4e49b32625526103f228ffd51b1fecf44835280f`.
Os registros abaixo não aprovam funcionalidades futuras.

## Evidências atuais do coordenador

| Verificação | Resultado | Evidência e limite |
| --- | --- | --- |
| Identidade e acesso do Site | PASS | Projeto do prompt, papel de proprietária confirmado, apresentação pública, versão 2 |
| Publicação atual | PASS | Deployment `appgdep_6ac5439c2f2c8191bfbdabf9b32ca37e`, `succeeded`, URL do projeto |
| Versão publicada | PASS | v2 `appgprj_6ac5417ab1088191936830568f12e4a8~appgver_00c8c83df96c8191b3a06e541cdfcb26`, commit `6e1e3486dfac3d4efb8c8ba7dabfa047f85926d6` |
| Código autorizado aberto | PASS | Abertura no checkout existente, sem sobrescrever trabalho; publicação por push não ativada |
| Local versus remoto | PASS | HEAD e FETCH_HEAD iguais a `4e49b32625526103f228ffd51b1fecf44835280f`; diff vazio |
| Trabalho local anterior | PASS | Árvore limpa antes dos registros T00 |
| Diferença publicada/local | PASS | Apenas robots/sitemap em src/dist, quatro arquivos, 16 linhas |
| Sintaxe | PASS | `npm run check`, saída 0; cinco módulos JS |
| Recompilação | PASS | `npm run build`, saída 0; `git diff --exit-code -- dist`, saída 0 |
| Dependências | PASS limitado | Lockfile v3; framer-motion 14.0.0, esbuild 0.28.2; nenhuma instalação/atualização nesta T00 |
| Navegação pública | PASS limitado | Página aberta no navegador, conteúdo atual observado, “Conheça a Nexo” navegou para `/#contato`, “Contato em breve” presente |
| Nome público indesejado | PASS limitado | Busca textual em src/dist pelo nome pessoal anterior e sua ordem inversa sem ocorrências; não é auditoria completa de histórico Git |
| Mobile/teclado/layout completos | BLOCKED para aceite do MVP | Não executados nesta T00; navegação básica da landing não equivale a QA visual completo |
| Fluxo operacional de MVP | BLOCKED | Entrevista, IA, banco, login, revisão e APIs ainda não implementados |

Uma tentativa de comparação com `origin/main` não se aplicava porque o helper não cria essa referência de acompanhamento; a comparação correta foi feita com FETCH_HEAD após fetch autenticado e passou. As primeiras duas solicitações de credencial tiveram erro de formato do parâmetro opcional; a chamada sem esse parâmetro concluiu, com publicação por push desativada. Não houve rejeição de aprovação nem publicação.

## Inventário de código

- `src/index.html`: apresentação, exemplos fixos, FAQ e contato em breve; ausência de formulário.
- `src/app.js`: menu, `initMotion()` e `initHeroLab()`.
- `src/motion.js`, `src/hero-lab.js`: interações/animação; nenhum fluxo de IA.
- `src/cases.js`, `src/experience.js`: demonstração histórica, não importada na entrada atual.
- `scripts/build.mjs`: bundle estático via esbuild e cópia de recursos.
- `scripts/serve.mjs`: entrega arquivos locais; não é backend de negócio.
- Manifesto de hospedagem: `static.directory = dist`; sem binding D1/R2 declarado.
- `README.md`, `PROMPT-PARA-O-CHAT.txt`, `QA_ACCEPTANCE.md`, `AI_BUILD_LOG.md`, arquivos `qa/` e manifesto de hashes: histórico inspecionado; não prova de MVP.

Não foram encontrados AGENTS.md/CLAUDE.md no projeto ou nos caminhos ancestrais verificados. O README antigo propõe outro Site; a instrução atual do prompt preserva este projeto e prevalece.

## Revisão independente

S1 confirmou a diferença entre promessas e funções existentes, a ausência de atendimento real e o recorte proposto. Identificou que a landing usa exemplo de Trabalho e que os exemplos históricos não são gabaritos confiáveis de extração.

S5 confirmou o diff de quatro arquivos, inicialização ativa e ausência de backend. Executou `node --check` nos cinco JS de src, dois scripts e bundle; todos passaram. Comparou dez pares de arquivos estáticos de src/dist por SHA-256, sem divergência. Não executou build/browser/remote; essas evidências, quando presentes acima, são do coordenador. Ambos trabalharam sem editar arquivos ou receber credenciais.

S5 também revisou os seis registros consolidados e não encontrou falsa aprovação, PASS indevido ou afirmação de implementação inexistente. Essa revisão aprova a coerência do plano, não substitui A1 da usuária nem o futuro aceite técnico do aplicativo.

## Achados concretos

| ID | Achado | Tratamento planejado |
| --- | --- | --- |
| AUD-01 | README e prompt legado ainda orientam criação de outro Site e remoção de canonical; divergem do estado atual | Reconciliar documentação após A1, preservando origem histórica |
| AUD-02 | QA antigo exige abas/seletores removidos e dependências de /tmp/macOS | Não usar PASS histórico; escrever testes do candidato atual |
| AUD-03 | CHECKSUMS-SHA256.json contém hashes antigos de README, HTML, JS e CSS | Reconciliar manifesto antes de nova entrega; divergência não prova corrupção |
| AUD-04 | Casos históricos incluem datas/documentos ausentes do relato original | Criar fixtures sintéticas coerentes com cada fonte |
| AUD-05 | Exemplo da landing é Trabalho, recorte proposto é Consumidor | Trocar exemplo após A1, preservando estrutura e marca |
| AUD-06 | Robots/sitemap estão no código e não na versão publicada | Preservar e incluir explicitamente na revisão A3 |

Ausência dos módulos de MVP é trabalho pendente, não defeito introduzido pela T00. Não há teste atual que demonstre segurança, conformidade jurídica ou qualidade de IA operacional.

## Matriz obrigatória para T10–T12

Todos os itens a seguir estão **BLOCKED por implementação pendente**, não aprovados:

- Atendimento completo com caso fictício e IA real; persistência após recarga/nova sessão.
- Rejeição de anônimo, usuário sem papel, outra organização e manipulação de IDs/papéis.
- Separação de recibo/entrevista e notas internas; nenhum segredo em cliente, erros ou repositório.
- Clique duplo, retry e concorrência sem duplicação descontrolada; revisão concorrente sem perda.
- Timeout, indisponibilidade, recusa, saída inválida e orçamento esgotado; relato preservado e retomada controlada.
- Bloqueio de coleta real, acesso demo restrito, suspensão administrativa e exclusão/retenção de dados sintéticos definida antes da demo hospedada.
- Celular ~390 px, desktop ~1440 px, teclado, foco, rótulos e ausência de rolagem horizontal indevida.
- Doze cenários: cobrança suficiente; cancelamento incompleto; produto/serviço; relato curto; datas contraditórias; sem documentos; fora da área; informação pessoal desnecessária; prompt injection; sinal para revisão prioritária; não sabe/encerra; erros de escrita e ordem.

Critérios: toda saída aceita válida; zero fatos/referências inventados aceitos como confirmados; zero decisão automática/vazamento; >=10/12 na rubrica e cada crítico aprovado individualmente. Repetições de injeção, contradição e incompletude dentro do orçamento. Distinguir falhas simuladas de chamadas reais e registrar custo/latência observados.

Antes de A3, vincular cada evidência ao commit/artefato candidato e listar limitações. Testes hospedados essenciais ainda não executados impedem afirmar conclusão operacional.
