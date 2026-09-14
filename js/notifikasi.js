// js/notifikasi.js - Sistem Notifikasi Frontend
// ✅ Dropdown + Badge + Auto-refresh

// ==========================================
// STATE
// ==========================================
let notifData = [];
let notifOpen = false;

// ==========================================
// INISIALISASI
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    setupNotifButton();
    // Auto-refresh notif setiap 60 detik
    setInterval(loadNotifikasiBadge, 60000);
});

// ==========================================
// SETUP TOMBOL NOTIFIKASI
// ==========================================
function setupNotifButton() {
    // Tombol lonceng (biasanya di header)
    const notifBtn = document.getElementById('btnNotifikasi') || 
                     document.querySelector('button:has(.fa-bell)');
    
    if (!notifBtn) {
        console.warn('Tombol notifikasi tidak ditemukan di header');
        return;
    }
    
    notifBtn.id = 'btnNotifikasi';
    notifBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleNotifDropdown();
    });
    
    // Buat dropdown container (kalau belum ada)
    if (!document.getElementById('notifDropdown')) {
        const dropdown = document.createElement('div');
        dropdown.id = 'notifDropdown';
        dropdown.className = 'hidden fixed bg-white rounded-2xl shadow-2xl border border-slate-200 z-[100] overflow-hidden';
        dropdown.style.width = '360px';
        dropdown.style.maxWidth = '90vw';
        dropdown.innerHTML = `
            <div class="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 class="text-sm font-bold text-slate-800">Notifikasi</h3>
                <button onclick="tandaiSemuaDibaca()" class="text-xs text-teal-600 hover:underline font-semibold">
                    Tandai semua dibaca
                </button>
            </div>
            <div id="notifList" class="max-h-96 overflow-y-auto">
                <div class="p-8 text-center text-slate-400">
                    <i class="fa-solid fa-circle-notch fa-spin text-2xl mb-2"></i>
                    <p class="text-sm">Memuat notifikasi...</p>
                </div>
            </div>
        `;
        document.body.appendChild(dropdown);
    }
    
    // Klik di luar → tutup
    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('notifDropdown');
        if (!dropdown || notifOpen === false) return;
        
        if (!dropdown.contains(e.target) && !e.target.closest('#btnNotifikasi')) {
            tutupNotifDropdown();
        }
    });
}

// ==========================================
// TOGGLE DROPDOWN
// ==========================================
function toggleNotifDropdown() {
    const dropdown = document.getElementById('notifDropdown');
    const btn = document.getElementById('btnNotifikasi');
    if (!dropdown) return;
    
    if (notifOpen) {
        tutupNotifDropdown();
    } else {
        // Posisikan di bawah tombol
        const rect = btn.getBoundingClientRect();
        dropdown.style.top = (rect.bottom + 8) + 'px';
        dropdown.style.right = (window.innerWidth - rect.right) + 'px';
        dropdown.style.left = 'auto';
        
        dropdown.classList.remove('hidden');
        notifOpen = true;
        loadNotifikasi();
    }
}

function tutupNotifDropdown() {
    const dropdown = document.getElementById('notifDropdown');
    if (dropdown) dropdown.classList.add('hidden');
    notifOpen = false;
}

// ==========================================
// LOAD NOTIFIKASI (LIST)
// ==========================================
async function loadNotifikasi() {
    const listContainer = document.getElementById('notifList');
    if (!listContainer) return;
    
    const user = JSON.parse(localStorage.getItem('user_session') || '{}');
    const idUser = user.id_user || user.id_mahasiswa || user.id_dosen;
    
    if (!idUser) {
        listContainer.innerHTML = '<p class="p-4 text-center text-slate-500 text-sm">Silakan login ulang.</p>';
        return;
    }
    
    listContainer.innerHTML = `
        <div class="p-8 text-center text-slate-400">
            <i class="fa-solid fa-circle-notch fa-spin text-2xl mb-2"></i>
            <p class="text-sm">Memuat notifikasi...</p>
        </div>
    `;
    
    try {
        const res = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'get_notifikasi',
                id_user: idUser
            })
        });
        
        const result = await res.json();
        
        if (result.status === 'success') {
            notifData = result.data;
            renderNotifikasi();
            updateBadge();
        } else {
            listContainer.innerHTML = `<p class="p-4 text-center text-red-500 text-sm">${result.message}</p>`;
        }
    } catch (error) {
        console.error('Error load notifikasi:', error);
        listContainer.innerHTML = '<p class="p-4 text-center text-red-500 text-sm">Gagal memuat notifikasi.</p>';
    }
}

