// js/admin-profil.js
// Logika Profil Admin

let currentUser = null;
let currentProfil = null;

// ==========================================
// INISIALISASI
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) {
        window.location.href = '../login.html';
        return;
    }
    
    currentUser = JSON.parse(sessionData);
    console.log(">>> User session:", currentUser);

    if (currentUser.role !== 'admin') {
        alert('Akses ditolak. Anda bukan admin.');
        window.location.href = '../login.html';
        return;
    }

    // Tunggu DOM
    await new Promise(resolve => setTimeout(resolve, 300));

    // Load profil
    await loadProfilAdmin(currentUser.id_user);

    // Event listeners
    document.getElementById('formEditProfil').addEventListener('submit', simpanEditProfil);
    document.getElementById('formGantiPassword').addEventListener('submit', simpanGantiPassword);
});

// ==========================================
// LOAD PROFIL ADMIN
// ==========================================
async function loadProfilAdmin(id_user) {
    const container = document.getElementById('profilContainer');
    container.innerHTML = `
        <div class="text-center py-16 text-slate-400">
            <i class="fa-solid fa-circle-notch fa-spin text-4xl mb-3 block"></i>
            <p class="text-sm">Memuat profil...</p>
        </div>
    `;

    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ 
                action: 'get_profil_admin', 
                id_user: id_user 
            })
        });
        const result = await response.json();
        console.log(">>> Profil admin:", result);

        if (result.status === 'success' && result.data) {
            currentProfil = result.data;
            renderProfil(result.data);
        } else {
            container.innerHTML = `
                <div class="text-center py-16 text-red-400">
                    <i class="fa-solid fa-circle-exclamation text-4xl mb-3 block"></i>
                    <p class="text-sm font-medium">${result.message || 'Gagal memuat profil.'}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error("Error load profil:", error);
        container.innerHTML = `
            <div class="text-center py-16 text-red-400">
                <i class="fa-solid fa-circle-exclamation text-4xl mb-3 block"></i>
                <p class="text-sm font-medium">Gagal terhubung ke server.</p>
            </div>
        `;
    }
}

// ==========================================
// RENDER PROFIL
// ==========================================
function renderProfil(profil) {
    const container = document.getElementById('profilContainer');
    
    const inisial = (profil.nama_admin || 'AD').charAt(0).toUpperCase();
    const statusBadge = profil.status_aktif 
        ? '<span class="bg-green-50 text-green-600 border border-green-200 text-xs font-bold px-3 py-1 rounded-full"><i class="fa-solid fa-check mr-1"></i> Aktif</span>'
        : '<span class="bg-red-50 text-red-600 border border-red-200 text-xs font-bold px-3 py-1 rounded-full"><i class="fa-solid fa-times mr-1"></i> Nonaktif</span>';
    
    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <!-- KARTU PROFIL KIRI -->
            <div class="lg:col-span-1">
                <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
                    <!-- Avatar -->
                    <div class="w-28 h-28 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-lg border-4 border-orange-100">
                        <span class="text-white font-extrabold text-4xl">${inisial}</span>
                    </div>
                    
                    <!-- Nama & Role -->
                    <h3 class="text-lg font-bold text-slate-800 mb-1">${profil.nama_admin || 'Administrator'}</h3>
                    <p class="text-xs text-orange-600 font-semibold mb-3 uppercase tracking-wide">Administrator</p>
                    
                    <!-- Status -->
                    <div class="mb-6">${statusBadge}</div>
                    
                    <!-- ID User -->
                    <div class="bg-slate-50 rounded-lg p-3 border border-slate-100 text-xs">
                        <p class="text-slate-500 mb-1">ID User</p>
                        <p class="font-bold text-slate-800">${profil.id_user || '-'}</p>
                    </div>
                </div>
            </div>
            
            <!-- KARTU DETAIL KANAN -->
            <div class="lg:col-span-2 space-y-6">
                
                <!-- Informasi Pribadi -->
                <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div class="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                        <h3 class="text-base font-bold text-slate-800 flex items-center">
                            <i class="fa-solid fa-user-circle text-orange-600 mr-2"></i> Informasi Akun
                        </h3>
                        <button id="btnEditProfil" class="bg-orange-50 hover:bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1">
                            <i class="fa-solid fa-edit"></i> Edit Profil
                        </button>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p class="text-xs text-slate-500 mb-1">Nama</p>
                            <p class="font-bold text-slate-800">${profil.nama_admin || '-'}</p>
                        </div>
                        <div>
                            <p class="text-xs text-slate-500 mb-1">Role</p>
                            <p class="font-bold text-slate-800 capitalize">${profil.role || 'admin'}</p>
                        </div>
                        <div class="md:col-span-2">
                            <p class="text-xs text-slate-500 mb-1">Username / Email</p>
                            <p class="font-bold text-slate-800">${profil.username || '-'}</p>
                        </div>
                        <div>
                            <p class="text-xs text-slate-500 mb-1">Status Verifikasi</p>
                            <p class="font-bold text-slate-800 capitalize">${profil.status_verifikasi || 'approved'}</p>
                        </div>
                        <div>
                            <p class="text-xs text-slate-500 mb-1">Tanggal Daftar</p>
                            <p class="font-bold text-slate-800">${formatWaktu(profil.tanggal_daftar)}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Keamanan Akun -->
                <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div class="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                        <h3 class="text-base font-bold text-slate-800 flex items-center">
                            <i class="fa-solid fa-lock text-orange-600 mr-2"></i> Keamanan Akun
                        </h3>
                    </div>
                    
                    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-amber-50 border border-amber-100 rounded-lg p-4">
                        <div class="flex items-center gap-3">
                            <div class="bg-amber-100 text-amber-600 p-2 rounded-lg">
                                <i class="fa-solid fa-key text-lg"></i>
                            </div>
                            <div>
                                <p class="font-bold text-slate-800 text-sm">Password</p>
                                <p class="text-xs text-slate-500">Disarankan ganti password secara berkala</p>
                            </div>
                        </div>
                        <button id="btnGantiPassword" class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1 justify-center">
                            <i class="fa-solid fa-shield-halved"></i> Ganti Password
                        </button>
                    </div>
                </div>
                
            </div>
        </div>
    `;
    
    // Attach event listeners setelah render
    attachEventListeners();
}

