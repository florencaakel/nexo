import { cases } from './cases.js';
import { animateTab, play } from './motion.js';

const preference = matchMedia('(prefers-reduced-motion: reduce)');
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const list = values => `<ul>${values.map(value => `<li>${escapeHTML(value)}</li>`).join('')}</ul>`;
const previews = {
  trabalho: { title: 'Jornada e pagamento', quote: '“Trabalhei além do horário. Não entendi o pagamento e tenho mensagens sobre a jornada.”', fact: 'Jornada estendida e pagamento a esclarecer.', docs: 'Mensagens e comprovante de pagamento.', gap: 'Confirmar vínculo, horários e recibos.' },
  consumo: { title: 'Compra com defeito', quote: '“A máquina de lavar parou de funcionar. Falei com a loja duas vezes e ainda espero uma solução.”', fact: 'Defeito relatado e contatos sem solução.', docs: 'Comprovante de compra e protocolo.', gap: 'Conferir datas e respostas da loja.' },
  moradia: { title: 'Pedido de saída do imóvel', quote: '“Recebi uma mensagem pedindo que eu saísse em sete dias. Tenho contrato, mas não entendi o motivo.”', fact: 'Pedido de saída em sete dias, por mensagem.', docs: 'Contrato, recibos e mensagem recebida.', gap: 'Verificar autoria, motivo e notificação.' },
};
const signalIcons = [
  '<path d="m5 12 4 4L19 6"/>',
  '<path d="M7 3h7l4 4v14H7zM14 3v5h5M10 12h5M10 16h5"/>',
  '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 .5c0 1.5-2.5 1.5-2.5 3M12 16v1"/>',
];

function tabKeys(tabs, activate) {
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(index));
    tab.addEventListener('keydown', event => {
      const next = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      activate(next, true);
    });
  });
}

function initDemo() {
  const panels = document.querySelector('#demo-panels');
  if (!panels) return;
  panels.innerHTML = cases.map((example, index) => {
    const preview = previews[example.id];
    const signals = [['Fatos', preview.fact], ['Documentos', preview.docs], ['A esclarecer', preview.gap]];
    return `<div id="panel-${example.id}" class="demo-panel" role="tabpanel" aria-labelledby="tab-${example.id}" tabindex="0" data-demo-state="idle" ${index ? 'hidden' : ''}>
      <div class="case-sidebar">
        <span class="case-reference">${example.reference} · ${example.label}</span>
        <h3>${preview.title}</h3>
        <blockquote class="case-story">${preview.quote}</blockquote>
        <button class="organize-button" type="button"><span>Organizar exemplo</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 6h16M4 12h10M4 18h7"/><path d="m16 17 2 2 4-5"/></svg></button>
        <span class="case-source-note">Um relato é o ponto de partida.</span>
      </div>
      <div class="case-analysis">
        <div class="analysis-heading"><h3>O relato, organizado.</h3><span class="analysis-symbol" aria-hidden="true">×</span></div>
        <div class="signal-list">${signals.map(([label, value], i) => `<div class="signal-card signal-${i}"><span class="signal-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">${signalIcons[i]}</svg></span><div><h4>${label}</h4><span class="signal-skeleton" aria-hidden="true"></span><p class="signal-value" hidden>${value}</p></div></div>`).join('')}</div>
        <p class="demo-status" role="status">Use “Organizar exemplo” para acompanhar.</p>
      </div>
      <details class="case-details"><summary>Ver detalhes do exemplo <span aria-hidden="true">+</span></summary><div class="case-details-grid">
        <div><h4>Relato completo</h4><p>${escapeHTML(example.story)}</p><h4>Linha do tempo</h4><ol class="timeline">${example.timeline.map(([date, event]) => `<li><strong>${escapeHTML(date)}</strong><span>${escapeHTML(event)}</span></li>`).join('')}</ol></div>
        <div><h4>Informações pendentes</h4>${list(example.pending)}<h4>Perguntas para esclarecer</h4>${list(example.questions)}</div>
        <div><h4>${escapeHTML(example.urgency)}</h4><p>${escapeHTML(example.urgencyReason)}</p><h4>Incertezas registradas</h4><p>${escapeHTML(example.uncertainty)}</p></div>
        <div><h4>Possíveis pontos para avaliação</h4>${list(example.points)}<h4>Próximo passo sugerido</h4><p>${escapeHTML(example.next)}</p></div>
      </div></details>
    </div>`;
  }).join('');

  panels.querySelectorAll('.organize-button').forEach(button => {
    button.addEventListener('click', () => {
      const panel = button.closest('.demo-panel');
      panel.dataset.demoState = 'running';
      button.disabled = true;
      button.querySelector('span').textContent = 'Organizando…';
      panel.querySelector('.demo-status').textContent = 'Reunindo os pontos do relato…';
      const cards = [...panel.querySelectorAll('.signal-card')];
      cards.forEach((card, i) => {
        card.querySelector('.signal-skeleton').hidden = true;
        card.querySelector('.signal-value').hidden = false;
        play(card, { opacity: [.2, 1], transform: ['translateX(18px)', 'translateX(0px)'] }, { duration: .5, delay: i * .18 }, i === cards.length - 1 ? () => {
          panel.dataset.demoState = 'ready';
          panel.querySelector('.demo-status').textContent = 'Organizado. O próximo passo é a revisão humana.';
          button.disabled = false;
          button.querySelector('span').textContent = 'Rever organização';
        } : undefined);
      });
    });
  });
  const tabs = [...document.querySelectorAll('.demo-tabs [role="tab"]')];
  tabKeys(tabs, (index, focus = false) => {
    const tab = tabs[index];
    const changed = tab.getAttribute('aria-selected') !== 'true';
    tabs.forEach((item, i) => {
      item.setAttribute('aria-selected', String(i === index));
      item.tabIndex = i === index ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = i !== index;
    });
    if (focus) tab.focus();
    if (changed) animateTab(tab, document.getElementById(tab.getAttribute('aria-controls')));
  });
}

