# Nexo — plano vigente sem IA paga

> Atualização local posterior ao retorno da banca: [voz, encaminhamento, apresentação e pendências](RETORNO-BANCA.md). Fonte `98abab0`, 119 testes. Ainda não publicada; o registro do deploy anterior abaixo permanece histórico.

> Atualização final de 17/11/2026: a demo por navegador foi autorizada e publicada em https://aps-nexo.vercel.app, sem login, banco remoto ou IA paga. Dados só no navegador; 99 testes passaram. [VERCEL.md](VERCEL.md) é a referência atual de publicação, arquitetura, comandos e QA. O restante preserva o contexto da versão Worker/D1 anterior.


Atualizado em 17/11/2026. A Florença substituiu a proposta de IA paga pelo pedido de uma versão sem gastos com IA. A implementação ativa usa regras determinísticas do próprio aplicativo. O plano anterior foi preservado em [histórico](../history/PRE-REGRAS-PLAN.md).

## Entrega local

- Entrevista com perguntas predefinidas para situação, envolvidos, tempo, tentativas, documentos mencionados e objetivo. Até oito perguntas e 10.000 caracteres; pode responder “não sei” e encerrar.
- Respostas persistidas, conferência/correção antes do envio e recibo somente após gravação.
- Ficha produzida pelo código `ai/rules.ts`: trechos literais e referências ao original, datas textuais e agrupamentos por palavras-chave. Nenhum modelo, chave, serviço externo de IA ou custo de tokens.
- Painel restrito com original, ficha, correção versionada e decisão humana. Área, compatibilidade com critérios e prioridade não são avaliadas automaticamente.
- Administração de acessos e critérios; uma pausa controla novas entrevistas e organização das fichas, preservando leitura autorizada.
- Interface branca, azul e laranja, com rótulos coerentes com regras. Demonstração identificada e somente dados fictícios.

## Arquitetura e limites

Vinext/React/TypeScript, Worker, D1 e login nativo já existentes no projeto. A prévia local usa o mecanismo oficial de identidade de teste e banco local. A rota fixa `createRulesProvider()` e orçamento zero; não seleciona provedor via variável, credencial ou interface. O adaptador externo e testes antigos ficam preservados, sem importação pela rota ativa.

Formato e referências da ficha são validados. Trechos com identificadores comuns ou marcação são omitidos; isso é heurístico, não anonimização garantida. Se não houver trecho adequado, a ficha não é inventada e o original segue disponível à revisão manual. Até 32 trechos, com aviso de corte. “Trecho de abertura” não é um resumo completo. Regras podem perder contexto; grupos vazios significam somente que não foi destacado um trecho.

Autorização é verificada no servidor por organização/papel. Travas, idempotência, versões e limites de tentativas continuam ativos. Nomes históricos de tabelas e DTOs são mantidos para compatibilidade; operações por regras registram custo/tokens zero e preservam contabilidade histórica existente.

Fora do escopo: atendimento real, anexos, OCR, WhatsApp, áudio, pagamentos, pesquisa jurídica, prioridade automática, expurgo agendado, serviço pago e publicação automática.

## Verificação e próximos passos

Critérios atuais: entrevista e ficha calculadas a partir de um relato novo; persistência e revisão; doze casos sintéticos com formato/citações válidos; zero acesso de rede pelo motor; orçamento zero e controles de pagamento rejeitados; autorização, concorrência e pausa preservadas; uso desktop/mobile.

A rubrica semântica do antigo plano de IA não é usada como prova de capacidade das regras. Ver [QA sem IA paga](QA-SEM-IA-PAGA.md), [QA navegador](QA-BROWSER-REGRAS.md) e [RUNBOOK](RUNBOOK.md).

A proposta A2 está encerrada como substituída, não pendente. O trabalho pode ser usado localmente. Antes de uma publicação, obter/reconciliar acesso ao remoto, verificar identidade e persistência hospedadas, confirmar que a hospedagem atende à restrição de não gastar e apresentar candidato/público/reversão para autorização A3. Nenhum serviço cobrado deve ser provisionado. Push, PR, merge, deploy e exclusões exigem confirmação separada.

Projeto preservado: `appgprj_6ac5417ab1088191936830568f12e4a8`, URL https://nexo-triagem-juridica.insper-1495.chatgpt.site, última versão conhecida 2. Na tentativa anterior, metadados foram lidos, mas a credencial do repositório falhou com “Sites project not found”. O pacote original em Downloads foi preservado.
