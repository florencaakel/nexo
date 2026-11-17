"use client";

import { useState } from "react";
import { DEMO_AUDIO, DEMO_STORY } from "@/lib/demo-example";

const steps = ["Relato", "Ficha", "Próximo passo", "Pessoa revisora"];

/** A demonstração só avança por escolha do visitante. */
export function LandingFlow() {
  const [step, setStep] = useState(0);
  return <section className="story-demo" aria-label="Exemplo do relato à revisão">
    <div className="story-demo-top"><span>Um caso de cancelamento</span><span>Exemplo fictício</span></div>
    <div className="story-demo-body" id="flow-example" aria-live="polite">
      {step === 0 && <div className="story-demo-scene"><h2>“Cancelei. A cobrança continuou.”</h2><p>Uma pessoa conta a situação com as próprias palavras.</p><audio controls preload="none" src={DEMO_AUDIO} aria-label="Ouvir relato fictício com voz sintetizada" /><p className="demo-audio-caption">Voz sintetizada para esta demonstração.</p><details><summary>Ler a transcrição</summary><p>{DEMO_STORY}</p></details></div>}
      {step === 1 && <div className="story-demo-scene"><h2>O relato vira uma ficha.</h2><dl className="demo-facts"><div><dt>O que aconteceu</dt><dd>Cobrança após pedido de cancelamento.</dd></div><div><dt>Datas relatadas</dt><dd>Cancelamento em 03/10; cobrança em 20/10/2026.</dd></div><div><dt>Registro mencionado</dt><dd>E-mail de confirmação, ainda não conferido.</dd></div><div><dt>O que a pessoa quer</dt><dd>Cancelar a cobrança.</dd></div></dl></div>}
      {step === 2 && <div className="story-demo-scene"><h2>Pode seguir para avaliação jurídica.</h2><p>Na simulação, a pessoa escolheu “cancelamento”, “quero uma avaliação” e não indicou urgência ou tema sensível.</p><div className="demo-next-step"><strong>Indicação de encaminhamento</strong><p>O assunto está no recorte de consumo da demonstração. Um profissional ainda precisa avaliar o relato e os registros.</p></div><p className="demo-audio-caption">Isso não confirma um direito nem a viabilidade de uma ação.</p></div>}
      {step === 3 && <div className="story-demo-scene"><h2>A conversa continua com uma pessoa.</h2><p>Quem atende lê o original, confere a ficha e esclarece o que falta. A avaliação e a decisão sobre o atendimento são humanas.</p><ul className="demo-review-list"><li>Confirmar o pedido de cancelamento.</li><li>Conferir a cobrança e o e-mail mencionados.</li><li>Ouvir a pessoa antes de definir como seguir.</li></ul><a className="text-link" href="/relato?exemplo=cancelamento">Experimentar este caso no aplicativo</a></div>}
    </div>
    <div className="story-demo-controls" role="group" aria-label="Escolher etapa do exemplo">{steps.map((name, index) => <button key={name} type="button" aria-pressed={step === index} aria-controls="flow-example" onClick={() => setStep(index)}><span>{index + 1}</span>{name}</button>)}</div>
    <div className="story-demo-bottom"><span>Avance no seu ritmo.</span><button type="button" onClick={() => setStep((step + 1) % steps.length)}>{step === 3 ? "Voltar ao relato" : "Próxima etapa"}</button></div>
  </section>;
}
