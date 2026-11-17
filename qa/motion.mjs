import { chromium } from '/tmp/nexo-browser-qa/node_modules/playwright-core/index.mjs';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const url = process.env.NEXO_QA_URL || 'http://localhost:4173/';
const prefix = url.startsWith('https:') ? 'public' : 'local';
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const report = { url, date: new Date().toISOString(), widths: [], errors: [] };
const frame = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const settled = async page => {
  await frame(page);
  await page.waitForFunction(() => document.getAnimations().every(animation => animation.effect.getTiming().iterations === Infinity || animation.playState !== 'running'));
};
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
    await page.addInitScript(() => {
      window.motionStarts = [];
      const original = Element.prototype.animate;
      Element.prototype.animate = function (...args) {
        window.motionStarts.push({ section: this.closest('section,footer')?.id || 'header', id: this.id, className: this.className, reduced: matchMedia('(prefers-reduced-motion: reduce)').matches });
        return original.apply(this, args);
      };
    });
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('html.motion-ready');
    const opening = await page.locator('h1').evaluate(element => ({ opacity: getComputedStyle(element).opacity, animations: element.getAnimations().length }));
    assert.equal(opening.opacity, '1');
    assert.equal(opening.animations, 0, 'Already visible copy must not disappear and replay');
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('#how-title').scrollIntoView(); });
    await page.waitForFunction(() => document.querySelector('#how-title').getAnimations().length > 0);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await frame(page);
    assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
    assert.equal(await page.locator('h1').evaluate(element => getComputedStyle(element).opacity), '1');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.evaluate(() => window.motionStarts.length), 0);
    await page.locator('#tab-consumo').click();
    if (width === 390) {
      await page.locator('.menu-toggle').click();
      await page.keyboard.press('Escape');
    }
    assert.equal(await page.evaluate(() => window.motionStarts.length), 0);

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.documentElement.style.scrollBehavior = 'auto');
    assert.equal(await page.locator('#how-title').evaluate(el => getComputedStyle(el).opacity), '0');
    await page.locator('#how-title').evaluate(el => scrollTo(0, scrollY + el.getBoundingClientRect().top - innerHeight - 48));
    await page.waitForFunction(() => document.querySelector('#how-title').getAnimations().length > 0);
    assert.ok(await page.locator('#how-title').evaluate(el => el.getBoundingClientRect().top >= innerHeight), 'Reveal starts just before entering view');
    await page.evaluate(() => scrollBy(0, 180));
    const opacity = await page.locator('#how-title').evaluate(async el => {
      const values = [];
      for (let i = 0; i < 45; i++) {
        values.push(Number(getComputedStyle(el).opacity));
        await new Promise(resolve => requestAnimationFrame(resolve));
      }
      return values;
    });
    assert.ok(opacity.every((value, i) => !i || value >= opacity[i - 1] - .001), 'No visible-to-hidden flash');
    assert.equal(opacity.at(-1), 1);
    const started = await page.evaluate(() => motionStarts.filter(a => a.id === 'how-title').length);
    await page.evaluate(() => scrollTo(0, 0));
    await frame(page);
    await page.locator('#how-title').scrollIntoViewIfNeeded();
    await frame(page);
    assert.equal(await page.evaluate(() => motionStarts.filter(a => a.id === 'how-title').length), started, 'Scrolling back must not restart the reveal');
    await page.evaluate(() => scrollTo(0, 0));
    // Traverse every viewport so scroll reveals are exercised, not skipped in a screenshot.
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.65) {
        scrollTo(0, y);
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      }
    });
    await settled(page);
    const sections = await page.evaluate(() => [...new Set(window.motionStarts.map(entry => entry.section))]);
    for (const section of ['inicio', 'solucao', 'como-funciona', 'demonstracao', 'para-quem', 'diferenciais', 'impacto', 'responsabilidade', 'proximo-passo', 'rodape']) assert.ok(sections.includes(section), section);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.locator('#tab-trabalho').focus();
    for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowRight');
    await page.keyboard.press('End');
    await page.keyboard.press('Tab');
    await settled(page);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'panel-moradia');
    assert.equal(await page.locator('#demo-panels [role=tabpanel]:visible').count(), 1);
    assert.equal(await page.locator('#panel-moradia').evaluate(element => getComputedStyle(element).opacity), '1');
    const alignment = await page.evaluate(() => {
      const tab = document.querySelector('.demo-tabs [role=tab][aria-selected=true]').getBoundingClientRect();
      const indicator = document.querySelector('.tab-indicator').getBoundingClientRect();
      return { left: Math.abs(tab.left - indicator.left), width: Math.abs(tab.width - indicator.width) };
    });
    assert.ok(alignment.left < 1 && alignment.width < 1);
    if (width === 390) {
      await page.locator('.menu-toggle').click();
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#main-nav').evaluate(element => element.inert), true);
      await page.keyboard.press('Enter');
      await page.keyboard.press('Escape');
      await settled(page);
      assert.equal(await page.locator('#main-nav').isVisible(), false);
      await page.locator('.menu-toggle').click();
      await page.setViewportSize({ width: 1440, height: 900 });
      await frame(page);
      assert.equal(await page.locator('#main-nav').evaluate(element => element.inert), false);
      assert.equal(await page.locator('#main-nav').isVisible(), true);
      await page.setViewportSize({ width, height: 900 });
      await frame(page);
      assert.equal(await page.locator('#main-nav').isVisible(), false);
    }
    await page.locator('#tab-trabalho').click();
    await page.evaluate(() => scrollTo(0, 0));
    await settled(page);
    await page.screenshot({ path: `qa/${prefix}-motion-full-${width}.png`, fullPage: true });
    report.widths.push({ width, opening, preparedBeforeEntry: 'PASS', noOpacityReset: 'PASS', noReplay: 'PASS', animatedSections: sections, reducedAtLoad: 'PASS', reducedWhileAnimating: 'PASS', rapidTabs: 'PASS', indicatorAlignment: alignment, responsiveMenu: 'PASS', overflow: false });
    await context.close();
  }
  const noJS = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const fallback = await noJS.newPage();
  await fallback.goto(url);
  assert.equal(await fallback.locator('h1').isVisible(), true);
  assert.equal(await fallback.locator('#impact-title').isVisible(), true);
  report.withoutJavaScript = 'Editorial content visible';
  await noJS.close();
  const frozen = await browser.newContext({ viewport: { width: 1287, height: 865 } });
  await frozen.addInitScript(() => {
    window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
    const original = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const animation = original.apply(this, args);
      animation.pause();
      animation.play = () => animation.pause();
      return animation;
    };
  });
  const embedded = await frozen.newPage();
  await embedded.goto(url, { waitUntil: 'networkidle' });
  await embedded.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('#how-title').scrollIntoView(); });
  await embedded.waitForFunction(() => document.querySelector('#how-title').dataset.revealState === 'shown');
  assert.equal(await embedded.locator('#how-title').evaluate(el => getComputedStyle(el).opacity), '1');
  await embedded.locator('#tab-consumo').click();
  await embedded.waitForFunction(() => getComputedStyle(document.querySelector('#panel-consumo')).opacity === '1');
  report.embeddedClock = 'PASS: reveals and tabs complete with native animation clock frozen';
  await frozen.close();
  assert.deepEqual(report.errors, []);
  report.status = 'PASS';
} catch (error) {
  report.status = 'FAIL'; report.error = error.stack; throw error;
} finally {
  await writeFile(`qa/${prefix}-scroll-motion-results.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
console.log(JSON.stringify(report, null, 2));
