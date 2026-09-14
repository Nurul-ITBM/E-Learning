// js/notifikasi.js - Sistem Notifikasi Frontend
// ✅ Kirim role di setiap fetch (mahasiswa/dosen/admin)
// ✅ Dropdown + Badge + Auto-refresh

// ==========================================
// STATE
// ==========================================
let notifData = [];
let notifOpen = false;
let notifAutoRefreshInterval = null;

// ==========================================
// AMBIL USER & ROLE DARI SESSION
// ==========================================
function getUserIdFromSession() {
    try {
        const user = JSON.parse(localStorage.getItem('user_session') || '{}');
        return user.id_user || user.id_mahasiswa || user.id_dosen || null;
    } catch (e) {
        return null;
    }
}

function getUserRoleFromSession() {
    try {
        const user = JSON.parse(localStorage.getItem('user_session') || '{}');
        return (user.role || '').toLowerCase().trim() || null;
    } catch (e) {
        return null;
    }
}

// ==========================================
// SETUP TOMBOL NOTIFIKASI
// ==========================================
function setupNotifButton() {
    const notifBtn = document.getElementById('btnNotifikasi');
    
    if (!notifBtn) {
        console.warn('⚠️ Tombol #btnNotifikasi tidak ditemukan di header');
        return;
    }
    
    // Hapus listener lama
    const newBtn = notifBtn.cloneNode(true);
    notifBtn.parentNode.replaceChild(newBtn, notifBtn);
    
    newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleNotifDropdown();
    });
    
    // Buat dropdown (kalau belum ada)
    if (!document.getElementById('notifDropdown')) {
        buatDropdownContainer();
    }
    
    // Klik di luar → tutup
    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('notifDropdown');
        if (!dropdown || !notifOpen) return;
        
        if (!dropdown.contains(e.target) && !e.target.closest('#btnNotifikasi')) {
            tutupNotifDropdown();
        }
    });
    
    // Auto-refresh setiap 60 detik
    if (notifAutoRefreshInterval) clearInterval(notifAutoRefreshInterval);
    notifAutoRefreshInterval = setInterval(loadNotifikasiBadge, 60000);
    
    console.log('✅ Setup notifikasi selesai');
}

// ==========================================
// BUAT DROPDOWN
// ==========================================
function buatDropdownContainer() {
    const dropdown = document.createElement('div');
    dropdown.id = 'notifDropdown';
    dropdown.className = 'hidden fixed bg-white rounded-2xl shadow-2xl border border-slate-200 z-[100] overflow-hidden';
    dropdown.style.width = '360px';
    dropdown.style.maxWidth = '90vw';
    dropdown.innerHTML = `
        <div class="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 class="text-sm font-bold text-slate-800">
                <i class="fa-solid fa-bell text-slate-600 mr-1"></i> Notifikasi
            </h3>
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

// ==========================================
// TOGGLE DROPDOWN
// ==========================================
function toggleNotifDropdown() {
    const dropdown = document.getElementById('notifDropdown');
    const btn = document.getElementById('btnNotifikasi');
    if (!dropdown || !btn) return;
    
    if (notifOpen) {
        tutupNotifDropdown();
    } else {
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
// LOAD NOTIFIKASI (LIST) — Kirim role
// ==========================================
async function loadNotifikasi() {
    const listContainer = document.getElementById('notifList');
    if (!listContainer) return;
    
    const idUser = getUserIdFromSession();
    const role = getUserRoleFromSession();
    
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
                id_user: idUser,
                role: role                // ✅ KIRIM ROLE
            })
        });
        
        const result = await res.json();
        
        if (result.status === 'success') {
            notifData = result.data || [];
            renderNotifikasi();
            updateBadge();
        } else {
            listContainer.innerHTML = `<p class="p-4 text-center text-red-500 text-sm">${result.message || 'Gagal memuat'}</p>`;
        }
    } catch (error) {
        console.error('Error load notifikasi:', error);
        listContainer.innerHTML = `
            <div class="p-6 text-center">
                <i class="fa-solid fa-circle-xmark text-red-400 text-3xl mb-2"></i>
                <p class="text-red-500 text-sm">Gagal memuat notifikasi.</p>
                <button onclick="loadNotifikasi()" class="mt-3 bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold">
                    <i class="fa-solid fa-rotate mr-1"></i> Coba Lagi
                </button>
            </div>
        `;
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
        const style = getNotifStyle(n.tipe);
        const isUnread = !n.sudah_dibaca;
        const bgUnread = isUnread ? 'bg-teal-50/50' : 'bg-white';
        const dotUnread = isUnread 
            ? '<span class="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0 mt-1.5"></span>' 
            : '';
        
        // Escape link
        const linkSafe = String(n.link || '').replace(/'/g, "\\'");
        
        html += `
            <div onclick="handleClickNotif('${n.id_notif}', '${linkSafe}', ${isUnread})" 
                class="${bgUnread} hover:bg-slate-50 p-3 border-b border-slate-100 cursor-pointer transition-colors flex gap-3 items-start">
                <div class="w-9 h-9 rounded-full ${style.bg} flex items-center justify-center flex-shrink-0">
                    <i class="fa-solid ${style.icon} ${style.color} text-sm"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold text-slate-800 line-clamp-1">${n.judul || '-'}</p>
                    <p class="text-xs text-slate-500 line-clamp-2 mt-0.5">${n.pesan || '-'}</p>
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
    if (isUnread) {
        await tandaiNotifDibaca(id_notif);
    }
    
    if (link && link.trim() !== '' && link !== 'undefined') {
        setTimeout(() => {
            window.location.href = link;
        }, 200);
    }
}

