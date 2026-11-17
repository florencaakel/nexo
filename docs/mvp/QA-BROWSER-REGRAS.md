# Nexo — verificação local da versão por regras

Executada pelo coordenador em 17/11/2026, usando navegador do Orca, servidor `npm run dev` em loopback e D1 local já migrado. Identidade fictícia oficial da prévia: Seedy (`local_seedy`), explicitamente associada aos papéis de administrador, revisor e testador. Não comprova autenticação ou persistência hospedada.

Código verificado: motor `d2ae7ef` + `814f8ba`, servidor `354affb`, UI `9791eea`, rótulos `77e1d6b`. Build atual passou. Não foi usada ficha fixa, edição manual do banco ou provedor fake no navegador.

## Caso novo e persistência

Sessão `56e94f13-470a-485c-99d5-16c6da5c819e`; caso `c2abbf65-b1e4-44c9-952a-99dcf91be1e0`. Dados inteiramente fictícios, inseridos pela interface:

> Caso fictício: a Loja Exemplo Azul cobrou R$ 45 após meu pedido de cancelamento. Quero o estorno. Já reclamei pelo chat e tenho um protocolo fictício.

O motor perguntou: “Quando isso aconteceu, mesmo que você só lembre aproximadamente?” A resposta de teste foi: “O cancelamento foi em 10/11/2026 e a cobrança fictícia apareceu em 12/11/2026.” Após pedir outra pergunta, o roteiro terminou sem repetir os campos reconhecidos.

| Verificação | Resultado observado |
| --- | --- |
| Criar sessão, salvar e pedir pergunta | PASS: resposta e pergunta persistiram, contador 1/8 |
| Conferência e confirmação de dados fictícios | PASS: envio bloqueado até a confirmação; recibo trouxe identificador real do banco local |
| Gerar ficha no recibo | PASS: estado passou de Recebido para Aguardando revisão |
| Painel/original/ficha | PASS: quatro trechos literais das respostas, duas datas, fontes e rótulo de regras; sem classificação automática |
| Correção pelo formulário de revisão | PASS: resumo corrigido manualmente com referência original mantida; área/compatibilidade definidas pelo revisor de teste |
| Decisão humana simulada | PASS: Pedir informações, com nota solicitando o retorno fictício da loja, ainda não informado |
| Recarregar detalhe | PASS: registro v4, estado, nota, autor, horário e ficha corrigida no histórico; original e ficha por regras preservados |
| Configurações | PASS: somente coleta/regras, retenção, critérios e acessos; sem ativação de IA, orçamento ou tokens |
| Pausar e retomar | PASS: ao pausar, início de novo relato ficou desabilitado; pausa persistiu ao navegar. Coleta restaurada e salva ao final |
| Teclado básico | PASS: CTA da landing acionado por foco + Enter, abrindo `/relato` |

A revisão simulada foi uma ação de teste executada pelo coordenador; não é decisão da Florença sobre um caso real. O caso foi preservado no banco local. Nenhum registro foi apagado.

## Desktop e celular

Capturas reais, inspecionadas visualmente, sem composição:

- [Apresentação desktop, 1440 × 1000](evidencias/regras-apresentacao-desktop.png).
- [Apresentação mobile, 390 × 844](evidencias/regras-apresentacao-mobile.png).
- [Caso desktop, antes da revisão](evidencias/regras-caso-desktop.png).
- [Caso mobile, depois da revisão e recarga](evidencias/regras-caso-mobile.png).
- [Configurações desktop](evidencias/regras-configuracoes-desktop.png).

Landing com texto de perguntas predefinidas/regras e CTA legível nos dois tamanhos. Caso com original preservado e ficha identificada. Medição DOM: landing 1440/1440 e 390/390 (viewport/scrollWidth); caso e conferência da entrevista 390/390. Sem extravasamento horizontal da página nos estados medidos; a navegação interna mobile mantém sua própria rolagem horizontal. Esta rodada não é auditoria completa de acessibilidade ou de todos os tamanhos/dispositivos.

## Limites e encerramento

Nenhuma chamada paga, chave de IA, contratação ou publicação. Zero rede do motor e ausência de componente pago no bundle foram verificados separadamente em [QA-SEM-IA-PAGA](QA-SEM-IA-PAGA.md). Navegação/login/persistência da aplicação local não significam que todo o aplicativo seja offline.

O servidor de prévia foi encerrado ao finalizar a verificação; `npm run dev` o reabre usando o banco local preservado. Ver [RUNBOOK](RUNBOOK.md). Remoto do Site, hospedagem sem custo e testes hospedados continuam pendentes. A proposta paga não é mais dependência desta entrega.
