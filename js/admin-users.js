// js/admin-users.js
// Logika Kelola Users Admin

let currentUser = null;
let allUsers = [];
let pendingUsers = [];
let currentTab = 'all';

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
    
    if (currentUser.role !== 'admin') {
        alert('Akses ditolak. Anda bukan admin.');
        window.location.href = '../login.html';
        return;
    }

    // Tunggu DOM
    await new Promise(resolve => setTimeout(resolve, 300));

    // Load data
    await loadAllUsers();
    await loadPendingUsers();
    
    // Update badge
    updatePendingBadge();

    // Event listeners
    document.getElementById('btnRefresh').addEventListener('click', async () => {
        await loadAllUsers();
        await loadPendingUsers();
    });

    document.getElementById('searchInput').addEventListener('input', applyFilter);
    document.getElementById('filterRole').addEventListener('change', applyFilter);
    document.getElementById('filterStatus').addEventListener('change', applyFilter);

    // Form submit
    document.getElementById('formEditUser').addEventListener('submit', simpanEditUser);
    document.getElementById('formResetPassword').addEventListener('submit', simpanResetPassword);
});

// ==========================================
// LOAD ALL USERS
// ==========================================
async function loadAllUsers() {
    const container = document.getElementById('containerTabel');
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'get_all_users' })
        });
        const result = await response.json();
        console.log(">>> All users:", result);

        if (result.status === 'success') {
            allUsers = result.data || [];
            updateStatCards();
            if (currentTab === 'all') renderTabel(allUsers);
        } else {
            container.innerHTML = `<p class="text-red-500 text-center py-10">${result.message}</p>`;
        }
    } catch (error) {
        console.error("Error load users:", error);
        container.innerHTML = `<p class="text-red-500 text-center py-10">Gagal terhubung ke server.</p>`;
    }
}

// ==========================================
// LOAD PENDING USERS
// ==========================================
async function loadPendingUsers() {
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'get_pending_users' })
        });
        const result = await response.json();
        console.log(">>> Pending users:", result);

        if (result.status === 'success') {
            pendingUsers = result.data || [];
            updatePendingBadge();
            updateStatCards();
        }
    } catch (error) {
        console.error("Error load pending:", error);
    }
}

// ==========================================
// UPDATE STAT CARDS
// ==========================================
function updateStatCards() {
    document.getElementById('statTotal').innerText = allUsers.length;
    document.getElementById('statMahasiswa').innerText = allUsers.filter(u => u.role === 'mahasiswa').length;
    document.getElementById('statDosen').innerText = allUsers.filter(u => u.role === 'dosen').length;
    document.getElementById('statPending').innerText = pendingUsers.length;
}

