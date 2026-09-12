// js/admin-log.js
// Logika Log Aktivitas Admin

let currentUser = null;
let allLogs = [];

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
    await loadLogAktivitas();

    // Event listeners
    document.getElementById('btnRefresh').addEventListener('click', loadLogAktivitas);
    document.getElementById('searchInput').addEventListener('input', applyFilter);
    document.getElementById('filterAksi').addEventListener('change', applyFilter);
});

// ==========================================
// LOAD LOG AKTIVITAS
// ==========================================
async function loadLogAktivitas() {
    const container = document.getElementById('containerTabel');
    container.innerHTML = `
        <div class="text-center py-12 text-slate-400">
            <i class="fa-solid fa-circle-notch fa-spin text-4xl mb-3 block"></i>
            <p class="text-sm">Memuat log aktivitas...</p>
        </div>
    `;
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'get_log_aktivitas' })
        });
        const result = await response.json();
        console.log(">>> Log aktivitas:", result);

        if (result.status === 'success') {
            allLogs = result.data || [];
            updateStatCards();
            renderTabel(allLogs);
        } else {
            container.innerHTML = `<p class="text-red-500 text-center py-10">${result.message}</p>`;
        }
    } catch (error) {
        console.error("Error load log:", error);
        container.innerHTML = `<p class="text-red-500 text-center py-10">Gagal terhubung ke server.</p>`;
    }
}

// ==========================================
// UPDATE STAT CARDS
// ==========================================
function updateStatCards() {
    document.getElementById('statTotal').innerText = allLogs.length;
    document.getElementById('statLogin').innerText = allLogs.filter(l => 
        (l.aksi || '').toLowerCase().includes('login')
    ).length;
    document.getElementById('statVerifikasi').innerText = allLogs.filter(l => 
        (l.aksi || '').toLowerCase().includes('verifikasi') || 
        (l.aksi || '').toLowerCase().includes('approve')
    ).length;
    document.getElementById('statBackup').innerText = allLogs.filter(l => 
        (l.aksi || '').toLowerCase().includes('backup')
    ).length;
}

// ==========================================
// RENDER TABEL
// ==========================================
function renderTabel(data) {
    const container = document.getElementById('containerTabel');
    
    if (data.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-slate-400">
                <i class="fa-regular fa-folder-open text-4xl mb-3 block opacity-30"></i>
                <p class="text-sm">Belum ada log aktivitas.</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-slate-700 uppercase font-bold text-xs">
                <tr>
                    <th class="px-4 py-3">No</th>
                    <th class="px-4 py-3">Waktu</th>
                    <th class="px-4 py-3">User</th>
                    <th class="px-4 py-3">Aksi</th>
                    <th class="px-4 py-3">Detail</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    data.forEach((log, idx) => {
        // Warna badge berdasarkan aksi
        let badgeClass = 'bg-slate-100 text-slate-600 border-slate-200';
        let iconClass = 'fa-circle-info';
        
        const aksi = String(log.aksi || '').toLowerCase();
        
        if (aksi.includes('login')) {
            badgeClass = 'bg-blue-50 text-blue-600 border-blue-200';
            iconClass = 'fa-right-to-bracket';
        } else if (aksi.includes('verifikasi') || aksi.includes('approve')) {
            badgeClass = 'bg-green-50 text-green-600 border-green-200';
            iconClass = 'fa-check-circle';
        } else if (aksi.includes('tolak') || aksi.includes('reject')) {
            badgeClass = 'bg-red-50 text-red-600 border-red-200';
            iconClass = 'fa-times-circle';
        } else if (aksi.includes('hapus') || aksi.includes('delete')) {
            badgeClass = 'bg-red-50 text-red-600 border-red-200';
            iconClass = 'fa-trash';
        } else if (aksi.includes('update')) {
            badgeClass = 'bg-amber-50 text-amber-600 border-amber-200';
            iconClass = 'fa-edit';
        } else if (aksi.includes('backup')) {
            badgeClass = 'bg-purple-50 text-purple-600 border-purple-200';
            iconClass = 'fa-database';
        } else if (aksi.includes('reset')) {
            badgeClass = 'bg-cyan-50 text-cyan-600 border-cyan-200';
            iconClass = 'fa-key';
        }
        
        html += `
            <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
                <td class="px-4 py-3 text-slate-600 font-medium">${idx + 1}</td>
                <td class="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    ${formatWaktu(log.waktu)}
                </td>
                <td class="px-4 py-3">
                    <span class="font-bold text-slate-800 text-xs">${log.username || '-'}</span>
                </td>
                <td class="px-4 py-3">
                    <span class="${badgeClass} text-[10px] font-bold px-2.5 py-1 rounded-md border inline-flex items-center gap-1">
                        <i class="fa-solid ${iconClass}"></i> ${log.aksi || '-'}
                    </span>
                </td>
                <td class="px-4 py-3 text-xs text-slate-600">${log.detail || '-'}</td>
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
    const search = document.getElementById('searchInput').value.toLowerCase();
    const aksi = document.getElementById('filterAksi').value;
    
    let filtered = [...allLogs];
    
    if (search) {
        filtered = filtered.filter(l => 
            (l.username || '').toLowerCase().includes(search) ||
            (l.aksi || '').toLowerCase().includes(search) ||
            (l.detail || '').toLowerCase().includes(search)
        );
    }
    
    if (aksi) {
        filtered = filtered.filter(l => (l.aksi || '') === aksi);
    }
    
    renderTabel(filtered);
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
            second: '2-digit',
            timeZone: 'Asia/Makassar',
            hour12: false
        };
        
        return date.toLocaleString('id-ID', options);
    } catch (e) {
        return String(waktu);
    }
}
