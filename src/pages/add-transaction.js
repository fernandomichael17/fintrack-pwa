import { addTransaction } from '../services/transaction.service.js';
import { getAccounts } from '../services/account.service.js';
import { getCategories } from '../services/category.service.js';
import { navigateTo } from '../router.js';
import { showToast } from '../components/toast.js';
import { escapeHtml } from '../utils/sanitize.js';

// Format Rupiah untuk display
function formatRupiah(num) {
    return new Intl.NumberFormat('id-ID').format(num);
}

export async function renderAddTransaction(container) {
    const accounts = await getAccounts();
    const incomeCategories = await getCategories('income');
    const expenseCategories = await getCategories('expense');

    let selectedType = 'expense';
    let selectedCategoryId = null;
    let selectedAccountId = accounts.length > 0 ? accounts[0].id : null;
    let selectedToAccountId = null;
    let amount = 0;

    function render() {
        const categories = selectedType === 'income' ? incomeCategories : expenseCategories;

        container.innerHTML = `
      <div class="add-tx-page">
        <div class="add-tx-header">
          <h2 class="add-tx-title">Tambah Transaksi</h2>
        </div>

        <!-- Type Toggle -->
        <div class="type-toggle">
          <button class="type-toggle-btn ${selectedType === 'income' ? 'active' : ''}" data-type="income">Pemasukan</button>
          <button class="type-toggle-btn ${selectedType === 'expense' ? 'active' : ''}" data-type="expense">Pengeluaran</button>
          <button class="type-toggle-btn ${selectedType === 'transfer' ? 'active' : ''}" data-type="transfer">Transfer</button>
        </div>

        <!-- Amount Input -->
        <div class="amount-display">
          <span class="amount-prefix">Rp</span>
          <input 
            type="text" 
            class="amount-value" 
            id="amount-input" 
            placeholder="0"
            inputmode="numeric"
            value="${amount > 0 ? formatRupiah(amount) : ''}"
          />
        </div>

        <!-- Account Selector (Dari) -->
        <div class="account-selector">
          <div class="section-header">
            <span class="section-title">${selectedType === 'transfer' ? 'Dari Akun' : 'Akun'}</span>
          </div>
          <div class="account-options">
            ${accounts.map(acc => `
              <div class="account-option ${selectedAccountId === acc.id ? 'selected' : ''}" data-account-id="${acc.id}">
                <span class="account-option-icon">${acc.icon || '🏦'}</span>
                <div class="account-option-info">
                  <div class="account-option-name">${escapeHtml(acc.name)}</div>
                  <div class="account-option-balance">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(acc.balance)}</div>
                </div>
              </div>
            `).join('')}
            ${accounts.length === 0 ? '<p style="color: var(--text-muted); font-size: var(--font-sm);">Belum ada akun. <a href="#/accounts">Tambah akun</a></p>' : ''}
          </div>
        </div>

        <!-- To Account (Transfer only) -->
        ${selectedType === 'transfer' ? `
          <div class="account-selector">
            <div class="section-header">
              <span class="section-title">Ke Akun</span>
            </div>
            <div class="account-options" id="to-account-options">
              ${accounts.filter(a => a.id !== selectedAccountId).map(acc => `
                <div class="account-option ${selectedToAccountId === acc.id ? 'selected' : ''}" data-to-account-id="${acc.id}">
                  <span class="account-option-icon">${acc.icon || '🏦'}</span>
                  <div class="account-option-info">
                    <div class="account-option-name">${escapeHtml(acc.name)}</div>
                    <div class="account-option-balance">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(acc.balance)}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Category (tidak untuk transfer) -->
        ${selectedType !== 'transfer' ? `
          <div class="category-section">
            <div class="section-header">
              <span class="section-title">Kategori</span>
            </div>
            <div class="category-grid" id="category-grid">
              ${categories.map(cat => `
                <div class="category-item ${selectedCategoryId === cat.id ? 'selected' : ''}" data-category-id="${cat.id}">
                  <span class="category-item-icon">${cat.icon || '📌'}</span>
                  <span class="category-item-name">${escapeHtml(cat.name)}</span>
                </div>
              `).join('')}
              ${categories.length === 0 ? '<p style="grid-column: 1/-1; color: var(--text-muted); font-size: var(--font-sm); text-align: center;">Tidak ada kategori</p>' : ''}
            </div>
          </div>
        ` : ''}

        <!-- Date & Note -->
        <div class="input-group" style="margin-bottom: var(--space-md);">
          <label for="tx-date">Tanggal</label>
          <input type="date" id="tx-date" class="input-field" value="${new Date().toISOString().split('T')[0]}" />
        </div>

        <div class="input-group" style="margin-bottom: var(--space-lg);">
          <label for="tx-note">Catatan (opsional)</label>
          <input type="text" id="tx-note" class="input-field" placeholder="Contoh: Makan siang di warteg" maxlength="100" />
        </div>

        <!-- Submit -->
        <button class="btn btn-primary" id="save-tx-btn">Simpan Transaksi</button>
      </div>
    `;

        bindEvents();
    }

    function bindEvents() {
        // Type toggle
        document.querySelectorAll('.type-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                selectedType = btn.dataset.type;
                selectedCategoryId = null;
                selectedToAccountId = null;
                render();
            });
        });

        // Amount input — hanya angka, auto format
        const amountInput = document.getElementById('amount-input');
        if (amountInput) {
            amountInput.addEventListener('input', (e) => {
                const raw = e.target.value.replace(/\D/g, '');
                amount = parseInt(raw) || 0;
                e.target.value = amount > 0 ? formatRupiah(amount) : '';
            });
            amountInput.focus();
        }

        // Account selector
        document.querySelectorAll('[data-account-id]').forEach(el => {
            el.addEventListener('click', () => {
                selectedAccountId = el.dataset.accountId;
                if (selectedType === 'transfer' && selectedToAccountId === selectedAccountId) {
                    selectedToAccountId = null;
                }
                render();
            });
        });

        // To account selector (transfer)
        document.querySelectorAll('[data-to-account-id]').forEach(el => {
            el.addEventListener('click', () => {
                selectedToAccountId = el.dataset.toAccountId;
                render();
            });
        });

        // Category selector
        document.querySelectorAll('[data-category-id]').forEach(el => {
            el.addEventListener('click', () => {
                selectedCategoryId = el.dataset.categoryId;
                document.querySelectorAll('.category-item').forEach(c => c.classList.remove('selected'));
                el.classList.add('selected');
            });
        });

        // Save button
        document.getElementById('save-tx-btn')?.addEventListener('click', handleSave);
    }

    async function handleSave() {
        const date = document.getElementById('tx-date')?.value;
        const note = document.getElementById('tx-note')?.value?.trim();
        const saveBtn = document.getElementById('save-tx-btn');

        // Validasi
        if (amount <= 0) {
            showToast('Masukkan jumlah transaksi', 'error');
            return;
        }

        if (amount > 999999999999) {
            showToast('Jumlah transaksi terlalu besar (maks Rp 999.999.999.999)', 'error');
            return;
        }

        if (!selectedAccountId) {
            showToast('Pilih akun terlebih dahulu', 'error');
            return;
        }

        if (selectedType === 'transfer' && !selectedToAccountId) {
            showToast('Pilih akun tujuan transfer', 'error');
            return;
        }

        if (selectedType !== 'transfer' && !selectedCategoryId) {
            showToast('Pilih kategori terlebih dahulu', 'error');
            return;
        }

        saveBtn.disabled = true;
        saveBtn.innerHTML = '<div class="spinner"></div>';

        try {
            await addTransaction({
                type: selectedType,
                amount: amount,
                category_id: selectedType !== 'transfer' ? selectedCategoryId : null,
                account_id: selectedAccountId,
                to_account_id: selectedType === 'transfer' ? selectedToAccountId : null,
                date: date,
                note: note
            });

            const typeLabel = selectedType === 'income' ? 'Pemasukan' : selectedType === 'expense' ? 'Pengeluaran' : 'Transfer';
            showToast(`${typeLabel} berhasil ditambahkan!`, 'success');
            navigateTo('/dashboard');
        } catch (error) {
            console.error('Save transaction error:', error);
            showToast('Gagal menyimpan transaksi', 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = 'Simpan Transaksi';
        }
    }

    render();
}
