import db from '../db/local.js';
import { supabase } from '../config/supabase.js';
import { getOnlineStatus } from '../db/sync.js';
import { getCurrentUser } from './auth.service.js';

export async function getAccounts() {
    const user = await getCurrentUser();
    if (!user) return [];

    const accounts = await db.accounts
        .where('user_id').equals(user.id)
        .toArray();

    return accounts.filter(a => a.syncStatus !== 'deleted');
}

export async function getAccountById(id) {
    return await db.accounts.get(id);
}

export async function addAccount(data) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const account = {
        id: crypto.randomUUID(),
        user_id: user.id,
        name: data.name,
        type: data.type,
        holder_name: data.holder_name || null,
        balance: data.balance || 0,
        icon: data.icon || '🏦',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        syncStatus: 'pending'
    };

    await db.accounts.add(account);

    if (getOnlineStatus()) {
        const { syncStatus, ...remoteData } = account;
        const { error } = await supabase.from('accounts').insert(remoteData);
        if (!error) {
            await db.accounts.update(account.id, { syncStatus: 'synced' });
        }
    }

    return account;
}

export async function updateAccount(id, updates) {
    const updatedData = { ...updates, updated_at: new Date().toISOString() };

    await db.accounts.update(id, { ...updatedData, syncStatus: 'pending' });

    if (getOnlineStatus()) {
        const { error } = await supabase
            .from('accounts')
            .update(updatedData)
            .eq('id', id);

        if (!error) {
            await db.accounts.update(id, { syncStatus: 'synced' });
        }
    }
}

export async function deleteAccount(id) {
    // Cek apakah ada transaksi terkait
    const transactions = await db.transactions
        .where('account_id').equals(id)
        .count();

    const transfersTo = await db.transactions
        .where('to_account_id').equals(id)
        .count();

    if (transactions > 0 || transfersTo > 0) {
        throw new Error('Akun masih memiliki transaksi terkait');
    }

    await db.accounts.delete(id);

    if (getOnlineStatus()) {
        await supabase.from('accounts').delete().eq('id', id);
    }
}

export async function updateBalance(accountId, amount, operation) {
    const account = await db.accounts.get(accountId);
    if (!account) return;

    let newBalance = account.balance;

    if (operation === 'add') {
        newBalance += amount;
    } else if (operation === 'subtract') {
        newBalance -= amount;
    } else if (operation === 'set') {
        newBalance = amount;
    }

    await updateAccount(accountId, { balance: newBalance });
}

export async function getTotalBalance() {
    const accounts = await getAccounts();
    return accounts.reduce((total, acc) => total + acc.balance, 0);
}
