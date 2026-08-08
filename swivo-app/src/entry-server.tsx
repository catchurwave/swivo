import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { HelmetProvider, type HelmetServerState } from 'react-helmet-async';
import App from './App';
import { AuthProvider } from './lib/auth';
import { ToastProvider } from './components/Toast';
export { FORMES_SEED, POSTS_SEED } from './data/seeds';

export type RenderResult = {
  html: string;
  head: string;
};

export function render(url: string): RenderResult {
  const helmetCtx: { helmet?: HelmetServerState } = {};
  const basename = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || '/';
  const html = renderToString(
    <StrictMode>
      <HelmetProvider context={helmetCtx}>
        <StaticRouter location={url} basename={basename}>
          <ToastProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ToastProvider>
        </StaticRouter>
      </HelmetProvider>
    </StrictMode>,
  );

  const helmet = helmetCtx.helmet;
  const head = [
    helmet?.title.toString() ?? '',
    helmet?.meta.toString() ?? '',
    helmet?.link.toString() ?? '',
    helmet?.script.toString() ?? '',
  ].join('\n');

  return { html, head };
}
