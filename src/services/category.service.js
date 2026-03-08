import db from '../db/local.js';
import { supabase } from '../config/supabase.js';
import { getOnlineStatus } from '../db/sync.js';
import { getCurrentUser } from './auth.service.js';

export async function getCategories(type = null) {
    const user = await getCurrentUser();
    if (!user) return [];

    let query = db.categories.where('user_id').equals(user.id);
    const categories = await query.toArray();

    if (type) {
        return categories.filter(c => c.type === type && c.syncStatus !== 'deleted');
    }

    return categories.filter(c => c.syncStatus !== 'deleted');
}

export async function getCategoryById(id) {
    return await db.categories.get(id);
}

export async function addCategory(data) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const category = {
        id: crypto.randomUUID(),
        user_id: user.id,
        name: data.name,
        type: data.type,
        icon: data.icon || '📌',
        is_default: false,
        created_at: new Date().toISOString(),
        syncStatus: 'pending'
    };

    await db.categories.add(category);

    if (getOnlineStatus()) {
        const { syncStatus, ...remoteData } = category;
        const { error } = await supabase.from('categories').insert(remoteData);
        if (!error) {
            await db.categories.update(category.id, { syncStatus: 'synced' });
        }
    }

    return category;
}

export async function updateCategory(id, updates) {
    const category = await db.categories.get(id);
    if (category && category.is_default) {
        throw new Error('Kategori default tidak bisa diubah');
    }

    await db.categories.update(id, { ...updates, syncStatus: 'pending' });

    if (getOnlineStatus()) {
        const { error } = await supabase
            .from('categories')
            .update(updates)
            .eq('id', id);

        if (!error) {
            await db.categories.update(id, { syncStatus: 'synced' });
        }
    }
}

export async function deleteCategory(id) {
    const category = await db.categories.get(id);
    if (category && category.is_default) {
        throw new Error('Kategori default tidak bisa dihapus');
    }

    await db.categories.delete(id);

    if (getOnlineStatus()) {
        await supabase.from('categories').delete().eq('id', id);
    }
}
