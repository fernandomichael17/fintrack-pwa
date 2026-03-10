import { getCurrentUser, logout } from '../services/auth.service.js';
import { getProfile, updateProfile } from '../services/profile.service.js';
import { navigateTo } from '../router.js';
import { showToast } from '../components/toast.js';

export async function renderProfile(container) {
    container.innerHTML = `<div class="profile-page"><div style="display:flex;justify-content:center;padding-top:100px;"><div class="spinner"></div></div></div>`;

    try {
        const user = await getCurrentUser();
        const profile = user ? await getProfile(user.id) : null;
        const displayName = profile?.display_name || user?.user_metadata?.display_name || 'User';
        const email = user?.email || '';
        const initial = displayName.charAt(0).toUpperCase();

        container.innerHTML = `
      <div class="profile-page">
        <div class="profile-header">
          <div class="profile-avatar">${initial}</div>
          <div class="profile-name" id="display-name">${displayName}</div>
          <div class="profile-email">${email}</div>
        </div>

        <!-- Menu -->
        <div class="profile-menu">
          <div class="profile-menu-item" id="edit-name-btn">
            <div class="profile-menu-icon">✏️</div>
            <div class="profile-menu-text">
              <div class="profile-menu-label">Edit Nama</div>
              <div class="profile-menu-desc">Ubah nama tampilan Anda</div>
            </div>
            <span class="profile-menu-arrow">›</span>
          </div>

          <div class="profile-menu-item" id="manage-categories-btn">
            <div class="profile-menu-icon">📂</div>
            <div class="profile-menu-text">
              <div class="profile-menu-label">Kelola Kategori</div>
              <div class="profile-menu-desc">Tambah atau edit kategori</div>
            </div>
            <span class="profile-menu-arrow">›</span>
          </div>
        </div>

        <!-- Logout -->
        <div class="logout-section">
          <button class="btn-logout" id="logout-btn">Keluar dari Akun</button>
        </div>

        <div class="app-info">
          <p>FinTrack v1.0.0</p>
          <p style="margin-top: 4px;">Made with ❤️</p>
        </div>
      </div>
    `;

        // Edit Name
        document.getElementById('edit-name-btn')?.addEventListener('click', () => {
            showEditName(container, user.id, displayName);
        });

        // Categories
        document.getElementById('manage-categories-btn')?.addEventListener('click', () => {
            navigateTo('/categories');
        });

        // Logout
        document.getElementById('logout-btn')?.addEventListener('click', async () => {
            showLogoutConfirm(container);
        });

    } catch (error) {
        console.error('Profile error:', error);
        container.innerHTML = `<div class="profile-page"><div class="empty-state"><div class="empty-state-icon">😵</div><p>Gagal memuat profil</p></div></div>`;
    }
}

function showEditName(container, userId, currentName) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Edit Nama</h3>
        <button class="modal-close" id="close-edit">✕</button>
      </div>
      <div class="input-group" style="margin-bottom: var(--space-lg);">
        <label for="edit-display-name">Nama Tampilan</label>
        <input type="text" id="edit-display-name" class="input-field" value="${currentName}" />
      </div>
      <button class="btn btn-primary" id="save-name-btn">Simpan</button>
    </div>
  `;

    overlay.querySelector('#close-edit')?.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector('#save-name-btn')?.addEventListener('click', async () => {
        const newName = overlay.querySelector('#edit-display-name')?.value?.trim();
        if (!newName) {
            showToast('Nama tidak boleh kosong', 'error');
            return;
        }

        try {
            await updateProfile(userId, { display_name: newName });
            showToast('Nama berhasil diubah', 'success');
            overlay.remove();
            await renderProfile(container);
        } catch (error) {
            showToast('Gagal mengubah nama', 'error');
        }
    });

    document.body.appendChild(overlay);
}

function showLogoutConfirm(container) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
    <div class="modal-content" style="text-align: center;">
      <div style="font-size: 48px; margin-bottom: var(--space-md);">👋</div>
      <h3 style="margin-bottom: var(--space-sm);">Keluar dari Akun?</h3>
      <p style="font-size: var(--font-sm); color: var(--text-secondary); margin-bottom: var(--space-lg);">Data lokal akan dihapus. Data tetap aman di cloud.</p>
      <div style="display: flex; gap: var(--space-sm);">
        <button class="btn btn-secondary" style="flex:1;" id="cancel-logout">Batal</button>
        <button class="btn btn-primary" style="flex:1; background: var(--color-expense);" id="confirm-logout">Keluar</button>
      </div>
    </div>
  `;

    overlay.querySelector('#cancel-logout')?.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector('#confirm-logout')?.addEventListener('click', async () => {
        try {
            await logout();
            overlay.remove();
            navigateTo('/login');
            showToast('Berhasil keluar', 'success');
        } catch (error) {
            showToast('Gagal keluar dari akun', 'error');
        }
    });

    document.body.appendChild(overlay);
}
