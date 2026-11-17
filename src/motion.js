import { animate } from 'framer-motion/dom/mini';

// Only unseen, offscreen content is prepared for a reveal. Visible content never resets.
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(max-width: 800px)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const active = new Map();
const seen = new WeakSet();
const pending = new Map();
const ease = [0.22, 1, 0.36, 1];
let clockTimer;
let viewportFrame;
let viewportFallback;

function tickMotion() {
  clockTimer = undefined;
  const now = performance.now();
  for (const [element, entry] of active) {
    const time = (now - entry.startedAt) / 1000;
    // Embedded browsers can freeze WAAPI while their JS clock keeps running.
    if (!entry.manual && time > .12 && entry.control.time < time - .1) {
      entry.manual = true;
      entry.control.pause();
    }
    if (entry.manual) entry.control.time = Math.min(time, entry.total);
    if (time >= entry.total + .05) settle(element, true);
  }
  if (active.size) clockTimer = setTimeout(tickMotion, 16);
}

function settle(element, complete = false) {
  const entry = active.get(element);
  if (!entry) return;
  active.delete(element);
  entry.control.cancel();
  for (const [property, value] of Object.entries(entry.original)) {
    if (value) element.style.setProperty(property, value);
    else element.style.removeProperty(property);
  }
  if (complete) entry.done?.();
}

export function play(element, keyframes, options = {}, done) {
  settle(element);
  if (preference.matches || !element.animate) { done?.(); return; }
  const original = Object.fromEntries(Object.keys(keyframes).map(key => [key, element.style.getPropertyValue(key)]));
  const settings = { duration: .48, ease, ...options };
  const control = animate(element, keyframes, settings);
  active.set(element, {
    control, original, done, startedAt: performance.now(),
    total: settings.duration + (settings.delay || 0), manual: false,
  });
  if (clockTimer === undefined) clockTimer = setTimeout(tickMotion, 16);
  control.then(() => {
    if (active.get(element)?.control === control) settle(element, true);
  });
}

function finishWithin(root) {
  for (const element of pending.keys()) {
    if (root === element || root.contains(element)) finishReveal(element);
  }
  for (const element of active.keys()) {
    if (root === element || root.contains(element)) settle(element, true);
  }
}

function finishReveal(element) {
  pending.delete(element);
  seen.add(element);
  element.dataset.revealState = 'shown';
  element.style.removeProperty('--reveal-from');
}

function updateReveals() {
  cancelAnimationFrame(viewportFrame);
  clearTimeout(viewportFallback);
  viewportFrame = viewportFallback = undefined;
  // Batch layout reads before writes; run only on viewport changes, not every frame.
  const entering = [];
  for (const [element, entry] of pending) {
    const rect = element.getBoundingClientRect();
    if (rect.width && rect.height && rect.top < innerHeight + 96) {
      entering.push({ element, entry, passed: rect.bottom <= 0 });
    }
  }
  for (const { element, entry, passed } of entering) {
    finishReveal(element);
    if (passed || preference.matches || element.contains(document.activeElement)) continue;
    element.dataset.revealState = 'revealing';
    play(element, { opacity: [0, 1], transform: [entry.from, entry.to] },
      { delay: entry.delay }, () => finishReveal(element));
  }
}

function scheduleReveals() {
  if (!pending.size || viewportFrame !== undefined) return;
  viewportFrame = requestAnimationFrame(updateReveals);
  // Some embedded previews throttle their rendering callbacks and observers.
  viewportFallback = setTimeout(updateReveals, 60);
}

function reveal(selector, { distance = 14, delay = 0, step = 0, rotate = 0 } = {}) {
  const groups = new Map();
  const prepared = [];
  document.querySelectorAll(selector).forEach(element => {
    if (seen.has(element) || pending.has(element)) return;
    const rect = element.getBoundingClientRect();
    const index = groups.get(element.parentElement) || 0;
    groups.set(element.parentElement, index + 1);
    if (preference.matches || !element.animate || !rect.width || !rect.height ||
        rect.top < innerHeight || element.contains(document.activeElement)) {
      seen.add(element);
      return;
    }
    const resting = getComputedStyle(element).transform;
    const to = resting === 'none' ? 'translateY(0px)' : resting;
    prepared.push({ element, from: `translateY(${Math.min(distance, 16)}px) rotate(${rotate}deg) ${to}`, to,
      delay: Math.min(delay + index * step, mobile.matches ? .06 : .12) });
  });
  prepared.forEach(({ element, ...entry }) => {
    pending.set(element, entry);
    element.style.setProperty('--reveal-from', entry.from);
    element.dataset.revealState = 'pending';
  });
}

