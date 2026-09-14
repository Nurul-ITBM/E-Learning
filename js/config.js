// ==========================================
// js/config.js - Konfigurasi Global EduLearn
// ✅ Dengan Auto-Check API_URL
// ==========================================

const CONFIG = {
    // ==========================================
    // ⚠️ GANTI URL INI dengan URL dari Apps Script
    // Cara ambil URL:
    // 1. Buka Apps Script editor
    // 2. Deploy → Manage deployments
    // 3. Copy "Web app URL"
    // 4. Paste di sini
    // ==========================================
    API_URL: 'https://script.google.com/macros/s/AKfycbzrrbV8sDbATnGg7iVxue07AbdAjuc42Ee-QLJyNo-KBJlzo0D9Jt5zDpfDqSKblBJSZg/exec',
    
    // ==========================================
    // KONFIGURASI LAIN
    // ==========================================
    APP_NAME: 'EduLearn',
    APP_VERSION: '1.0.0',
    DEBUG: true,   // Set false di production
    
    // Timeout fetch (ms)
    FETCH_TIMEOUT: 30000,
    
    // Auto-refresh notif (ms)
    NOTIF_REFRESH_INTERVAL: 60000
};

// ==========================================
// AUTO-CHECK API_URL (SAAT LOAD)
// ==========================================
(function autoCheckApiUrl() {
    // Cek 1: API_URL ada?
    if (!CONFIG.API_URL) {
        console.error('❌ CONFIG.API_URL KOSONG! Isi dengan URL Apps Script.');
        return;
    }
    
    // Cek 2: Format URL benar?
    const urlValid = CONFIG.API_URL.includes('script.google.com/macros/s/') && 
                     CONFIG.API_URL.endsWith('/exec');
    
    if (!urlValid) {
        console.error('❌ CONFIG.API_URL FORMAT SALAH!');
        console.error('   Harus: https://script.google.com/macros/s/XXX/exec');
        console.error('   Sekarang:', CONFIG.API_URL);
        return;
    }
    
    // Cek 3: URL masih pakai placeholder?
    if (CONFIG.API_URL.includes('XXXXX') || CONFIG.API_URL.includes('GANTI')) {
        console.error('❌ CONFIG.API_URL belum diganti! Masih pakai placeholder.');
        return;
    }
    
    // Kalau semua check lulus
    if (CONFIG.DEBUG) {
        console.log('✅ CONFIG.API_URL OK:', CONFIG.API_URL.substring(0, 80) + '...');
    }
})();

// ==========================================
// HELPER: FETCH DENGAN RETRY & TIMEOUT
// ==========================================
async function fetchWithRetry(url, options, maxRetries = 2, timeout = CONFIG.FETCH_TIMEOUT) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
            if (CONFIG.DEBUG) {
                console.log(`🔄 Fetch attempt ${attempt}/${maxRetries + 1}`);
            }
            
            // Timeout via AbortController
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            // ✅ Cek HTTP status
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            // ✅ Cek content-type (harus JSON)
            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                console.warn('⚠️ Content-Type bukan JSON:', contentType);
                // Tetap lanjut — Apps Script kadang tidak set header dengan benar
            }
            
            if (CONFIG.DEBUG) {
                console.log(`✅ Fetch success (attempt ${attempt})`);
            }
            return response;
            
        } catch (error) {
            lastError = error;
            console.warn(`⚠️ Fetch failed (attempt ${attempt}):`, error.message);
            
            // Kalau bukan attempt terakhir, tunggu sebentar
            if (attempt <= maxRetries) {
                const waitTime = 1000 * attempt;
                if (CONFIG.DEBUG) {
                    console.log(`⏳ Retry in ${waitTime}ms...`);
                }
                await new Promise(r => setTimeout(r, waitTime));
            }
        }
    }
    
    throw lastError;
}

// ==========================================
// HELPER: FETCH & PARSE JSON DENGAN ERROR HANDLING
// ==========================================
async function fetchJSON(action, data = {}) {
    try {
        const response = await fetchWithRetry(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: action, ...data })
        });
        
        // ✅ Baca sebagai text dulu
        const rawText = await response.text();
        
        if (CONFIG.DEBUG) {
            console.log(`📥 Response [${action}]:`, rawText.substring(0, 200) + '...');
        }
        
        // ✅ Coba parse JSON
        let result;
        try {
            result = JSON.parse(rawText);
        } catch (parseError) {
            console.error('❌ Response bukan JSON!');
            console.error('   Raw response (200 char):', rawText.substring(0, 200));
            console.error('   Kemungkinan penyebab:');
            console.error('   1. CONFIG.API_URL salah / outdated');
            console.error('   2. Apps Script belum di-deploy');
            console.error('   3. Deployment URL berubah (harus pakai "New version")');
            throw new Error('Response server bukan JSON. Cek Console untuk detail.');
        }
        
        return result;
        
    } catch (error) {
        console.error(`❌ Error fetchJSON [${action}]:`, error.message);
        throw error;
    }
}

// ==========================================
// HELPER: CEK KONEKSI KE BACKEND (DEBUG ONLY)
// ==========================================
async function testConnection() {
    console.log('=== TEST KONEKSI BACKEND ===');
    console.log('API_URL:', CONFIG.API_URL);
    
    try {
        const result = await fetchJSON('test_connection', {});
        console.log('✅ Backend OK:', result);
        return true;
    } catch (error) {
        console.error('❌ Backend GAGAL:', error.message);
        console.error('Kemungkinan:');
        console.error('1. URL salah → cek Apps Script → Manage deployments');
        console.error('2. Apps Script belum deploy ulang');
        console.error('3. Deployment access bukan "Anyone"');
        return false;
    }
}

// ==========================================
// EKSPOSE KE WINDOW (untuk debug dari console)
// ==========================================
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
    window.fetchJSON = fetchJSON;
    window.fetchWithRetry = fetchWithRetry;
    window.testConnection = testConnection;
}
