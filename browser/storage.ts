import type { SqlJsStatic } from 'sql.js';
import { BrowserDatabaseError, openBrowserDatabase, type BrowserSqliteD1 } from './database.ts';

export const BROWSER_DATABASE_NAME='nexo-browser-demo-v1';
const STORE='sqlite';const SNAPSHOT_KEY='current';
export interface BrowserLockManager {
  request<T>(name:string,options:{mode:'exclusive'},callback:()=>Promise<T>):Promise<T>;
}
export interface StoredSnapshot {revision:number;bytes:ArrayBuffer;savedAt:string}
export interface BrowserPersistenceOptions {SQL:SqlJsStatic;migration:string;indexedDB:IDBFactory|undefined;locks:BrowserLockManager|undefined;databaseName?:string;signal?:AbortSignal|null}

function storageError(error:unknown):BrowserDatabaseError {
  if(error instanceof BrowserDatabaseError) return error;
  const name=error instanceof Error||error instanceof DOMException?error.name:'';
  return name==='QuotaExceededError'
    ?new BrowserDatabaseError('BROWSER_STORAGE_FULL','O navegador não tem espaço para salvar. Esta operação não foi confirmada; os dados anteriores foram preservados.')
    :new BrowserDatabaseError('BROWSER_STORAGE_UNAVAILABLE','Não foi possível salvar ou abrir os dados neste navegador. Esta operação não foi confirmada; verifique as permissões de armazenamento.');
}
function validSnapshot(value:unknown):StoredSnapshot|null {
  if(value===undefined) return null;
  if(!value||typeof value!=='object') throw new BrowserDatabaseError('BROWSER_DATABASE_CORRUPT','O registro local está inválido. O conteúdo foi preservado; não limpe o armazenamento.');
  const snapshot=value as Partial<StoredSnapshot>;
  if(!Number.isSafeInteger(snapshot.revision)||snapshot.revision!<1||!(snapshot.bytes instanceof ArrayBuffer)||snapshot.bytes.byteLength===0||typeof snapshot.savedAt!=='string') throw new BrowserDatabaseError('BROWSER_DATABASE_CORRUPT','O registro local está inválido. O conteúdo foi preservado; não limpe o armazenamento.');
  return snapshot as StoredSnapshot;
}
async function openStorage(factory:IDBFactory,name:string):Promise<IDBDatabase> {
  return new Promise((resolve,reject)=>{
    let settled=false;let request:IDBOpenDBRequest;
    try {request=factory.open(name,1);} catch(error) {reject(storageError(error));return;}
    request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);};
    request.onerror=()=>{settled=true;reject(storageError(request.error));};
    request.onblocked=()=>{settled=true;reject(new BrowserDatabaseError('BROWSER_STORAGE_BLOCKED','Outra aba está impedindo a abertura dos dados. Feche as outras abas da demonstração e tente novamente.'));};
    request.onsuccess=()=>{
      const database=request.result;
      if(settled) {database.close();return;}
      if(!database.objectStoreNames.contains(STORE)) {database.close();reject(new BrowserDatabaseError('BROWSER_DATABASE_CORRUPT','O armazenamento local não tem a estrutura esperada. Os dados foram preservados.'));return;}
      database.onversionchange=()=>database.close();resolve(database);
    };
  });
}
async function readSnapshot(database:IDBDatabase):Promise<StoredSnapshot|null> {
  return new Promise((resolve,reject)=>{
    let transaction:IDBTransaction;let value:unknown;
    try {transaction=database.transaction(STORE,'readonly');const request=transaction.objectStore(STORE).get(SNAPSHOT_KEY);request.onsuccess=()=>{value=request.result;};}
    catch(error) {reject(storageError(error));return;}
    transaction.oncomplete=()=>{try {resolve(validSnapshot(value));} catch(error) {reject(error);}};
    transaction.onabort=()=>reject(storageError(transaction.error));transaction.onerror=()=>{/* onabort reports the final failure. */};
  });
}
async function saveSnapshot(database:IDBDatabase,previous:StoredSnapshot|null,bytes:Uint8Array):Promise<void> {
  return new Promise((resolve,reject)=>{
    let transaction:IDBTransaction;let failure:unknown;
    try {
      transaction=database.transaction(STORE,'readwrite');const store=transaction.objectStore(STORE);const request=store.get(SNAPSHOT_KEY);
      request.onsuccess=()=>{
        try {
          const current=validSnapshot(request.result);
          if((current?.revision??0)!==(previous?.revision??0)) throw new BrowserDatabaseError('BROWSER_STORAGE_CONFLICT','Os dados mudaram em outra aba. A operação não foi salva; atualize e tente novamente.');
          const revision=(current?.revision??0)+1;
          if(!Number.isSafeInteger(revision)) throw new BrowserDatabaseError('BROWSER_STORAGE_CONFLICT','O registro local atingiu um limite de versão e foi preservado.');
          store.put({revision,bytes:Uint8Array.from(bytes).buffer,savedAt:new Date().toISOString()} satisfies StoredSnapshot,SNAPSHOT_KEY);
        } catch(error) {failure=error;transaction.abort();}
      };
    } catch(error) {reject(storageError(error));return;}
    transaction.oncomplete=()=>resolve();
    transaction.onabort=()=>reject(storageError(failure??transaction.error));transaction.onerror=()=>{/* wait for abort; never report a successful write early. */};
  });
}

/** One cross-tab lock spans load, API execution and durable IDB transaction.
 * The task's result is returned only after the snapshot has committed. */
export async function withBrowserDatabase<T>(options:BrowserPersistenceOptions,task:(db:BrowserSqliteD1)=>Promise<T>):Promise<T> {
  if(!options.indexedDB) throw new BrowserDatabaseError('BROWSER_STORAGE_UNAVAILABLE','Este navegador não disponibiliza armazenamento local. A demonstração não pode confirmar salvamentos.');
  if(!options.locks) throw new BrowserDatabaseError('BROWSER_LOCKS_UNAVAILABLE','Este navegador não oferece o controle necessário para salvar com segurança entre abas. Use uma versão atual de um navegador compatível.');
  const factory=options.indexedDB;const name=options.databaseName??BROWSER_DATABASE_NAME;
  return options.locks.request(`${name}:sqlite`,{mode:'exclusive'},async()=>{
    options.signal?.throwIfAborted();
    const storage=await openStorage(factory,name);let database:BrowserSqliteD1|undefined;
    try {
      const previous=await readSnapshot(storage);
      database=openBrowserDatabase(options.SQL,previous?new Uint8Array(previous.bytes):null,options.migration);
      options.signal?.throwIfAborted();
      const result=await task(database);
      // Finish durable saving even if a UI navigation aborts after execution.
      await saveSnapshot(storage,previous,database.snapshot());return result;
    } finally {database?.close();storage.close();}
  });
}
