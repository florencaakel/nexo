# Nexo — contratos ativos da versão por regras

Estado: implementação local por regras, atualizada em 17/11/2026. Definições executáveis em lib/contracts.ts, lib/ai-contract.ts e lib/server-contract.ts. Contrato anterior preservado em docs/history/PRE-REGRAS-API-CONTRACTS.md.
Objetivo: delimitar módulos e impedir que frontend, servidor e motor de regras criem formatos divergentes.

## Fronteiras

Visitante anônimo: somente apresentação institucional e entrada de login.
Testador: entrevista fictícia, sua sessão e recibo, sem notas internas/listagem.
Revisor: casos da organização para a qual tem associação ativa, análise e revisão humana.
Administrador: acessos, critérios versionados, pausas e limites; pode acumular papel de revisor explicitamente.

Identidade vem do mecanismo oficial da plataforma; papel e organização vêm do servidor. Campos enviados pelo cliente não concedem permissões. O ambiente local pode usar identidades de teste, explicitamente simuladas e excluídas de produção; isso não prova autenticação hospedada.

## APIs locais

| Método e caminho | Acesso | Comportamento |
| --- | --- | --- |
| GET /api/me | Autenticado | Identidade e permissões efetivas, sem segredos |
| POST /api/intake-sessions | Testador autorizado | Inicia sessão demo com expiração e limites |
| GET /api/intake-sessions/:id | Titular autorizado | Rascunho e progresso da própria sessão |
| PUT /api/intake-sessions/:id/messages | Titular autorizado | Salva respostas/correções com versão esperada |
| POST /api/intake-sessions/:id/next-question | Titular autorizado | Pergunta predefinida escolhida por regras; custo zero, sem rede externa |
| POST /api/intake-sessions/:id/submit | Titular autorizado | Confirma e persiste caso; recibo depois da gravação |
| POST /api/cases/:id/analysis | Ator autorizado ao fluxo | Ficha de trechos literais por regras, limitada/idempotente; nenhuma execução do relato |
| GET /api/cases | Revisor/administrador | Lista paginada e filtrada da organização |
| GET /api/cases/:id | Revisor/administrador | Original, ficha, revisões e versões permitidos |
| POST /api/cases/:id/reviews | Revisor/administrador | Correção e decisão humanas, com versão esperada e autor do servidor |
| GET/PATCH /api/admin/settings | Administrador | Pausa única da coleta/regras e retenção; rejeita IA paga/orçamento positivo |
| GET/PUT /api/admin/memberships | Administrador | Lista e alteração controlada de associações |
| GET/POST /api/admin/criteria | Administrador | Consulta/criação de versões de critérios |
| GET /api/admin/usage | Administrador | Histórico legado e operações por regras com custo/tokens zero; sem relatos nos logs |

Os caminhos e DTOs estão definidos em lib/contracts.ts e implementados localmente. Não expor as mesmas respostas do painel ao participante. Rotas sensíveis devem evitar cache público; gravações devem validar origem/CSRF conforme o mecanismo utilizado.

## Regras comuns

- IDs opacos; escopo de organização obrigatório em consultas.
- `Idempotency-Key` nas operações repetíveis, vinculado a ator/organização/operação e hash do pedido; reutilização com conteúdo diferente gera conflito.
- Versão esperada nas correções/revisões; conflito explícito em edição concorrente.
- Erro com código estável, mensagem simples, ID técnico e indicação de retomada. Não devolver prompt interno, chave, stack ou casos alheios.
- Mensagens originais preservadas; correções humanas e revisões não sobrescrevem silenciosamente o registro anterior.
- Sem sucesso aparente se a gravação falhou. Falha da análise preserva o caso.
- Trava/lease de processamento e registro atômico; reserva/custo zero nas regras, sem retries automáticos. Histórico externo preservado, nunca zerado para permitir execução.

## Dados e estados

Organization e Membership delimitam acesso. IntakeSession contém expiração e modo. Case identifica atendimento e estado; Message guarda autoria, ordem e texto. Analysis guarda versão de prompt/schema/modelo, resultado validado e critérios. Review registra ator humano, correção, decisão e horário. CriteriaVersion, AuditEvent e AIUsage completam rastreabilidade e operação.

