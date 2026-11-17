export default function HomePage() {
  return (<>

  
  <header className="site-header">
    <div className="container header-inner">
      <a className="wordmark" href="#inicio" aria-label="Nexo, início">Ne<span className="brand-x">x</span>o<span className="brand-dot">.</span></a>
      <button className="menu-toggle" aria-expanded="false" aria-controls="main-nav"><span>Menu</span><span className="menu-icon" aria-hidden="true"></span></button>
      <nav id="main-nav" aria-label="Navegação principal">
        <a href="#como-funciona">Como funciona</a><a href="#entrega">O que você recebe</a><a href="#diferenciais">Diferenciais</a><a href="#para-quem">Para quem</a><a href="#faq">FAQ</a><a href="/relato" className="nav-demo">Demonstração</a><a href="/painel">Painel</a>
      </nav>
    </div>
  </header>
  <main id="conteudo" tabIndex="-1">
    <section id="inicio" className="hero" aria-labelledby="hero-title">
      <div className="container hero-grid">
        <div className="hero-copy">
          <p className="eyebrow"><span className="mini-x" aria-hidden="true">×</span> Triagem jurídica assistida por IA</p>
          <h1 id="hero-title">Do primeiro relato à <em className="serif-emphasis">triagem organizada.</em></h1>
          <p className="hero-description">A Nexo organiza o que a pessoa conta, reúne os pontos relevantes e identifica o que falta esclarecer. Sua equipe recebe uma pré-análise para revisar e decidir como seguir com o atendimento.</p>
          <div className="button-group"><a className="button primary interactive-cta" href="/relato"><span className="cta-fill" aria-hidden="true"></span><span className="cta-label">Experimentar a demonstração</span><span className="cta-spark" aria-hidden="true">×</span></a><a className="button secondary" href="#como-funciona">Veja como funciona</a></div><p className="landing-demo-note">Ambiente restrito a testadores autorizados · somente casos fictícios.</p>
        </div>
        <div className="flow-visual" role="group" aria-label="Fluxo: Relato, Organização, Pré-análise e Revisão humana">
          <div className="visual-heading"><span>DA HISTÓRIA À CLAREZA</span><span className="visual-symbol" aria-hidden="true">×</span></div>
          <div className="flow-caption" aria-hidden="true">
            <span>Primeiro, a sua história.</span>
            <span>Cada informação encontra seu lugar.</span>
            <span>Os próximos pontos ficam claros.</span>
            <span>Agora, o olhar humano.</span>
          </div>
          <div className="flow-canvas">
            <div className="flow-story flow-scene">
              <div className="story-paper">
                <div className="story-topline"><span className="flow-label">O ponto de partida</span><span className="story-quote" aria-hidden="true">“</span></div>
                <blockquote>“Não sei por onde começar.”</blockquote>
                <div className="story-voice" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
              </div>
              <div className="story-fragments" aria-hidden="true"><span>Um relato</span><span>Datas soltas</span><span>Dúvidas</span></div>
            </div>
            <div className="flow-record flow-scene">
              <p className="flow-label">Informações que ganham forma</p>
              <div className="flow-sheets">
                <dl className="flow-details">
                  <div><dt><span aria-hidden="true">01</span> Contexto</dt><dd>Fatos e relato</dd></div>
                  <div><dt><span aria-hidden="true">02</span> Referências</dt><dd>Datas e documentos</dd></div>
                  <div><dt><span aria-hidden="true">03</span> Pendências</dt><dd>Pontos a esclarecer</dd></div>
                </dl>
                <div className="flow-scan" aria-hidden="true"><span>PRÉ-ANÁLISE</span></div>
              </div>
              <p className="analysis-note"><span aria-hidden="true">↳</span> Dúvidas identificadas para revisão</p>
            </div>
            <div className="review-handoff flow-scene">
              <div className="handoff-document" aria-hidden="true"><span>RELATO ORGANIZADO</span><span className="handoff-symbol">×</span><i></i><i></i><i></i></div>
              <div className="handoff-connector" aria-hidden="true"><span></span></div>
              <div className="review-person">
                <span className="review-avatar" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="12" cy="8" r="3.3"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg><span className="review-check"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="m3 8 3 3 7-7"/></svg></span></span>
                <strong>Preparado para revisão</strong><span>O próximo passo é humano.</span>
              </div>
            </div>
          </div>
          <ol className="hero-flow">
            <li><span className="stage-progress" aria-hidden="true"></span><span className="flow-node" aria-hidden="true">01</span><strong>Relato</strong></li>
            <li><span className="stage-progress" aria-hidden="true"></span><span className="flow-node" aria-hidden="true">02</span><strong>Organização</strong></li>
            <li><span className="stage-progress" aria-hidden="true"></span><span className="flow-node" aria-hidden="true">03</span><strong>Pré-análise</strong></li>
            <li><span className="stage-progress" aria-hidden="true"></span><span className="flow-node" aria-hidden="true">04</span><strong>Revisão humana</strong></li>
          </ol>
          <div className="visual-footer"><p className="visual-footnote">Tecnologia conecta. Pessoas decidem.</p><button className="flow-toggle" type="button" aria-label="Pausar animação do fluxo" aria-pressed="false" hidden>Pausar</button></div>
        </div>
      </div>
      <div className="container hero-baseline"><span>Triagem jurídica assistida por IA</span><span>Histórias no centro. Revisão humana no processo.</span></div>
    </section>
    <section id="como-funciona" className="section narrative-section" aria-labelledby="how-title">
      <div className="container">
        <p className="eyebrow"><span className="section-index">01</span> Como funciona</p>
        <div className="section-head"><h2 id="how-title">A pessoa conta.<br />A Nexo organiza.<br />Sua equipe avalia.</h2><p className="section-intro">Do primeiro contato à revisão profissional, cada etapa tem uma função clara.</p></div>
        <ol className="steps-grid">
          <li><span className="step-number">01</span><span className="step-owner">QUEM BUSCA ATENDIMENTO</span><h3>Relata o problema</h3><p>A pessoa explica o que aconteceu em uma entrevista guiada, com linguagem simples, sem precisar conhecer termos jurídicos.</p></li>
          <li><span className="step-number">02</span><span className="step-owner">A NEXO</span><h3>Organiza o caso</h3><p>A IA estrutura os fatos, as datas e os documentos mencionados. Também registra dúvidas e informações que ainda precisam ser confirmadas.</p></li>
          <li><span className="step-number">03</span><span className="step-owner">OS CRITÉRIOS DA ORGANIZAÇÃO</span><h3>Orienta a triagem</h3><p>Na demonstração, o recorte é consumidor: cobrança contestada, cancelamento e problemas com produtos ou serviços.</p></li>
          <li><span className="step-number">04</span><span className="step-owner">SUA EQUIPE</span><h3>Revisa e decide</h3><p>Uma pessoa qualificada revisa a pré-análise e define se é preciso pedir informações, seguir com o atendimento ou avaliar um encaminhamento.</p></li>
        </ol>
        <p className="section-footnote">O resultado é uma base organizada para análise. A decisão sobre o atendimento continua com a equipe.</p>
      </div>
    </section>
    <section id="entrega" className="section narrative-section output-section" aria-labelledby="output-title">
      <div className="container">
        <p className="eyebrow"><span className="section-index">02</span> O que sua equipe recebe</p>
        <div className="section-head"><h2 id="output-title">Um caso organizado.<br />Pronto para revisar.</h2><p className="section-intro">Veja como um relato se transforma em uma ficha com os pontos que a equipe precisa avaliar.</p></div>
        <div className="example-layout">
          <article className="input-story"><span className="step-owner">O RELATO RECEBIDO</span><blockquote>“Cancelei um serviço fictício no dia 3 de outubro, mas recebi outra cobrança de R$ 89 no dia 20. Tenho o e-mail de confirmação e ainda não consegui resolver.”</blockquote><p>Exemplo fictício · Consumidor · Ficha ilustrativa</p></article>
          <article className="output-sheet"><div className="sheet-heading"><span>PRÉ-ANÁLISE DO RELATO</span><span className="sheet-mark" aria-hidden="true">×</span></div><h3>Cobrança após cancelamento</h3><dl>
            <div><dt>Resumo do caso</dt><dd>A pessoa relata uma cobrança de R$ 89 após cancelar um serviço fictício.</dd></div>
            <div><dt>Fatos e datas</dt><dd>Cancelamento relatado em 3 de outubro; cobrança em 20 de outubro. Ano não informado.</dd></div>
            <div><dt>Documentos mencionados</dt><dd>E-mail de confirmação mencionado. Nenhum documento foi recebido ou analisado.</dd></div>
            <div><dt>Perguntas pendentes</dt><dd>De que ano são essas datas? A cobrança foi paga? Como a pessoa tentou resolver?</dd></div>
          </dl><div className="sheet-status">Aguardando revisão humana</div></article>
        </div>
        <p className="section-footnote">A ficha explicita o que foi relatado e o que falta confirmar. Ela não conclui sobre direitos, valores ou a aceitação do caso.</p>
      </div>
    </section>
    <section id="diferenciais" className="section narrative-section" aria-labelledby="dif-title">
      <div className="container">
        <p className="eyebrow"><span className="section-index">03</span> Diferenciais</p>
        <div className="section-head"><h2 id="dif-title">Feita para o trabalho<br />de triagem jurídica.</h2><p className="section-intro">Um fluxo que ajuda quem relata a explicar o problema e quem atende a compreender o caso.</p></div>
        <div className="benefits-grid">
          <article><span>01 / ACOLHIMENTO</span><h3>Linguagem acessível</h3><p>A entrevista parte do que aconteceu. A pessoa não precisa saber a área do Direito ou formular uma pergunta técnica.</p></article>
          <article><span>02 / CONSISTÊNCIA</span><h3>Informações padronizadas</h3><p>Fatos, documentos e pendências ficam em uma estrutura comum, facilitando a leitura e a revisão pela equipe.</p></article>
          <article><span>03 / CONTEXTO</span><h3>Critérios da sua organização</h3><p>A triagem considera o escopo de atuação e o perfil atendido, para apoiar uma avaliação compatível com a operação.</p></article>
          <article><span>04 / RESPONSABILIDADE</span><h3>Revisão humana no fluxo</h3><p>Dúvidas e incertezas ficam registradas. A equipe mantém a responsabilidade pela avaliação e pelo próximo passo.</p></article>
        </div>
      </div>
    </section>
    <section id="para-quem" className="section audience" aria-labelledby="audience-title">
      <div className="container audience-grid">
        <div className="audience-heading"><p className="eyebrow"><span className="section-index">04</span> Para quem</p><h2 id="audience-title">Para equipes que recebem demandas jurídicas.</h2><p className="section-intro">Da triagem em escritórios ao atendimento social, a proposta é preparar as informações para quem vai analisar o caso.</p></div>
        <div className="audience-list">
          <article><span className="audience-number" aria-hidden="true">01</span><div><h3>Escritórios de advocacia</h3><p>Apoiar a triagem inicial com relatos estruturados e pendências identificadas, conforme as áreas e os critérios do escritório.</p></div></article>
          <article><span className="audience-number" aria-hidden="true">02</span><div><h3>Clínicas e núcleos jurídicos</h3><p>Preparar informações para a análise supervisionada de equipes e estudantes, inclusive em universidades com atendimento jurídico.</p></div></article>
          <article><span className="audience-number" aria-hidden="true">03</span><div><h3>ONGs e organizações sociais</h3><p>Organizar demandas recebidas e possíveis encaminhamentos, respeitando o escopo e a capacidade de atendimento da organização.</p></div></article>
          <article><span className="audience-number" aria-hidden="true">04</span><div><h3>Projetos e profissionais pro bono</h3><p>Reduzir o trabalho inicial de organização dos relatos para preparar uma revisão compatível com o tempo e as áreas disponíveis.</p></div></article>
        </div>
      </div>
    </section>
    <section id="contato" className="section narrative-section contact-section" aria-labelledby="contact-title">
      <div className="container contact-layout"><div><p className="eyebrow"><span className="section-index">05</span> Contato</p><h2 id="contact-title">Como a Nexo pode apoiar a sua equipe?</h2><p className="contact-description">Queremos entender como sua organização recebe demandas e onde a triagem precisa melhorar.</p></div><div className="contact-note"><span className="step-owner">PRODUTO EM DESENVOLVIMENTO</span><h3>Estamos construindo a Nexo.</h3><p>Você pode conhecer o fluxo na demonstração restrita a testadores autorizados. Não há atendimento jurídico real. O canal para conversar com a equipe será disponibilizado aqui.</p><span className="contact-status">Contato em breve</span></div></div>
    </section>
    <section id="faq" className="section narrative-section faq-section" aria-labelledby="faq-title">
      <div className="container faq-layout"><div><p className="eyebrow"><span className="section-index">06</span> Perguntas frequentes</p><h2 id="faq-title">Antes de começar.</h2><p className="section-intro">Entenda o papel da Nexo e os limites da triagem assistida por IA.</p></div><div className="faq-list">
        <details><summary>A Nexo substitui um advogado?</summary><p>Não. A Nexo apoia a coleta e a organização das informações. A avaliação jurídica e as decisões sobre o caso exigem revisão de uma pessoa qualificada.</p></details>
        <details><summary>A IA decide quem será atendido?</summary><p>Não. Os critérios da organização orientam a triagem, mas cabe à equipe revisar as informações e definir o atendimento ou um possível encaminhamento.</p></details>
        <details><summary>Quais critérios orientam a triagem?</summary><p>A demonstração usa critérios versionados de consumidor: cobrança contestada, cancelamento e problemas com produtos ou serviços. Não aplica critérios de renda ou localização.</p></details>
        <details><summary>A pessoa precisa ter todos os documentos?</summary><p>O relato é o ponto de partida. A pré-análise registra os documentos mencionados e as informações pendentes para que a equipe possa pedir o que falta.</p></details>
        <details><summary>A Nexo também serve para atendimento pro bono?</summary><p>Sim, essa é uma aplicação prevista. O fluxo pode apoiar projetos e organizações que oferecem atendimento gratuito. A aceitação de cada demanda depende dos critérios e da disponibilidade da equipe.</p></details>
        <details id="responsabilidade"><summary>Como os dados pessoais serão tratados?</summary><p>Esta demonstração aceita somente dados fictícios. Não informe CPF, dados bancários, endereço completo nem relatos reais. O acesso é restrito; os registros de teste são salvos para revisão e podem ser excluídos pelo administrador.</p></details>
        <details><summary>A plataforma já está disponível?</summary><p>A Nexo está em desenvolvimento. A demonstração permite a testadores autorizados salvar casos fictícios e revisar registros. A IA só funciona quando estiver configurada e habilitada; sua indisponibilidade aparece no próprio fluxo. Não há atendimento jurídico real.</p></details>
      </div></div>
    </section>
  </main>
  <footer id="rodape" className="site-footer">
    <div className="container">
      <div className="footer-top"><a className="wordmark" href="#inicio" aria-label="Nexo, voltar ao início">Ne<span className="brand-x">x</span>o<span className="brand-dot">.</span></a><nav aria-label="Navegação do rodapé"><a href="#como-funciona">Como funciona</a><a href="#entrega">O que você recebe</a><a href="#diferenciais">Diferenciais</a><a href="#para-quem">Para quem</a><a href="#contato">Contato</a><a href="#faq">FAQ</a></nav></div>
      <div className="footer-bottom"><p>Produto em desenvolvimento.</p><p>A Nexo não substitui avaliação jurídica profissional.</p></div>
    </div>
  </footer>

<script type="module" src="/site/app.js" />
</>);
}
