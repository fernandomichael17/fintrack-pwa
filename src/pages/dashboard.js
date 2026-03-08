import { getSummary, getTransactions } from '../services/transaction.service.js';
import { getAccounts, getTotalBalance } from '../services/account.service.js';
import { getCategoryById } from '../services/category.service.js';
import { getProfile } from '../services/profile.service.js';
import { getCurrentUser } from '../services/auth.service.js';
import { getOnlineStatus } from '../db/sync.js';
import { navigateTo } from '../router.js';

// Format angka ke Rupiah
function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Format tanggal
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

// Nama bulan
const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

export async function renderDashboard(container) {
    // Loading state
    container.innerHTML = `
    <div class="dashboard">
      <div style="display: flex; justify-content: center; padding-top: 100px;">
        <div class="spinner"></div>
      </div>
    </div>
  `;

    try {
        const user = await getCurrentUser();
        const profile = user ? await getProfile(user.id) : null;
        const displayName = profile?.display_name || user?.user_metadata?.display_name || 'User';

        await renderContent(container, displayName);
    } catch (error) {
        console.error('Dashboard error:', error);
        container.innerHTML = `
      <div class="dashboard">
        <div class="empty-state">
          <div class="empty-state-icon">😵</div>
          <p>Gagal memuat dashboard</p>
        </div>
      </div>
    `;
    }
}

async function renderContent(container, displayName) {
    const [totalBalance, accounts, summary, recentTransactions] = await Promise.all([
        getTotalBalance(),
        getAccounts(),
        getSummary(currentMonth, currentYear),
        getTransactions({ month: currentMonth, year: currentYear })
    ]);

    const recent5 = recentTransactions.slice(0, 5);
    const isOnline = getOnlineStatus();

    container.innerHTML = `
    <div class="dashboard">
      <!-- Header -->
      <div class="dash-header">
        <div class="dash-greeting">
          <h2>Halo, ${displayName} 👋</h2>
          <p>${formatDate(new Date())} • <span class="sync-badge ${isOnline ? 'online' : 'offline'}"><span class="sync-dot"></span> ${isOnline ? 'Online' : 'Offline'}</span></p>
        </div>
      </div>

      <!-- Total Balance -->
      <div class="balance-card">
        <div class="balance-label">Total Saldo</div>
        <div class="balance-amount">${formatRupiah(totalBalance)}</div>
      </div>

      <!-- Income & Expense Summary -->
      <div class="summary-row">
        <div class="summary-card">
          <div class="summary-card-header">
            <div class="summary-icon income">↑</div>
            <span>Pemasukan</span>
          </div>
          <div class="summary-amount income">${formatRupiah(summary.income)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-card-header">
            <div class="summary-icon expense">↓</div>
            <span>Pengeluaran</span>
          </div>
          <div class="summary-amount expense">${formatRupiah(summary.expense)}</div>
        </div>
      </div>

      <!-- Accounts -->
      ${accounts.length > 0 ? `
        <div class="accounts-section">
          <div class="section-header">
            <span class="section-title">Akun Saya</span>
            <a href="#/accounts" class="section-link">Lihat Semua →</a>
          </div>
          <div class="accounts-scroll">
            ${accounts.map(acc => `
              <div class="account-chip">
                <div class="account-chip-icon">${acc.icon || '🏦'}</div>
                <div class="account-chip-name">${acc.name}</div>
                <div class="account-chip-balance">${formatRupiah(acc.balance)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Month Selector -->
      <div class="month-selector">
        <button class="month-btn" id="prev-month">‹</button>
        <span class="month-label" id="month-label">${monthNames[currentMonth]} ${currentYear}</span>
        <button class="month-btn" id="next-month">›</button>
      </div>

      <!-- Recent Transactions -->
      <div class="recent-transactions">
        <div class="section-header">
          <span class="section-title">Transaksi Terbaru</span>
          <a href="#/transactions" class="section-link">Lihat Semua →</a>
        </div>
        ${recent5.length > 0 ? `
          <div id="transaction-list">
            ${await renderTransactionItems(recent5)}
          </div>
        ` : `
          <div class="empty-state">
            <div class="empty-state-icon">📭</div>
            <p>Belum ada transaksi bulan ini</p>
          </div>
        `}
      </div>
    </div>
  `;

    // Month navigation
    document.getElementById('prev-month')?.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        renderContent(container, displayName);
    });

    document.getElementById('next-month')?.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        renderContent(container, displayName);
    });
}

async function renderTransactionItems(transactions) {
    const items = await Promise.all(transactions.map(async (t) => {
        const category = t.category_id ? await getCategoryById(t.category_id) : null;
        const icon = category?.icon || (t.type === 'transfer' ? '🔄' : '📌');
        const name = t.type === 'transfer' ? 'Transfer' : (category?.name || 'Tanpa Kategori');

        const prefix = t.type === 'income' ? '+' : t.type === 'expense' ? '-' : '';

        return `
      <div class="transaction-item">
        <div class="transaction-icon">${icon}</div>
        <div class="transaction-info">
          <div class="transaction-name">${name}${t.note ? ' • ' + t.note : ''}</div>
          <div class="transaction-meta">${formatDate(t.date)}</div>
        </div>
        <div class="transaction-amount ${t.type}">${prefix}${formatRupiah(t.amount)}</div>
      </div>
    `;
    }));

    return items.join('');
}
