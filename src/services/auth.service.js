import { supabase } from '../config/supabase.js';
import { clearLocalDB } from '../db/sync.js';

// Register user baru
export async function register(email, password, displayName) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                display_name: displayName
            }
        }
    });

    if (error) throw error;
    return data;
}

// Login
export async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) throw error;
    return data;
}

// Logout
export async function logout() {
    await clearLocalDB();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

// Get current session
export async function getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

// Get current user
export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// Check if authenticated
export async function isAuthenticated() {
    const session = await getSession();
    return !!session;
}

// Forgot password
export async function forgotPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#/reset-password`
    });

    if (error) throw error;
}

// Reset password (setelah klik link dari email)
export async function resetPassword(newPassword) {
    const { error } = await supabase.auth.updateUser({
        password: newPassword
    });

    if (error) throw error;
}

// Listen auth state changes
export function onAuthChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
}
