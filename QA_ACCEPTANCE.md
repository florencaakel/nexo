# Critérios e evidências — Nexo

Cada seção deve: comunicar uma ideia necessária; usar linguagem responsável; preservar o conteúdo obrigatório; apresentar hierarquia e contraste; funcionar em 390 e 1440 px sem corte; manter navegação e carregamento corretos. PASS apenas após DOM, renderização e inspeção das capturas.

| Seção | Mensagem / aceitação específica | Estado |
|---|---|---|
| Cabeçalho | Nexo identificada; âncoras reais; menu por toque, Enter e Escape | PASS — navegação e teclado em qa/headless.mjs; captura qa/menu-mobile.png |
| Abertura | Copy exata; produto, público e fluxo claros no primeiro enquadramento; dois CTAs reais | PASS — DOM e qa/inicio-{desktop,mobile}.png; links #solucao e #como-funciona |
| Problema | Copy exata; dois lados visíveis; sem estatísticas | PASS — DOM e qa/solucao-{desktop,mobile}.png; zero overflow |
| Como funciona | Quatro etapas na ordem; critérios da organização e decisão humana | PASS — qa/como-funciona-{desktop,mobile,mobile-end}.png; lista semântica |
| Demonstração | Três casos fictícios; todos os campos; tabs ARIA, setas, Home/End; revisão necessária | PASS — qa/interactions.py e screenshots das abas; seleção única, painel correspondente e foco visível |
| Para quem | Quatro públicos; benefícios concretos; sem clientes inventados | PASS — qa/para-quem-{desktop,mobile,mobile-end}.png; DOM sem overflow |
| Comparação | Seis dimensões; comparação equilibrada; fluxo proposto | PASS — qa/diferenciais-{desktop,mobile,mobile-end}.png; tabela semântica responsiva |
| Impacto | Pro bono como possibilidade; encaminhamento condicionado à capacidade | PASS — qa/impacto-{desktop,mobile,mobile-end}.png; copy condicional e sem promessas |
| Responsabilidade | Sete princípios sem certificação; frase obrigatória | PASS — qa/responsabilidade-{desktop,mobile,mobile-end}.png; lista e nota profissional |
| Encerramento | Título exato; CTA para demonstração | PASS — qa/proximo-passo-{desktop,mobile}.png; botão real #demonstracao |
| Rodapé | Nexo; navegação; desenvolvimento e avaliação profissional | PASS — qa/rodape-{desktop,mobile}.png; âncoras existentes |

QA final: produção, 360/390/768/1440 px; screenshots completas; zero overflow, console e 404; foco e teclado; contraste; redução de movimento; metadados e favicon; publicação e atualização no mesmo endereço quando disponíveis.

Correções: FAIL inicial no contraste do índice de Impacto (4,40:1) e no refluxo de texto a 200%. Corrigidos com cor mais clara, tamanhos relativos e quebra de texto restrita ao espaço disponível. Repetição do audit de DOM: PASS em todas as 12 combinações de largura/caso, alvos de 44 px ou maiores e nenhuma âncora inválida. `qa/final-results.json` registra medições e HTTP 200 dos seis recursos.

Capturas completas reabertas: `qa/full-1440.png` e `qa/full-390.png`. Composição revisada em toda a extensão, incluindo transições entre seções e conteúdo da demonstração.

QA nativo local e público: `qa/local-browser-results.json` e `qa/public-browser-results.json`, ambos PASS. Chrome sem estado de usuário; 12 auditorias axe WCAG 2.1 AA sem violações; 4 ordens de foco verificadas; toques reais em 360/390 px; todos os links ativados; redução de movimento emulada; texto ampliado 200%; zero erros de console, HTTP ou requests. Capturas nativas: `qa/local-full-{1440,390}.png` e `qa/public-full-{1440,390}.png`.

Publicação: PASS — versões 1 e 2 do mesmo projeto publicadas em [endereço histórico do Sites omitido], sem alteração do endereço. A versão atualizada foi testada novamente sem autenticação nas quatro larguras; URL canônica, Open Graph, favicon, título e descrição confirmados. Evidência inicial preservada em `qa/public-v1-browser-results.json`; validação da atualização em `qa/public-browser-results.json`.

