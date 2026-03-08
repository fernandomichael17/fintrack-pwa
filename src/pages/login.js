import { login } from '../services/auth.service.js';
import { navigateTo } from '../router.js';
import { showToast } from '../components/toast.js';

export function renderLogin(container) {
    container.innerHTML = `
    <div class="auth-page">
      <div class="auth-header">
        <div class="auth-logo">💰</div>
        <h1>FinTrack</h1>
        <p>Masuk ke akun Anda</p>
      </div>

      <form class="auth-form" id="login-form">
        <div class="input-group">
          <label for="login-email">Email</label>
          <input 
            type="email" 
            id="login-email" 
            class="input-field" 
            placeholder="nama@email.com"
            required
            autocomplete="email"
          />
        </div>

        <div class="input-group">
          <label for="login-password">Password</label>
          <div class="password-wrapper">
            <input 
              type="password" 
              id="login-password" 
              class="input-field" 
              placeholder="Masukkan password"
              required
              autocomplete="current-password"
            />
            <button type="button" class="password-toggle" id="toggle-password">👁</button>
          </div>
        </div>

        <div class="auth-link">
          <a href="#/forgot-password">Lupa password?</a>
        </div>

        <button type="submit" class="btn btn-primary auth-submit" id="login-btn">
          Masuk
        </button>
      </form>

      <div class="auth-footer">
        Belum punya akun? <a href="#/register">Daftar</a>
      </div>
    </div>
  `;

    // Toggle password visibility
    const toggleBtn = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('login-password');

    toggleBtn.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        toggleBtn.textContent = isPassword ? '🙈' : '👁';
    });

    // Handle form submit
    const form = document.getElementById('login-form');
    const loginBtn = document.getElementById('login-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            showToast('Mohon isi semua field', 'error');
            return;
        }

        loginBtn.disabled = true;
        loginBtn.innerHTML = '<div class="spinner"></div>';

        try {
            await login(email, password);
            showToast('Login berhasil!', 'success');
            navigateTo('/dashboard');
        } catch (error) {
            console.error('Login error:', error);

            if (error.message.includes('Invalid login credentials')) {
                showToast('Email atau password salah', 'error');
            } else if (error.message.includes('Email not confirmed')) {
                showToast('Email belum diverifikasi. Cek inbox Anda.', 'error');
            } else {
                showToast('Gagal login. Coba lagi.', 'error');
            }

            loginBtn.disabled = false;
            loginBtn.textContent = 'Masuk';
        }
    });
}
