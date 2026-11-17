/// <reference types="vite/client" />
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import migration from '../drizzle/0000_perfect_khan.sql?raw';
import { createRulesProvider } from '../ai/rules.ts';
import { handleApi } from '../server/api.ts';
import { BrowserDatabaseError } from './database.ts';
import { withBrowserDatabase } from './storage.ts';

let sqlPromise:Promise<SqlJsStatic>|undefined;
function sqlite():Promise<SqlJsStatic> {
  // The WASM asset ships with this site; no external service or API is used.
  return sqlPromise??=(initSqlJs({locateFile:()=>wasmUrl}).catch(()=>{sqlPromise=undefined;throw new BrowserDatabaseError('BROWSER_SQLITE_UNAVAILABLE','Não foi possível carregar o armazenamento da demonstração. Recarregue a página antes de continuar.');}));
}
function failure(code:string,message:string,status=503):Response {
  return Response.json({error:{code,message,requestId:crypto.randomUUID(),retryable:status>=500}},{status,headers:{'Cache-Control':'no-store','X-Nexo-Storage':'browser-only'}});
}

/** A simulated local identity for one browser profile, never remote authentication.
 * Every browser profile has its own isolated SQLite snapshot in IndexedDB. */
export async function handleBrowserRequest(path:string,options:RequestInit={}):Promise<Response> {
  try {
    const origin=globalThis.location?.origin;
    if(!origin||origin==='null') return failure('BROWSER_ORIGIN_UNAVAILABLE','Abra a demonstração pelo endereço do site para usar o armazenamento local.');
    const url=new URL(path.startsWith('/')?path:`/api/${path}`,origin);
    if(url.origin!==origin||!url.pathname.startsWith('/api/')) return failure('BROWSER_ROUTE_INVALID','Caminho local não permitido.',400);
    const parts=url.pathname.slice(5).split('/').filter(Boolean);
    if(parts[0]==='admin'&&parts[1]==='memberships') return failure('BROWSER_ACCESS_UNAVAILABLE','Esta demonstração é individual e local ao navegador. Não há contas remotas ou gerenciamento de acessos.',403);
    const headers=new Headers(options.headers);headers.set('Origin',origin);
    const request=new Request(url,{...options,headers});
    const SQL=await sqlite();
    let factory:IDBFactory|undefined;let locks:LockManager|undefined;
    try {factory=globalThis.indexedDB;locks=globalThis.navigator?.locks;} catch {return failure('BROWSER_STORAGE_UNAVAILABLE','O navegador bloqueou o armazenamento local. Nenhuma operação foi confirmada.');}
    return await withBrowserDatabase({SQL,migration,indexedDB:factory,locks:locks?{request:async(name,lockOptions,callback)=>await locks.request(name,lockOptions,callback)}:undefined,signal:options.signal},db=>handleApi(request,parts,{
      db,identity:{id:'browser_demo',displayName:'Revisor da demonstração'},provider:createRulesProvider(),
      config:{bootstrapAdminId:'browser_demo',aiApproved:false,maxBudgetMicrousd:0,sessionTtlHours:24,realIntakeEnabled:false},
    }));
  } catch(error) {
    if(error instanceof DOMException&&error.name==='AbortError') throw error;
    if(error instanceof BrowserDatabaseError) return failure(error.code,error.message);
    return failure('BROWSER_OPERATION_FAILED','Não foi possível concluir a operação neste navegador. O salvamento não foi confirmado; atualize o estado antes de tentar novamente.');
  }
}
