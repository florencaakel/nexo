import { animate as animateFlow } from 'framer-motion/dom/mini';

const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const pointerPreference = matchMedia('(hover: hover) and (pointer: fine)');
const easing = 'cubic-bezier(.22,1,.36,1)';

function initFlow() {
  const card = document.querySelector('.flow-visual');
  if (!card || !Element.prototype.animate) return;
  const toggle = card.querySelector('.flow-toggle');
  const stages = [...card.querySelectorAll('.hero-flow li')];
  const duration = 12;
  const phaseDuration = duration / stages.length;
  let tracks = [];
  let timer;
  let watchdog;
  let compatibilityTimer;
  let elapsed = 0;
  let startedAt = 0;
  let playing = false;
  let manualClock = false;
  let inViewport = false;
  let userPaused = false;
  const currentTime = () => elapsed + (playing ? (performance.now() - startedAt) / 1000 : 0);

  function showPhase(index) {
    card.dataset.flowPhase = String(index);
    stages.forEach((stage, i) => i === index ? stage.setAttribute('aria-current', 'step') : stage.removeAttribute('aria-current'));
  }
  function updatePhase() {
    const position = currentTime() % duration;
    showPhase(Math.min(3, Math.floor(position / phaseDuration)));
    timer = setTimeout(updatePhase, Math.max(50, (phaseDuration - position % phaseDuration) * 1000 + 20));
  }
  function seekWithClock() {
    if (!playing) return;
    const position = currentTime();
    tracks.forEach(({ control }) => { control.time = position; });
    compatibilityTimer = setTimeout(seekWithClock, 33);
  }
  function syncPlayback() {
    clearTimeout(timer);
    clearTimeout(watchdog);
    clearTimeout(compatibilityTimer);
    elapsed = currentTime();
    playing = tracks.length > 0 && !motionPreference.matches && !userPaused && inViewport && !document.hidden;
    startedAt = performance.now();
    tracks.forEach(({ control }) => {
      control.pause();
      control.time = elapsed;
      if (playing && !manualClock) control.play();
    });
    card.dataset.playback = !tracks.length ? 'static' : playing ? 'playing' : 'paused';
    if (!playing) return;
    updatePhase();
    if (manualClock) seekWithClock();
    else watchdog = setTimeout(() => {
      // Embedded browsers may expose a visible page with a frozen native timeline.
      // Framer Motion's seek API keeps that preview moving without altering its look.
      if (!playing || Math.abs(tracks[0].control.time - currentTime()) < .15) return;
      manualClock = true;
      card.dataset.motionClock = 'compatibility';
      tracks.forEach(({ control }) => control.pause());
      seekWithClock();
    }, 300);
  }
  // Some embedded previews delay IntersectionObserver indefinitely. Read the
  // viewport directly so the animation also starts reliably in those browsers.
  function syncViewport() {
    const rect = card.getBoundingClientRect();
    const height = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0));
    const width = Math.max(0, Math.min(rect.right, innerWidth) - Math.max(rect.left, 0));
    const visible = rect.width > 0 && rect.height > 0 && width * height / (rect.width * rect.height) >= .15;
    if (visible !== inViewport) {
      inViewport = visible;
      syncPlayback();
    }
  }
  function clearTracks() {
    clearTimeout(timer);
    clearTimeout(watchdog);
    clearTimeout(compatibilityTimer);
    playing = false;
    elapsed = 0;
    manualClock = false;
    card.dataset.motionClock = 'native';
    tracks.forEach(({ element, control, original }) => {
      control.cancel();
      for (const [property, value] of Object.entries(original)) {
        if (value) element.style.setProperty(property, value);
        else element.style.removeProperty(property);
      }
    });
    tracks = [];
  }
  function track(selector, keyframes, times, ease = [.22, 1, .36, 1]) {
    card.querySelectorAll(selector).forEach(element => {
      const original = Object.fromEntries(Object.keys(keyframes).map(property => [property, element.style.getPropertyValue(property)]));
      const control = animateFlow(element, keyframes, {
        duration, repeat: Infinity, times: times.map(time => time / duration), ease: times.map(() => ease),
      });
      control.pause();
      control.time = 0;
      tracks.push({ element, control, original });
    });
  }
  // Each word is animated visually; assistive technology keeps the full sentence.
  const quote = card.querySelector('blockquote');
  const sentence = quote.textContent;
  quote.setAttribute('aria-label', sentence);
  quote.replaceChildren(...sentence.split(' ').flatMap((word, index) => {
    const span = document.createElement('span');
    span.className = 'story-word';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = word;
    return index ? [document.createTextNode(' '), span] : [span];
  }));

  function setup() {
    clearTracks();
    card.classList.toggle('flow-animated', !motionPreference.matches);
    toggle.hidden = motionPreference.matches;
    if (motionPreference.matches) { showPhase(3); syncViewport(); syncPlayback(); return; }
    track('.flow-story', {
      opacity: [0, 1, 1, 0, 0],
      transform: ['translateY(32px) rotate(-3deg)', 'translateY(0px) rotate(0deg)', 'translateY(0px) rotate(0deg)', 'translateY(-65px) rotate(3deg)', 'translateY(-65px) rotate(3deg)'],
    }, [0, .5, 2.5, 3.15, duration]);
    card.querySelectorAll('.story-word').forEach((_, index) => {
      const start = .15 + index * .18;
      track(`.story-word:nth-of-type(${index + 1})`, {
        opacity: [0, 0, 1, 1],
        transform: ['translateY(14px)', 'translateY(14px)', 'translateY(0px)', 'translateY(0px)'],
      }, [0, start, start + .4, duration]);
    });
    card.querySelectorAll('.story-voice i').forEach((_, index) => {
      const times = Array.from({ length: 13 }, (_, i) => i * .22);
      const values = times.map((_, i) => `scaleY(${.18 + ((i * 7 + index * 3) % 11) / 13})`);
      track(`.story-voice i:nth-child(${index + 1})`, { transform: [...values, values[0]] }, [...times, duration], 'ease-in-out');
    });
    card.querySelectorAll('.story-fragments span').forEach((_, index) => {
      const tilt = [-5, 3, 5][index];
      track(`.story-fragments span:nth-child(${index + 1})`, {
        opacity: [0, 0, 1, 1, 0, 0],
        transform: [`translateY(22px) rotate(${tilt}deg)`, `translateY(22px) rotate(${tilt}deg)`, `translateY(0px) rotate(${tilt}deg)`, `translateY(-5px) rotate(${-tilt}deg)`, 'translateY(-70px) rotate(0deg)', 'translateY(-70px) rotate(0deg)'],
      }, [0, .4 + index * .2, .95 + index * .2, 2.3, 3.1, duration]);
    });
    track('.flow-record', {
      opacity: [0, 0, 1, 1, 0, 0],
      transform: ['translateY(30px) scale(.95)', 'translateY(30px) scale(.95)', 'translateY(0px) scale(1)', 'translateY(0px) scale(1)', 'translateY(-45px) scale(.82)', 'translateY(-45px) scale(.82)'],
    }, [0, 2.7, 3.3, 8.65, 9.2, duration]);
    card.querySelectorAll('.flow-details > div').forEach((_, index) => {
      const start = 2.8 + index * .3;
      const from = [`translate(-48px, 30px) rotate(-8deg)`, `translate(48px, 30px) rotate(7deg)`, `translate(-30px, 50px) rotate(-5deg)`][index];
      track(`.flow-details > div:nth-child(${index + 1})`, {
        opacity: [0, 0, 1, 1],
        transform: [from, from, 'translate(0px, 0px) rotate(0deg)', 'translate(0px, 0px) rotate(0deg)'],
      }, [0, start, start + .8, duration]);
    });
    track('.flow-scan', {
      opacity: [0, 0, 1, 1, 0, 0],
      transform: ['translateY(-100%)', 'translateY(-100%)', 'translateY(-95%)', 'translateY(0%)', 'translateY(0%)', 'translateY(0%)'],
    }, [0, 6, 6.2, 7.9, 8.15, duration], 'linear');
    track('.flow-details > div:last-child', {
      'background-color': ['#ffffff', '#ffffff', '#fff2e8', '#fff2e8'],
      'border-color': ['#d0dff3', '#d0dff3', '#f47721', '#f47721'],
    }, [0, 7.55, 8.05, duration]);
    track('.analysis-note', {
      opacity: [0, 0, 1, 1],
      transform: ['translateY(12px)', 'translateY(12px)', 'translateY(0px)', 'translateY(0px)'],
    }, [0, 7.8, 8.25, duration]);
    track('.review-handoff', {
      opacity: [0, 0, 1, 1, 0, 0],
      transform: ['translateY(20px)', 'translateY(20px)', 'translateY(0px)', 'translateY(0px)', 'translateY(-24px)', 'translateY(-24px)'],
    }, [0, 8.9, 9.4, 11.4, 11.95, duration]);
    track('.handoff-document', {
      transform: ['translateY(-35px) scale(.75) rotate(-6deg)', 'translateY(-35px) scale(.75) rotate(-6deg)', 'translateY(0px) scale(1) rotate(0deg)', 'translateY(0px) scale(1) rotate(0deg)'],
    }, [0, 8.9, 9.65, duration]);
    track('.handoff-connector', { transform: ['scaleY(0)', 'scaleY(0)', 'scaleY(1)', 'scaleY(1)'] }, [0, 9.35, 9.95, duration]);
    track('.handoff-connector > span', {
      opacity: [0, 0, 1, 1, 0, 0],
      transform: ['translateY(0rem)', 'translateY(0rem)', 'translateY(0rem)', 'translateY(3.1rem)', 'translateY(3.1rem)', 'translateY(3.1rem)'],
    }, [0, 9.5, 9.6, 10.2, 10.3, duration], 'linear');
    track('.review-person', {
      opacity: [0, 0, 1, 1],
      transform: ['translateY(26px) scale(.9)', 'translateY(26px) scale(.9)', 'translateY(0px) scale(1)', 'translateY(0px) scale(1)'],
    }, [0, 9.4, 10.05, duration]);
    track('.review-check', {
      opacity: [0, 0, 1, 1, 1],
      transform: ['scale(0)', 'scale(0)', 'scale(1.2)', 'scale(1)', 'scale(1)'],
    }, [0, 10, 10.25, 10.45, duration]);
    track('.visual-symbol', {
      transform: ['rotate(0deg)', 'rotate(0deg)', 'rotate(90deg)', 'rotate(90deg)', 'rotate(180deg)', 'rotate(180deg)', 'rotate(270deg)', 'rotate(270deg)', 'rotate(360deg)'],
    }, [0, 2.6, 3.2, 5.6, 6.2, 8.6, 9.2, 11.5, duration]);
    stages.forEach((_, index) => {
      const start = index * phaseDuration;
      const end = start + phaseDuration;
      const times = [0, ...(start ? [start] : []), end, ...(end < duration ? [duration] : [])];
      const values = ['scaleX(0)', ...(start ? ['scaleX(0)'] : []), 'scaleX(1)', ...(end < duration ? ['scaleX(1)'] : [])];
      track(`.hero-flow li:nth-child(${index + 1}) .stage-progress`, { transform: values }, times, 'linear');
    });
    showPhase(0);
    syncViewport();
    syncPlayback();
  }
  toggle.addEventListener('click', () => {
    userPaused = !userPaused;
    toggle.setAttribute('aria-pressed', String(userPaused));
    toggle.setAttribute('aria-label', userPaused ? 'Retomar animação do fluxo' : 'Pausar animação do fluxo');
    toggle.textContent = userPaused ? 'Retomar' : 'Pausar';
    syncPlayback();
  });
  window.addEventListener('scroll', syncViewport, { passive: true });
  window.addEventListener('resize', syncViewport);
  window.addEventListener('load', syncViewport);
  window.addEventListener('pageshow', () => { syncViewport(); syncPlayback(); });
  motionPreference.addEventListener('change', setup);
  document.addEventListener('visibilitychange', () => { syncViewport(); syncPlayback(); });
  setup();
}