Pendência externa: grupo enviar o endereço a uma pessoa de fora para abrir no próprio celular. Manter o site publicado até 18/11/2026. Demonstração conceitual e revisão em Chromium; nenhum teste automatizado substitui uma auditoria formal de acessibilidade.

## Atualização com Framer Motion — 05/10/2026

PASS local — biblioteca instalada e empacotada; 11 seções com animações observadas no navegador; build e sintaxe; 12 cenários axe sem violações; teclado, toque, âncoras, texto ampliado e responsividade nas quatro larguras. Testes específicos confirmam redução de movimento inicial/dinâmica, interrupção das animações ao focar, troca rápida de abas, indicador alinhado e menu entre mobile/desktop. Conteúdo editorial continua visível sem JavaScript. Capturas completas de 390/1440 px reabertas. Evidências: `qa/local-motion-results.json`, `qa/local-browser-results.json` e `qa/local-motion-full-{390,1440}.png`.

PASS público — versão 4 com Framer Motion no mesmo endereço, testada sem login em contextos novos. Suite completa nas quatro larguras e testes de movimento em 390/1440 px aprovados, sem erros. Capturas públicas reabertas. Evidências atualizadas: `qa/public-browser-results.json`, `qa/public-motion-results.json` e `qa/public-motion-full-{390,1440}.png`.

## Refinamento editorial do hero — 05/10/2026

PASS local: composição marfim/oliva sem brilhos, scanner ou mudanças de cores; quatro etapas preservadas; entrada finita e redução de movimento inicial/dinâmica. Build e sintaxe aprovados. Suite geral: 12 cenários axe sem violações, interações e carregamento aprovados. Após o ajuste de rótulos, verificação específica em seis larguras (360 a 1440 px), texto a 200% sem cortes/overflow e contraste aprovado. Capturas completas e do bloco reabertas. Evidências: `qa/local-refined-results.json` e `qa/local-refined-*.png`.

## Correção do ciclo de animação — 05/10/2026

PASS local: ciclo real completo com reinício; quatro etapas em 16 segundos; pausa/retomada por teclado e toque; suspensão fora da tela e retomada ao retornar; redução de movimento no carregamento e durante o ciclo. Layout e contraste em seis larguras aprovados; suite geral com 12 auditorias axe sem violações. Ocultação nativa de aba não emulada pelo Chrome headless. Evidências: `qa/local-refined-results.json`, `qa/local-browser-results.json` e `qa/local-flow-review.png`.

## Cenas animadas da abertura — 06/10/2026

A sequência de 12 segundos mostra o relato palavra por palavra, ondas de voz, fichas que entram de lados diferentes, varredura da pré-análise e encaminhamento para revisão humana. Mantém pausa/retomada, suspensão fora da tela, relógio de compatibilidade e resumo estático com redução de movimento ou sem JavaScript. A área da cena reserva espaço e contém os deslocamentos das fichas.

Validação: build e sintaxe; ciclo completo e reinício; teclado/toque; redução de movimento inicial e dinâmica; compatibilidade com relógio nativo congelado; seis larguras (360 a 1440 px), texto a 200% e auditoria axe. O teste percorre também as posições intermediárias da animação para verificar rolagem lateral. Evidência: `qa/local-story-results.json`.

## Rolagem e explicações interativas — 06/10/2026

Conteúdo já visível não volta à transparência zero. Os elementos seguintes são preparados fora da tela e entram uma única vez, antes de cruzar a borda da janela, com deslocamentos menores e atrasos limitados. Um relógio de compatibilidade evita transições congeladas no navegador integrado. Foco e redução de movimento sempre liberam o conteúdo.

As seções 01–03 agora usam texto curto, detalhes em azul/verde/âmbar, quatro etapas clicáveis com reprodução e pausa, e três exemplos com organização animada e detalhes expansíveis. A interação usa apenas os dados fictícios existentes.

PASS: `qa/local-scroll-motion-results.json` (rolagem sem reinício, teclado, menu, abas, redução de movimento e relógio congelado) e `qa/experience-results.json` (casos, sequência com pausa/retomada, detalhes, celular/desktop, fonte a 200% e axe sem violações). Capturas locais reabertas nas larguras 390 e 1287 px.
