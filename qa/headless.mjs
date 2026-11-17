// Dependências de QA isoladas em /tmp; o site publicado não depende delas.
import { chromium } from '/tmp/nexo-browser-qa/node_modules/playwright-core/index.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const url = process.env.NEXO_QA_URL || 'http://localhost:4173/';
const prefix = url.startsWith('https:') ? 'public' : 'local';
const browser = await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const report = {url,date:new Date().toISOString(),results:[],console:[],failedRequests:[]};
const waitForMotion = async page => {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.waitForFunction(() => document.getAnimations().every(animation => !['running', 'pending'].includes(animation.playState)));
};
await mkdir(path.join(root,'qa'),{recursive:true});
try {
  for (const width of [360,390,768,1440]) {
    // Audit the stable reading state; qa/redesign.mjs exercises the repeating flow.
    const context = await browser.newContext({viewport:{width,height:width>1000?960:844},isMobile:width<500,hasTouch:width<500,locale:'pt-BR',reducedMotion:'reduce'});
    const page = await context.newPage();
    page.on('pageerror', error => report.console.push(error.message));
    page.on('console', msg => {if(msg.type()==='error')report.console.push(msg.text());});
    page.on('requestfailed', request => report.failedRequests.push({url:request.url(),reason:request.failure()?.errorText}));
    page.on('response', response => {if(response.status()>=400)report.failedRequests.push({url:response.url(),status:response.status()});});
    const response = await page.goto(url,{waitUntil:'networkidle'});
    assert.equal(response.status(),200);
    assert.equal(await page.title(),'Nexo | Triagem jurídica inteligente');
    assert.equal(await page.locator('h1').count(),1);
    assert.equal(await page.locator('html').getAttribute('lang'),'pt-BR');
    assert.ok((await page.locator('meta[name=description]').getAttribute('content')).includes('revisão humana'));
    assert.equal(await page.locator('link[rel=icon]').getAttribute('href'),'./favicon.svg');
    if(prefix==='public'){
      assert.equal(new URL(await page.locator('link[rel=canonical]').getAttribute('href')).origin,new URL(url).origin);
      assert.equal(await page.locator('meta[property="og:site_name"]').getAttribute('content'),'Nexo');
    }
    await page.addScriptTag({path:'/tmp/nexo-browser-qa/node_modules/axe-core/axe.min.js'});
    await page.evaluate(()=>document.documentElement.style.scrollBehavior='auto');
    for(const example of ['trabalho','consumo','moradia']) {
      if(width<500)await page.locator('#tab-'+example).tap();else await page.locator('#tab-'+example).click();
      await page.locator('#panel-'+example).waitFor({state:'visible'});
      assert.equal(await page.locator('#demo-panels [role=tabpanel]:visible').count(),1);
      await waitForMotion(page);
      const axe = await page.evaluate(async()=>{const results=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return {violations:results.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>n.target)})),passes:results.passes.length};});
      const overflow=await page.evaluate(()=>({document:document.documentElement.scrollWidth>innerWidth,clipped:[...document.querySelectorAll('main *,footer *')].filter(e=>{if(!e.getClientRects().length||e.closest('[hidden],.sr-only')||e.closest('thead')&&getComputedStyle(e.closest('thead')).clip!=='auto')return false;const r=e.getBoundingClientRect();return r.left< -1||r.right>innerWidth+1;}).map(e=>e.tagName+'.'+e.className)}));
      report.results.push({width,example,axe,overflow});
      console.log(JSON.stringify({width,example,violations:axe.violations,overflow}));
      assert.deepEqual(axe.violations,[]);
      assert.equal(overflow.document,false);assert.deepEqual(overflow.clipped,[]);
    }
    await page.locator('#tab-trabalho').click();
    await page.locator('#tab-trabalho').focus();
    for(const [key,expected] of [['ArrowRight','consumo'],['ArrowRight','moradia'],['ArrowLeft','consumo'],['Home','trabalho'],['End','moradia']]) {
      await page.keyboard.press(key);
      assert.equal(await page.evaluate(()=>document.activeElement.id),'tab-'+expected);
      assert.equal(await page.locator('#demo-panels [role=tabpanel]:visible').getAttribute('id'),'panel-'+expected);
    }
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'panel-moradia');
    assert.equal(await page.evaluate(()=>document.activeElement.matches(':focus-visible')),true);
    if(width<500) {
      await page.locator('.menu-toggle').tap();
      assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');
      await page.locator('#main-nav a[href="#impacto"]').tap();
      assert.equal(new URL(page.url()).hash,'#impacto');
      assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
      await waitForMotion(page);
    }
    // Testar cada link por ativação nativa e verificar destino e posição visível.
    const anchors = await page.locator('a[href^="#"]').evaluateAll(links=>links.map((a,i)=>({index:i,href:a.getAttribute('href')})));
    for(const anchor of anchors) {
      const link=page.locator('a[href^="#"]').nth(anchor.index);
      if(!await link.isVisible())continue;
      if(anchor.index===0)await link.focus();
      await link.click();
      assert.equal(new URL(page.url()).hash,anchor.href);
    }
    await page.goto(url,{waitUntil:'networkidle'});
    const expected=await page.locator('a,button,[tabindex="0"]').evaluateAll(els=>els.filter(e=>e.tabIndex>=0&&e.getClientRects().length&&!e.closest('[hidden]')).map(e=>e.id||e.className||e.textContent.trim()));
    const actual=[];
    for(const item of expected){
      await page.keyboard.press('Tab');
      const focus=await page.evaluate(()=>({name:document.activeElement.id||document.activeElement.className||document.activeElement.textContent.trim(),visible:document.activeElement.matches(':focus-visible'),outline:getComputedStyle(document.activeElement).outlineStyle}));
      actual.push(focus.name);assert.equal(focus.visible,true);assert.notEqual(focus.outline,'none');
    }
    assert.deepEqual(actual,expected);
    report.results.push({width,keyboard:'PASS',focusOrder:actual,touch:width<500?'PASS':'n/a',anchors:'PASS'});
    await page.locator('#tab-trabalho').click();
    await page.evaluate(()=>scrollTo(0,0));
    await waitForMotion(page);
    if([390,1440].includes(width))await page.screenshot({path:path.join(root,'qa',prefix+'-full-'+width+'.png'),fullPage:true,animations:'disabled'});
    if(width===390){
      await page.evaluate(()=>document.documentElement.style.fontSize='200%');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      report.text200='PASS';
      await page.evaluate(()=>document.documentElement.style.fontSize='');
      await page.emulateMedia({reducedMotion:'reduce'});
      const motion=await page.evaluate(()=>({preference:matchMedia('(prefers-reduced-motion: reduce)').matches,scroll:getComputedStyle(document.documentElement).scrollBehavior,transition:getComputedStyle(document.querySelector('.button')).transitionDuration}));
      assert.equal(motion.preference,true);assert.equal(motion.scroll,'auto');assert.equal(motion.transition,'0s');
      report.reducedMotion=motion;
    }
    await context.close();
  }
  assert.deepEqual(report.console,[]);assert.deepEqual(report.failedRequests,[]);
  report.status='PASS';
} catch(error) {report.status='FAIL';report.error=error.stack;throw error;}
finally {
  await writeFile(path.join(root,'qa',prefix+'-browser-results.json'),JSON.stringify(report,null,2));
  await browser.close();
}
console.log('PASS: axe WCAG 2.1 AA, teclado nativo, toque, âncoras, redução de movimento, texto 200%, console e recursos.');
