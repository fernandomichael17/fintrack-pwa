import db from '../db/local.js';
import { supabase } from '../config/supabase.js';
import { getOnlineStatus } from '../db/sync.js';

export async function getProfile(userId) {
    // Coba ambil dari local dulu
    const local = await db.user_profiles.get(userId);
    if (local) return local;

    // Jika tidak ada di local, ambil dari Supabase
    if (getOnlineStatus()) {
        const { data } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (data) {
            await db.user_profiles.put({ ...data, syncStatus: 'synced' });
            return data;
        }
    }

    return null;
}

export async function updateProfile(userId, updates) {
    const updatedData = { ...updates, updated_at: new Date().toISOString() };

    // Update local
    await db.user_profiles.update(userId, { ...updatedData, syncStatus: 'pending' });

    // Update Supabase jika online
    if (getOnlineStatus()) {
        const { error } = await supabase
            .from('user_profiles')
            .update(updatedData)
            .eq('id', userId);

        if (!error) {
            await db.user_profiles.update(userId, { syncStatus: 'synced' });
        }
    }
}
