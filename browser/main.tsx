import { Component, lazy, Suspense, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import '../app/globals.css';

const Landing = lazy(() => import('../app/page'));
const Interview = lazy(() => import('../app/relato/page'));
const Panel = lazy(() => import('../app/painel/page'));
const Settings = lazy(() => import('../app/painel/configuracoes/page'));
const Case = lazy(() => import('../app/painel/casos/[id]/page'));
const path = window.location.pathname.replace(/\/$/, '') || '/';
const caseMatch = /^\/painel\/casos\/([a-zA-Z0-9_-]{1,100})$/.exec(path);
const params = Promise.resolve({ id: caseMatch?.[1] || '' });
const titles: Record<string, string> = { '/': 'Nexo | Apoio ao primeiro atendimento de consumo', '/relato': 'Relato fictício | Nexo', '/painel': 'Painel da demonstração | Nexo', '/painel/configuracoes': 'Configurações deste navegador | Nexo' };
document.title = titles[path] || (caseMatch ? 'Revisão simulada | Nexo' : 'Página não encontrada | Nexo');
if (path !== '/') {
  const robots = document.createElement('meta'); robots.name = 'robots'; robots.content = 'noindex, nofollow'; document.head.appendChild(robots);
}

class BrowserBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <main id="conteudo" className="nx-main nx-width"><h1>Não foi possível abrir a demonstração.</h1><p>Recarregue a página. Os dados já salvos neste navegador serão mantidos.</p><button className="nx-button nx-primary" onClick={() => window.location.reload()}>Tentar novamente</button></main> : this.props.children; }
}

function App() {
  if (path === '/') return <Landing />;
  if (path === '/relato') return <Interview />;
  if (path === '/painel') return <Panel />;
  if (path === '/painel/configuracoes') return <Settings />;
  if (caseMatch) return <Case params={params} />;
  return <main id="conteudo" className="nx-main nx-width"><h1>Página não encontrada.</h1><a href="/">Voltar à Nexo</a></main>;
}

createRoot(document.getElementById('root')!).render(<BrowserBoundary><Suspense fallback={<main id="conteudo" className="nx-main nx-width"><p role="status">Abrindo a Nexo…</p></main>}><App /></Suspense></BrowserBoundary>);
