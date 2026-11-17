/** Real sql.js/WASM and IndexedDB semantics via fake-indexeddb.
 * The lock queue is a test harness for the Web Locks contract, not production auth. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import initSqlJs from 'sql.js';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { openBrowserDatabase } from '../browser/database.ts';
import { withBrowserDatabase, type BrowserLockManager, type BrowserPersistenceOptions, type StoredSnapshot } from '../browser/storage.ts';
import { handleApi } from '../server/api.ts';
import { createRulesProvider } from '../ai/rules.ts';
import type { CaseDetailDTO, SessionDTO } from '../lib/contracts.ts';

const migration=readFileSync(new URL('../drizzle/0000_perfect_khan.sql',import.meta.url),'utf8');
const SQL=await initSqlJs({locateFile:()=>fileURLToPath(new URL('../node_modules/sql.js/dist/sql-wasm.wasm',import.meta.url))});
class TestLocks implements BrowserLockManager {
  tails=new Map<string,Promise<unknown>>();names:string[]=[];
  async request<T>(name:string,_options:{mode:'exclusive'},callback:()=>Promise<T>):Promise<T> {
    this.names.push(name);const prior=this.tails.get(name)??Promise.resolve();const next=prior.catch(()=>undefined).then(callback);this.tails.set(name,next);return next;
  }
}
function setup() {
  const factory=new IDBFactory();const locks=new TestLocks();const options:BrowserPersistenceOptions={SQL,migration,indexedDB:factory,locks,databaseName:'test-nexo-local'};
  async function call<T=Record<string,unknown>>(path:string,method='GET',input?:unknown,key=crypto.randomUUID()) {
    const request=new Request(`https://nexo.example/api/${path}`,{method,headers:method==='GET'?{}:{Origin:'https://nexo.example','Content-Type':'application/json','X-Nexo-Request':'1','Idempotency-Key':key},...(method==='GET'?{}:{body:JSON.stringify(input??{})})});
    const response=await withBrowserDatabase(options,db=>handleApi(request,path.split('/'),{db,identity:{id:'browser_demo',displayName:'Revisor da demonstração'},provider:createRulesProvider(),config:{bootstrapAdminId:'browser_demo',aiApproved:false,maxBudgetMicrousd:0,sessionTtlHours:24,realIntakeEnabled:false}}));
    return {status:response.status,data:await response.json() as T};
  }
  return {factory,locks,options,call};
}
async function snapshot(factory:IDBFactory,name='test-nexo-local',replace?:unknown):Promise<StoredSnapshot|undefined> {
  const database=await new Promise<IDBDatabase>((resolve,reject)=>{const request=factory.open(name,1);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
  try {return await new Promise((resolve,reject)=>{
    const tx=database.transaction('sqlite',replace===undefined?'readonly':'readwrite');const store=tx.objectStore('sqlite');let result:StoredSnapshot|undefined;
    const request=replace===undefined?store.get('current'):store.put(replace,'current');request.onsuccess=()=>{result=request.result as StoredSnapshot|undefined;};
    tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(tx.error);
  });} finally {database.close();}
}

test('SQLite WASM aplica schema versionado e batch transacional preserva rollback',async()=>{
  const database=openBrowserDatabase(SQL,null,migration);
  try {
    assert.equal(await database.prepare('PRAGMA user_version').first('user_version'),1);
    await assert.rejects(database.batch([
      database.prepare('INSERT INTO organizations(id,name,created_at) VALUES (?,?,?)').bind('test-org','Organização fictícia','2026-11-17'),
      database.prepare('INSERT INTO organizations(id,name,created_at) VALUES (?,?,?)').bind('test-org','Duplicada','2026-11-17'),
    ]));
    assert.equal(await database.prepare('SELECT COUNT(*) AS count FROM organizations').first('count'),0);
    const results=await database.batch([database.prepare('INSERT INTO organizations(id,name,created_at) VALUES (?,?,?)').bind('test-org',"Texto literal '); DROP TABLE cases; --",'2026-11-17'),database.prepare('SELECT name FROM organizations WHERE id=?').bind('test-org')]);
    assert.equal(results[0].meta.changes,1);assert.equal(results[1].meta.changes,0);
    assert.equal((results[1].results[0] as {name:string}).name,"Texto literal '); DROP TABLE cases; --");
    assert.deepEqual(await database.prepare('SELECT id FROM organizations').raw({columnNames:true}),[['id'],['test-org']]);
    const reopened=openBrowserDatabase(SQL,database.snapshot(),migration);
    try {assert.equal(await reopened.prepare('SELECT COUNT(*) AS count FROM organizations').first('count'),1);} finally {reopened.close();}
  } finally {database.close();}
});

test('relato, ficha por regras e revisão sobrevivem ao fechamento e reabertura do SQLite e IndexedDB',async t=>{
  const network=t.mock.method(globalThis,'fetch',()=>{throw new Error('Network is forbidden in this test.');});
  const h=setup();await h.call('me');
  let session=(await h.call<SessionDTO>('intake-sessions','POST',{mode:'demo'})).data;
  session=(await h.call<SessionDTO>(`intake-sessions/${session.id}/messages`,'POST',{expectedVersion:session.version,content:'Recebi uma cobrança da empresa fictícia.'})).data;
  session=(await h.call<SessionDTO>(`intake-sessions/${session.id}/next-question`,'POST',{expectedVersion:session.version})).data;assert.equal(session.messages.at(-1)?.role,'assistant');
  session=(await h.call<SessionDTO>(`intake-sessions/${session.id}/submit`,'POST',{expectedVersion:session.version,confirmedFictional:true})).data;
  const id=session.receipt!.caseId;assert.equal((await h.call(`cases/${id}/analysis`,'POST',{expectedVersion:session.receipt!.version})).status,200);
  const detail=(await h.call<CaseDetailDTO>(`cases/${id}`)).data;assert.equal(detail.analysis?.model,'nexo-regras-v1');
  assert.equal((await h.call(`cases/${id}/reviews`,'POST',{expectedVersion:detail.version,decision:'PENDENTE_INFORMACOES',notes:'Revisão fictícia gravada no navegador.',correctedAnalysis:null})).status,200);
  const restored=(await h.call<CaseDetailDTO>(`cases/${id}`)).data;assert.equal(restored.reviews.length,1);assert.equal(restored.messages[0].content,'Recebi uma cobrança da empresa fictícia.');
  const saved=await snapshot(h.factory);assert.ok(saved&&saved.revision>=8);assert.equal(network.mock.callCount(),0);
});

test('duas instâncias compartilham lock e carregam snapshot mais recente sem perder alterações',async()=>{
  const h=setup();await h.call('me');let release!:()=>void;let started!:()=>void;
  const waiting=new Promise<void>(resolve=>{release=resolve;});const active=new Promise<void>(resolve=>{started=resolve;});
  const first=withBrowserDatabase(h.options,async db=>{started();await waiting;await db.prepare("UPDATE organizations SET retention_days=retention_days+1 WHERE id='nexo-demo'").run();return 'first';});
  await active;
  const second=withBrowserDatabase({...h.options},async db=>{assert.equal(await db.prepare("SELECT retention_days FROM organizations WHERE id='nexo-demo'").first('retention_days'),31);await db.prepare("UPDATE organizations SET retention_days=retention_days+1 WHERE id='nexo-demo'").run();return 'second';});
  release();assert.deepEqual(await Promise.all([first,second]),['first','second']);
  assert.equal(await withBrowserDatabase(h.options,db=>db.prepare("SELECT retention_days FROM organizations WHERE id='nexo-demo'").first('retention_days')),32);
  assert.equal(new Set(h.locks.names).size,1);
});

test('quota excedida não confirma sucesso e conserva exatamente o snapshot anterior',async t=>{
  const h=setup();await h.call('me');const before=await snapshot(h.factory);let executed=false;
  const put=t.mock.method(IDBObjectStore.prototype,'put',()=>{throw new DOMException('Test quota failure','QuotaExceededError');});
  await assert.rejects(withBrowserDatabase(h.options,async db=>{executed=true;await db.prepare("UPDATE organizations SET name='ALTERAÇÃO NÃO SALVA' WHERE id='nexo-demo'").run();return Response.json({saved:true});}),error=>!!error&&typeof error==='object'&&'code'in error&&error.code==='BROWSER_STORAGE_FULL');
  put.mock.restore();assert.equal(executed,true);const after=await snapshot(h.factory);assert.deepEqual(after,before);
  assert.equal(await withBrowserDatabase(h.options,db=>db.prepare("SELECT name FROM organizations WHERE id='nexo-demo'").first('name')),'Nexo — Ambiente de Demonstração');
});

test('abort assíncrono da transação IndexedDB não confirma salvamento nem substitui o snapshot',async t=>{
  const h=setup();await h.call('me');const before=await snapshot(h.factory);const original=IDBObjectStore.prototype.put;
  const put=t.mock.method(IDBObjectStore.prototype,'put',function(this:IDBObjectStore,value:unknown,key?:IDBValidKey){const request=original.call(this,value,key);queueMicrotask(()=>this.transaction.abort());return request;});
  await assert.rejects(withBrowserDatabase(h.options,async db=>{await db.prepare("UPDATE organizations SET retention_days=55 WHERE id='nexo-demo'").run();return true;}));
  put.mock.restore();assert.deepEqual(await snapshot(h.factory),before);
});

test('armazenamento ou Web Locks ausentes impedem a operação sem fallback em memória',async()=>{
  const h=setup();let invoked=0;
  await assert.rejects(withBrowserDatabase({...h.options,indexedDB:undefined},async()=>{invoked++;}),/armazenamento local/);
  await assert.rejects(withBrowserDatabase({...h.options,locks:undefined},async()=>{invoked++;}),/entre abas/);
  assert.equal(invoked,0);
});

test('corrupção e schema futuro são recusados sem reset ou sobrescrita',async()=>{
  const h=setup();await h.call('me');const good=(await snapshot(h.factory))!;
  const corrupt={...good,bytes:new Uint8Array([1,2,3,4,5]).buffer};await snapshot(h.factory,'test-nexo-local',corrupt);
  await assert.rejects(withBrowserDatabase(h.options,async()=>true),error=>!!error&&typeof error==='object'&&'code'in error&&error.code==='BROWSER_DATABASE_CORRUPT');assert.deepEqual(await snapshot(h.factory),corrupt);
  const future=new SQL.Database(new Uint8Array(good.bytes));future.exec('PRAGMA user_version=99');const unsupported={...good,bytes:Uint8Array.from(future.export()).buffer};future.close();await snapshot(h.factory,'test-nexo-local',unsupported);
  await assert.rejects(withBrowserDatabase(h.options,async()=>true),error=>!!error&&typeof error==='object'&&'code'in error&&error.code==='BROWSER_SCHEMA_UNSUPPORTED');assert.deepEqual(await snapshot(h.factory),unsupported);
});

test('erro no trabalho não persiste alterações parciais e a conexão seguinte usa o original',async()=>{
  const h=setup();await h.call('me');const before=await snapshot(h.factory);
  await assert.rejects(withBrowserDatabase(h.options,async db=>{await db.prepare("UPDATE organizations SET retention_days=88 WHERE id='nexo-demo'").run();throw new Error('Deliberate test failure.');}));
  assert.deepEqual(await snapshot(h.factory),before);
  assert.equal(await withBrowserDatabase(h.options,db=>db.prepare("SELECT retention_days FROM organizations WHERE id='nexo-demo'").first('retention_days')),30);
});
