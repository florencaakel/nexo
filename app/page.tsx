import { BROWSER_DEMO } from "@/lib/runtime-mode";
import { LandingRuntime } from "@/components/nexo/landing-runtime";
import { LandingFlow } from "@/components/nexo/landing-flow";

export default function HomePage() {
  return <>
    {["styles", "sections", "narrative", "refinements"].map(name => <link key={name} rel="stylesheet" href={`/site/${name}.css`} />)}
    <header className="site-header">
      <div className="container header-inner">
        <a className="wordmark" href="#inicio" aria-label="Nexo, início">Ne<span className="brand-x">x</span>o<span className="brand-dot">.</span></a>
        <button className="menu-toggle" aria-expanded="false" aria-controls="main-nav"><span>Menu</span><span className="menu-icon" aria-hidden="true" /></button>
        <nav id="main-nav" aria-label="Navegação principal"><a href="#para-quem">Para quem</a><a href="#como-funciona">Como funciona</a><a href="#faq">Dúvidas</a><a href="/painel">Painel da demo</a><a href="/relato" className="nav-demo">Abrir aplicativo</a></nav>
      </div>
    </header>
    <main id="conteudo" tabIndex={-1}>
      <section id="inicio" className="hero nexo-hero" aria-labelledby="hero-title">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="hero-audience">Para escritórios que atendem demandas de consumo.</p>
            <h1 id="hero-title">Mais tempo para ouvir.<br />Menos tempo para organizar.</h1>
            <p className="hero-description">Cobranças, cancelamentos e problemas com produtos chegam em relatos soltos. O Nexo reúne as primeiras informações para o advogado começar a conversa com o caso em mãos.</p>
            <div className="button-group"><a className="button primary" href="/relato">Experimentar o aplicativo</a><a className="button secondary" href="#como-funciona">Ver como funciona</a></div>
            <p className="landing-demo-note">{BROWSER_DEMO ? "Demo sem login, apenas com situações fictícias." : "Demonstração com situações fictícias para testadores autorizados."}</p>
          </div>
          <LandingFlow />
        </div>
      </section>

      <section id="para-quem" className="section narrative-section nexo-audience" aria-labelledby="audience-title">
        <div className="container audience-grid">
          <div className="audience-heading"><h2 id="audience-title">A mesma pergunta.<br />De novo. E de novo.</h2><p className="section-intro">Quando muitas demandas parecidas chegam ao escritório, a equipe repete a coleta de datas, cobranças, tentativas e documentos antes de conseguir avaliar cada história.</p></div>
          <div className="audience-list">
            <article><div><h3>O recorte inicial: consumo repetitivo</h3><p>Escritórios que atuam pelo consumidor em cobranças contestadas, cancelamentos e problemas com produtos ou serviços. Esse é o público e o fluxo que esta demonstração explora.</p></div></article>
            <article><div><h3>O papel: apoio de secretaria e paralegal</h3><p>O Nexo prepara o material de entrada: recolhe o relato, organiza as informações e aponta o que precisa de uma conversa. A proposta é liberar tempo da equipe para ouvir e avaliar.</p></div></article>
            <article><div><h3>O limite: a relação continua humana</h3><p>Atendimentos de família, situações sensíveis e casos em que a escuta é central pedem contato humano desde o início. Eles não são o foco desta versão.</p></div></article>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="section narrative-section" aria-labelledby="how-title">
        <div className="container">
          <div className="section-head"><h2 id="how-title">Antes da conversa,<br />o caso começa a tomar forma.</h2><p className="section-intro">A pessoa pode falar ou escrever. O relato continua disponível, junto da ficha, para quem vai atendê-la.</p></div>
          <ol className="steps-grid">
            <li><span className="step-number">1</span><h3>Conte o que aconteceu</h3><p>Escreva ou use o ditado por voz em um navegador compatível. Confira o texto antes de salvar; não é preciso conhecer termos jurídicos.</p></li>
            <li><span className="step-number">2</span><h3>Complete o que souber</h3><p>Perguntas curtas ajudam a lembrar datas, tentativas e registros. “Não sei” também é uma resposta; a pessoa pode encerrar o roteiro.</p></li>
            <li><span className="step-number">3</span><h3>Veja o próximo passo</h3><p>Escolhas explícitas sobre o assunto e a necessidade de ajuda geram uma indicação de encaminhamento. Nenhuma regra decide se há direito ou se cabe uma ação.</p></li>
            <li><span className="step-number">4</span><h3>Uma pessoa confere</h3><p>Relato original, trechos e pendências ficam juntos. Quem revisa pode corrigir a ficha, pedir informações e registrar uma decisão de atendimento.</p></li>
          </ol>
          <div className="human-handoff"><h3>O primeiro atendimento não precisa começar do zero.</h3><p>A ferramenta prepara a conversa. O advogado ou a equipe de atendimento acolhe, esclarece e decide como seguir. Nesta demo, você experimenta os dois papéis; nenhum relato é enviado a um escritório.</p><a className="text-link" href="/relato?exemplo=cancelamento">Abrir o exemplo de cancelamento no aplicativo</a></div>
        </div>
      </section>

      <section id="faq" className="section narrative-section faq-section" aria-labelledby="faq-title">
        <div className="container faq-layout"><div><h2 id="faq-title">O que esperar do Nexo.</h2><p className="section-intro">Um apoio para o trabalho inicial, com limites visíveis para quem conta e para quem revisa.</p></div><div className="faq-list">
          <details open><summary>A pessoa deixa de conversar com um advogado?</summary><p>A proposta é que a conversa humana aconteça com as informações iniciais organizadas. O Nexo não oferece consulta nem substitui a escuta. A pessoa pode indicar que precisa de contato humano, e essa indicação acompanha o relato para revisão.</p></details>
          <details><summary>O Nexo diz se o caso pode ir para o jurídico?</summary><p>Ele sugere um próximo passo com base nas opções que a pessoa confirma: avaliação jurídica de consumo, conversa para esclarecer, outra especialidade ou informação inicial. Isso não é um parecer sobre o direito ou sobre a chance de ganhar uma ação. A decisão de atender é humana.</p></details>
          <details><summary>Como funciona a opção de voz?</summary><p>Em navegadores compatíveis, o ditado transforma a fala em texto para conferência. O fornecedor do navegador pode processar o áudio; por isso a opção pede ciência antes de começar. O Nexo salva apenas o texto confirmado. Digitar continua disponível.</p></details>
          <details><summary>Preciso contratar uma IA para testar?</summary><p>Não. A entrevista, a ficha e a indicação de encaminhamento usam regras do aplicativo, sem API de IA paga. O ditado opcional depende do recurso oferecido pelo navegador e pode precisar de conexão.</p></details>
          <details><summary>Onde ficam os relatos da demonstração?</summary><p>{BROWSER_DEMO ? "O texto e as decisões ficam apenas neste navegador e dispositivo. Não há conta, envio à equipe, sincronização ou cópia remota. Quem usa o mesmo perfil de navegador pode vê-los. Limpar os dados do site apaga os registros. Use somente situações fictícias." : "Esta é uma demonstração restrita a testadores autorizados e aceita apenas situações fictícias. Os registros são salvos para revisão. Não informe dados de pessoas reais."}</p></details>
          <details><summary>Preciso enviar documentos?</summary><p>Não. Você pode mencionar um e-mail ou comprovante, mas esta versão não recebe nem analisa documentos. A ficha diferencia o que foi relatado do que ainda precisa de conferência.</p></details>
        </div></div>
      </section>

      <section id="demonstracao" className="section contact-section nexo-closing" aria-labelledby="demo-title"><div className="container"><div><h2 id="demo-title">Estamos construindo o Nexo.</h2><p>Experimente um caso fictício do primeiro relato à revisão. O aplicativo está logo aqui.</p></div><a className="button primary" href="/relato">Abrir aplicativo</a></div></section>
    </main>
    <footer className="site-footer"><div className="container"><div className="footer-top"><a className="wordmark" href="#inicio" aria-label="Nexo, voltar ao início">Ne<span className="brand-x">x</span>o<span className="brand-dot">.</span></a><nav aria-label="Navegação do rodapé"><a href="#para-quem">Para quem</a><a href="#como-funciona">Como funciona</a><a href="/relato">Aplicativo</a><a href="/painel">Painel da demo</a></nav></div><div className="footer-bottom"><p>Demonstração em desenvolvimento.</p><p>Não oferece atendimento jurídico real.</p></div></div></footer>
    <LandingRuntime />
  </>;
}
