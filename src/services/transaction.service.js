import db from '../db/local.js';
import { supabase } from '../config/supabase.js';
import { getOnlineStatus } from '../db/sync.js';
import { getCurrentUser } from './auth.service.js';
import { updateBalance } from './account.service.js';

export async function addTransaction(data) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const transaction = {
        id: crypto.randomUUID(),
        user_id: user.id,
        category_id: data.category_id || null,
        account_id: data.account_id || null,
        to_account_id: data.to_account_id || null,
        type: data.type,
        amount: data.amount,
        note: data.note || '',
        date: data.date || new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        syncStatus: 'pending'
    };

    await db.transactions.add(transaction);

    // Update saldo akun
    if (transaction.account_id) {
        if (transaction.type === 'income') {
            await updateBalance(transaction.account_id, transaction.amount, 'add');
        } else if (transaction.type === 'expense') {
            await updateBalance(transaction.account_id, transaction.amount, 'subtract');
        } else if (transaction.type === 'transfer') {
            await updateBalance(transaction.account_id, transaction.amount, 'subtract');
            if (transaction.to_account_id) {
                await updateBalance(transaction.to_account_id, transaction.amount, 'add');
            }
        }
    }

    // Sync ke Supabase
    if (getOnlineStatus()) {
        const { syncStatus, ...remoteData } = transaction;
        const { error } = await supabase.from('transactions').insert(remoteData);
        if (!error) {
            await db.transactions.update(transaction.id, { syncStatus: 'synced' });
        }
    }

    return transaction;
}

export async function getTransactions(filters = {}) {
    const user = await getCurrentUser();
    if (!user) return [];

    let transactions = await db.transactions
        .where('user_id').equals(user.id)
        .toArray();

    // Filter out deleted
    transactions = transactions.filter(t => t.syncStatus !== 'deleted');

    // Filter by type
    if (filters.type && filters.type !== 'all') {
        transactions = transactions.filter(t => t.type === filters.type);
    }

    // Filter by month & year
    if (filters.month !== undefined && filters.year !== undefined) {
        transactions = transactions.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === filters.month && d.getFullYear() === filters.year;
        });
    }

    // Filter by account
    if (filters.account_id) {
        transactions = transactions.filter(t =>
            t.account_id === filters.account_id || t.to_account_id === filters.account_id
        );
    }

    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    return transactions;
}

export async function updateTransaction(id, updates) {
    const oldTransaction = await db.transactions.get(id);
    if (!oldTransaction) throw new Error('Transaksi tidak ditemukan');

    // Rollback saldo lama
    if (oldTransaction.account_id) {
        if (oldTransaction.type === 'income') {
            await updateBalance(oldTransaction.account_id, oldTransaction.amount, 'subtract');
        } else if (oldTransaction.type === 'expense') {
            await updateBalance(oldTransaction.account_id, oldTransaction.amount, 'add');
        } else if (oldTransaction.type === 'transfer') {
            await updateBalance(oldTransaction.account_id, oldTransaction.amount, 'add');
            if (oldTransaction.to_account_id) {
                await updateBalance(oldTransaction.to_account_id, oldTransaction.amount, 'subtract');
            }
        }
    }

    const updatedData = { ...updates, updated_at: new Date().toISOString() };
    await db.transactions.update(id, { ...updatedData, syncStatus: 'pending' });

    // Terapkan saldo baru
    const newTransaction = await db.transactions.get(id);
    if (newTransaction.account_id) {
        if (newTransaction.type === 'income') {
            await updateBalance(newTransaction.account_id, newTransaction.amount, 'add');
        } else if (newTransaction.type === 'expense') {
            await updateBalance(newTransaction.account_id, newTransaction.amount, 'subtract');
        } else if (newTransaction.type === 'transfer') {
            await updateBalance(newTransaction.account_id, newTransaction.amount, 'subtract');
            if (newTransaction.to_account_id) {
                await updateBalance(newTransaction.to_account_id, newTransaction.amount, 'add');
            }
        }
    }

    if (getOnlineStatus()) {
        const { syncStatus, ...remoteData } = newTransaction;
        const { error } = await supabase
            .from('transactions')
            .update(updatedData)
            .eq('id', id);

        if (!error) {
            await db.transactions.update(id, { syncStatus: 'synced' });
        }
    }
}

export async function deleteTransaction(id) {
    const transaction = await db.transactions.get(id);
    if (!transaction) return;

    // Rollback saldo
    if (transaction.account_id) {
        if (transaction.type === 'income') {
            await updateBalance(transaction.account_id, transaction.amount, 'subtract');
        } else if (transaction.type === 'expense') {
            await updateBalance(transaction.account_id, transaction.amount, 'add');
        } else if (transaction.type === 'transfer') {
            await updateBalance(transaction.account_id, transaction.amount, 'add');
            if (transaction.to_account_id) {
                await updateBalance(transaction.to_account_id, transaction.amount, 'subtract');
            }
        }
    }

    await db.transactions.delete(id);

    if (getOnlineStatus()) {
        await supabase.from('transactions').delete().eq('id', id);
    }
}

export async function getSummary(month, year) {
    const transactions = await getTransactions({ month, year });

    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    return { income, expense, balance: income - expense };
}