// ==========================================
// UPDATE PENDING BADGE
// ==========================================
function updatePendingBadge() {
    const badge = document.getElementById('badgePending');
    if (!badge) return;
    
    if (pendingUsers.length > 0) {
        badge.innerText = pendingUsers.length;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

// ==========================================
// SWITCH TAB
// ==========================================
function switchTab(tab) {
    currentTab = tab;
    
    const tabAll = document.getElementById('tabAll');
    const tabPending = document.getElementById('tabPending');
    
    if (tab === 'all') {
        tabAll.className = 'flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition bg-orange-50 text-orange-600';
        tabPending.className = 'flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition text-slate-500 hover:bg-slate-50';
        renderTabel(allUsers);
    } else {
        tabPending.className = 'flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition bg-amber-50 text-amber-600';
        tabAll.className = 'flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition text-slate-500 hover:bg-slate-50';
        renderTabelPending(pendingUsers);
    }
}

// ==========================================
// RENDER TABEL (SEMUA USER)
// ==========================================
function renderTabel(data) {
    const container = document.getElementById('containerTabel');
    
    if (data.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-slate-400">
                <i class="fa-regular fa-folder-open text-4xl mb-3 block opacity-30"></i>
                <p class="text-sm">Belum ada user.</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-slate-700 uppercase font-bold text-xs">
                <tr>
                    <th class="px-4 py-3">No</th>
                    <th class="px-4 py-3">Nama</th>
                    <th class="px-4 py-3">Username</th>
                    <th class="px-4 py-3">Role</th>
                    <th class="px-4 py-3">Status</th>
                    <th class="px-4 py-3 text-center">Aksi</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    data.forEach((user, idx) => {
        // Warna badge role
        const roleColors = {
            'admin': 'bg-purple-50 text-purple-600 border-purple-200',
            'dosen': 'bg-teal-50 text-teal-600 border-teal-200',
            'mahasiswa': 'bg-blue-50 text-blue-600 border-blue-200'
        };
        const roleClass = roleColors[user.role] || 'bg-slate-50 text-slate-600 border-slate-200';
        
        // Status badge
        const statusClass = user.status_aktif 
            ? 'bg-green-50 text-green-600 border-green-200' 
            : 'bg-red-50 text-red-600 border-red-200';
        const statusLabel = user.status_aktif ? 'Aktif' : 'Nonaktif';
        
        html += `
            <tr class="border-b border-slate-100 hover:bg-slate-50">
                <td class="px-4 py-3 text-slate-600 font-medium">${idx + 1}</td>
                <td class="px-4 py-3">
                    <p class="font-bold text-slate-800">${user.nama || '-'}</p>
                    <p class="text-[10px] text-slate-500">${user.detail || '-'}</p>
                </td>
                <td class="px-4 py-3 text-slate-600 text-xs">${user.username || '-'}</td>
                <td class="px-4 py-3">
                    <span class="${roleClass} text-[10px] font-bold px-2.5 py-1 rounded-md border uppercase">${user.role || '-'}</span>
                </td>
                <td class="px-4 py-3">
                    <span class="${statusClass} text-[10px] font-bold px-2.5 py-1 rounded-md border">${statusLabel}</span>
                </td>
                <td class="px-4 py-3">
                    <div class="flex justify-center gap-1">
                        <button onclick="bukaModalEdit('${user.id_user}')" 
                            class="text-orange-600 hover:bg-orange-50 p-2 rounded-lg transition" title="Edit">
                            <i class="fa-solid fa-edit"></i>
                        </button>
                        <button onclick="bukaModalReset('${user.id_user}')" 
                            class="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition" title="Reset Password">
                            <i class="fa-solid fa-key"></i>
                        </button>
                        <button onclick="hapusUser('${user.id_user}', '${(user.nama || '').replace(/'/g, "\\'")}')" 
                            class="text-red-600 hover:bg-red-50 p-2 rounded-lg transition" title="Hapus">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
}

// ==========================================
// RENDER TABEL PENDING
// ==========================================
function renderTabelPending(data) {
    const container = document.getElementById('containerTabel');
    
    if (data.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-slate-400">
                <i class="fa-regular fa-circle-check text-4xl mb-3 block opacity-30"></i>
                <p class="text-sm">Tidak ada permohonan akun baru.</p>
                <p class="text-xs text-slate-400 mt-1">Semua permohonan sudah diproses! ✅</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <table class="w-full text-left text-sm">
            <thead class="bg-amber-50 text-amber-800 uppercase font-bold text-xs">
                <tr>
                    <th class="px-4 py-3">No</th>
                    <th class="px-4 py-3">Nama</th>
                    <th class="px-4 py-3">Username</th>
                    <th class="px-4 py-3">Role</th>
                    <th class="px-4 py-3">Tanggal Daftar</th>
                    <th class="px-4 py-3 text-center">Aksi</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    data.forEach((user, idx) => {
        const roleColors = {
            'dosen': 'bg-teal-50 text-teal-600 border-teal-200',
            'mahasiswa': 'bg-blue-50 text-blue-600 border-blue-200'
        };
        const roleClass = roleColors[user.role] || 'bg-slate-50 text-slate-600 border-slate-200';
        
        html += `
            <tr class="border-b border-amber-100 hover:bg-amber-50/50">
                <td class="px-4 py-3 text-slate-600 font-medium">${idx + 1}</td>
                <td class="px-4 py-3">
                    <p class="font-bold text-slate-800">${user.nama || '-'}</p>
                    <p class="text-[10px] text-slate-500">${user.detail || '-'}</p>
                </td>
                <td class="px-4 py-3 text-slate-600 text-xs">${user.username || '-'}</td>
                <td class="px-4 py-3">
                    <span class="${roleClass} text-[10px] font-bold px-2.5 py-1 rounded-md border uppercase">${user.role || '-'}</span>
                </td>
                <td class="px-4 py-3 text-xs text-slate-500">
                    ${formatWaktu(user.tanggal_daftar)}
                </td>
                <td class="px-4 py-3">
                    <div class="flex justify-center gap-1">
                        <button onclick="verifikasiUser('${user.id_user}', 'approve')" 
                            class="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                            <i class="fa-solid fa-check"></i> Setujui
                        </button>
                        <button onclick="verifikasiUser('${user.id_user}', 'reject')" 
                            class="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                            <i class="fa-solid fa-times"></i> Tolak
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
}

// ==========================================
// APPLY FILTER
// ==========================================
function applyFilter() {
    if (currentTab === 'pending') return;  // Skip filter di tab pending
    
    const search = document.getElementById('searchInput').value.toLowerCase();
    const role = document.getElementById('filterRole').value;
    const status = document.getElementById('filterStatus').value;
    
    let filtered = [...allUsers];
    
    if (search) {
        filtered = filtered.filter(u => 
            (u.nama || '').toLowerCase().includes(search) ||
            (u.username || '').toLowerCase().includes(search) ||
            (u.detail || '').toLowerCase().includes(search)
        );
    }
    
    if (role) {
        filtered = filtered.filter(u => u.role === role);
    }
    
    if (status) {
        const isAktif = status === 'aktif';
        filtered = filtered.filter(u => u.status_aktif === isAktif);
    }
    
    renderTabel(filtered);
}

// ==========================================
// BUKA MODAL EDIT USER
// ==========================================
function bukaModalEdit(id_user) {
    const user = allUsers.find(u => u.id_user === id_user);
    if (!user) return;
    
    document.getElementById('editIdUser').value = user.id_user;
    document.getElementById('editNama').innerText = user.nama || '-';
    document.getElementById('editUsername').innerText = user.username || '-';
    document.getElementById('editRole').value = user.role || 'mahasiswa';
    document.getElementById('editStatus').value = user.status_aktif ? 'true' : 'false';
    
    document.getElementById('modalEditUser').classList.remove('hidden');
}

// ==========================================
// SIMPAN EDIT USER
// ==========================================
async function simpanEditUser(e) {
    e.preventDefault();
    
    const id_user = document.getElementById('editIdUser').value;
    const role = document.getElementById('editRole').value;
    const status_aktif = document.getElementById('editStatus').value === 'true';
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'update_user',
                id_user: id_user,
                role: role,
                status_aktif: status_aktif
            })
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            alert('✅ ' + result.message);
            tutupModal('modalEditUser');
            await loadAllUsers();
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        alert('❌ Terjadi kesalahan koneksi.');
    }
}

// ==========================================
// BUKA MODAL RESET PASSWORD
// ==========================================
function bukaModalReset(id_user) {
    const user = allUsers.find(u => u.id_user === id_user);
    if (!user) return;
    
    document.getElementById('resetIdUser').value = user.id_user;
    document.getElementById('resetNama').innerText = user.nama || '-';
    document.getElementById('resetPasswordBaru').value = '';
    
    document.getElementById('modalResetPassword').classList.remove('hidden');
}

// ==========================================
// SIMPAN RESET PASSWORD
// ==========================================
async function simpanResetPassword(e) {
    e.preventDefault();
    
    const id_user = document.getElementById('resetIdUser').value;
    const password_baru = document.getElementById('resetPasswordBaru').value;
    
    if (password_baru.length < 6) {
        alert('⚠️ Password minimal 6 karakter.');
        return;
    }
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'reset_password_user',
                id_user: id_user,
                password_baru: password_baru
            })
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            alert('✅ ' + result.message);
            tutupModal('modalResetPassword');
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        alert('❌ Terjadi kesalahan koneksi.');
    }
}

// ==========================================
// VERIFIKASI USER (APPROVE / REJECT)
// ==========================================
async function verifikasiUser(id_user, aksi) {
    const pesan = aksi === 'approve' 
        ? 'Setujui akun ini?' 
        : 'Tolak akun ini?';
    
    if (!confirm(pesan)) return;
    
    let alasan = '';
    if (aksi === 'reject') {
        alasan = prompt('Alasan penolakan (opsional):') || '';
    }
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'verifikasi_user',
                id_user: id_user,
                aksi: aksi,
                alasan: alasan
            })
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            alert('✅ ' + result.message);
            await loadAllUsers();
            await loadPendingUsers();
            renderTabelPending(pendingUsers);
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        alert('❌ Terjadi kesalahan koneksi.');
    }
}

// ==========================================
// HAPUS USER
// ==========================================
async function hapusUser(id_user, nama) {
    if (!confirm(`Hapus user "${nama}"?\n\nTindakan ini tidak bisa dibatalkan!`)) return;
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'delete_user',
                id_user: id_user
            })
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            alert('✅ ' + result.message);
            await loadAllUsers();
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        alert('❌ Terjadi kesalahan koneksi.');
    }
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
// =
