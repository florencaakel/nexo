import { chromium } from '/tmp/nexo-browser-qa/node_modules/playwright-core/index.mjs';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const url = process.env.NEXO_QA_URL || 'http://localhost:4173/';
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const report = { url, widths: [], errors: [] };
try {
  for (const width of [390, 1287]) {
    const context = await browser.newContext({ viewport: { width, height: 865 }, hasTouch: true, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.documentElement.style.scrollBehavior = 'auto');
    for (const id of ['trabalho', 'consumo', 'moradia']) {
      await page.locator('#tab-' + id).tap();
      const panel = page.locator('#panel-' + id);
      assert.equal(await page.locator('#demo-panels [role=tabpanel]:visible').count(), 1);
      await panel.locator('.organize-button').tap();
      await page.waitForFunction(id => document.querySelector('#panel-' + id).dataset.demoState === 'ready', id);
      assert.equal(await panel.locator('.signal-value:visible').count(), 3);
      assert.match(await panel.locator('.demo-status').textContent(), /revisão humana/);
      await panel.locator('summary').click();
      assert.equal(await panel.locator('.case-details-grid').isVisible(), true);
      await panel.locator('summary').click();
    }
    for (let index = 0; index < 4; index++) {
      await page.locator('#process-tab-' + index).tap();
      assert.equal(await page.locator('.process-panels [role=tabpanel]:visible').count(), 1);
      assert.equal(await page.locator('#process-panel-' + index).isVisible(), true);
    }
    await page.locator('#process-tab-0').focus();
    await page.keyboard.press('End');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'process-tab-3');
    await page.keyboard.press('Home');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'process-tab-0');
    await page.addScriptTag({ path: '/tmp/nexo-browser-qa/node_modules/axe-core/axe.min.js' });
    const violations = await page.evaluate(async () => (await axe.run('#solucao, #como-funciona, #demonstracao', { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })));
    assert.deepEqual(violations, []);
    for (const section of ['solucao', 'como-funciona', 'demonstracao']) await page.locator('#' + section).screenshot({ path: `qa/experience-${section}-${width}.png` });
    for (const enlarged of [false, true]) {
      await page.evaluate(value => document.documentElement.style.fontSize = value ? '200%' : '', enlarged);
      for (let index = 0; index < 4; index++) {
        await page.locator('#process-tab-' + index).click();
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
        assert.equal(overflow, false, `Horizontal overflow at ${width}, 200%=${enlarged}, stage ${index}`);
      }
    }
    await page.evaluate(() => document.documentElement.style.fontSize = '');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.locator('#tab-trabalho').click();
    await page.locator('#panel-trabalho .organize-button').click();
    await page.waitForFunction(() => document.querySelector('#panel-trabalho').dataset.demoState === 'ready');
    if (width === 1287) {
      await page.locator('#process-tab-0').click();
      await page.getByRole('button', { name: 'Ver sequência' }).click();
      await page.waitForFunction(() => document.querySelector('.process-shell').dataset.processStep === '1');
      await page.getByRole('button', { name: 'Pausar sequência' }).click();
      await page.waitForTimeout(2100);
      assert.equal(await page.locator('.process-shell').getAttribute('data-process-step'), '1');
      await page.getByRole('button', { name: 'Continuar sequência' }).click();
      await page.waitForFunction(() => document.querySelector('.process-shell').dataset.processStep === '3');
      await page.waitForFunction(() => document.querySelector('.process-replay').getAttribute('aria-pressed') === 'false');
    }
    report.widths.push({ width, cases: 'PASS', processTabs: 'PASS', keyboard: 'PASS', text200: 'PASS', axe: violations, animation: 'PASS' });
    await context.close();
  }
  assert.deepEqual(report.errors, []);
  report.status = 'PASS';
} catch (error) { report.status = 'FAIL'; report.error = error.stack; process.exitCode = 1; }
finally { await writeFile('qa/experience-results.json', JSON.stringify(report, null, 2)); await browser.close(); }
console.log(JSON.stringify(report, null, 2));