function initButton() {
  const button = document.querySelector('.interactive-cta');
  if (!button || !Element.prototype.animate) return;
  const label = button.querySelector('.cta-label');
  const text = label.textContent;
  button.setAttribute('aria-label', text);
  label.setAttribute('aria-hidden', 'true');
  label.replaceChildren(...[...text].map(character => {
    const span = document.createElement('span');
    span.className = 'cta-letter'; span.textContent = character; return span;
  }));
  const fill = button.querySelector('.cta-fill');
  const spark = button.querySelector('.cta-spark');
  const running = new Map();
  const ripples = new Set();
  let hovered = false;
  let focused = false;
  let origin = '50% 50%';
  function animate(element, keyframes, options = {}) {
    running.get(element)?.cancel();
    const animation = element.animate(keyframes, { duration: 550, easing, fill: 'forwards', ...options });
    running.set(element, animation);
  }
  function update(on, event) {
    if (motionPreference.matches) return;
    if (event) {
      const rect = button.getBoundingClientRect();
      origin = `${event.clientX - rect.left}px ${event.clientY - rect.top}px`;
    }
    const clip = getComputedStyle(fill).clipPath;
    const color = getComputedStyle(button).color;
    animate(fill, [{clipPath:clip}, {clipPath:`circle(${on ? '150%' : '0%'} at ${origin})`}], {duration:on ? 650 : 450});
    animate(button, [{color}, {color:'#ffffff'}], {duration:300});
    const rotation = getComputedStyle(spark).transform;
    animate(spark, [{transform:rotation}, {transform:on ? 'rotate(180deg)' : 'rotate(0deg)'}], {duration:750});
    if (on) [...label.children].forEach((letter, i) => animate(letter, [
      {transform:'translateY(0px)',opacity:1}, {transform:'translateY(-5px)',opacity:.35,offset:.4}, {transform:'translateY(0px)',opacity:1}
    ], {delay:i*16,duration:430,fill:'none'}));
  }
  button.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse' || !pointerPreference.matches) return;
    hovered = true; update(true,event);
  });
  button.addEventListener('pointerleave', event => { if (!hovered) return; hovered = false; if (!focused) update(false,event); });
  button.addEventListener('focus', () => { focused = button.matches(':focus-visible'); if (focused) update(true); });
  button.addEventListener('blur', () => { focused = false; if (!hovered) update(false); });
  button.addEventListener('pointerdown', event => {
    if (motionPreference.matches) return;
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'cta-ripple'; ripple.setAttribute('aria-hidden','true');
    ripple.style.left = `${event.clientX - rect.left}px`; ripple.style.top = `${event.clientY - rect.top}px`;
    button.append(ripple);
    const animation = ripple.animate([{transform:'scale(0)',opacity:.65},{transform:'scale(30)',opacity:0}], {duration:700,easing:'ease-out'});
    ripples.add(animation);
    animation.onfinish = animation.oncancel = () => { ripples.delete(animation); ripple.remove(); };
  });
  motionPreference.addEventListener('change', () => {
    if (!motionPreference.matches) return;
    running.forEach(animation => animation.cancel()); running.clear();
    ripples.forEach(animation => animation.cancel());
  });
}
export function initHeroLab() { initFlow(); initButton(); }
