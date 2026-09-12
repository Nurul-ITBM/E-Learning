// ==========================================
// js/dosen-profil.js - Logika Halaman Profil Dosen
// Fitur: Lihat Profil, Edit Profil, Ganti Password, Statistik
// ==========================================

// ==========================================
// VARIABEL GLOBAL
// ==========================================
let currentUser = null;
let currentProfil = null;

// ==========================================
// INISIALISASI
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Validasi Sesi
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) {
        window.location.href = '../login.html';
        return;
    }
    
    currentUser = JSON.parse(sessionData);
    console.log(">>> User session:", currentUser);

    // 2. Tunggu DOM siap
    await new Promise(resolve => setTimeout(resolve, 100));

    // 3. Cek elemen penting
    const profilContainer = document.getElementById('profilContainer');
    if (!profilContainer) {
        console.error('❌ Elemen profilContainer tidak ditemukan!');
        return;
    }

    // 4. Load Profil & Statistik
    if (currentUser.id_dosen) {
        await loadProfil(currentUser.id_dosen);
        await loadStatistik(currentUser.id_dosen);
    } else {
        profilContainer.innerHTML = `
            <div class="text-center py-16 text-red-400">
                <i class="fa-solid fa-circle-exclamation text-5xl mb-4 block"></i>
                <p class="text-sm font-medium">ID Dosen tidak ditemukan di session.</p>
            </div>
        `;
    }

    // 5. Event Listener Tombol
    const btnEditProfil = document.getElementById('btnEditProfil');
    if (btnEditProfil) {
        btnEditProfil.addEventListener('click', bukaModalEditProfil);
    }

    const btnGantiPassword = document.getElementById('btnGantiPassword');
    if (btnGantiPassword) {
        btnGantiPassword.addEventListener('click', bukaModalGantiPassword);
    }

    const btnSimpanProfil = document.getElementById('btnSimpanProfil');
    if (btnSimpanProfil) {
        btnSimpanProfil.addEventListener('click', simpanEditProfil);
    }

    const btnSimpanPassword = document.getElementById('btnSimpanPassword');
    if (btnSimpanPassword) {
        btnSimpanPassword.addEventListener('click', simpanGantiPassword);
    }
});