// ==========================================
// ATTACH EVENT LISTENERS
// ==========================================
function attachEventListeners() {
    const btnEditProfil = document.getElementById('btnEditProfil');
    if (btnEditProfil) {
        btnEditProfil.addEventListener('click', bukaModalEditProfil);
    }
    
    const btnGantiPassword = document.getElementById('btnGantiPassword');
    if (btnGantiPassword) {
        btnGantiPassword.addEventListener('click', bukaModalGantiPassword);
    }
}

// ==========================================
// BUKA MODAL EDIT PROFIL
// ==========================================
function bukaModalEditProfil() {
    if (!currentProfil) return;
    
    document.getElementById('editIdUser').value = currentProfil.id_user || '';
    document.getElementById('editNama').value = currentProfil.nama_admin || 'Administrator';
    document.getElementById('editUsername').value = currentProfil.username || '';
    document.getElementById('editRole').value = currentProfil.role || 'admin';
    
    document.getElementById('modalEditProfil').classList.remove('hidden');
}

// ==========================================
// SIMPAN EDIT PROFIL
// ==========================================
async function simpanEditProfil(e) {
    e.preventDefault();
    
    const id_user = document.getElementById('editIdUser').value;
    const username = document.getElementById('editUsername').value.trim();
    
    if (!username) {
        alert('⚠️ Username tidak boleh kosong.');
        return;
    }
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'update_profil_admin',
                id_user: id_user,
                username: username
            })
        });
        const result = await response.json();
        console.log(">>> Update profil:", result);
        
        if (result.status === 'success') {
            alert('✅ ' + result.message);
            tutupModal('modalEditProfil');
            
            // Update session
            currentUser.username = username;
            localStorage.setItem('user_session', JSON.stringify(currentUser));
            
            // Reload profil
            await loadProfilAdmin(id_user);
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        console.error("Error update profil:", error);
        alert('❌ Terjadi kesalahan koneksi.');
    }
}

// ==========================================
// BUKA MODAL GANTI PASSWORD
// ==========================================
function bukaModalGantiPassword() {
    document.getElementById('passwordLama').value = '';
    document.getElementById('passwordBaru').value = '';
    document.getElementById('passwordKonfirmasi').value = '';
    
    document.getElementById('modalGantiPassword').classList.remove('hidden');
}

// ==========================================
// SIMPAN GANTI PASSWORD
// ==========================================
async function simpanGantiPassword(e) {
    e.preventDefault();
    
    const passwordLama = document.getElementById('passwordLama').value;
    const passwordBaru = document.getElementById('passwordBaru').value;
    const passwordKonfirmasi = document.getElementById('passwordKonfirmasi').value;
    
    // Validasi
    if (!passwordLama || !passwordBaru || !passwordKonfirmasi) {
        alert('⚠️ Semua kolom wajib diisi.');
        return;
    }
    
    if (passwordBaru.length < 6) {
        alert('⚠️ Password baru minimal 6 karakter.');
        return;
    }
    
    if (passwordBaru !== passwordKonfirmasi) {
        alert('⚠️ Konfirmasi password tidak cocok.');
        return;
    }
    
    if (passwordLama === passwordBaru) {
        alert('⚠️ Password baru harus berbeda dengan password lama.');
        return;
    }
    
    if (!confirm('Ganti password? Anda akan logout otomatis setelah ini.')) {
        return;
    }
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'ganti_password',
                id_user: currentUser.id_user,
                password_lama: passwordLama,
                password_baru: passwordBaru
            })
        });
        const result = await response.json();
        console.log(">>> Ganti password:", result);

        if (result.status === 'success') {
            alert('✅ ' + result.message);
            tutupModal('modalGantiPassword');
            
            // Logout otomatis setelah 2 detik
            setTimeout(() => {
                localStorage.removeItem('user_session');
                window.location.href = '../login.html';
            }, 2000);
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        console.error("Error ganti password:", error);
        alert('❌ Terjadi kesalahan koneksi.');
    }
}

// ==========================================
// TOGGLE PASSWORD
// ==========================================
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const btn = event.target.closest('button');
    const icon = btn ? btn.querySelector('i') : null;
    
    if (input.type === 'password') {
        input.type = 'text';
        if (icon) {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        }
    } else {
        input.type = 'password';
        if (icon) {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }
}

// ==========================================
// HELPER: FORMAT WAKTU
// ==========================================
function formatWaktu(waktu) {
    if (!waktu || waktu === '-') return '-';
    try {
        const date = new Date(String(waktu).replace(' ', 'T'));
        if (isNaN(date.getTime())) return String(waktu);
        
        const options = {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Makassar',
            hour12: false
        };
        
        return date.toLocaleString('id-ID', options);
    } catch (e) {
        return String(waktu);
    }
}

// ==========================================
// TUTUP MODAL
// ==========================================
function tutupModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
}