export function animateMenu(nav, open, immediate = false) {
  finishWithin(nav);
  nav.inert = mobile.matches && !open;
  if (!mobile.matches || immediate || preference.matches) {
    nav.classList.toggle('is-open', mobile.matches && open);
    return;
  }
  if (open) {
    nav.classList.add('is-open');
    play(nav, { opacity: [0, 1], transform: ['translateY(-10px)', 'translateY(0px)'] }, { duration: 0.24 });
    nav.querySelectorAll('a').forEach((link, i) => {
      play(link, { opacity: [0, 1], transform: ['translateY(-6px)', 'translateY(0px)'] }, { duration: 0.22, delay: i * 0.025 });
    });
  } else if (nav.classList.contains('is-open')) {
    play(nav, { opacity: [1, 0], transform: ['translateY(0px)', 'translateY(-8px)'] }, { duration: 0.16 }, () => nav.classList.remove('is-open'));
  }
}

let indicator;
let selectedTab;
function positionIndicator(immediate = false) {
  if (!indicator || !selectedTab) return;
  const previous = getComputedStyle(indicator).transform;
  settle(indicator);
  const next = `translateX(${selectedTab.offsetLeft}px) scaleX(${selectedTab.offsetWidth})`;
  indicator.style.transform = next;
  if (!immediate) play(indicator, { transform: [previous, next] }, { duration: 0.3 });
}

export function animateTab(tab, panel) {
  finishWithin(document.querySelector('#demo-panels'));
  selectedTab = tab;
  positionIndicator();
  // Keep ARIA/hidden changes immediate. Only the incoming visible content animates.
  if (!panel.contains(document.activeElement)) {
    play(panel, { opacity: [0.35, 1], transform: ['translateY(8px)', 'translateY(0px)'] }, { duration: 0.28 });
  }
}

export function initMotion() {
  document.documentElement.classList.add('motion-ready');
  // Keep the initial viewport intact; prepare later sections before they enter it.
  reveal('.header-inner > .wordmark', { distance: 0, rotate: -4 });
  reveal('.hero-copy > *', { distance: 24, step: 0.07 });
  reveal('.flow-visual', { distance: 18, delay: 0.1 });
  reveal('.hero-baseline', { distance: 10 });
  reveal('.section > .container > .eyebrow, .section-head > *, .problem-intro > *');
  reveal('.two-sides article', { step: 0.1 });
  reveal('.loose-facts span, .organized-facts li', { distance: 8, step: .06 });
  reveal('.bridge-x', { distance: 0, rotate: -12 });
  reveal('.problem-connection, .flow-note, .concept-note, .demo-disclaimer');
  reveal('.process-shell', { distance: 12 });
  reveal('.product-window', { distance: 12 });
  reveal('.audience-heading > *, .audience-list article', { distance: 18 });
  reveal('.comparison-table tbody tr', { distance: 12 });
  reveal('.comparison-end, .impact-grid h2, .impact-copy > *');
  reveal('.impact-motif, .closing-motif', { distance: 0, rotate: -12 });
  reveal('.impact-path > div', { step: 0.08 });
  reveal('.principles > div, .professional-note');
  reveal('.closing h2, .closing p, .closing .button', { distance: 18, step: 0.06 });
  reveal('.footer-top > *, .footer-bottom', { distance: 12 });
  window.addEventListener('scroll', scheduleReveals, { passive: true });
  window.addEventListener('resize', scheduleReveals);
  window.addEventListener('pageshow', scheduleReveals);
  window.addEventListener('load', scheduleReveals);
  scheduleReveals();

  const tablist = document.querySelector('.demo-tabs');
  if (tablist) {
  indicator = document.createElement('span');
  indicator.className = 'tab-indicator';
  indicator.setAttribute('aria-hidden', 'true');
  tablist.append(indicator);
  selectedTab = tablist.querySelector('[aria-selected="true"]');
  positionIndicator(true);
  new ResizeObserver(() => positionIndicator(true)).observe(tablist);
  }

  document.querySelectorAll('.button:not(.interactive-cta)').forEach(button => {
    button.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse' && finePointer.matches) {
        play(button, { transform: ['translateY(0px)', 'translateY(-3px)'] }, { duration: 0.22 });
      }
    });
    button.addEventListener('pointerleave', event => {
      if (event.pointerType === 'mouse' && finePointer.matches) {
        play(button, { transform: ['translateY(-3px)', 'translateY(0px)'] }, { duration: 0.22 });
      }
    });
  });
  document.querySelectorAll('.button:not(.interactive-cta), .menu-toggle, [role="tab"]').forEach(control => {
    control.addEventListener('pointerdown', () => {
      const resting = getComputedStyle(control).transform;
      const base = resting === 'none' ? '' : resting;
      play(control, { transform: [`${base} scale(1)`, `${base} scale(0.97)`, `${base} scale(1)`] }, { duration: 0.22 });
    });
  });

  // Focusing an element always brings it and its ancestors to their resting state.
  document.addEventListener('focusin', event => {
    let element = event.target;
    while (element instanceof HTMLElement) {
      if (pending.has(element)) finishReveal(element);
      else seen.add(element);
      settle(element, true);
      element = element.parentElement;
    }
  });
  preference.addEventListener('change', () => {
    if (preference.matches) finishWithin(document.documentElement);
    positionIndicator(true);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      for (const element of active.keys()) settle(element, true);
    } else scheduleReveals();
  });
}
