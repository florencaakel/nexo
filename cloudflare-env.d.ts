declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    NEXO_BOOTSTRAP_ADMIN_ID?: string;
  }
}
