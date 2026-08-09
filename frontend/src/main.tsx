import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';
import './i18n';
import * as api from './api';

// expose a tiny helper for the admin dashboard to call the protected notify endpoint
(window as any).fetchAdminTestNotify = async (email: string | null) => {
  return api.adminTestNotify(email);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
