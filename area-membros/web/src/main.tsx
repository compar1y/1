import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { MeProvider } from './state';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MeProvider>
      <App />
    </MeProvider>
  </StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
