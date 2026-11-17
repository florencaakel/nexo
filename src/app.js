import { initHeroLab } from './hero-lab.js';
import { animateMenu, initMotion } from './motion.js';

const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
const closeMenu = (immediate = false) => {
  toggle.setAttribute('aria-expanded', 'false');
  if (nav.contains(document.activeElement) && matchMedia('(max-width: 800px)').matches) toggle.focus();
  animateMenu(nav, false, immediate);
};
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  animateMenu(nav, open);
});
nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { closeMenu(); toggle.focus(); } });
document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
matchMedia('(min-width: 801px)').addEventListener('change', () => closeMenu(true));
closeMenu(true);

initMotion();

initHeroLab();
