// ==========================================
// js/auth.js - Logika Login & Otentikasi Client-Side
// Version: 3.0 - Login + Lupa Password Popup
// ✅ Selaras dengan Auth.gs - Login & Reset Password
// ✅ Toggle password visibility
// ✅ Popup lupa password (nama + email)
// ✅ Storage key konsisten
// ==========================================

// ==========================================
// 1. TOGGLE PASSWORD VISIBILITY
// ==========================================
function togglePassword() {
    const input = document.getElementById('password');
    const icon = document.getElementById('eyeIcon');

    if (!input || !icon) {
        console.warn('Element password atau eyeIcon tidak ditemukan');
        return;
    }

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// ==========================================
// 2. HELPER: API CALL
// ==========================================
async function callAuthAPI(action, data, options) {
    options = options || {};
    const timeout = options.timeout || 30000;

    const controller = new AbortController();
    const timeoutId = setTimeout(function () { controller.abort(); }, timeout);

    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            mode: 'cors',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(Object.assign({ action: action }, data || {})),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }

        const rawText = await response.text();

        // Cek HTML (login page / error page)
        const trimmed = rawText.trim();
        if (trimmed.indexOf('<!DOCTYPE') === 0 || trimmed.indexOf('<html') === 0) {
            throw new Error('Server balas HTML — cek deployment Apps Script.');
        }

        try {
            return JSON.parse(trimmed);
        } catch (e) {
            console.error('Response bukan JSON:', trimmed.substring(0, 200));
            throw new Error('Response server tidak valid.');
        }

    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
            throw new Error('Request timeout setelah ' + (timeout / 1000) + ' detik.');
        }
        throw err;
    }
}

// ==========================================
// 3. LOGIN HANDLER
// ==========================================
document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const user = document.getElementById('username').value.trim();
        const pass = document.getElementById('password').value;
        const btn = document.getElementById('loginBtn');
        const msg = document.getElementById('statusMessage');
        const btnOriginalContent = btn.innerHTML;

        // Validasi
        if (!user || !pass) {
            msg.className = 'mt-4 text-center text-sm block p-2 rounded-lg bg-red-50 text-red-600 border border-red-200';
            msg.innerHTML = '<i class="fa-solid fa-circle-exclamation mr-1"></i> Username dan password wajib diisi.';
            return;
        }

        // Loading state
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i><span>Memvalidasi...</span>';
        btn.disabled = true;
        btn.classList.add('opacity-75');

        msg.className = 'mt-4 text-center text-sm block p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200';
        msg.innerHTML = '<i class="fa-solid fa-cloud-arrow-up mr-1"></i> Menghubungkan ke server...';

        // Hash password SHA-256
        const hashedPassword = CryptoJS.SHA256(pass).toString();

        console.log('>>> Login attempt:', user);

        try {
            const result = await callAuthAPI('login', {
                username: user,
                password: hashedPassword
            }, { timeout: 30000 });

            console.log('>>> Login response:', result.status);

            if (result.status === 'success') {
                msg.className = 'mt-4 text-center text-sm block p-2 rounded-lg bg-green-50 text-green-600 border border-green-200 font-medium';
                msg.innerHTML = '<i class="fa-solid fa-circle-check mr-1"></i> Login Berhasil! Mengalihkan...';

                // Simpan session
                localStorage.setItem('user_session', JSON.stringify(result.data));
                localStorage.setItem('user', JSON.stringify(result.data));
                localStorage.setItem('isLoggedIn', 'true');

                console.log('>>> Saved to localStorage, role:', result.data.role);

                setTimeout(function () {
                    const role = (result.data.role || '').toLowerCase().trim();
                    const origin = window.location.origin;
                    const basePath = window.location.pathname.replace(/\/[^/]*$/, '/');

                    let redirectUrl = '';

                    if (role === 'admin') {
                        redirectUrl = origin + basePath + 'admin/admin-dashboard.html';
                    } else if (role === 'dosen') {
                        redirectUrl = origin + basePath + 'dosen/dosen-dashboard.html';
                    } else if (role === 'mahasiswa') {
                        redirectUrl = origin + basePath + 'mahasiswa/dashboard.html';
                    } else {
                        console.error('❌ Role tidak dikenali:', role);
                        redirectUrl = origin + basePath + 'index.html';
                    }

                    console.log('>>> Redirect ke:', redirectUrl);
                    window.location.href = redirectUrl;

                }, 800);

            } else {
                msg.className = 'mt-4 text-center text-red-600 bg-red-50 p-2 rounded-lg text-sm block border border-red-200';
                msg.innerHTML = '<i class="fa-solid fa-circle-exclamation mr-1"></i> ' +
                                (result.message || 'Login gagal.');

                btn.innerHTML = btnOriginalContent;
                btn.disabled = false;
                btn.classList.remove('opacity-75');
            }

        } catch (error) {
            console.error('❌ Error login:', error);
            msg.className = 'mt-4 text-center text-red-600 bg-red-50 p-2 rounded-lg text-sm block border border-red-200';
            msg.innerHTML = '<i class="fa-solid fa-triangle-exclamation mr-1"></i> Error: ' + error.message;

            btn.innerHTML = btnOriginalContent;
            btn.disabled = false;
            btn.classList.remove('opacity-75');
        }
    });
});

