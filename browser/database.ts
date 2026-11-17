import type { Database, SqlJsStatic, SqlValue } from 'sql.js';

export const BROWSER_SCHEMA_VERSION = 1;
const REQUIRED_TABLES = ['organizations','memberships','criteria_versions','intake_sessions','cases','messages','analyses','reviews','audit_events','ai_operations','ai_usage','idempotency'];

export class BrowserDatabaseError extends Error {
  code: string;
  constructor(code:string,message:string) { super(message);this.name='BrowserDatabaseError';this.code=code; }
}

function binding(value:unknown):SqlValue {
  if(value===null||typeof value==='string') return value;
  if(typeof value==='number'&&Number.isFinite(value)) return value;
  if(value instanceof ArrayBuffer) return new Uint8Array(value);
  if(ArrayBuffer.isView(value)) return Uint8Array.from(new Uint8Array(value.buffer,value.byteOffset,value.byteLength));
  if(Array.isArray(value)&&value.every(item=>Number.isInteger(item)&&item>=0&&item<=255)) return Uint8Array.from(value);
  throw new TypeError('Unsupported SQLite binding.');
}
function scalar(connection:Database,sql:string):number { return Number(connection.exec(sql)[0]?.values[0]?.[0]??0); }

class BrowserStatement implements D1PreparedStatement {
  database:BrowserSqliteD1; query:string; values:SqlValue[];
  constructor(database:BrowserSqliteD1,query:string,values:SqlValue[]=[]) {this.database=database;this.query=query;this.values=values;}
  bind(...values:unknown[]):D1PreparedStatement {return new BrowserStatement(this.database,this.query,values.map(binding));}
  execute<T>():D1Result<T> {
    const start=performance.now();const connection=this.database.connection;const before=scalar(connection,'SELECT total_changes()');
    const statement=connection.prepare(this.query);const rows:unknown[]=[];
    try {statement.bind(this.values);while(statement.step()) rows.push(statement.getAsObject());} finally {statement.free();}
    const changes=scalar(connection,'SELECT total_changes()')-before;
    return {success:true,results:rows as T[],meta:{duration:performance.now()-start,size_after:scalar(connection,'PRAGMA page_count')*scalar(connection,'PRAGMA page_size'),rows_read:rows.length,rows_written:changes,last_row_id:scalar(connection,'SELECT last_insert_rowid()'),changed_db:changes>0,changes}};
  }
  async first<T=Record<string,unknown>>():Promise<T|null>;
  async first<T=unknown>(colName:string):Promise<T|null>;
  async first<T=Record<string,unknown>>(colName?:string):Promise<T|null> {
    const statement=this.database.connection.prepare(this.query);
    try {
      statement.bind(this.values);if(!statement.step()) return null;const row=statement.getAsObject();
      if(colName!==undefined) {if(!Object.hasOwn(row,colName)) throw new Error('D1_COLUMN_NOTFOUND');return row[colName] as T;}
      return row as T;
    } finally {statement.free();}
  }
  async all<T=Record<string,unknown>>():Promise<D1Result<T>> {return this.execute<T>();}
  async run<T=Record<string,unknown>>():Promise<D1Result<T>> {return this.execute<T>();}
  async raw<T=unknown[]>(options:{columnNames:true}):Promise<[string[],...T[]]>;
  async raw<T=unknown[]>(options?:{columnNames?:false}):Promise<T[]>;
  async raw<T=unknown[]>(options?:{columnNames?:boolean}):Promise<T[]|[string[],...T[]]> {
    const statement=this.database.connection.prepare(this.query);const rows:T[]=[];
    try {statement.bind(this.values);const names=statement.getColumnNames();while(statement.step()) rows.push(statement.get() as T);return options?.columnNames?[names,...rows]:rows;} finally {statement.free();}
  }
}

/** SQLite runs in WebAssembly in this browser. This adapter is not remote D1. */
export class BrowserSqliteD1 implements D1Database {
  connection:Database;
  constructor(connection:Database) {this.connection=connection;}
  prepare(query:string):D1PreparedStatement {return new BrowserStatement(this,query);}
  async batch<T=unknown>(statements:D1PreparedStatement[]):Promise<D1Result<T>[]> {
    if(!statements.every(statement=>statement instanceof BrowserStatement&&statement.database===this)) throw new TypeError('All statements must belong to the same browser database.');
    this.connection.exec('BEGIN IMMEDIATE');
    try {
      // No await between BEGIN and COMMIT, so the batch is one SQLite transaction.
      const results=statements.map(statement=>(statement as BrowserStatement).execute<T>());
      this.connection.exec('COMMIT');return results;
    } catch(error) {this.connection.exec('ROLLBACK');throw error;}
  }
  async exec(query:string):Promise<D1ExecResult> {const start=performance.now();this.connection.exec(query);return {count:query.split(';').filter(value=>value.trim()).length,duration:performance.now()-start};}
  withSession():D1DatabaseSession {throw new Error('Hosted D1 sessions are unavailable in the browser demonstration.');}
  snapshot():Uint8Array {
    const bytes=this.connection.export();
    // sql.js export may reopen SQLite internally. Restore connection-local FK checks.
    this.connection.exec('PRAGMA foreign_keys=ON');return bytes;
  }
  async dump():Promise<ArrayBuffer> {return Uint8Array.from(this.snapshot()).buffer;}
  close():void {this.connection.close();}
}

export function openBrowserDatabase(SQL:SqlJsStatic,snapshot:Uint8Array|null,migration:string):BrowserSqliteD1 {
  let connection:Database|undefined;
  try {
    connection=new SQL.Database(snapshot??undefined);connection.exec('PRAGMA foreign_keys=ON');
    if(snapshot===null) {
      connection.exec('BEGIN IMMEDIATE');
      try {connection.exec(migration);connection.exec(`PRAGMA user_version=${BROWSER_SCHEMA_VERSION}`);connection.exec('COMMIT');}
      catch(error) {connection.exec('ROLLBACK');throw error;}
    }
    const version=scalar(connection,'PRAGMA user_version');
    if(version!==BROWSER_SCHEMA_VERSION) throw new BrowserDatabaseError('BROWSER_SCHEMA_UNSUPPORTED','Os dados deste navegador usam uma versão incompatível. Eles foram preservados; não limpe o armazenamento.');
    if(connection.exec('PRAGMA quick_check')[0]?.values[0]?.[0]!=='ok') throw new Error('SQLite integrity check failed.');
    const names=new Set(connection.exec("SELECT name FROM sqlite_master WHERE type='table'")[0]?.values.map(row=>String(row[0]))??[]);
    if(REQUIRED_TABLES.some(name=>!names.has(name))) throw new Error('Required tables missing.');
    return new BrowserSqliteD1(connection);
  } catch(error) {
    connection?.close();
    if(error instanceof BrowserDatabaseError) throw error;
    throw new BrowserDatabaseError(snapshot===null?'BROWSER_DATABASE_INIT_FAILED':'BROWSER_DATABASE_CORRUPT',snapshot===null?'Não foi possível preparar o armazenamento desta demonstração.':'Não foi possível abrir os dados deste navegador. O conteúdo foi preservado; não limpe o armazenamento.');
  }
}
