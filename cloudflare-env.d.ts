declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    OPENAI_API_KEY?: string;
    NEXO_AI_MODEL?: string;
    NEXO_AI_APPROVED?: string;
    NEXO_BOOTSTRAP_ADMIN_ID?: string;
    NEXO_MAX_BUDGET_USD?: string;
    NEXO_AI_INPUT_USD_PER_MILLION?: string;
    NEXO_AI_OUTPUT_USD_PER_MILLION?: string;
    NEXO_AI_TIMEOUT_MS?: string;
    NEXO_AI_MAX_INPUT_TOKENS?: string;
    NEXO_AI_QUESTION_OUTPUT_TOKENS?: string;
    NEXO_AI_ANALYSIS_OUTPUT_TOKENS?: string;
  }
}
