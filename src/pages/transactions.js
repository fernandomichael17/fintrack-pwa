import { getTransactions, deleteTransaction } from '../services/transaction.service.js';
import { getCategoryById } from '../services/category.service.js';
import { getAccountById } from '../services/account.service.js';
import { showToast } from '../components/toast.js';

function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(amount);
}

const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let currentFilter = 'all';

export async function renderTransactions(container) {
    container.innerHTML = `<div class="tx-list-page"><div style="display:flex;justify-content:center;padding-top:100px;"><div class="spinner"></div></div></div>`;

    try {
        await renderContent(container);
    } catch (error) {
        console.error('Transactions error:', error);
        container.innerHTML = `<div class="tx-list-page"><div class="empty-state"><div class="empty-state-icon">😵</div><p>Gagal memuat transaksi</p></div></div>`;
    }
}

async function renderContent(container) {
    const transactions = await getTransactions({
        month: currentMonth,
        year: currentYear,
        type: currentFilter
    });

    // Group by date
    const grouped = {};
    transactions.forEach(t => {
        const dateKey = t.date;
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(t);
    });

    const dateKeys = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

    container.innerHTML = `
    <div class="tx-list-page">
      <div class="accounts-page-header">
        <h2>Riwayat</h2>
      </div>

      <!-- Month Selector -->
      <div class="month-selector">
        <button class="month-btn" id="prev-month">‹</button>
        <span class="month-label">${monthNames[currentMonth]} ${currentYear}</span>
        <button class="month-btn" id="next-month">›</button>
      </div>

      <!-- Filters -->
      <div class="tx-filters">
        <button class="filter-chip ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">Semua</button>
        <button class="filter-chip ${currentFilter === 'income' ? 'active' : ''}" data-filter="income">Pemasukan</button>
        <button class="filter-chip ${currentFilter === 'expense' ? 'active' : ''}" data-filter="expense">Pengeluaran</button>
        <button class="filter-chip ${currentFilter === 'transfer' ? 'active' : ''}" data-filter="transfer">Transfer</button>
      </div>

      <!-- Transaction List -->
      ${dateKeys.length > 0 ? `
        ${dateKeys.map(dateKey => `
          <div class="tx-date-group">
            <div class="tx-date-label">${formatDateLabel(dateKey)}</div>
            <div id="tx-group-${dateKey}"></div>
          </div>
        `).join('')}
      ` : `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <p>Tidak ada transaksi di ${monthNames[currentMonth]} ${currentYear}</p>
        </div>
      `}
    </div>
  `;

    // Render transaction items per group
    for (const dateKey of dateKeys) {
        const groupEl = document.getElementById(`tx-group-${dateKey}`);
        if (groupEl) {
            groupEl.innerHTML = await renderItems(grouped[dateKey]);
        }
    }

    // Month navigation
    document.getElementById('prev-month')?.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        renderContent(container);
    });

    document.getElementById('next-month')?.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        renderContent(container);
    });

    // Filter chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            currentFilter = chip.dataset.filter;
            renderContent(container);
        });
    });

    // Delete (long press / swipe — for now, click the amount)
    document.querySelectorAll('.transaction-item[data-tx-id]').forEach(el => {
        el.addEventListener('click', () => {
            showDeleteTx(container, el.dataset.txId);
        });
    });
}

async function renderItems(transactions) {
    const items = await Promise.all(transactions.map(async (t) => {
        const category = t.category_id ? await getCategoryById(t.category_id) : null;
        const account = t.account_id ? await getAccountById(t.account_id) : null;
        const toAccount = t.to_account_id ? await getAccountById(t.to_account_id) : null;

        const icon = category?.icon || (t.type === 'transfer' ? '🔄' : '📌');
        let name = category?.name || 'Tanpa Kategori';
        let meta = account?.name || '';

        if (t.type === 'transfer') {
            name = 'Transfer';
            meta = `${account?.name || '?'} → ${toAccount?.name || '?'}`;
        }

        const prefix = t.type === 'income' ? '+' : t.type === 'expense' ? '-' : '';

        return `
      <div class="transaction-item" data-tx-id="${t.id}">
        <div class="transaction-icon">${icon}</div>
        <div class="transaction-info">
          <div class="transaction-name">${name}${t.note ? ' • ' + t.note : ''}</div>
          <div class="transaction-meta">${meta}</div>
        </div>
        <div class="transaction-amount ${t.type}">${prefix}${formatRupiah(t.amount)}</div>
      </div>
    `;
    }));

    return items.join('');
}

function formatDateLabel(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hari Ini';
    if (date.toDateString() === yesterday.toDateString()) return 'Kemarin';

    return date.toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long'
    });
}

function showDeleteTx(container, txId) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
    <div class="modal-content" style="text-align: center;">
      <div style="font-size: 48px; margin-bottom: var(--space-md);">🗑️</div>
      <h3 style="margin-bottom: var(--space-sm);">Hapus Transaksi?</h3>
      <p style="font-size: var(--font-sm); color: var(--text-secondary); margin-bottom: var(--space-lg);">Saldo akun akan otomatis disesuaikan.</p>
      <div style="display: flex; gap: var(--space-sm);">
        <button class="btn btn-secondary" style="flex:1;" id="cancel-del-tx">Batal</button>
        <button class="btn btn-primary" style="flex:1; background: var(--color-expense);" id="confirm-del-tx">Hapus</button>
      </div>
    </div>
  `;

    overlay.querySelector('#cancel-del-tx')?.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector('#confirm-del-tx')?.addEventListener('click', async () => {
        try {
            await deleteTransaction(txId);
            showToast('Transaksi berhasil dihapus', 'success');
            overlay.remove();
            await renderContent(container);
        } catch (error) {
            showToast('Gagal menghapus transaksi', 'error');
        }
    });

    document.body.appendChild(overlay);
}
