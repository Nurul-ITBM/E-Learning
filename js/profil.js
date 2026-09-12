// ==========================================
// js/profil.js - Logika Halaman Profil Mahasiswa
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

    // 3. Cek elemen
    const profilContainer = document.getElementById('profilContainer');
    if (!profilContainer) {
        console.error('❌ Elemen profilContainer tidak ditemukan!');
        return;
    }

    // 4. Load Profil & Statistik
    if (currentUser.id_mahasiswa) {
        await loadProfil(currentUser.id_mahasiswa);
        await loadStatistik(currentUser.id_mahasiswa);
    } else {
        profilContainer.innerHTML = `
            <div class="text-center py-16 text-red-400">
                <i class="fa-solid fa-circle-exclamation text-5xl mb-4 block"></i>
                <p class="text-sm font-medium">ID Mahasiswa tidak ditemukan di session.</p>
            </div>
        `;
    }

    // 5. ✅ Event listener GLOBAL (delegasi) - untuk tombol dinamis
    setupGlobalEventListeners();
});

// ==========================================
// ✅ SETUP EVENT LISTENER GLOBAL (DELEGASI)
// ==========================================
function setupGlobalEventListeners() {
    document.addEventListener('click', function(e) {
        // Tombol Edit Profil
        if (e.target.closest('#btnEditProfil')) {
            e.preventDefault();
            bukaModalEditProfil();
            return;
        }
        
        // Tombol Ganti Password
        if (e.target.closest('#btnGantiPassword')) {
            e.preventDefault();
            bukaModalGantiPassword();
            return;
        }
        
        // Tombol Simpan Profil
        if (e.target.closest('#btnSimpanProfil')) {
            e.preventDefault();
            simpanEditProfil();
            return;
        }
        
        // Tombol Simpan Password
        if (e.target.closest('#btnSimpanPassword')) {
            e.preventDefault();
            simpanGantiPassword();
            return;
        }
        
        // Tombol Batal (tutup modal)
        const btnBatal = e.target.closest('button[onclick*="tutupModal"]');
        if (btnBatal) {
            const onclickAttr = btnBatal.getAttribute('onclick');
            const match = onclickAttr.match(/tutupModal\('([^']+)'\)/);
            if (match) {
                tutupModal(match[1]);
            }
            return;
        }
    });
}

