// FinTrack PWA - Main Entry Point
import './styles/index.css';
import './styles/components.css';
import './styles/auth.css';
import './styles/dashboard.css';
import './styles/transactions.css';
import './styles/accounts.css';
import './styles/profile.css';
import './styles/categories.css';

import { renderAppShell } from './app.js';
import { registerRoute, setAuthGuard, initRouter } from './router.js';
import { isAuthenticated, onAuthChange } from './services/auth.service.js';
import { syncAll } from './db/sync.js';

// Import pages
import { renderLogin } from './pages/login.js';
import { renderRegister } from './pages/register.js';
import { renderForgotPassword } from './pages/forgot-password.js';
import { renderResetPassword } from './pages/reset-password.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderAddTransaction } from './pages/add-transaction.js';
import { renderAccounts } from './pages/accounts.js';
import { renderTransactions } from './pages/transactions.js';
import { renderProfile } from './pages/profile.js';
import { renderCategories } from './pages/categories.js';


// 1. Render app shell (navbar + content area)
renderAppShell();

// 2. Register routes
registerRoute('/login', renderLogin);
registerRoute('/register', renderRegister);

// Placeholder untuk halaman yang belum dibuat
const comingSoon = (container) => {
  container.innerHTML = `
    <div class="page" style="text-align: center; padding-top: 80px;">
      <div style="font-size: 48px; margin-bottom: 16px;">🚧</div>
      <h2>Coming Soon</h2>
      <p style="margin-top: 8px;">Halaman ini sedang dalam pengembangan</p>
    </div>
  `;
};

registerRoute('/dashboard', renderDashboard);
registerRoute('/accounts', renderAccounts)
registerRoute('/transactions', renderTransactions);
registerRoute('/add-transaction', renderAddTransaction);
registerRoute('/categories', renderCategories);
registerRoute('/profile', renderProfile);
registerRoute('/forgot-password', renderForgotPassword);
registerRoute('/reset-password', renderResetPassword);

// 3. Set auth guard
setAuthGuard(isAuthenticated);

// 4. Listen auth changes
onAuthChange(async (event, session) => {
  console.log('Auth event:', event);

  if (event === 'SIGNED_IN' && session) {
    // Sync data saat login
    await syncAll();
  }
});

// 5. Start router
initRouter();

console.log('🚀 FinTrack PWA initialized');
