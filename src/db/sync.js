import db from './local.js';
import { supabase } from '../config/supabase.js';

// ---- Status listener ----
let isOnline = navigator.onLine;

window.addEventListener('online', () => {
    isOnline = true;
    console.log('🟢 Online — memulai sync...');
    syncAll();
});

window.addEventListener('offline', () => {
    isOnline = false;
    console.log('🔴 Offline — data disimpan lokal');
});

export function getOnlineStatus() {
    return isOnline;
}

// ---- Pull: Supabase → Local ----
export async function pullFromSupabase(userId) {
    if (!isOnline) return;

    try {
        // Pull user profile
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profile) {
            await db.user_profiles.put({ ...profile, syncStatus: 'synced' });
        }

        // Pull accounts
        const { data: accounts } = await supabase
            .from('accounts')
            .select('*')
            .eq('user_id', userId);

        if (accounts) {
            await db.accounts.bulkPut(
                accounts.map(a => ({ ...a, syncStatus: 'synced' }))
            );
        }

        // Pull categories
        const { data: categories } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', userId);

        if (categories) {
            await db.categories.bulkPut(
                categories.map(c => ({ ...c, syncStatus: 'synced' }))
            );
        }

        // Pull transactions
        const { data: transactions } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId);

        if (transactions) {
            await db.transactions.bulkPut(
                transactions.map(t => ({ ...t, syncStatus: 'synced' }))
            );
        }

        console.log('✅ Pull dari Supabase berhasil');
    } catch (error) {
        console.error('❌ Pull gagal:', error);
    }
}

// ---- Push: Local → Supabase ----
export async function pushToSupabase() {
    if (!isOnline) return;

    try {
        // Push pending accounts
        const pendingAccounts = await db.accounts
            .where('syncStatus').equals('pending').toArray();

        for (const account of pendingAccounts) {
            const { syncStatus, ...data } = account;
            const { error } = await supabase.from('accounts').upsert(data);
            if (!error) {
                await db.accounts.update(account.id, { syncStatus: 'synced' });
            }
        }

        // Push pending categories
        const pendingCategories = await db.categories
            .where('syncStatus').equals('pending').toArray();

        for (const category of pendingCategories) {
            const { syncStatus, ...data } = category;
            const { error } = await supabase.from('categories').upsert(data);
            if (!error) {
                await db.categories.update(category.id, { syncStatus: 'synced' });
            }
        }

        // Push pending transactions
        const pendingTransactions = await db.transactions
            .where('syncStatus').equals('pending').toArray();

        for (const transaction of pendingTransactions) {
            const { syncStatus, ...data } = transaction;
            const { error } = await supabase.from('transactions').upsert(data);
            if (!error) {
                await db.transactions.update(transaction.id, { syncStatus: 'synced' });
            }
        }

        console.log('✅ Push ke Supabase berhasil');
    } catch (error) {
        console.error('❌ Push gagal:', error);
    }
}

// ---- Sync All ----
export async function syncAll() {
    if (!isOnline) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await pushToSupabase();
    await pullFromSupabase(user.id);
}

// ---- Clear Local DB (saat logout) ----
export async function clearLocalDB() {
    await db.user_profiles.clear();
    await db.accounts.clear();
    await db.categories.clear();
    await db.transactions.clear();
    console.log('🗑️ Local DB cleared');
}
