const routes = {};
let currentPage = null;
let authGuardCallback = null;

// Daftarkan halaman ke router
export function registerRoute(path, renderFunction) {
    routes[path] = renderFunction;
}

// Set auth guard — akan dicek sebelum navigasi
export function setAuthGuard(callback) {
    authGuardCallback = callback;
}

// Navigasi ke halaman tertentu
export function navigateTo(path) {
    window.location.hash = path;
}

// Render halaman berdasarkan hash
async function handleRoute() {
    const hash = window.location.hash.slice(1) || '/login';
    const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];

    // Auth guard: redirect ke login jika belum authenticated
    if (authGuardCallback && !publicRoutes.includes(hash)) {
        const isAuthenticated = await authGuardCallback();
        if (!isAuthenticated) {
            navigateTo('/login');
            return;
        }
    }

    // Jika sudah login tapi akses halaman auth, redirect ke dashboard
    if (authGuardCallback && publicRoutes.includes(hash)) {
        const isAuthenticated = await authGuardCallback();
        if (isAuthenticated && hash !== '/reset-password') {
            navigateTo('/dashboard');
            return;
        }
    }

    const renderFunction = routes[hash];
    const contentEl = document.getElementById('page-content');

    if (renderFunction && contentEl) {
        // Animasi transisi halaman
        contentEl.style.opacity = '0';
        contentEl.style.transform = 'translateY(8px)';

        setTimeout(async () => {
            await renderFunction(contentEl);
            currentPage = hash;

            contentEl.style.transition = 'opacity 250ms ease, transform 250ms ease';
            contentEl.style.opacity = '1';
            contentEl.style.transform = 'translateY(0)';

            // Update navbar active state
            updateNavbar(hash);
        }, 150);
    } else if (contentEl) {
        contentEl.innerHTML = `
      <div class="page" style="text-align: center; padding-top: 100px;">
        <h2>404</h2>
        <p>Halaman tidak ditemukan</p>
        <a href="#/dashboard">Kembali ke Dashboard</a>
      </div>
    `;
    }
}

// Update active state pada navbar
function updateNavbar(hash) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const route = item.getAttribute('data-route');
        if (route === hash) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Inisialisasi router
export function initRouter() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
}

export function getCurrentPage() {
    return currentPage;
}
