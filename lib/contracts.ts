// Shared API v1. No identity, authorization or provider secrets belong here.
export const CONTRACT_VERSION = 'nexo-api-v1';
export const MAX_PARTICIPANT_CHARS = 10_000;
export const MAX_QUESTIONS = 8;
export type ProcessingMode = 'rules' | 'external';
export type Role = 'tester' | 'reviewer' | 'admin';
export type CaseStatus = 'RASCUNHO' | 'RECEBIDO' | 'EM_ANALISE' | 'AGUARDANDO_REVISAO' | 'FALHA_ANALISE' | 'PENDENTE_INFORMACOES' | 'ACEITO_PARA_ATENDIMENTO' | 'ENCERRADO';
export type Decision = 'PENDENTE_INFORMACOES' | 'ACEITO_PARA_ATENDIMENTO' | 'ENCERRADO';
export const STATUS_LABELS: Record<CaseStatus,string> = {
  RASCUNHO:'Rascunho', RECEBIDO:'Recebido', EM_ANALISE:'Em análise',
  AGUARDANDO_REVISAO:'Aguardando revisão', FALHA_ANALISE:'Análise pendente',
  PENDENTE_INFORMACOES:'Pedir informações', ACEITO_PARA_ATENDIMENTO:'Aceito para atendimento', ENCERRADO:'Encerrado',
};
export interface Evidence { message_id: string; trecho: string }
export interface CitedText { texto: string; referencias_a_mensagens: Evidence[] }
export interface AnalysisData {
  resumo: CitedText;
  fatos_relatados: CitedText[];
  datas_mencionadas: CitedText[];
  envolvidos_mencionados: CitedText[];
  documentos_mencionados: CitedText[];
  tentativas_de_solucao: CitedText[];
  lacunas: string[];
  perguntas_pendentes: string[];
  area_sugerida: 'consumidor' | 'fora_do_escopo' | 'insuficiente';
  compatibilidade_com_criterios: { versao: number; resultado: 'compativel' | 'fora_do_escopo' | 'insuficiente'; explicacao: string };
  sinais_para_revisao_prioritaria: CitedText[];
  avisos_de_incerteza: string[];
}
export interface MessageDTO { id: string; role: 'user'|'assistant'; content: string; sequence: number; createdAt: string }
export interface ReceiptDTO { caseId: string; status: CaseStatus; version: number; receivedAt: string }
export interface SessionDTO {
  id: string; version: number; state: 'draft'|'submitted'; mode: 'demo';
  messages: MessageDTO[]; questionCount: number; expiresAt: string;
  processingMode?: ProcessingMode;
  canAsk: boolean; aiAvailable: boolean; receipt: ReceiptDTO|null;
}
export interface MeDTO {
  user: {id: string; displayName: string};
  organization: {id: string; name: string}|null;
  roles: Role[];
  capabilities: {processingMode?: ProcessingMode; intakeOpen: boolean; aiConfigured: boolean; aiEnabled: boolean; realIntakeEnabled: false};
}
export interface CriteriaDTO { id: string; version: number; text: string; createdAt: string }
export interface AnalysisDTO {
  id: string; version: number; data: AnalysisData; model: string; promptVersion: string;
  schemaVersion: string; criteriaVersion: number; createdAt: string;
}
export interface ReviewDTO {
  id: string; authorName: string; decision: Decision; notes: string;
  correctedAnalysis: AnalysisData|null; createdAt: string;
}
export interface CaseListItem { id: string; title: string; status: CaseStatus; version: number; createdAt: string; updatedAt: string; mode: 'demo' }
export interface CaseDetailDTO extends CaseListItem { messages: MessageDTO[]; analysis: AnalysisDTO|null; reviews: ReviewDTO[]; criteria: CriteriaDTO; analysisError: string|null }
export interface CaseListDTO { cases: CaseListItem[]; nextCursor: string|null }
export interface SettingsDTO {
  processingMode?: ProcessingMode;
  intakeEnabled: boolean; aiEnabled: boolean; aiConfigured: boolean; realIntakeEnabled: false;
  budgetLimitMicrousd: number; budgetSpentMicrousd: number; budgetReservedMicrousd: number;
  retentionDays: number; version: number;
}
export interface MembershipDTO { userId: string; displayName: string; roles: Role[]; active: boolean }
export interface UsageDTO { calls: number; inputTokens: number; outputTokens: number; spentMicrousd: number; reservedMicrousd: number; limitMicrousd: number }
export interface ApiErrorBody { error: {code: string; message: string; requestId: string; retryable: boolean} }

// Mutations use application/json, X-Nexo-Request: 1 and a stable Idempotency-Key.
export interface CreateSessionInput { mode: 'demo' }
export interface AddMessageInput { content: string; expectedVersion: number }
export interface EditMessagesInput { answers: {id: string; content: string}[]; expectedVersion: number }
export interface VersionInput { expectedVersion: number }
export interface SubmitInput extends VersionInput { confirmedFictional: true }
export interface CreateReviewInput extends VersionInput { decision: Decision; notes: string; correctedAnalysis: AnalysisData|null }
export interface SettingsInput extends VersionInput { intakeEnabled?: boolean; aiEnabled?: boolean; budgetLimitMicrousd?: number; retentionDays?: number }
export interface MembershipInput { userId: string; displayName: string; roles: Role[]; active: boolean }
export interface CriteriaInput { text: string; expectedVersion: number }
