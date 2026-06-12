import { StrictMode } from 'react';
import { hydrateRoot, createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { AuthProvider } from './lib/auth';
import { ToastProvider } from './components/Toast';
import './styles/index.css';

const basename = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || '/';

const root = document.getElementById('root')!;
const tree = (
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter basename={basename}>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>
);

// If the markup was pre-rendered (root has child nodes), hydrate; otherwise
// mount fresh (dev mode without prerender).
if (root.hasChildNodes()) {
  hydrateRoot(root, tree);
} else {
  createRoot(root).render(tree);
}