// ==========================================
// TANDAI DIBACA (SATU)
// ==========================================
async function tandaiNotifDibaca(id_notif) {
    const idUser = getUserIdFromSession();
    const role = getUserRoleFromSession();
    
    if (!idUser) return;
    
    try {
        await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'tandai_notif_dibaca',
                id_notif: id_notif,
                id_user: idUser,
                role: role               // ✅ KIRIM ROLE
            })
        });
        
        const notif = notifData.find(n => n.id_notif === id_notif);
        if (notif) notif.sudah_dibaca = true;
        
        updateBadge();
    } catch (error) {
        console.error('Error tandai dibaca:', error);
    }
}

// ==========================================
// TANDAI SEMUA DIBACA — Kirim role
// ==========================================
async function tandaiSemuaDibaca() {
    const idUser = getUserIdFromSession();
    const role = getUserRoleFromSession();
    
    if (!idUser) return;
    
    try {
        const res = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'tandai_semua_notif_dibaca',
                id_user: idUser,
                role: role               // ✅ KIRIM ROLE
            })
        });
        
        const result = await res.json();
        if (result.status === 'success') {
            notifData.forEach(n => n.sudah_dibaca = true);
            renderNotifikasi();
            updateBadge();
        }
    } catch (error) {
        console.error('Error tandai semua:', error);
    }
}

// ==========================================
// UPDATE BADGE (setelah render list)
// ==========================================
function updateBadge() {
    const unreadCount = notifData.filter(n => !n.sudah_dibaca).length;
    updateBadgeOnly(unreadCount);
}

// ==========================================
// UPDATE BADGE ONLY
// ==========================================
function updateBadgeOnly(count) {
    const badge = document.getElementById('notifBadge');
    const badgeCount = document.getElementById('notifBadgeCount');
    
    if (!badge || !badgeCount) return;
    
    if (count > 0) {
        badgeCount.textContent = count > 99 ? '99+' : count;
        badge.classList.remove('hidden');
        badge.classList.add('flex');
    } else {
        badge.classList.add('hidden');
        badge.classList.remove('flex');
    }
}

// ==========================================
// LOAD BADGE — Kirim role, pakai get_jumlah_notif
// ==========================================
async function loadNotifikasiBadge() {
    const idUser = getUserIdFromSession();
    const role = getUserRoleFromSession();
    
    if (!idUser) return;
    
    try {
        const res = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'get_jumlah_notif',
                id_user: idUser,
                role: role                // ✅ KIRIM ROLE
            })
        });
        
        const result = await res.json();
        if (result.status === 'success') {
            const count = result.data || 0;
            updateBadgeOnly(count);
        }
    } catch (error) {
        console.warn('Gagal load badge notif:', error);
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
