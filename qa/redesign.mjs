// Regression check for the animated story, its controls, and static fallback.
import { chromium } from '/tmp/nexo-browser-qa/node_modules/playwright-core/index.mjs';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const url = process.env.NEXO_QA_URL || 'http://localhost:4173/';
const prefix = url.startsWith('https:') ? 'public' : 'local';
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const report = { url, date: new Date().toISOString(), widths: [], errors: [] };
const context = await browser.newContext({ viewport: { width: 1287, height: 865 }, hasTouch: true });
const page = await context.newPage();
const settle = async () => {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.waitForFunction(() => document.getAnimations().every(a => a.effect.getTiming().iterations === Infinity || a.playState !== 'running'));
};
page.on('pageerror', error => report.errors.push(error.message));
page.on('response', response => { if (response.status() >= 400) report.errors.push(`${response.status()} ${response.url()}`); });
try {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
  assert.equal(response.status(), 200);
  await page.waitForFunction(() => document.querySelector('.flow-story').getAnimations().length > 0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await settle();
  assert.equal(await page.locator('.flow-story').evaluate(el => getComputedStyle(el).opacity), '1');
  assert.equal(await page.locator('.flow-visual').evaluate(el => el.getAnimations({ subtree: true }).length), 0);
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('.flow-visual').evaluate(el => el.getAnimations({ subtree: true }).length), 0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.reload({ waitUntil: 'networkidle' });
  const card = page.locator('.flow-visual');
  const states = () => card.evaluate(el => el.getAnimations({ subtree: true }).filter(a => a.effect.getTiming().iterations === Infinity).map(a => ({ state: a.playState, time: a.currentTime })));
  const observed = [];
  for (const phase of ['0', '1', '2', '3', '0']) {
    await page.waitForFunction(expected => document.querySelector('.flow-visual').dataset.flowPhase === expected, phase);
    assert.equal(await page.locator('.hero-flow [aria-current=step]').count(), 1);
    observed.push(phase);
    if (phase === '3') {
      await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.review-handoff')).opacity) > .99);
      await card.screenshot({ path: `qa/${prefix}-flow-review.png` });
    }
  }
  assert.ok((await states()).length > 0);
  const clockMode = await card.getAttribute('data-motion-clock');
  assert.ok((await states()).every(a => a.state === (clockMode === 'compatibility' ? 'paused' : 'running')));
  await page.getByRole('button', { name: 'Pausar animação do fluxo' }).focus();
  await page.keyboard.press('Enter');
  await settle();
  const paused = await states();
  assert.ok(paused.every(a => a.state === 'paused'));
  await page.waitForTimeout(180);
  assert.deepEqual(await states(), paused);
  await page.keyboard.press('Space');
  await page.waitForFunction(() => document.querySelector('.flow-visual').dataset.playback === 'playing');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await settle();
  assert.equal((await states()).length, 0);
  assert.equal(await card.getAttribute('data-playback'), 'static');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(() => document.documentElement.style.scrollBehavior = 'auto');
  await page.locator('#solucao').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('.flow-visual').dataset.playback === 'paused');
  assert.ok((await states()).every(a => a.state === 'paused'));
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForFunction(() => document.querySelector('.flow-visual').dataset.playback === 'playing');
  const background = await page.context().newPage();
  await background.goto('about:blank');
  const nativeBackground = await page.evaluate(() => document.hidden);
  if (nativeBackground) await page.waitForFunction(() => document.querySelector('.flow-visual').dataset.playback === 'paused');
  await page.bringToFront();
  await page.waitForFunction(() => document.querySelector('.flow-visual').dataset.playback === 'playing');
  await background.close();
  assert.deepEqual(await page.locator('.hero-flow strong').allTextContents(), ['Relato', 'Organização', 'Pré-análise', 'Revisão humana']);
  report.motion = { status: 'PASS', observedPhases: observed, repeats: true, keyboardPauseResume: true, offscreenPauseResume: true, backgroundPauseResume: nativeBackground ? 'PASS' : 'Not emulated by headless Chrome', reducedAtLoadAndRuntime: true };
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addScriptTag({ path: '/tmp/nexo-browser-qa/node_modules/axe-core/axe.min.js' });
  for (const width of [360, 390, 768, 1024, 1287, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await settle();
    for (const size of ['', '200%']) {
      await page.evaluate(value => document.documentElement.style.fontSize = value, size);
      const issues = await page.locator('.flow-visual').evaluate(card => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        clipped: [...card.querySelectorAll('*')].filter(el => !el.closest('[aria-hidden=true]') && el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1).map(el => el.tagName + '.' + el.className),
      }));
      assert.equal(issues.overflow, false, `${width} ${size}: page overflow`);
      assert.deepEqual(issues.clipped, [], `${width} ${size}: clipped text`);
    }
    await page.evaluate(() => document.documentElement.style.fontSize = '');
    const violations = await page.evaluate(async () => (await axe.run('.flow-visual', { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(v => v.id));
    assert.deepEqual(violations, []);
    report.widths.push({ width, text200: 'PASS', overflow: false, axeViolations: 0 });
  }
  // Check the moving cards too: offscreen transforms must not widen the page.
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await card.scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Pausar animação do fluxo' }).click();
  report.movingLayout = [];
  for (const width of [360, 390, 768, 1024, 1287, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const overflow = await card.evaluate(async el => {
      const animations = el.getAnimations({ subtree: true }).filter(a => a.effect.getTiming().iterations === Infinity);
      const duration = animations[0].effect.getTiming().duration;
      const failures = [];
      for (let time = 0; time < duration; time += 125) {
        animations.forEach(a => a.currentTime = time);
        await new Promise(resolve => requestAnimationFrame(resolve));
        if (document.documentElement.scrollWidth > innerWidth) failures.push(time);
      }
      return failures;
    });
    assert.deepEqual(overflow, [], `${width}: moving cards widen page`);
    report.movingLayout.push({ width, overflow: false });
  }
  await page.getByRole('button', { name: 'Retomar animação do fluxo' }).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.locator('.flow-visual').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('.flow-visual').dataset.playback === 'playing');
  await page.getByRole('button', { name: 'Pausar animação do fluxo' }).tap();
  assert.equal(await card.getAttribute('data-playback'), 'paused');
  await page.getByRole('button', { name: 'Retomar animação do fluxo' }).tap();
  assert.equal(await card.getAttribute('data-playback'), 'playing');
  report.mobileTouch = 'PASS';
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await settle();
  await page.screenshot({ path: `qa/${prefix}-refined-mobile.png` });
  await page.evaluate(() => scrollTo(0, 0));
  await settle();
  await page.screenshot({ path: `qa/${prefix}-refined-full-mobile.png`, fullPage: true });
  await page.setViewportSize({ width: 1287, height: 865 });
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: `qa/${prefix}-refined-desktop.png` });
  await page.screenshot({ path: `qa/${prefix}-refined-full-desktop.png`, fullPage: true });
  const fallback = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  await fallback.goto(url);
  assert.equal(await fallback.locator('.review-handoff').isVisible(), true);
  assert.equal(await fallback.locator('.flow-details > div').count(), 3);
  await fallback.close();
  report.fallback = 'PASS: complete illustration without JS';
  // Reproduce the embedded preview: no viewport notifications and no native clock.
  const frozenContext = await browser.newContext({ viewport: { width: 1287, height: 865 } });
  await frozenContext.addInitScript(() => {
    window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
    const nativeAnimate = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const animation = nativeAnimate.apply(this, args);
      animation.play = () => animation.pause();
      return animation;
    };
  });
  const frozenPage = await frozenContext.newPage();
  await frozenPage.goto(url, { waitUntil: 'networkidle' });
  await frozenPage.waitForFunction(() => document.querySelector('.flow-visual').dataset.motionClock === 'compatibility');
  await frozenPage.waitForFunction(() => document.querySelector('.flow-visual').dataset.flowPhase === '1');
  await frozenPage.waitForFunction(() => Number(getComputedStyle(document.querySelector('.flow-record')).opacity) > .99);
  const recovered = await frozenPage.locator('.flow-record').evaluate(el => ({ time: el.getAnimations()[0].currentTime, opacity: getComputedStyle(el).opacity }));
  assert.ok(recovered.time > 2900);
  assert.ok(Number(recovered.opacity) > .99);
  await frozenContext.close();
  report.embeddedCompatibility = 'PASS: animation advances with native clock and viewport observer frozen';
  assert.deepEqual(report.errors, []);
  report.status = 'PASS';
} catch (error) { report.status = 'FAIL'; report.error = error.stack; process.exitCode = 1; }
finally { await writeFile(`qa/${prefix}-story-results.json`, JSON.stringify(report, null, 2)); await browser.close(); }
console.log(JSON.stringify(report, null, 2));
