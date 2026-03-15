/**
 * Utilitas Keamanan - Fintrack PWA
 * Modul ini berisi fungsi-fungsi untuk sanitasi input dan pencegahan XSS.
 */

/**
 * Escape karakter HTML berbahaya agar aman dipakai di innerHTML.
 * Mencegah serangan XSS (Cross-Site Scripting).
 * 
 * @param {string} str - String yang akan di-escape
 * @returns {string} String yang sudah aman dari karakter HTML
 */
export function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Sanitasi input pengguna: trim, batasi panjang, dan strip HTML tags.
 * Digunakan sebelum menyimpan data ke database.
 * 
 * @param {string} str - Input pengguna
 * @param {number} maxLength - Panjang maksimal karakter (default: 100)
 * @returns {string} String yang sudah disanitasi
 */
export function sanitizeInput(str, maxLength = 100) {
    if (str === null || str === undefined) return '';
    return String(str)
        .trim()
        .replace(/<[^>]*>/g, '') // Strip HTML tags
        .slice(0, maxLength);
}

/**
 * Validasi tipe transaksi — hanya menerima nilai yang di-whitelist.
 * 
 * @param {string} type - Tipe transaksi
 * @returns {boolean} true jika valid
 */
export function validateTransactionType(type) {
    const allowedTypes = ['income', 'expense', 'transfer'];
    return allowedTypes.includes(type);
}

/**
 * Validasi jumlah transaksi — harus positif dan di bawah batas maksimal.
 * 
 * @param {number} amount - Jumlah transaksi
 * @param {number} max - Batas maksimal (default: 999.999.999.999)
 * @returns {boolean} true jika valid
 */
export function validateAmount(amount, max = 999999999999) {
    return typeof amount === 'number' && amount > 0 && amount <= max && Number.isFinite(amount);
}

/**
 * Buat rate limiter berbasis memori untuk mencegah brute-force pada form autentikasi.
 * 
 * @param {number} maxAttempts - Jumlah percobaan maksimal
 * @param {number} windowMs - Jendela waktu dalam milidetik (default: 15 menit)
 * @returns {{ check: () => { allowed: boolean, remainingMs: number }, reset: () => void }}
 */
export function createRateLimiter(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    let attempts = [];

    return {
        /**
         * Cek apakah percobaan masih diizinkan.
         * @returns {{ allowed: boolean, remainingMs: number }}
         */
        check() {
            const now = Date.now();
            // Bersihkan percobaan yang sudah expired
            attempts = attempts.filter(t => now - t < windowMs);

            if (attempts.length >= maxAttempts) {
                const oldestAttempt = attempts[0];
                const remainingMs = windowMs - (now - oldestAttempt);
                return { allowed: false, remainingMs };
            }

            attempts.push(now);
            return { allowed: true, remainingMs: 0 };
        },

        /**
         * Reset semua percobaan (misalnya setelah login berhasil).
         */
        reset() {
            attempts = [];
        }
    };
}

/**
 * Format sisa waktu rate limit menjadi string yang mudah dibaca.
 * 
 * @param {number} ms - Sisa waktu dalam milidetik
 * @returns {string} Contoh: "2 menit 30 detik"
 */
export function formatRemainingTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.ceil((ms % 60000) / 1000);

    if (minutes > 0) {
        return `${minutes} menit ${seconds} detik`;
    }
    return `${seconds} detik`;
}