Estados: RASCUNHO, RECEBIDO, EM_ANALISE, AGUARDANDO_REVISAO, FALHA_ANALISE, PENDENTE_INFORMACOES, ACEITO_PARA_ATENDIMENTO, ENCERRADO.
Aceitação e encerramento exigem operação humana autorizada. “Fora do escopo” é indicação para revisão, não rejeição automática.

## Contrato da ficha por regras

Campos históricos preservados: resumo, fatos_relatados, datas_mencionadas, envolvidos_mencionados, documentos_mencionados, tentativas_de_solucao, lacunas, perguntas_pendentes, area_sugerida, compatibilidade_com_criterios, sinais_para_revisao_prioritaria e avisos_de_incerteza. Cada item citado carrega referencias_a_mensagens.

Na versão `nexo-regras-v1`, resumo contém o primeiro trecho e aparece como “Trecho de abertura”; fatos_relatados são “Trechos do relato”. Datas são literais; agrupamentos são por palavras-chave. Não são fatos verificados nem resumo semântico. Área e compatibilidade retornam `insuficiente` com explicação de ausência de avaliação automática, e sinais de prioridade retornam lista vazia. Revisores podem classificar/corrigir posteriormente.

Até 32 trechos de até 780 caracteres, com aviso de truncamento. Identificadores comuns/marcação provocam omissão de frase e aviso; sem trecho apropriado, `RULES_NO_SAFE_TEXT`, preservando original e revisão manual. Citações e schema são validados pelo mesmo contrato. Regras respeitam encerramento, até oito perguntas e 10.000 caracteres.

`AiProvider.kind='rules'`, `configured=true`, `model='nexo-regras-v1'`, `maxCostMicrousd=0`. Metadados de custo/tokens são zero, requestId nulo e usageEstimated false. A rota ativa fixa esse motor, `aiApproved=false` e `maxBudgetMicrousd=0`. Não importa o adaptador externo, não lê credenciais e não permite troca por configuração.

SessionDTO, MeDTO.capabilities e SettingsDTO informam `processingMode:'rules'`. Nomes legados `aiAvailable`, `aiConfigured`, `aiEnabled` permanecem para compatibilidade interna; disponibilidade vem do motor de regras e da pausa de coleta. O PATCH rejeita habilitação paga e orçamento positivo; `intakeEnabled` controla coleta/perguntas/fichas. Valores históricos de uso não são apagados.

## Decisões T01

- Respostas de sucesso usam diretamente os DTOs de lib/contracts.ts; erros usam ApiErrorBody.
- POST intake-sessions/:id/messages adiciona resposta; PUT altera respostas do participante antes do envio. Ambos retornam SessionDTO.
- POST next-question e submit retornam SessionDTO. Recibo contém versão do caso para retry explícito; apenas caseId/status/version/receivedAt, sem ficha.
- POST cases/:id/analysis aceita VersionInput e retorna caseId/status; tester dono ou revisor/admin autorizado. GET detalhe/lista continuam restritos ao painel.
- GET/PUT admin/memberships retornam objeto members; sem concessão por e-mail ou primeiro login.
- DELETE cases/:id é reservado a administrador para excluir caso sintético e dados correlatos; não permitir enquanto análise está ativa.
- Escritas exigem JSON, Origin igual ao destino, X-Nexo-Request:1 e Idempotency-Key persistente durante repetição.
- Uma execução por operação, sem retry oculto. Registro e trava no servidor; regras não reservam verba nem fazem chamada de rede.
- Providers fake ficam somente nos testes. A prévia oficial local tem identidade de demonstração restrita a loopback; produção exige autenticação oficial e associação explícita. O produto usa regras reais, não saída fixa de teste.

## Implementação local em 17/11/2026

POST /api/intake-sessions/:id/messages acrescenta resposta; PUT corrige respostas antes do envio. POST submit retorna SessionDTO com recibo, sem chamar IA. POST cases/:id/analysis processa separadamente e retorna caseId/status. POST reviews retorna CaseDetailDTO e admite decisão humana com correctedAnalysis:null, inclusive sem ficha; o original permanece intacto. GET admin/criteria retorna CriteriaDTO diretamente. DELETE cases/:id exige administrador, expectedVersion, origem e idempotência.

O histórico de orçamento é expresso em microdólares (1 USD = 1.000.000). Operações por regras registram zero, inclusive quando falham. Reservas externas antigas seguem tratamento conservador. retentionDays registra política, sem expurgo agendado implementado. Testes com motor real verificam o produto por regras; não equivalem a QA hospedado.
