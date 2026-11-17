# Nexo — verificação local no navegador

17/11/2026, coordenador. Código funcional até `96f23ee`; ajuste mobile final `364a403`. Prévia Vinext em `http://127.0.0.1:5173`, browser embutido do Orca. Somente identidade simulada oficial do starter, organização e relato fictícios. IA desligada e orçamento zero. Nenhuma publicação.

## Resultado observado

| Verificação | Resultado | Evidência e limite |
| --- | --- | --- |
| Entrada anônima | PASS local | `/relato` oferece login; `/api/me` anônimo retorna 401 |
| Login sem associação | PASS local | Antes do bootstrap explícito, a identidade simulada mostrou acesso ainda não liberado; login isolado não liberou o painel |
| Relato e recibo | PASS local | Sessão iniciada pelo botão; texto fictício salvo; conferência e checkbox; envio retornou identificador somente após API gravar |
| Painel e detalhe | PASS local | Caso apareceu na lista; detalhe mostrou original e ausência explícita de ficha de IA |
| Decisão manual | PASS local | Decisão “Pedir informações” e notas registradas pela interface, sem ficha simulada; histórico com ator e horário |
| Persistência após recarga | PASS local | Recarregamento conservou original, registro v2, decisão e notas; nova leitura veio do servidor |
| Pausa administrativa | PASS local | Checkbox e Salvar controles desativaram novos relatos; `/relato` mostrou aviso e botão desabilitado. Reativado ao terminar |
| IA bloqueada | PASS local | Sem configuração/A2, não houve geração; painel de consumo mostrou zero chamadas e custo zero |
| Responsividade | PASS limitado | Landing e detalhe inspecionados em 1440×1000 e 390×844; relato e configurações também sem overflow da página em 390px. Menu operacional usa rolagem horizontal própria |
| Menu e teclado | PASS limitado | Menu mobile abriu e fechou com Escape; link “Ir para o conteúdo” acionado por Enter levou foco a `#conteudo` |
| CTA mobile | PASS após correção | Texto inicialmente cortado; `364a403` empilhou botões; captura final conferida e clique abriu `/relato` |
| Hidratação | PASS limitado | Inicialização antecipada do script legado gerava mismatch; passou a ocorrer após hidratação. Navegações finais não exibiram novos erros no trecho de console inspecionado |
| Build final | PASS | `npm run build`, saída 0 após `364a403`; rotas `/`, `/relato`, `/painel`, detalhe, configurações e API incluídas |
| Bundle de produção | PASS limitado | Busca por marcadores de login local, padrão de chave e nome pessoal proibido sem ocorrências em `dist/client`/`dist/server` aplicáveis. Busca textual não equivale a prova formal de ausência de segredos |

Caso fictício observado: `f0061b0f-a293-41fe-8384-2124e7b88f93`; sessão `9fef8bde-a657-4aac-8353-d4fce892c7e6`. Esses IDs identificam somente o banco local desta workspace, não registros hospedados. A construção de fluxo usou somente telas e APIs; SQL foi usado apenas na migração inicial, antes do teste.

## Capturas reais

- [Apresentação desktop](evidencias/apresentacao-desktop.png)
- [Apresentação mobile após ajuste](evidencias/apresentacao-mobile.png)
- [Detalhe desktop](evidencias/caso-desktop.png)
- [Detalhe mobile](evidencias/caso-mobile.png)

## Limites

Não foram testados no navegador: ficha de IA real e seu editor com modelo real; todas as combinações de falha de rede; leitor de tela; exclusão efetiva pelo botão; identidade de outra pessoa no ambiente hospedado. Exclusão, concorrência, isolamento, timeout e revisão de ficha possuem testes automatizados independentes conforme [QA-PRE-A2](QA-PRE-A2.md). A avaliação real dos 12 casos continua pendente; não há aprovação do MVP completo nem do piloto real.

A migração inicial foi aplicada apenas no D1 emulado local, após confirmar ausência das tabelas. A prévia usa `.dev.vars` ignorado para bootstrap da identidade simulada, nunca a identidade hospedada. O servidor de prévia foi encerrado após QA; `npm run dev` o inicia novamente.
