import { navigateTo } from './router.js';

// Halaman yang tidak menampilkan navbar
const noNavbarPages = ['/login', '/register', '/forgot-password', '/reset-password'];

export function renderAppShell() {
    const app = document.getElementById('app');

    app.innerHTML = `
    <div id="page-content"></div>
    <nav id="navbar" class="navbar">
      <div class="nav-item" data-route="/dashboard" id="nav-dashboard">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span>Home</span>
      </div>
      <div class="nav-item" data-route="/accounts" id="nav-accounts">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2"/>
          <line x1="2" y1="10" x2="22" y2="10"/>
        </svg>
        <span>Akun</span>
      </div>
      <div class="nav-item nav-add" data-route="/add-transaction" id="nav-add">
        <div class="nav-add-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </div>
      </div>
      <div class="nav-item" data-route="/transactions" id="nav-transactions">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"/>
          <line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/>
          <line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
        <span>Riwayat</span>
      </div>
      <div class="nav-item" data-route="/profile" id="nav-profile">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span>Profil</span>
      </div>
    </nav>
  `;

    // Event listener untuk navbar
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const route = item.getAttribute('data-route');
            navigateTo(route);
        });
    });

    // Toggle navbar visibility based on current page
    updateNavbarVisibility();
    window.addEventListener('hashchange', updateNavbarVisibility);
}

function updateNavbarVisibility() {
    const hash = window.location.hash.slice(1) || '/login';
    const navbar = document.getElementById('navbar');

    if (navbar) {
        if (noNavbarPages.includes(hash)) {
            navbar.style.display = 'none';
        } else {
            navbar.style.display = 'flex';
        }
    }
}
