// ==========================================
// js/dosen-dashboard.js - Dashboard Dosen
// Fitur: Statistik, Jadwal Hari Ini, Tugas Baru, Ujian Terdekat
// ==========================================

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

    if (currentUser.role && currentUser.role !== 'dosen') {
        window.location.href = '../login.html';
        return;
    }

    // Tunggu DOM siap
    await new Promise(resolve => setTimeout(resolve, 100));

    // Load dashboard
    if (currentUser.id_dosen) {
        await loadDashboard(currentUser.id_dosen);
    } else {
        console.error('❌ id_dosen tidak ditemukan!');
    }
});

// ==========================================
// LOAD DASHBOARD
// ==========================================
async function loadDashboard(id_dosen) {
    try {
        console.log(">>> Loading dashboard untuk:", id_dosen);
        
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ 
                action: 'get_dashboard_dosen', 
                id_dosen: id_dosen 
            })
        });
        const result = await response.json();
        console.log(">>> Dashboard data:", result);

        if (result.status === 'success' && result.data) {
            dashboardData = result.data;
            
            renderWelcome(result.data.dosen);
            renderStatCards(result.data.statistik);
            renderJadwalHariIni(result.data.jadwal_hari_ini, result.data.hari_ini);
            renderTugasBaru(result.data.tugas_baru);
            renderUjianTerdekat(result.data.ujian_terdekat);
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
function renderWelcome(dosen) {
    const bannerName = document.getElementById('bannerDosenName');
    if (bannerName) bannerName.innerText = dosen.nama_dosen || 'Dosen';
}

// ==========================================
// RENDER STAT CARDS
// ==========================================
function renderStatCards(stat) {
    const container = document.getElementById('statCards');
    if (!container) return;
    
    container.innerHTML = `
        <!-- Kelas Diampu -->
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition">
            <div class="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                <i class="fa-solid fa-book text-xl"></i>
            </div>
            <div>
                <h3 class="text-2xl font-bold text-slate-800 leading-none">${stat.total_kelas || 0}</h3>
                <p class="text-xs text-slate-500 mt-1.5 font-medium">Kelas Diampu</p>
            </div>
        </div>
        
        <!-- Tugas Masuk -->
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition">
            <div class="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
                <i class="fa-solid fa-file-pen text-xl"></i>
            </div>
            <div>
                <h3 class="text-2xl font-bold text-slate-800 leading-none">${stat.total_pengumpulan || 0}</h3>
                <p class="text-xs text-slate-500 mt-1.5 font-medium">Tugas Masuk</p>
            </div>
        </div>
        
        <!-- Perlu Penilaian -->
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition">
            <div class="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <i class="fa-solid fa-triangle-exclamation text-xl"></i>
            </div>
            <div>
                <h3 class="text-2xl font-bold text-slate-800 leading-none">${stat.perlu_penilaian || 0}</h3>
                <p class="text-xs text-slate-500 mt-1.5 font-medium">Perlu Penilaian</p>
            </div>
        </div>
        
        <!-- Total Mahasiswa -->
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition">
            <div class="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <i class="fa-solid fa-user-graduate text-xl"></i>
            </div>
            <div>
                <h3 class="text-2xl font-bold text-slate-800 leading-none">${stat.total_mahasiswa || 0}</h3>
                <p class="text-xs text-slate-500 mt-1.5 font-medium">Total Mahasiswa</p>
            </div>
        </div>
    `;
}

// ==========================================
// RENDER JADWAL HARI INI
// ==========================================
function renderJadwalHariIni(jadwal, hariIni) {
    const container = document.getElementById('jadwalHariIni');
    const titleHariIni = document.getElementById('titleHariIni');
    
    if (titleHariIni) {
        titleHariIni.innerText = `Jadwal Mengajar Hari ${hariIni}`;
    }
    
    if (!container) return;
    
    if (!jadwal || jadwal.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-slate-400">
                <i class="fa-regular fa-calendar-check text-4xl mb-2 block opacity-30"></i>
                <p class="text-sm">Tidak ada jadwal mengajar hari ${hariIni}.</p>
                <p class="text-xs text-slate-400 mt-1">Nikmati waktu luang Anda! 🎉</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    jadwal.forEach(item => {
        html += `
            <div class="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-teal-50/30 transition">
                <div class="flex justify-between items-center gap-3">
                    <div class="flex-1 min-w-0">
                        <span class="text-xs font-semibold bg-teal-100 text-teal-700 px-2 py-0.5 rounded">
                            ${item.jam_mulai} - ${item.jam_selesai}
                        </span>
                        <h4 class="font-bold text-slate-800 text-sm mt-1.5 truncate">${item.nama_matkul || '-'}</h4>
                        <p class="text-xs text-slate-500 mt-0.5">${item.ruangan || '-'} • ${item.nama_kelas || '-'}</p>
                    </div>
                    <a href="dosen-absensi.html" class="bg-teal-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-teal-700 transition flex-shrink-0">
                        <i class="fa-solid fa-user-check mr-1"></i> Absensi
                    </a>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ==========================================
// RENDER TUGAS BARU
// ==========================================
function renderTugasBaru(tugas) {
    const container = document.getElementById('tugasBaru');
    if (!container) return;
    
    if (!tugas || tugas.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-slate-400">
                <i class="fa-regular fa-folder-open text-4xl mb-2 block opacity-30"></i>
                <p class="text-sm">Belum ada tugas yang dikumpulkan.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    tugas.forEach(item => {
        const belumDinilai = item.belum_dinilai;
        const statusClass = belumDinilai 
            ? 'bg-amber-50 text-amber-600' 
            : 'bg-emerald-50 text-emerald-600';
        const statusText = belumDinilai ? 'Belum Dinilai' : 'Sudah Dinilai';
        
        html += `
            <div class="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-teal-200 transition gap-3">
                <div class="flex items-center space-x-3 min-w-0 flex-1">
                    <div class="w-9 h-9 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center flex-shrink-0">
                        <i class="fa-solid fa-file-arrow-down text-sm"></i>
                    </div>
                    <div class="min-w-0 flex-1">
                        <p class="text-sm font-bold text-slate-800 truncate">${item.judul_tugas || '-'}</p>
                        <p class="text-xs text-slate-500 truncate">${item.nama_mahasiswa || '-'} • ${formatWaktuLalu(item.waktu_kumpul)}</p>
                    </div>
                </div>
                <span class="text-[10px] ${statusClass} font-bold px-2 py-1 rounded flex-shrink-0">${statusText}</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ==========================================
// RENDER UJIAN TERDEKAT
// ==========================================
function renderUjianTerdekat(ujian) {
    const container = document.getElementById('ujianTerdekat');
    if (!container) return;
    
    if (!ujian || ujian.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-slate-400 col-span-full">
                <i class="fa-regular fa-file-lines text-4xl mb-2 block opacity-30"></i>
                <p class="text-sm">Tidak ada ujian yang akan datang.</p>
            </div>
        `;
        return;
    }
    
    const jenisColors = {
        'UTS': 'bg-blue-50 text-blue-600 border-blue-100',
        'UAS': 'bg-purple-50 text-purple-600 border-purple-100',
        'Quiz': 'bg-amber-50 text-amber-600 border-amber-100',
        'Tugas Besar': 'bg-rose-50 text-rose-600 border-rose-100'
    };
    
    let html = '';
    ujian.forEach(item => {
        const jenisClass = jenisColors[item.jenis_ujian] || jenisColors['UTS'];
        
        html += `
            <div class="bg-slate-50 border border-slate-100 rounded-xl p-4 hover:bg-rose-50/30 transition">
                <div class="flex justify-between items-start mb-2 gap-2">
                    <div class="min-w-0 flex-1">
                        <p class="font-bold text-slate-800 text-sm truncate">${item.judul || '-'}</p>
                        <p class="text-xs text-slate-500 mt-0.5">${item.nama_matkul || '-'}</p>
                    </div>
                    <span class="${jenisClass} text-[10px] font-bold px-2 py-0.5 rounded-md border flex-shrink-0">${item.jenis_ujian || 'UTS'}</span>
                </div>
                <div class="text-xs text-slate-500 mt-2">
                    <i class="fa-regular fa-clock mr-1"></i>
                    ${formatTanggalWaktu(item.waktu_mulai)}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ==========================================
// HELPER: FORMAT WAKTU LALU
// ==========================================
function formatWaktuLalu(waktu) {
    if (!waktu) return '-';
    try {
        const tgl = new Date(String(waktu).replace(' ', 'T'));
        const now = new Date();
        const diffMs = now - tgl;
        const diffMenit = Math.floor(diffMs / (1000 * 60));
        
        if (diffMenit < 1) return 'Baru saja';
        if (diffMenit < 60) return `${diffMenit} menit lalu`;
        const diffJam = Math.floor(diffMenit / 60);
        if (diffJam < 24) return `${diffJam} jam lalu`;
        const diffHari = Math.floor(diffJam / 24);
        return `${diffHari} hari lalu`;
    } catch (e) {
        return '-';
    }
}

// ==========================================
// HELPER: FORMAT TANGGAL & WAKTU
// ==========================================
function formatTanggalWaktu(tanggalISO) {
    if (!tanggalISO) return '-';
    try {
        const date = new Date(String(tanggalISO).replace(' ', 'T') + '+08:00');
        if (isNaN(date.getTime())) return String(tanggalISO);
        
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
        return String(tanggalISO);
    }
}

// ==========================================
// SHOW ERROR
// ==========================================
function showError(message) {
    const container = document.querySelector('main .p-8');
    if (container) {
        container.innerHTML = `
            <div class="text-center py-16 text-red-400">
                <i class="fa-solid fa-circle-exclamation text-5xl mb-4 block"></i>
                <p class="text-sm font-medium">${message}</p>
                <button onclick="loadDashboard(currentUser.id_dosen)" 
                    class="mt-4 bg-teal-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-teal-600">
                    <i class="fa-solid fa-rotate mr-1"></i> Coba Lagi
                </button>
            </div>
        `;
    }
}