// ==========================================
// RENDER NOTIFIKASI
// ==========================================
function renderNotifikasi() {
    const listContainer = document.getElementById('notifList');
    if (!listContainer) return;
    
    if (notifData.length === 0) {
        listContainer.innerHTML = `
            <div class="p-8 text-center">
                <i class="fa-solid fa-bell-slash text-slate-300 text-4xl mb-3"></i>
                <p class="text-slate-500 text-sm">Belum ada notifikasi.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    notifData.forEach(n => {
        // Warna & ikon per tipe
        const style = getNotifStyle(n.tipe);
        const isUnread = !n.sudah_dibaca;
        const bgUnread = isUnread ? 'bg-teal-50/50' : 'bg-white';
        const dotUnread = isUnread ? '<span class="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0 mt-1.5"></span>' : '';
        
        html += `
            <div onclick="handleClickNotif('${n.id_notif}', '${n.link || ''}', ${isUnread})" 
                class="${bgUnread} hover:bg-slate-50 p-3 border-b border-slate-100 cursor-pointer transition-colors flex gap-3 items-start">
                <div class="w-9 h-9 rounded-full ${style.bg} flex items-center justify-center flex-shrink-0">
                    <i class="fa-solid ${style.icon} ${style.color} text-sm"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold text-slate-800 line-clamp-1">${n.judul}</p>
                    <p class="text-xs text-slate-500 line-clamp-2 mt-0.5">${n.pesan}</p>
                    <p class="text-[10px] text-slate-400 mt-1">
                        <i class="fa-regular fa-clock mr-1"></i>${formatWaktu(n.waktu)}
                    </p>
                </div>
                ${dotUnread}
            </div>
        `;
    });
    
    listContainer.innerHTML = html;
}

// ==========================================
// STYLE PER TIPE
// ==========================================
function getNotifStyle(tipe) {
    switch(tipe) {
        case 'tugas':
        case 'pengumpulan':
            return { icon: 'fa-file-pen', bg: 'bg-teal-100', color: 'text-teal-600' };
        case 'nilai':
            return { icon: 'fa-star', bg: 'bg-amber-100', color: 'text-amber-600' };
        case 'ujian':
            return { icon: 'fa-pen-to-square', bg: 'bg-purple-100', color: 'text-purple-600' };
        case 'absensi':
            return { icon: 'fa-clipboard-check', bg: 'bg-blue-100', color: 'text-blue-600' };
        default:
            return { icon: 'fa-bell', bg: 'bg-slate-100', color: 'text-slate-600' };
    }
}

// ==========================================
// HANDLE KLIK NOTIFIKASI
// ==========================================
async function handleClickNotif(id_notif, link, isUnread) {
    // Tandai dibaca
    if (isUnread) {
        await tandaiNotifDibaca(id_notif);
    }
    
    // Redirect kalau ada link
    if (link && link.trim() !== '') {
        window.location.href = link;
    }
}

// ==========================================
// TANDAI DIBACA (SATU)
// ==========================================
async function tandaiNotifDibaca(id_notif) {
    const user = JSON.parse(localStorage.getItem('user_session') || '{}');
    const idUser = user.id_user || user.id_mahasiswa || user.id_dosen;
    
    try {
        await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'tandai_notif_dibaca',
                id_notif: id_notif,
                id_user: idUser
            })
        });
        
        // Update lokal
        const notif = notifData.find(n => n.id_notif === id_notif);
        if (notif) notif.sudah_dibaca = true;
        
        updateBadge();
    } catch (error) {
        console.error('Error tandai dibaca:', error);
    }
}

// ==========================================
// TANDAI SEMUA DIBACA
// ==========================================
async function tandaiSemuaDibaca() {
    const user = JSON.parse(localStorage.getItem('user_session') || '{}');
    const idUser = user.id_user || user.id_mahasiswa || user.id_dosen;
    
    if (!idUser) return;
    
    try {
        const res = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'tandai_semua_notif_dibaca',
                id_user: idUser
            })
        });
        
        const result = await res.json();
        if (result.status === 'success') {
            // Update lokal
            notifData.forEach(n => n.sudah_dibaca = true);
            renderNotifikasi();
            updateBadge();
        }
    } catch (error) {
        console.error('Error tandai semua:', error);
    }
}

// ==========================================
// UPDATE BADGE (jumlah belum dibaca)
// ==========================================
function updateBadge() {
    const badge = document.querySelector('#btnNotifikasi span') || 
                  document.querySelector('button .fa-bell ~ span');
    
    if (!badge) return;
    
    const unreadCount = notifData.filter(n => !n.sudah_dibaca).length;
    
    if (unreadCount > 0) {
        badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// ==========================================
// LOAD BADGE (untuk auto-refresh)
// ==========================================
async function loadNotifikasiBadge() {
    const user = JSON.parse(localStorage.getItem('user_session') || '{}');
    const idUser = user.id_user || user.id_mahasiswa || user.id_dosen;
    
    if (!idUser) return;
    
    try {
        const res = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'get_notifikasi',
                id_user: idUser
            })
        });
        
        const result = await res.json();
        if (result.status === 'success') {
            notifData = result.data;
            updateBadge();
        }
    } catch (error) {
        // Silent fail
    }
}

// ==========================================
// FORMAT WAKTU RELATIF
// ==========================================
function formatWaktu(waktuStr) {
    if (!waktuStr) return '-';
    
    try {
        const waktu = new Date(String(waktuStr).replace(' ', 'T'));
        const now = new Date();
        const diffMs = now - waktu;
        const diffMenit = Math.floor(diffMs / 60000);
        const diffJam = Math.floor(diffMs / 3600000);
        const diffHari = Math.floor(diffMs / 86400000);
        
        if (diffMenit < 1) return 'Baru saja';
        if (diffMenit < 60) return diffMenit + ' menit lalu';
        if (diffJam < 24) return diffJam + ' jam lalu';
        if (diffHari < 7) return diffHari + ' hari lalu';
        
        return waktu.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch (e) {
        return waktuStr;
    }
}