// ==========================================
// 4. LUPA PASSWORD — POPUP HANDLER
// ==========================================
function bukaPopupLupaPassword() {
    const modal = document.getElementById('modalLupaPassword');
    if (!modal) {
        console.error('❌ Modal lupa password tidak ditemukan');
        return;
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Reset form & status
    const form = document.getElementById('formLupaPassword');
    if (form) form.reset();

    const status = document.getElementById('lupa_status');
    if (status) {
        status.className = 'hidden';
        status.innerHTML = '';
    }

    // Focus ke input nama
    setTimeout(function () {
        const input = document.getElementById('lupa_nama');
        if (input) input.focus();
    }, 100);
}

function tutupPopupLupaPassword() {
    const modal = document.getElementById('modalLupaPassword');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// ==========================================
// 5. SUBMIT HANDLER — LUPA PASSWORD
// ==========================================
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('formLupaPassword');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const nama = document.getElementById('lupa_nama').value.trim();
        const email = document.getElementById('lupa_email').value.trim();
        const btn = document.getElementById('lupa_submit');
        const status = document.getElementById('lupa_status');
        const originalHTML = btn.innerHTML;

        // Validasi client-side
        if (!nama || nama.length < 3) {
            status.className = 'text-sm p-3 rounded-lg mb-4 bg-red-50 text-red-600 border border-red-200';
            status.innerHTML = '<i class="fa-solid fa-circle-exclamation mr-1"></i> Nama minimal 3 karakter.';
            return;
        }

        if (!email) {
            status.className = 'text-sm p-3 rounded-lg mb-4 bg-red-50 text-red-600 border border-red-200';
            status.innerHTML = '<i class="fa-solid fa-circle-exclamation mr-1"></i> Email wajib diisi.';
            return;
        }

        // Validasi format email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            status.className = 'text-sm p-3 rounded-lg mb-4 bg-red-50 text-red-600 border border-red-200';
            status.innerHTML = '<i class="fa-solid fa-circle-exclamation mr-1"></i> Format email tidak valid.';
            return;
        }

        // Loading state
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i><span>Mengirim...</span>';

        status.className = 'text-sm p-3 rounded-lg mb-4 bg-blue-50 text-blue-600 border border-blue-200';
        status.innerHTML = '<i class="fa-solid fa-cloud-arrow-up mr-1"></i> Menghubungi server...';

        console.log('>>> Request reset password untuk:', email);

        try {
            const result = await callAuthAPI('request_reset_password', {
                nama: nama,
                email: email
            }, { timeout: 30000 });

            console.log('>>> Reset response:', result.status);

            if (result.status === 'success') {
                status.className = 'text-sm p-3 rounded-lg mb-4 bg-green-50 text-green-700 border border-green-200';
                status.innerHTML =
                    '<i class="fa-solid fa-circle-check mr-1"></i> ' +
                    '<b>Berhasil!</b><br>' +
                    '<span class="text-xs">' + result.message + '</span>';

                // Reset form
                form.reset();

                // Auto close setelah 5 detik
                setTimeout(function () {
                    tutupPopupLupaPassword();
                }, 5000);

            } else {
                status.className = 'text-sm p-3 rounded-lg mb-4 bg-red-50 text-red-600 border border-red-200';
                status.innerHTML = '<i class="fa-solid fa-circle-exclamation mr-1"></i> ' +
                                   (result.message || 'Gagal mengirim. Coba lagi.');
            }

        } catch (error) {
            console.error('❌ Error request reset:', error);
            status.className = 'text-sm p-3 rounded-lg mb-4 bg-red-50 text-red-600 border border-red-200';
            status.innerHTML = '<i class="fa-solid fa-triangle-exclamation mr-1"></i> ' +
                               'Error: ' + error.message;

        } finally {
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        }
    });

    // ==========================================
    // 6. EVENT: Tutup popup saat klik backdrop
    // ==========================================
    const modal = document.getElementById('modalLupaPassword');
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                tutupPopupLupaPassword();
            }
        });
    }

    // ==========================================
    // 7. EVENT: Tutup popup saat tekan ESC
    // ==========================================
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('modalLupaPassword');
            if (modal && !modal.classList.contains('hidden')) {
                tutupPopupLupaPassword();
            }
        }
    });
});

// ==========================================
// 8. EXPOSE KE WINDOW (untuk onclick di HTML)
// ==========================================
if (typeof window !== 'undefined') {
    window.togglePassword = togglePassword;
    window.bukaPopupLupaPassword = bukaPopupLupaPassword;
    window.tutupPopupLupaPassword = tutupPopupLupaPassword;
}
