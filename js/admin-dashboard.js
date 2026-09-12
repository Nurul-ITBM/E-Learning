// js/admin-dashboard.js
// Logika Dashboard Admin

let currentUser = null;
let dashboardData = null;

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

    // Validasi role admin
    if (currentUser.role && currentUser.role !== 'admin') {
        alert('Akses ditolak. Anda bukan admin.');
        window.location.href = '../login.html';
        return;
    }

    // Tunggu DOM siap
    await new Promise(resolve => setTimeout(resolve, 200));

    // Load dashboard
    await loadDashboard();
});

// ==========================================
// LOAD DASHBOARD
// ==========================================
async function loadDashboard() {
    try {
        console.log(">>> Loading dashboard admin...");
        
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ 
                action: 'get_dashboard_admin'
            })
        });
        const result = await response.json();
        console.log(">>> Dashboard data:", result);

        if (result.status === 'success' && result.data) {
            dashboardData = result.data;
            
            renderWelcome();
            renderStatCards(result.data.users);
            renderMasterStats(result.data.master);
            renderLogTerbaru(result.data.log_terbaru);
            
        } else {
            showError(result.message || 'Gagal memuat data dashboard.');
        }
    } catch (error) {
        console.error("Error load dashboard:", error);
        showError('Gagal terhubung ke server.');
    }
}

// ==========================================
// RENDER WELCOME
// ==========================================
function renderWelcome() {
    const bannerName = document.getElementById('bannerAdminName');
    if (bannerName) {
        bannerName.innerText = currentUser.nama_admin || currentUser.username?.split('@')[0] || 'Administrator';
    }
}

// ==========================================
// RENDER STAT CARDS
// ==========================================
function renderStatCards(users) {
    const container = document.getElementById('statCards');
    if (!container) return;
    
    container.innerHTML = `
        <!-- Total Users -->
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition">
            <div class="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
                <i class="fa-solid fa-users text-xl"></i>
            </div>
            <div>
                <h3 class="text-2xl font-bold text-slate-800 leading-none">${users.total || 0}</h3>
                <p class="text-xs text-slate-500 mt-1.5 font-medium">Total Users</p>
            </div>
        </div>

        <!-- Mahasiswa -->
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition">
            <div class="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <i class="fa-solid fa-user-graduate text-xl"></i>
            </div>
            <div>
                <h3 class="text-2xl font-bold text-slate-800 leading-none">${users.mahasiswa || 0}</h3>
                <p class="text-xs text-slate-500 mt-1.5 font-medium">Mahasiswa</p>
            </div>
        </div>

        <!-- Dosen -->
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition">
            <div class="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <i class="fa-solid fa-chalkboard-user text-xl"></i>
            </div>
            <div>
                <h3 class="text-2xl font-bold text-slate-800 leading-none">${users.dosen || 0}</h3>
                <p class="text-xs text-slate-500 mt-1.5 font-medium">Dosen</p>
            </div>
        </div>

        <!-- Admin -->
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition">
            <div class="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                <i class="fa-solid fa-user-shield text-xl"></i>
            </div>
            <div>
                <h3 class="text-2xl font-bold text-slate-800 leading-none">${users.admin || 0}</h3>
                <p class="text-xs text-slate-500 mt-1.5 font-medium">Admin</p>
            </div>
        </div>
    `;
}

