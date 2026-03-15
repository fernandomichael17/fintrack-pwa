import { getCategories, addCategory, updateCategory, deleteCategory } from '../services/category.service.js';
import { showToast } from '../components/toast.js';
import { navigateTo } from '../router.js';
import { escapeHtml } from '../utils/sanitize.js';

let activeTab = 'expense';

const incomeEmojis = ['💼', '💻', '🎁', '💰', '📈', '🏠', '🎓', '🏦', '💵', '📌', '⭐', '🎯'];
const expenseEmojis = ['🍽️', '🛒', '🚗', '📄', '🎮', '🏥', '📚', '👕', '✈️', '📱', '☕', '📌'];

export async function renderCategories(container) {
    container.innerHTML = `<div class="categories-page"><div style="display:flex;justify-content:center;padding-top:100px;"><div class="spinner"></div></div></div>`;

    try {
        await renderContent(container);
    } catch (error) {
        console.error('Categories error:', error);
        container.innerHTML = `<div class="categories-page"><div class="empty-state"><div class="empty-state-icon">😵</div><p>Gagal memuat kategori</p></div></div>`;
    }
}

async function renderContent(container) {
    const categories = await getCategories(activeTab);

    container.innerHTML = `
    <div class="categories-page">
      <div class="categories-page-header">
        <button class="back-btn" id="back-btn">← Kembali</button>
        <h2>Kategori</h2>
        <button class="btn btn-secondary" id="add-category-btn">+ Tambah</button>
      </div>

      <!-- Tabs -->
      <div class="category-tabs">
        <button class="category-tab ${activeTab === 'income' ? 'active' : ''}" data-tab="income">Pemasukan</button>
        <button class="category-tab ${activeTab === 'expense' ? 'active' : ''}" data-tab="expense">Pengeluaran</button>
      </div>

      <!-- Category List -->
      ${categories.length > 0 ? `
        <div class="category-list">
          ${categories.map(cat => `
            <div class="category-list-item">
              <div class="category-list-icon">${cat.icon || '📌'}</div>
              <div class="category-list-name">${escapeHtml(cat.name)}</div>
              ${cat.is_default ? '<span class="category-list-badge">Default</span>' : ''}
              ${!cat.is_default ? `
                <div class="category-list-actions">
                  <button class="account-action-btn edit-cat" data-id="${cat.id}" title="Edit">✎</button>
                  <button class="account-action-btn delete delete-cat" data-id="${cat.id}" title="Hapus">✕</button>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="empty-state">
          <div class="empty-state-icon">📂</div>
          <p>Belum ada kategori ${activeTab === 'income' ? 'pemasukan' : 'pengeluaran'}</p>
        </div>
      `}
    </div>
  `;

    // Back button
    document.getElementById('back-btn')?.addEventListener('click', () => navigateTo('/profile'));

    // Tabs
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            activeTab = tab.dataset.tab;
            renderContent(container);
        });
    });

    // Add button
    document.getElementById('add-category-btn')?.addEventListener('click', () => {
        showCategoryModal(container, null);
    });

    // Edit buttons
    document.querySelectorAll('.edit-cat').forEach(btn => {
        btn.addEventListener('click', () => {
            const cat = categories.find(c => c.id === btn.dataset.id);
            if (cat) showCategoryModal(container, cat);
        });
    });

    // Delete buttons
    document.querySelectorAll('.delete-cat').forEach(btn => {
        btn.addEventListener('click', () => showDeleteConfirm(container, btn.dataset.id));
    });
}

function showCategoryModal(container, editCategory = null) {
    const isEdit = !!editCategory;
    const emojis = activeTab === 'income' ? incomeEmojis : expenseEmojis;
    let selectedIcon = editCategory?.icon || emojis[0];

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    function renderModal() {
        overlay.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${isEdit ? 'Edit Kategori' : 'Tambah Kategori'}</h3>
          <button class="modal-close" id="close-modal">✕</button>
        </div>

        <div class="add-account-form">
          <div class="input-group">
            <label for="cat-name">Nama Kategori</label>
            <input type="text" id="cat-name" class="input-field" placeholder="Contoh: Investasi" value="${escapeHtml(editCategory?.name || '')}" maxlength="50" />
          </div>

          <div class="input-group">
            <label>Pilih Ikon</label>
            <div class="emoji-picker">
              ${emojis.map(e => `
                <button class="emoji-option ${selectedIcon === e ? 'selected' : ''}" data-emoji="${e}">${e}</button>
              `).join('')}
            </div>
          </div>

          <button class="btn btn-primary" id="save-cat-btn">${isEdit ? 'Simpan' : 'Tambah'}</button>
        </div>
      </div>
    `;

        // Emoji select
        overlay.querySelectorAll('.emoji-option').forEach(btn => {
            btn.addEventListener('click', () => {
                selectedIcon = btn.dataset.emoji;
                overlay.querySelectorAll('.emoji-option').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });

        // Close
        overlay.querySelector('#close-modal')?.addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

        // Save
        overlay.querySelector('#save-cat-btn')?.addEventListener('click', async () => {
            const name = overlay.querySelector('#cat-name')?.value?.trim();
            if (!name) {
                showToast('Masukkan nama kategori', 'error');
                return;
            }

            try {
                if (isEdit) {
                    await updateCategory(editCategory.id, { name, icon: selectedIcon });
                    showToast('Kategori berhasil diubah', 'success');
                } else {
                    await addCategory({ name, type: activeTab, icon: selectedIcon });
                    showToast('Kategori berhasil ditambahkan', 'success');
                }
                overlay.remove();
                await renderContent(container);
            } catch (error) {
                showToast(error.message || 'Gagal menyimpan kategori', 'error');
            }
        });
    }

    renderModal();
    document.body.appendChild(overlay);
}

function showDeleteConfirm(container, categoryId) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
    <div class="modal-content" style="text-align: center;">
      <div style="font-size: 48px; margin-bottom: var(--space-md);">⚠️</div>
      <h3 style="margin-bottom: var(--space-sm);">Hapus Kategori?</h3>
      <p style="font-size: var(--font-sm); color: var(--text-secondary); margin-bottom: var(--space-lg);">Kategori ini akan dihapus secara permanen.</p>
      <div style="display: flex; gap: var(--space-sm);">
        <button class="btn btn-secondary" style="flex:1;" id="cancel-del">Batal</button>
        <button class="btn btn-primary" style="flex:1; background: var(--color-expense);" id="confirm-del">Hapus</button>
      </div>
    </div>
  `;

    overlay.querySelector('#cancel-del')?.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector('#confirm-del')?.addEventListener('click', async () => {
        try {
            await deleteCategory(categoryId);
            showToast('Kategori berhasil dihapus', 'success');
            overlay.remove();
            await renderContent(container);
        } catch (error) {
            showToast(error.message || 'Gagal menghapus kategori', 'error');
        }
    });

    document.body.appendChild(overlay);
}
