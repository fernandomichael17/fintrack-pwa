import { resetPassword } from '../services/auth.service.js';
import { navigateTo } from '../router.js';
import { showToast } from '../components/toast.js';

export function renderResetPassword(container) {
    container.innerHTML = `
    <div class="auth-page">
      <div class="auth-header">
        <div class="auth-logo">🔒</div>
        <h1>Reset Password</h1>
        <p>Masukkan password baru Anda</p>
      </div>

      <form class="auth-form" id="reset-form">
        <div class="input-group">
          <label for="reset-password">Password Baru</label>
          <div class="password-wrapper">
            <input 
              type="password" 
              id="reset-password" 
              class="input-field" 
              placeholder="Minimal 6 karakter"
              required
              minlength="6"
              autocomplete="new-password"
            />
            <button type="button" class="password-toggle" id="toggle-reset-password">👁</button>
          </div>
        </div>

        <div class="input-group">
          <label for="reset-confirm">Konfirmasi Password</label>
          <input 
            type="password" 
            id="reset-confirm" 
            class="input-field" 
            placeholder="Ulangi password baru"
            required
            minlength="6"
            autocomplete="new-password"
          />
        </div>

        <button type="submit" class="btn btn-primary auth-submit" id="reset-btn">
          Simpan Password Baru
        </button>
      </form>
    </div>
  `;

    // Toggle password visibility
    const toggleBtn = document.getElementById('toggle-reset-password');
    const passwordInput = document.getElementById('reset-password');

    toggleBtn.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        toggleBtn.textContent = isPassword ? '🙈' : '👁';
    });

    // Handle form submit
    const form = document.getElementById('reset-form');
    const resetBtn = document.getElementById('reset-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const password = document.getElementById('reset-password').value;
        const confirm = document.getElementById('reset-confirm').value;

        if (password.length < 6) {
            showToast('Password minimal 6 karakter', 'error');
            return;
        }

        if (password !== confirm) {
            showToast('Password tidak cocok', 'error');
            return;
        }

        resetBtn.disabled = true;
        resetBtn.innerHTML = '<div class="spinner"></div>';

        try {
            await resetPassword(password);
            showToast('Password berhasil diubah!', 'success');
            navigateTo('/login');
        } catch (error) {
            console.error('Reset password error:', error);
            showToast('Gagal mengubah password. Coba lagi.', 'error');
            resetBtn.disabled = false;
            resetBtn.textContent = 'Simpan Password Baru';
        }
    });
}
