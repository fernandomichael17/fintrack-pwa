import { forgotPassword } from '../services/auth.service.js';
import { showToast } from '../components/toast.js';

export function renderForgotPassword(container) {
    container.innerHTML = `
    <div class="auth-page">
      <div class="auth-header">
        <div class="auth-logo">🔑</div>
        <h1>Lupa Password</h1>
        <p>Masukkan email Anda untuk reset password</p>
      </div>

      <form class="auth-form" id="forgot-form">
        <div class="input-group">
          <label for="forgot-email">Email</label>
          <input 
            type="email" 
            id="forgot-email" 
            class="input-field" 
            placeholder="nama@email.com"
            required
            autocomplete="email"
          />
        </div>

        <button type="submit" class="btn btn-primary auth-submit" id="forgot-btn">
          Kirim Link Reset
        </button>
      </form>

      <div class="auth-footer">
        <a href="#/login">← Kembali ke Login</a>
      </div>
    </div>
  `;

    const form = document.getElementById('forgot-form');
    const forgotBtn = document.getElementById('forgot-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('forgot-email').value.trim();

        if (!email) {
            showToast('Mohon masukkan email', 'error');
            return;
        }

        forgotBtn.disabled = true;
        forgotBtn.innerHTML = '<div class="spinner"></div>';

        try {
            await forgotPassword(email);

            container.innerHTML = `
        <div class="auth-page">
          <div class="auth-success">
            <div class="auth-success-icon">📧</div>
            <h2>Email Terkirim</h2>
            <p>Link reset password telah dikirim ke <strong>${email}</strong>. Cek inbox atau folder spam Anda.</p>
            <a href="#/login" class="btn btn-primary">Kembali ke Login</a>
          </div>
        </div>
      `;
        } catch (error) {
            console.error('Forgot password error:', error);
            showToast('Gagal mengirim email. Coba lagi.', 'error');
            forgotBtn.disabled = false;
            forgotBtn.textContent = 'Kirim Link Reset';
        }
    });
}