// ==========================================
// LOAD PROFIL DOSEN
// ==========================================
async function loadProfil(idDosen) {
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
                action: 'get_profil_dosen', 
                id_dosen: idDosen 
            })
        });
        const result = await response.json();
        console.log(">>> Profil dosen:", result);

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
    
    const inisial = (profil.nama_dosen || '?').charAt(0).toUpperCase();
    const statusBadge = profil.status_aktif 
        ? '<span class="bg-green-50 text-green-600 border border-green-200 text-xs font-bold px-3 py-1 rounded-full"><i class="fa-solid fa-check mr-1"></i> Aktif</span>'
        : '<span class="bg-red-50 text-red-600 border border-red-200 text-xs font-bold px-3 py-1 rounded-full"><i class="fa-solid fa-times mr-1"></i> Nonaktif</span>';
    
    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <!-- KARTU PROFIL KIRI -->
            <div class="lg:col-span-1">
                <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
                    <!-- Avatar -->
                    <div class="w-28 h-28 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <span class="text-white font-extrabold text-4xl">${inisial}</span>
                    </div>
                    
                    <!-- Nama & Spesialisasi -->
                    <h3 class="text-lg font-bold text-slate-800 mb-1">${profil.nama_dosen || '-'}</h3>
                    <p class="text-xs text-teal-600 font-semibold mb-3">${profil.spesialisasi || 'Dosen Pengajar'}</p>
                    
                    <!-- Status -->
                    <div class="mb-6">${statusBadge}</div>
                    
                    <!-- NIP -->
                    <div class="bg-slate-50 rounded-lg p-3 border border-slate-100 text-xs">
                        <p class="text-slate-500 mb-1">NIP</p>
                        <p class="font-bold text-slate-800">${profil.nip || '-'}</p>
                    </div>
                </div>
            </div>
            
            <!-- KARTU DETAIL KANAN -->
            <div class="lg:col-span-2 space-y-6">
                
                <!-- Informasi Pribadi -->
                <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div class="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                        <h3 class="text-base font-bold text-slate-800 flex items-center">
                            <i class="fa-solid fa-user-circle text-teal-600 mr-2"></i> Informasi Pribadi
                        </h3>
                        <button id="btnEditProfil" class="bg-teal-50 hover:bg-teal-100 text-teal-600 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1">
                            <i class="fa-solid fa-edit"></i> Edit Profil
                        </button>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p class="text-xs text-slate-500 mb-1">Nama Lengkap</p>
                            <p class="font-bold text-slate-800">${profil.nama_dosen || '-'}</p>
                        </div>
                        <div>
                            <p class="text-xs text-slate-500 mb-1">NIP</p>
                            <p class="font-bold text-slate-800">${profil.nip || '-'}</p>
                        </div>
                        <div>
                            <p class="text-xs text-slate-500 mb-1">Spesialisasi</p>
                            <p class="font-bold text-slate-800">${profil.spesialisasi || '-'}</p>
                        </div>
                        <div>
                            <p class="text-xs text-slate-500 mb-1">Email</p>
                            <p class="font-bold text-slate-800">${profil.email || '-'}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Keamanan Akun -->
                <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div class="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                        <h3 class="text-base font-bold text-slate-800 flex items-center">
                            <i class="fa-solid fa-lock text-teal-600 mr-2"></i> Keamanan Akun
                        </h3>
                    </div>
                    
                    <div class="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-lg p-4">
                        <div class="flex items-center gap-3">
                            <div class="bg-amber-100 text-amber-600 p-2 rounded-lg">
                                <i class="fa-solid fa-key text-lg"></i>
                            </div>
                            <div>
                                <p class="font-bold text-slate-800 text-sm">Password</p>
                                <p class="text-xs text-slate-500">Disarankan ganti password secara berkala</p>
                            </div>
                        </div>
                        <button id="btnGantiPassword" class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1">
                            <i class="fa-solid fa-shield-halved"></i> Ganti Password
                        </button>
                    </div>
                </div>
                
            </div>
        </div>
    `;
    
    // Re-attach event listeners setelah render
    attachProfilEventListeners();
}

// ==========================================
// ATTACH EVENT LISTENERS (Setelah Render)
// ==========================================
function attachProfilEventListeners() {
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
// LOAD STATISTIK DOSEN
// ==========================================
async function loadStatistik(idDosen) {
    const container = document.getElementById('statistikContainer');
    if (!container) return;

    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ 
                action: 'get_statistik_dosen', 
                id_dosen: idDosen 
            })
        });
        const result = await response.json();
        console.log(">>> Statistik dosen:", result);

        if (result.status === 'success' && result.data) {
            renderStatistik(result.data);
        } else {
            container.innerHTML = '';
        }
    } catch (error) {
        console.error("Error load statistik:", error);
        container.innerHTML = '';
    }
}

// ==========================================
// RENDER STATISTIK
// ==========================================
function renderStatistik(stat) {
    const container = document.getElementById('statistikContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 class="text-base font-bold text-slate-800 mb-5 pb-3 border-b border-slate-100 flex items-center">
                <i class="fa-solid fa-chart-line text-teal-600 mr-2"></i> Statistik Mengajar
            </h3>
            
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div class="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                    <div class="bg-blue-100 text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <i class="fa-solid fa-book-open-reader"></i>
                    </div>
                    <p class="text-2xl font-extrabold text-blue-700">${stat.total_kelas || 0}</p>
                    <p class="text-xs text-slate-600 mt-1">Kelas</p>
                </div>
                
                <div class="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
                    <div class="bg-purple-100 text-purple-600 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <i class="fa-solid fa-users"></i>
                    </div>
                    <p class="text-2xl font-extrabold text-purple-700">${stat.total_mahasiswa || 0}</p>
                    <p class="text-xs text-slate-600 mt-1">Mahasiswa</p>
                </div>
                
                <div class="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
                    <div class="bg-amber-100 text-amber-600 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <i class="fa-solid fa-file-pen"></i>
                    </div>
                    <p class="text-2xl font-extrabold text-amber-700">${stat.total_tugas || 0}</p>
                    <p class="text-xs text-slate-600 mt-1">Tugas</p>
                </div>
                
                <div class="bg-rose-50 border border-rose-100 rounded-xl p-4 text-center">
                    <div class="bg-rose-100 text-rose-600 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <i class="fa-regular fa-file-lines"></i>
                    </div>
                    <p class="text-2xl font-extrabold text-rose-700">${stat.total_ujian || 0}</p>
                    <p class="text-xs text-slate-600 mt-1">Ujian</p>
                </div>
                
                <div class="bg-teal-50 border border-teal-100 rounded-xl p-4 text-center">
                    <div class="bg-teal-100 text-teal-600 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <i class="fa-solid fa-calendar-check"></i>
                    </div>
                    <p class="text-2xl font-extrabold text-teal-700">${stat.total_pertemuan || 0}</p>
                    <p class="text-xs text-slate-600 mt-1">Pertemuan</p>
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// BUKA MODAL EDIT PROFIL
// ==========================================
function bukaModalEditProfil() {
    if (!currentProfil) return;
    
    document.getElementById('editNama').value = currentProfil.nama_dosen || '';
    document.getElementById('editSpesialisasi').value = currentProfil.spesialisasi || '';
    document.getElementById('editNip').value = currentProfil.nip || '';
    document.getElementById('editEmail').value = currentProfil.email || '';
    
    document.getElementById('modalEditProfil').classList.remove('hidden');
}

// ==========================================
// SIMPAN EDIT PROFIL
// ==========================================
async function simpanEditProfil() {
    const nama = document.getElementById('editNama').value.trim();
    const spesialisasi = document.getElementById('editSpesialisasi').value.trim();
    
    if (!nama) {
        alert('⚠️ Nama dosen tidak boleh kosong.');
        return;
    }
    
    const btn = document.getElementById('btnSimpanProfil');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Menyimpan...';
    btn.disabled = true;
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ 
                action: 'update_profil_dosen', 
                id_dosen: currentUser.id_dosen,
                nama_dosen: nama,
                spesialisasi: spesialisasi
            })
        });
        const result = await response.json();
        console.log(">>> Update profil:", result);

        if (result.status === 'success') {
            alert('✅ ' + result.message);
            tutupModal('modalEditProfil');
            
            // Update session localStorage
            currentUser.nama_dosen = nama;
            currentUser.spesialisasi = spesialisasi;
            localStorage.setItem('user_session', JSON.stringify(currentUser));
            
            // Reload profil
            await loadProfil(currentUser.id_dosen);
            
            // Update nama di header
            const dosenNameDisplay = document.getElementById('dosenNameDisplay');
            if (dosenNameDisplay) dosenNameDisplay.innerText = nama;
            
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        console.error("Error simpan profil:", error);
        alert('❌ Terjadi kesalahan koneksi.');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
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
async function simpanGantiPassword() {
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
    
    const btn = document.getElementById('btnSimpanPassword');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Menyimpan...';
    btn.disabled = true;
    
    try {
        // Hash password pakai SHA-256 (CryptoJS)
        const hashLama = CryptoJS.SHA256(passwordLama).toString();
        const hashBaru = CryptoJS.SHA256(passwordBaru).toString();
        
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ 
                action: 'ganti_password_dosen', 
                id_user: currentUser.id_user,
                password_lama: passwordLama,  // Kirim plain, backend yang hash
                password_baru: passwordBaru   // Kirim plain, backend yang hash
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
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// ==========================================
// TUTUP MODAL
// ==========================================
function tutupModal(id) {
    document.getElementById(id).classList.add('hidden');
}
