import { getAccounts, addAccount, updateAccount, deleteAccount, getTotalBalance } from '../services/account.service.js';
import { showToast } from '../components/toast.js';

function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(amount);
}

const typeLabels = { bank: 'Bank', 'e-wallet': 'E-Wallet', cash: 'Cash' };

export async function renderAccounts(container) {
    container.innerHTML = `<div class="accounts-page"><div style="display:flex;justify-content:center;padding-top:100px;"><div class="spinner"></div></div></div>`;

    try {
        await renderContent(container);
    } catch (error) {
        console.error('Accounts error:', error);
        container.innerHTML = `<div class="accounts-page"><div class="empty-state"><div class="empty-state-icon">😵</div><p>Gagal memuat akun</p></div></div>`;
    }
}

async function renderContent(container) {
    const accounts = await getAccounts();
    const totalBalance = await getTotalBalance();

    container.innerHTML = `
    <div class="accounts-page">
      <div class="accounts-page-header">
        <h2>Akun Saya</h2>
        <button class="btn btn-secondary" id="add-account-btn">+ Tambah</button>
      </div>

      <div class="accounts-total">
        <div class="accounts-total-label">Total Saldo</div>
        <div class="accounts-total-amount">${formatRupiah(totalBalance)}</div>
      </div>

      ${accounts.length > 0 ? `
        <div class="account-list">
          ${accounts.map(acc => `
            <div class="account-list-item" data-id="${acc.id}">
              <div class="account-list-icon">${acc.icon || '🏦'}</div>
              <div class="account-list-info">
                <div class="account-list-name">${acc.name}</div>
                <div class="account-list-type">${typeLabels[acc.type] || acc.type}${acc.holder_name ? ' • ' + acc.holder_name : ''}</div>
              </div>
              <div class="account-list-balance">${formatRupiah(acc.balance)}</div>
              <div class="account-list-actions">
                <button class="account-action-btn edit-account" data-id="${acc.id}" title="Edit">✎</button>
                <button class="account-action-btn delete account-delete" data-id="${acc.id}" title="Hapus">✕</button>
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="empty-state">
          <div class="empty-state-icon">🏦</div>
          <p>Belum ada akun. Tambahkan akun bank, e-wallet, atau cash.</p>
        </div>
      `}
    </div>
  `;

    // Add account button
    document.getElementById('add-account-btn')?.addEventListener('click', () => showAccountModal(container));

    // Edit buttons
    document.querySelectorAll('.edit-account').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const acc = accounts.find(a => a.id === btn.dataset.id);
            if (acc) showAccountModal(container, acc);
        });
    });

    // Delete buttons
    document.querySelectorAll('.account-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            showDeleteConfirm(container, btn.dataset.id);
        });
    });
}

function showAccountModal(container, editAccount = null) {
    const isEdit = !!editAccount;
    let selectedType = editAccount?.type || 'bank';
    let selectedIcon = editAccount?.icon || '🏦';

    const icons = { bank: '🏦', 'e-wallet': '📱', cash: '💵' };

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    function renderModal() {
        selectedIcon = icons[selectedType] || '🏦';

        overlay.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${isEdit ? 'Edit Akun' : 'Tambah Akun'}</h3>
          <button class="modal-close" id="close-modal">✕</button>
        </div>

        <div class="add-account-form">
          <div class="input-group">
            <label>Tipe Akun</label>
            <div class="type-select-group">
              <button class="type-select-btn ${selectedType === 'bank' ? 'selected' : ''}" data-type="bank">
                <span class="type-select-icon">🏦</span> Bank
              </button>
              <button class="type-select-btn ${selectedType === 'e-wallet' ? 'selected' : ''}" data-type="e-wallet">
                <span class="type-select-icon">📱</span> E-Wallet
              </button>
              <button class="type-select-btn ${selectedType === 'cash' ? 'selected' : ''}" data-type="cash">
                <span class="type-select-icon">💵</span> Cash
              </button>
            </div>
          </div>

          <div class="input-group">
            <label for="account-name">Nama Akun</label>
            <input type="text" id="account-name" class="input-field" placeholder="Contoh: BCA, Dana, GoPay" value="${editAccount?.name || ''}" />
          </div>

          <div class="input-group">
            <label for="account-holder">Nama Pemilik (opsional)</label>
            <input type="text" id="account-holder" class="input-field" placeholder="Nama pemilik rekening" value="${editAccount?.holder_name || ''}" />
          </div>

          ${!isEdit ? `
            <div class="input-group">
              <label for="account-balance">Saldo Awal</label>
              <input type="text" id="account-balance" class="input-field" placeholder="0" inputmode="numeric" />
            </div>
          ` : ''}

          <button class="btn btn-primary" id="save-account-btn">${isEdit ? 'Simpan Perubahan' : 'Tambah Akun'}</button>
        </div>
      </div>
    `;

        // Type select
        overlay.querySelectorAll('.type-select-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                selectedType = btn.dataset.type;
                renderModal();
            });
        });

        // Balance input format
        const balanceInput = overlay.querySelector('#account-balance');
        if (balanceInput) {
            balanceInput.addEventListener('input', (e) => {
                const raw = e.target.value.replace(/\D/g, '');
                const num = parseInt(raw) || 0;
                e.target.value = num > 0 ? new Intl.NumberFormat('id-ID').format(num) : '';
            });
        }

        // Close modal
        overlay.querySelector('#close-modal')?.addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

        // Save
        overlay.querySelector('#save-account-btn')?.addEventListener('click', async () => {
            const name = overlay.querySelector('#account-name')?.value?.trim();
            const holderName = overlay.querySelector('#account-holder')?.value?.trim();
            const balanceRaw = overlay.querySelector('#account-balance')?.value?.replace(/\D/g, '');
            const balance = parseInt(balanceRaw) || 0;

            if (!name) {
                showToast('Masukkan nama akun', 'error');
                return;
            }

            try {
                if (isEdit) {
                    await updateAccount(editAccount.id, { name, type: selectedType, holder_name: holderName || null, icon: selectedIcon });
                    showToast('Akun berhasil diperbarui', 'success');
                } else {
                    await addAccount({ name, type: selectedType, holder_name: holderName || null, balance, icon: selectedIcon });
                    showToast('Akun berhasil ditambahkan', 'success');
                }
                overlay.remove();
                await renderContent(container);
            } catch (error) {
                console.error('Save account error:', error);
                showToast('Gagal menyimpan akun', 'error');
            }
        });
    }

    renderModal();
    document.body.appendChild(overlay);
}

function showDeleteConfirm(container, accountId) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
    <div class="modal-content" style="text-align: center;">
      <div style="font-size: 48px; margin-bottom: var(--space-md);">⚠️</div>
      <h3 style="margin-bottom: var(--space-sm);">Hapus Akun?</h3>
      <p style="font-size: var(--font-sm); color: var(--text-secondary); margin-bottom: var(--space-lg);">Akun ini akan dihapus. Pastikan tidak ada transaksi terkait.</p>
      <div style="display: flex; gap: var(--space-sm);">
        <button class="btn btn-secondary" style="flex:1;" id="cancel-delete">Batal</button>
        <button class="btn btn-primary" style="flex:1; background: var(--color-expense);" id="confirm-delete">Hapus</button>
      </div>
    </div>
  `;

    overlay.querySelector('#cancel-delete')?.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector('#confirm-delete')?.addEventListener('click', async () => {
        try {
            await deleteAccount(accountId);
            showToast('Akun berhasil dihapus', 'success');
            overlay.remove();
            await renderContent(container);
        } catch (error) {
            showToast(error.message || 'Gagal menghapus akun', 'error');
        }
    });

    document.body.appendChild(overlay);
}