// ==========================================
// RENDER MASTER STATS
// ==========================================
function renderMasterStats(master) {
    const container = document.getElementById('masterStats');
    if (!container) return;
    
    container.innerHTML = `
        <div class="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
            <div class="bg-blue-100 text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <i class="fa-solid fa-book"></i>
            </div>
            <p class="text-2xl font-extrabold text-blue-700">${master.total_matkul || 0}</p>
            <p class="text-xs text-slate-600 mt-1">Mata Kuliah</p>
        </div>

        <div class="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
            <div class="bg-purple-100 text-purple-600 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <i class="fa-solid fa-chalkboard"></i>
            </div>
            <p class="text-2xl font-extrabold text-purple-700">${master.total_kelas || 0}</p>
            <p class="text-xs text-slate-600 mt-1">Kelas</p>
        </div>

        <div class="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
            <div class="bg-amber-100 text-amber-600 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <i class="fa-solid fa-file-pen"></i>
            </div>
            <p class="text-2xl font-extrabold text-amber-700">${master.total_tugas || 0}</p>
            <p class="text-xs text-slate-600 mt-1">Tugas</p>
        </div>

        <div class="bg-rose-50 border border-rose-100 rounded-xl p-4 text-center">
            <div class="bg-rose-100 text-rose-600 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <i class="fa-regular fa-file-lines"></i>
            </div>
            <p class="text-2xl font-extrabold text-rose-700">${master.total_ujian || 0}</p>
            <p class="text-xs text-slate-600 mt-1">Ujian</p>
        </div>
    `;
}

// ==========================================
// RENDER LOG TERBARU
// ==========================================
function renderLogTerbaru(logs) {
    const container = document.getElementById('logTerbaru');
    if (!container) return;
    
    if (!logs || logs.length === 0) {
        container.innerHTML = `
            <div class="text-center py-6 text-slate-400">
                <i class="fa-regular fa-folder-open text-3xl mb-2 block opacity-30"></i>
                <p class="text-xs">Belum ada aktivitas.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    logs.forEach(log => {
        // Warna badge berdasarkan aksi
        let badgeColor = 'bg-slate-50 text-slate-600';
        let iconClass = 'fa-circle-info';
        
        const aksi = String(log.aksi || '').toLowerCase();
        if (aksi.includes('login')) {
            badgeColor = 'bg-blue-50 text-blue-600';
            iconClass = 'fa-right-to-bracket';
        } else if (aksi.includes('backup')) {
            badgeColor = 'bg-emerald-50 text-emerald-600';
            iconClass = 'fa-database';
        } else if (aksi.includes('verifikasi') || aksi.includes('approve')) {
            badgeColor = 'bg-green-50 text-green-600';
            iconClass = 'fa-check-circle';
        } else if (aksi.includes('tolak') || aksi.includes('reject')) {
            badgeColor = 'bg-red-50 text-red-600';
            iconClass = 'fa-times-circle';
        } else if (aksi.includes('hapus') || aksi.includes('delete')) {
            badgeColor = 'bg-red-50 text-red-600';
            iconClass = 'fa-trash';
        } else if (aksi.includes('update')) {
            badgeColor = 'bg-amber-50 text-amber-600';
            iconClass = 'fa-edit';
        }
        
        html += `
            <div class="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-orange-200 transition">
                <div class="w-8 h-8 rounded-lg ${badgeColor} flex items-center justify-center flex-shrink-0">
                    <i class="fa-solid ${iconClass} text-xs"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-xs font-bold text-slate-800">${log.aksi || '-'}</p>
                    <p class="text-[10px] text-slate-500 mt-0.5 truncate">${log.detail || '-'}</p>
                    <p class="text-[10px] text-slate-400 mt-0.5">
                        <i class="fa-regular fa-clock mr-1"></i>${formatWaktu(log.waktu)}
                    </p>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ==========================================
// HELPER: FORMAT WAKTU
// ==========================================
function formatWaktu(waktu) {
    if (!waktu) return '-';
    try {
        const date = new Date(String(waktu).replace(' ', 'T'));
        if (isNaN(date.getTime())) return String(waktu);
        
        const options = {
            day: 'numeric',
            month: 'short',
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
// SHOW ERROR
// ==========================================
function showError(message) {
    const container = document.querySelector('main .p-4, main .p-8');
    if (container) {
        container.innerHTML = `
            <div class="text-center py-16 text-red-400">
                <i class="fa-solid fa-circle-exclamation text-5xl mb-4 block"></i>
                <p class="text-sm font-medium">${message}</p>
                <button onclick="loadDashboard()" 
                    class="mt-4 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600">
                    <i class="fa-solid fa-rotate mr-1"></i> Coba Lagi
                </button>
            </div>
        `;
    }
}
