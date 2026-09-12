// js/admin-backup.js
// Logika Backup Database Admin

let currentUser = null;
let allBackups = [];

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
    await loadListBackup();

    // Event listeners
    document.getElementById('btnRefresh').addEventListener('click', loadListBackup);
    document.getElementById('btnBackup').addEventListener('click', buatBackup);
});

// ==========================================
// LOAD LIST BACKUP
// ==========================================
async function loadListBackup() {
    const container = document.getElementById('containerTabel');
    container.innerHTML = `
        <div class="text-center py-12 text-slate-400">
            <i class="fa-solid fa-circle-notch fa-spin text-4xl mb-3 block"></i>
            <p class="text-sm">Memuat riwayat backup...</p>
        </div>
    `;
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'get_list_backup' })
        });
        const result = await response.json();
        console.log(">>> List backup:", result);

        if (result.status === 'success') {
            allBackups = result.data || [];
            updateStatCards();
            renderTabel(allBackups);
        } else {
            container.innerHTML = `<p class="text-red-500 text-center py-10">${result.message}</p>`;
        }
    } catch (error) {
        console.error("Error load backup:", error);
        container.innerHTML = `<p class="text-red-500 text-center py-10">Gagal terhubung ke server.</p>`;
    }
}

// ==========================================
// UPDATE STAT CARDS
// ==========================================
function updateStatCards() {
    document.getElementById('statTotal').innerText = allBackups.length;
    
    if (allBackups.length > 0) {
        // Backup terakhir
        const terakhir = allBackups[0];
        const tgl = new Date(terakhir.tanggal);
        const diffMs = new Date() - tgl;
        const diffHari = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffJam = Math.floor(diffMs / (1000 * 60 * 60));
        
        let labelTerakhir = '';
        if (diffHari > 0) labelTerakhir = `${diffHari} hari lalu`;
        else if (diffJam > 0) labelTerakhir = `${diffJam} jam lalu`;
        else labelTerakhir = 'Baru saja';
        
        document.getElementById('statTerakhir').innerText = labelTerakhir;
        
        // Total ukuran
        const totalBytes = allBackups.reduce((sum, b) => sum + parseInt(b.ukuran || 0), 0);
        const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
        document.getElementById('statUkuran').innerText = totalMB + ' MB';
    } else {
        document.getElementById('statTerakhir').innerText = '-';
        document.getElementById('statUkuran').innerText = '0 MB';
    }
}

// ==========================================
// RENDER TABEL
// ==========================================
function renderTabel(data) {
    const container = document.getElementById('containerTabel');
    
    if (data.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-slate-400">
                <i class="fa-solid fa-database text-4xl mb-3 block opacity-30"></i>
                <p class="text-sm">Belum ada backup.</p>
                <p class="text-xs text-slate-400 mt-1">Klik "Buat Backup Sekarang" untuk membuat backup pertama.</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-slate-700 uppercase font-bold text-xs">
                <tr>
                    <th class="px-4 py-3">No</th>
                    <th class="px-4 py-3">Nama File</th>
                    <th class="px-4 py-3">Tanggal</th>
                    <th class="px-4 py-3">Ukuran</th>
                    <th class="px-4 py-3 text-center">Aksi</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    data.forEach((backup, idx) => {
        html += `
            <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
                <td class="px-4 py-3 text-slate-600 font-medium">${idx + 1}</td>
                <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                            <i class="fa-solid fa-file-zipper text-sm"></i>
                        </div>
                        <div class="min-w-0">
                            <p class="font-bold text-slate-800 text-xs truncate">${backup.nama || '-'}</p>
                            <p class="text-[10px] text-slate-400 truncate">${backup.id || '-'}</p>
                        </div>
                    </div>
                </td>
                <td class="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                    ${formatWaktu(backup.tanggal)}
                </td>
                <td class="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                    ${formatUkuran(backup.ukuran)}
                </td>
                <td class="px-4 py-3">
                    <div class="flex justify-center gap-1">
                        <a href="${backup.url}" target="_blank" 
                            class="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition" title="Download">
                            <i class="fa-solid fa-download"></i>
                        </a>
                        <button onclick="konfirmasiHapus('${backup.id}', '${(backup.nama || '').replace(/'/g, "\\'")}')" 
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
// BUAT BACKUP
// ==========================================
async function buatBackup() {
    if (!confirm('Buat backup database sekarang?\n\nProses ini akan menyalin seluruh database ke Google Drive.')) {
        return;
    }
    
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.remove('hidden');
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'backup_database' })
        });
        const result = await response.json();
        console.log(">>> Backup result:", result);

        if (result.status === 'success') {
            alert(`✅ ${result.message}\n\nFile: ${result.data.nama_file}\n\nBackup tersimpan di Google Drive Anda.`);
            await loadListBackup();
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        console.error("Error backup:", error);
        alert('❌ Terjadi kesalahan koneksi.');
    } finally {
        overlay.classList.add('hidden');
    }
}

// ==========================================
// KONFIRMASI HAPUS BACKUP
// ==========================================
async function konfirmasiHapus(fileId, namaFile) {
    if (!confirm(`Hapus backup "${namaFile}"?\n\nFile akan dipindahkan ke Trash Google Drive.`)) {
        return;
    }
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'delete_backup',
                file_id: fileId
            })
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            alert('✅ ' + result.message);
            await loadListBackup();
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        console.error("Error hapus backup:", error);
        alert('❌ Terjadi kesalahan koneksi.');
    }
}

// ==========================================
// HELPER: FORMAT WAKTU
// ==========================================
function formatWaktu(waktu) {
    if (!waktu) return '-';
    try {
        const date = new Date(waktu);
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
// HELPER: FORMAT UKURAN
// ==========================================
function formatUkuran(bytes) {
    if (!bytes) return '-';
    const size = parseInt(bytes);
    
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
    return (size / (1024 * 1024)).toFixed(2) + ' MB';
}