// ==========================================
// LOAD PROFIL MAHASISWA
// ==========================================
async function loadProfil(idMahasiswa) {
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
                action: 'get_profil_mahasiswa', 
                id_mahasiswa: idMahasiswa 
            })
        });
        const result = await response.json();
        console.log(">>> Profil mahasiswa:", result);

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
    
    const inisial = (profil.nama_mahasiswa || '?').charAt(0).toUpperCase();
    const statusBadge = profil.status_aktif 
        ? '<span class="bg-green-50 text-green-600 border border-green-200 text-xs font-bold px-3 py-1 rounded-full"><i class="fa-solid fa-check mr-1"></i> Aktif</span>'
        : '<span class="bg-red-50 text-red-600 border border-red-200 text-xs font-bold px-3 py-1 rounded-full"><i class="fa-solid fa-times mr-1"></i> Nonaktif</span>';
    
    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div class="lg:col-span-1">
                <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
                    <div class="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <span class="text-white font-extrabold text-4xl">${inisial}</span>
                    </div>
                    <h3 class="text-lg font-bold text-slate-800 mb-1">${profil.nama_mahasiswa || '-'}</h3>
                    <p class="text-xs text-indigo-600 font-semibold mb-3">${profil.program_studi || 'Mahasiswa'}</p>
                    <div class="mb-6">${statusBadge}</div>
                    <div class="bg-slate-50 rounded-lg p-3 border border-slate-100 text-xs">
                        <p class="text-slate-500 mb-1">NIM</p>
                        <p class="font-bold text-slate-800">${profil.nim || '-'}</p>
                    </div>
                </div>
            </div>
            
            <div class="lg:col-span-2 space-y-6">
                <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div class="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                        <h3 class="text-base font-bold text-slate-800 flex items-center">
                            <i class="fa-solid fa-user-circle text-indigo-600 mr-2"></i> Informasi Pribadi
                        </h3>
                        <button id="btnEditProfil" class="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1">
                            <i class="fa-solid fa-edit"></i> Edit Profil
                        </button>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p class="text-xs text-slate-500 mb-1">Nama Lengkap</p>
                            <p class="font-bold text-slate-800">${profil.nama_mahasiswa || '-'}</p>
                        </div>
                        <div>
                            <p class="text-xs text-slate-500 mb-1">NIM</p>
                            <p class="font-bold text-slate-800">${profil.nim || '-'}</p>
                        </div>
                        <div>
                            <p class="text-xs text-slate-500 mb-1">Program Studi</p>
                            <p class="font-bold text-slate-800">${profil.program_studi || '-'}</p>
                        </div>
                        <div>
                            <p class="text-xs text-slate-500 mb-1">Angkatan</p>
                            <p class="font-bold text-slate-800">${profil.angkatan || '-'}</p>
                        </div>
                        <div class="md:col-span-2">
                            <p class="text-xs text-slate-500 mb-1">Email</p>
                            <p class="font-bold text-slate-800">${profil.email || profil.email_login || '-'}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div class="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                        <h3 class="text-base font-bold text-slate-800 flex items-center">
                            <i class="fa-solid fa-lock text-indigo-600 mr-2"></i> Keamanan Akun
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
                        <button id="btnGantiPassword" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1">
                            <i class="fa-solid fa-shield-halved"></i> Ganti Password
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// LOAD STATISTIK
// ==========================================
async function loadStatistik(idMahasiswa) {
    const container = document.getElementById('statistikContainer');
    if (!container) return;

    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ 
                action: 'get_statistik_mahasiswa', 
                id_mahasiswa: idMahasiswa 
            })
        });
        const result = await response.json();
        console.log(">>> Statistik mahasiswa:", result);

        if (result.status === 'success' && result.data) {
            renderStatistik(result.data);
        }
    } catch (error) {
        console.error("Error load statistik:", error);
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
                <i class="fa-solid fa-chart-line text-indigo-600 mr-2"></i> Statistik Perkuliahan
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                    <div class="bg-blue-100 text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <i class="fa-solid fa-book"></i>
                    </div>
                    <p class="text-2xl font-extrabold text-blue-700">${stat.total_kelas || 0}</p>
                    <p class="text-xs text-slate-600 mt-1">Mata Kuliah</p>
                </div>
                <div class="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
                    <div class="bg-purple-100 text-purple-600 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <i class="fa-solid fa-file-pen"></i>
                    </div>
                    <p class="text-2xl font-extrabold text-purple-700">${stat.total_tugas || 0}</p>
                    <p class="text-xs text-slate-600 mt-1">Tugas</p>
                </div>
                <div class="bg-rose-50 border border-rose-100 rounded-xl p-4 text-center">
                    <div class="bg-rose-100 text-rose-600 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <i class="fa-regular fa-file-lines"></i>
                    </div>
                    <p class="text-2xl font-extrabold text-rose-700">${stat.total_ujian || 0}</p>
                    <p class="text-xs text-slate-600 mt-1">Ujian</p>
                </div>
                <div class="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                    <div class="bg-emerald-100 text-emerald-600 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <i class="fa-solid fa-user-check"></i>
                    </div>
                    <p class="text-2xl font-extrabold text-emerald-700">${stat.persen_kehadiran || 0}%</p>
                    <p class="text-xs text-slate-600 mt-1">Kehadiran</p>
                </div>
            </div>
            <div class="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 text-center">
                <i class="fa-solid fa-info-circle mr-1"></i>
                Total ${stat.total_hadir || 0} hadir dari ${stat.total_absensi || 0} pertemuan
            </div>
        </div>
    `;
}

// ==========================================
// BUKA MODAL EDIT PROFIL
// ==========================================
function bukaModalEditProfil() {
    if (!currentProfil) {
        alert('Data profil belum dimuat. Mohon tunggu...');
        return;
    }
    
    document.getElementById('editNama').value = currentProfil.nama_mahasiswa || '';
    document.getElementById('editProdi').value = currentProfil.program_studi || '';
    document.getElementById('editAngkatan').value = currentProfil.angkatan || '';
    document.getElementById('editEmail').value = currentProfil.email || currentProfil.email_login || '';
    document.getElementById('editNim').value = currentProfil.nim || '';
    
    document.getElementById('modalEditProfil').classList.remove('hidden');
}

// ==========================================
// SIMPAN EDIT PROFIL
// ==========================================
async function simpanEditProfil() {
    console.log(">>> simpanEditProfil dipanggil");
    
    const nama = document.getElementById('editNama').value.trim();
    const prodi = document.getElementById('editProdi').value.trim();
    const angkatan = document.getElementById('editAngkatan').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    
    if (!nama) {
        alert('⚠️ Nama mahasiswa tidak boleh kosong.');
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
                action: 'update_profil_mahasiswa', 
                id_mahasiswa: currentUser.id_mahasiswa,
                nama_mahasiswa: nama,
                program_studi: prodi,
                angkatan: angkatan,
                email: email
            })
        });
        const result = await response.json();
        console.log(">>> Update profil:", result);

        if (result.status === 'success') {
            alert('✅ ' + result.message);
            tutupModal('modalEditProfil');
            
            // Update session
            currentUser.nama_mahasiswa = nama;
            currentUser.program_studi = prodi;
            currentUser.angkatan = angkatan;
            currentUser.email = email;
            localStorage.setItem('user_session', JSON.stringify(currentUser));
            
            // Reload profil
            await loadProfil(currentUser.id_mahasiswa);
            
            // Update header
            const nameDisplay = document.getElementById('mahasiswaNameDisplay');
            if (nameDisplay) nameDisplay.innerText = nama;
            
            const prodiDisplay = document.getElementById('mahasiswaProdiDisplay');
            if (prodiDisplay) prodiDisplay.innerText = prodi;
            
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
    console.log(">>> simpanGantiPassword dipanggil");
    
    const passwordLama = document.getElementById('passwordLama').value;
    const passwordBaru = document.getElementById('passwordBaru').value;
    const passwordKonfirmasi = document.getElementById('passwordKonfirmasi').value;
    
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
            
            setTimeout(() => {
                localStorage.removeItem('user_session');
                window.location.href = 'login.html';
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
// TOGGLE PASSWORD VISIBILITY
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
// TUTUP MODAL
// ==========================================
function tutupModal(id) {
    document.getElementById(id).classList.add('hidden');
}
