# A2 — proposta para integração de IA

Preparada em 17/11/2026. **Não aprovada. Nenhuma chamada paga executada nesta etapa.**

## Decisão proposta

Um provedor, OpenAI, com `gpt-5.4-mini-2026-03-17` na Responses API. Saída JSON estruturada estrita, sem ferramentas, navegação, anexos ou execução autônoma. A escolha será validada pelos 12 casos sintéticos e pela rubrica antes de ser aceita como adequada à Nexo.

Preços consultados: US$ 0,75 por milhão de tokens de entrada e US$ 4,50 por milhão de saída. Fonte: [modelo e preços oficiais](https://developers.openai.com/api/docs/models/gpt-5.4-mini). Valores em USD, sem câmbio, impostos ou tarifas do meio de pagamento; não presumir créditos inclusos na assinatura do chat.

## Dados e controles

Enviar somente texto de relatos fictícios minimizado, IDs opacos das mensagens, perguntas anteriores e critérios versionados. Não enviar identidade da conta, organização, e-mail ou metadados pessoais. A minimização é heurística, não garantia de anonimização; usar apenas casos fictícios.

`store:false`, sem estado persistente de conversa no provedor. Isso não significa retenção zero: a política padrão admite logs de monitoramento de abuso por até 30 dias, com exceções. [Controles de dados oficiais](https://developers.openai.com/api/docs/guides/your-data).

## Limites propostos

- Texto do participante: até 10.000 caracteres; até oito perguntas por sessão.
- Entrada: teto conservador de 64.000 tokens por chamada, verificado por limite superior de bytes mais margem; não é estimativa de consumo típico.
- Saída: 512 tokens por pergunta; 4.096 por ficha.
- Prazo técnico: 25 segundos por chamada; falhas podem ser cobradas pelo provedor.
- Uma chamada por ação; nenhuma repetição automática. Até três tentativas explícitas por operação lógica, todas sujeitas ao orçamento. Sem alternância de provedor.
- Reserva máxima: US$ 0,050304 por pergunta; US$ 0,066432 por ficha. Uma sessão com oito perguntas e uma ficha reserva até US$ 0,468864, sem repetições.

Proposta de teto: **US$ 10 para avaliação** e **US$ 5 adicionais para demonstração**, total acumulado máximo de **US$ 15** para chamadas deste aplicativo. Começar com teto de US$ 10; só elevar para até gasto apurado mais US$ 5 após encerrar a avaliação, sempre limitado a US$ 15. Não zerar histórico de consumo entre fases.

A avaliação prevê até 12 sessões completas (108 chamadas, US$ 5,626368 no teto) e seis análises adicionais de cenários críticos (US$ 0,398592), com margem restante dentro dos US$ 10 para falhas e repetições explícitas. Parar ao atingir o teto, mesmo que a avaliação não tenha terminado. A demo deve parar após consumir seus US$ 5 ou o teto global, o que vier primeiro.

O servidor reserva orçamento atomicamente e contabiliza a reserva inteira em chamadas interrompidas ou de cobrança incerta. Os números internos são estimativas de controle, não a fatura do provedor. Não abrangem consumo por outros aplicativos na mesma conta; usar credencial/projeto dedicado e monitorar o painel do provedor.

## Configuração segura e dependências

O plugin OpenAI Developers apareceu `ENABLED`, `AVAILABLE` e não instalado nesta sessão. Deve ser instalado e disponibilizar o fluxo protegido `openai-platform-api-key` antes da configuração. Não enviar chave pelo chat, arquivo de código, commit, log ou navegador.

Configurar somente no servidor: `OPENAI_API_KEY`, `NEXO_AI_MODEL`, `NEXO_AI_APPROVED`, preços por milhão, limites de tokens/tempo e `NEXO_MAX_BUDGET_USD`. Habilitar o controle de IA no painel apenas após A2 e confirmar o teto efetivo.

O acesso de escrita ao código do Site retornou “Sites project not found”; a reconciliação remota e as permissões precisam ser resolvidas antes de qualquer configuração hospedada. O retorno de metadados da versão 2 não comprova acesso de edição nesta conta.

Hospedagem/armazenamento: mesmo Site, Worker e D1, sem R2. Tarifa efetiva e eventual franquia desta conta não foram informadas pelas ferramentas; **custo hospedado pendente**. Esta proposta não autoriza contratar/provisionar serviço cobrado com preço desconhecido. Apresentar o custo antes dessa ação, se necessária. Publicação continua sujeita a A3 e confirmação própria; A2 não autoriza push, PR, merge ou deploy.

## Critérios antes de A3

Executar os 12 casos da rubrica com IA real, medir uso/latência, verificar falhas e confirmar revisão humana. Os testes atuais de transporte usam fixtures e não comprovam qualidade do modelo. Citações literais válidas não provam fidelidade de paráfrases nem correção jurídica; a revisão humana permanece obrigatória.
