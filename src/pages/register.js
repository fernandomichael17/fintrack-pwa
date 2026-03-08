import { register } from '../services/auth.service.js';
import { navigateTo } from '../router.js';
import { showToast } from '../components/toast.js';

export function renderRegister(container) {
    container.innerHTML = `
    <div class="auth-page">
      <div class="auth-header">
        <div class="auth-logo">💰</div>
        <h1>Buat Akun</h1>
        <p>Mulai kelola keuangan Anda</p>
      </div>

      <form class="auth-form" id="register-form">
        <div class="input-group">
          <label for="reg-name">Nama</label>
          <input 
            type="text" 
            id="reg-name" 
            class="input-field" 
            placeholder="Nama lengkap"
            required
            autocomplete="name"
          />
        </div>

        <div class="input-group">
          <label for="reg-email">Email</label>
          <input 
            type="email" 
            id="reg-email" 
            class="input-field" 
            placeholder="nama@email.com"
            required
            autocomplete="email"
          />
        </div>

        <div class="input-group">
          <label for="reg-password">Password</label>
          <div class="password-wrapper">
            <input 
              type="password" 
              id="reg-password" 
              class="input-field" 
              placeholder="Minimal 6 karakter"
              required
              minlength="6"
              autocomplete="new-password"
            />
            <button type="button" class="password-toggle" id="toggle-reg-password">👁</button>
          </div>
        </div>

        <div class="input-group">
          <label for="reg-confirm">Konfirmasi Password</label>
          <div class="password-wrapper">
            <input 
              type="password" 
              id="reg-confirm" 
              class="input-field" 
              placeholder="Ulangi password"
              required
              minlength="6"
              autocomplete="new-password"
            />
          </div>
        </div>

        <button type="submit" class="btn btn-primary auth-submit" id="register-btn">
          Daftar
        </button>
      </form>

      <div class="auth-footer">
        Sudah punya akun? <a href="#/login">Masuk</a>
      </div>
    </div>
  `;

    // Toggle password visibility
    const toggleBtn = document.getElementById('toggle-reg-password');
    const passwordInput = document.getElementById('reg-password');

    toggleBtn.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        toggleBtn.textContent = isPassword ? '🙈' : '👁';
    });

    // Handle form submit
    const form = document.getElementById('register-form');
    const registerBtn = document.getElementById('register-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const confirm = document.getElementById('reg-confirm').value;

        // Validasi
        if (!name || !email || !password || !confirm) {
            showToast('Mohon isi semua field', 'error');
            return;
        }

        if (password.length < 6) {
            showToast('Password minimal 6 karakter', 'error');
            return;
        }

        if (password !== confirm) {
            showToast('Password tidak cocok', 'error');
            return;
        }

        registerBtn.disabled = true;
        registerBtn.innerHTML = '<div class="spinner"></div>';

        try {
            await register(email, password, name);

            // Tampilkan pesan sukses
            container.innerHTML = `
        <div class="auth-page">
          <div class="auth-success">
            <div class="auth-success-icon">✉️</div>
            <h2>Cek Email Anda</h2>
            <p>Kami telah mengirimkan link verifikasi ke <strong>${email}</strong>. Klik link tersebut untuk mengaktifkan akun Anda.</p>
            <a href="#/login" class="btn btn-primary">Kembali ke Login</a>
          </div>
        </div>
      `;
        } catch (error) {
            console.error('Register error:', error);

            if (error.message.includes('already registered')) {
                showToast('Email sudah terdaftar', 'error');
            } else {
                showToast('Gagal mendaftar. Coba lagi.', 'error');
            }

            registerBtn.disabled = false;
            registerBtn.textContent = 'Daftar';
        }
    });
}
