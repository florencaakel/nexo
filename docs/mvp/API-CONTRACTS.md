# Nexo — proposta de contratos

Estado: contrato v1 fixado após A1. Definições executáveis em lib/contracts.ts, lib/ai-contract.ts e lib/server-contract.ts; implementação local em andamento.
Objetivo: delimitar módulos e impedir que frontend, servidor e IA criem formatos divergentes.

## Fronteiras

Visitante anônimo: somente apresentação institucional e entrada de login.
Testador: entrevista fictícia, sua sessão e recibo, sem notas internas/listagem.
Revisor: casos da organização para a qual tem associação ativa, análise e revisão humana.
Administrador: acessos, critérios versionados, pausas e limites; pode acumular papel de revisor explicitamente.

Identidade vem do mecanismo oficial da plataforma; papel e organização vêm do servidor. Campos enviados pelo cliente não concedem permissões. O ambiente local pode usar identidades de teste, explicitamente simuladas e excluídas de produção; isso não prova autenticação hospedada.

## APIs propostas

| Método e caminho | Acesso | Comportamento |
| --- | --- | --- |
| GET /api/me | Autenticado | Identidade e permissões efetivas, sem segredos |
| POST /api/intake-sessions | Testador autorizado | Inicia sessão demo com expiração e limites |
| GET /api/intake-sessions/:id | Titular autorizado | Rascunho e progresso da própria sessão |
| PUT /api/intake-sessions/:id/messages | Titular autorizado | Salva respostas/correções com versão esperada |
| POST /api/intake-sessions/:id/next-question | Titular autorizado | Pergunta limitada, usando somente lacunas; real consumo depende de A2 |
| POST /api/intake-sessions/:id/submit | Titular autorizado | Confirma e persiste caso; recibo depois da gravação |
| POST /api/cases/:id/analysis | Ator autorizado ao fluxo | Processamento limitado/idempotente, sem SQL ou autorização sob controle da IA |
| GET /api/cases | Revisor/administrador | Lista paginada e filtrada da organização |
| GET /api/cases/:id | Revisor/administrador | Original, ficha, revisões e versões permitidos |
| POST /api/cases/:id/reviews | Revisor/administrador | Correção e decisão humanas, com versão esperada e autor do servidor |
| GET/PATCH /api/admin/settings | Administrador | Pausa de coleta/IA e limites; coleta real não habilitável pela demo |
| GET/PUT /api/admin/memberships | Administrador | Lista e alteração controlada de associações |
| GET/POST /api/admin/criteria | Administrador | Consulta/criação de versões de critérios |
| GET /api/admin/usage | Administrador | Uso e reserva de orçamento sem relatos nos logs |

Os caminhos e DTOs estão definidos em lib/contracts.ts e implementados localmente. Não expor as mesmas respostas do painel ao participante. Rotas sensíveis devem evitar cache público; gravações devem validar origem/CSRF conforme o mecanismo utilizado.

## Regras comuns

- IDs opacos; escopo de organização obrigatório em consultas.
- `Idempotency-Key` nas operações repetíveis, vinculado a ator/organização/operação e hash do pedido; reutilização com conteúdo diferente gera conflito.
- Versão esperada nas correções/revisões; conflito explícito em edição concorrente.
- Erro com código estável, mensagem simples, ID técnico e indicação de retomada. Não devolver prompt interno, chave, stack ou casos alheios.
- Mensagens originais preservadas; correções humanas e revisões não sobrescrevem silenciosamente o registro anterior.
- Sem sucesso aparente se a gravação falhou. Falha da análise preserva o caso.
- Trava/lease de análise e reserva atômica de consumo. Cobrança incerta não autoriza loop de retries.

## Dados e estados

Organization e Membership delimitam acesso. IntakeSession contém expiração e modo. Case identifica atendimento e estado; Message guarda autoria, ordem e texto. Analysis guarda versão de prompt/schema/modelo, resultado validado e critérios. Review registra ator humano, correção, decisão e horário. CriteriaVersion, AuditEvent e AIUsage completam rastreabilidade e operação.

Estados: RASCUNHO, RECEBIDO, EM_ANALISE, AGUARDANDO_REVISAO, FALHA_ANALISE, PENDENTE_INFORMACOES, ACEITO_PARA_ATENDIMENTO, ENCERRADO.
Aceitação e encerramento exigem operação humana autorizada. “Fora do escopo” é indicação para revisão, não rejeição automática.

## Contrato de IA a finalizar

Campos: resumo, fatos_relatados, datas_mencionadas, envolvidos_mencionados, documentos_mencionados, tentativas_de_solucao, lacunas, perguntas_pendentes, area_sugerida, compatibilidade_com_criterios, sinais_para_revisao_prioritaria, referencias_a_mensagens e avisos_de_incerteza.

Cada fato extraído terá referência válida às mensagens; citações literais serão conferidas. Dados desconhecidos usam null/lista vazia conforme o schema; datas ambíguas permanecem ambíguas. Não inventar lei, prazo, valor ou documento. Classificação é sugestão, não parecer.

A IA não escreve decisão, associação ou autorização. O servidor valida schema, referências e regras de negócio. Recusa, timeout, resposta incompleta ou inválida não se tornam ficha concluída. Até duas novas tentativas por falha transitória e uma tentativa de reparo, sempre sujeitas ao orçamento total; números finais de tokens/tempo serão aprovados em A2.

Fixtures sintéticas serão específicas para avaliação, com expectativas anteriores às chamadas. Mocks poderão existir em testes e serão explicitamente identificados; não serão o resultado do produto entregue como IA funcional.

## Decisões T01

- Respostas de sucesso usam diretamente os DTOs de lib/contracts.ts; erros usam ApiErrorBody.
- POST intake-sessions/:id/messages adiciona resposta; PUT altera respostas do participante antes do envio. Ambos retornam SessionDTO.
- POST next-question e submit retornam SessionDTO. Recibo contém versão do caso para retry explícito; apenas caseId/status/version/receivedAt, sem ficha.
- POST cases/:id/analysis aceita VersionInput e retorna caseId/status; tester dono ou revisor/admin autorizado. GET detalhe/lista continuam restritos ao painel.
- GET/PUT admin/memberships retornam objeto members; sem concessão por e-mail ou primeiro login.
- DELETE cases/:id é reservado a administrador para excluir caso sintético e dados correlatos; não permitir enquanto análise está ativa.
- Escritas exigem JSON, Origin igual ao destino, X-Nexo-Request:1 e Idempotency-Key persistente durante repetição.
- AiProvider executa uma chamada por operação, sem retry oculto. Reserva de orçamento ocorre no servidor. Metadados usageEstimated distinguem medição de estimativa.
- Identidade local de testes e provider fake existem apenas em arquivos de testes; não haverá backdoor de autenticação ou mock de IA no produto.

## Implementação local em 17/11/2026

POST /api/intake-sessions/:id/messages acrescenta resposta; PUT corrige respostas antes do envio. POST submit retorna SessionDTO com recibo, sem chamar IA. POST cases/:id/analysis processa separadamente e retorna caseId/status. POST reviews retorna CaseDetailDTO e admite decisão humana com correctedAnalysis:null, inclusive sem ficha de IA; o original permanece intacto. GET admin/criteria retorna CriteriaDTO diretamente. DELETE cases/:id exige administrador, expectedVersion, origem e idempotência.

O orçamento é expresso em microdólares (1 USD = 1.000.000). Falhas incertas retêm o custo máximo conservador; não há repetição automática. retentionDays registra política, sem expurgo agendado implementado nesta etapa. Testes simulados não substituem QA hospedado ou avaliação do modelo real.