function initProcess() {
  const shell = document.querySelector('.process-shell');
  if (!shell) return;
  const tabs = [...shell.querySelectorAll('[role="tab"]')];
  const panels = [...shell.querySelectorAll('[role="tabpanel"]')];
  const button = shell.querySelector('.process-replay');
  const position = shell.querySelector('.process-position');
  let current = 0;
  let timer;
  let playing = false;
  let resumable = false;
  button.hidden = false;
  const buttonLabel = () => {
    button.textContent = preference.matches ? 'Próxima etapa' : playing ? 'Pausar sequência' : resumable ? 'Continuar sequência' : current === 3 ? 'Rever sequência' : 'Ver sequência ▷';
    button.setAttribute('aria-pressed', String(playing));
  };
  function stop(resume = false) {
    clearTimeout(timer);
    playing = false;
    resumable = resume;
    buttonLabel();
  }
  function activate(index, focus = false) {
    const changed = current !== index;
    current = index;
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    position.textContent = `Etapa ${index + 1} de 4`;
    shell.dataset.processStep = index;
    if (focus) tabs[index].focus();
    if (changed) {
      play(panels[index].querySelector('.process-copy'), { opacity: [.3, 1], transform: ['translateY(8px)', 'translateY(0px)'] }, { duration: .35 });
      const example = panels[index].querySelector('.process-example');
      play(example, { opacity: [0, 1], transform: ['translateY(15px) scale(.97)', 'translateY(0px) scale(1)'] }, { duration: .5 });
      if (index === 1) example.querySelectorAll('.example-row').forEach((row, i) => play(row, { opacity: [0, 1], transform: ['translateX(20px)', 'translateX(0px)'] }, { duration: .4, delay: i * .1 }));
    }
  }
  function advance() {
    timer = setTimeout(() => {
      if (current === 3) { stop(); return; }
      activate(current + 1);
      advance();
    }, 1900);
  }
  tabKeys(tabs, (index, focus) => { stop(); activate(index, focus); buttonLabel(); });
  button.addEventListener('click', () => {
    if (preference.matches) { activate((current + 1) % tabs.length); return; }
    if (playing) { stop(true); return; }
    if (!resumable || current === 3) activate(0);
    resumable = false;
    playing = true;
    buttonLabel();
    advance();
  });
  preference.addEventListener('change', () => stop());
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) stop(true); });
  window.addEventListener('scroll', () => {
    if (!playing) return;
    const rect = shell.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top >= innerHeight) stop(true);
  }, { passive: true });
  buttonLabel();
}

export function initExperience() { initDemo(); initProcess(); }
