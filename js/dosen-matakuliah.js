// js/dosen-matakuliah.js - Data Kelas Ampuan Dosen (Dinamis)

document.addEventListener('DOMContentLoaded', async () => {
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) {
        window.location.href = '../login.html';
        return;
    }
    const user = JSON.parse(sessionData);
    if (user.role !== 'dosen') {
        alert('Anda bukan dosen!');
        window.location.href = '../login.html';
        return;
    }

    // Logout
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('user_session');
            window.location.href = '../login.html';
        });
    }

    // Tampilkan nama dosen di header
    if (document.getElementById('dosenNameDisplay')) {
        document.getElementById('dosenNameDisplay').innerText = user.nama_dosen || 'Dosen';
    }
    
    if (user.id_dosen) {
        await loadKelasDosen(user.id_dosen);
    } else {
        const container = document.getElementById('containerMatkulDosen');
        if (container) container.innerHTML = '<p class="text-red-500 col-span-3 text-center py-10">Error: ID Dosen tidak ditemukan.</p>';
    }
});

async function loadKelasDosen(id_dosen) {
    const container = document.getElementById('containerMatkulDosen');
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'get_matakuliah_ampuan',
                id_dosen: id_dosen 
            })
        });
        const result = await response.json();

        if (result.status === 'success') {
            container.innerHTML = ''; 
            if (!result.data || result.data.length === 0) {
                container.innerHTML = '<p class="text-slate-500 col-span-3 text-center py-10">Belum ada kelas yang diampu.</p>';
                return;
            }

            result.data.forEach(item => {
                const card = document.createElement('div');
                card.className = "bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-teal-200 hover:shadow-md transition-all flex flex-col justify-between";
                
                card.innerHTML = `
                    <div>
                        <div class="flex justify-between items-start mb-3">
                            <span class="bg-teal-50 text-teal-600 text-xs font-bold px-2.5 py-1 rounded-md border border-teal-100">Semester ${item.semester || '-'}</span>
                            <span class="text-xs font-semibold text-slate-400">${item.kode_mk || '-'} - ${item.sks || '-'} SKS</span>
                        </div>
                        <h3 class="text-lg font-bold text-slate-800 leading-tight mb-1">${item.mata_kuliah || 'Mata Kuliah'}</h3>
                        <p class="text-sm text-slate-500 mb-4 flex items-center"><i class="fa-solid fa-chalkboard-user mr-2 text-slate-400"></i> ${item.dosen_pengampu || 'Dosen Pengampu'}</p>
                        <div class="bg-teal-50 p-3 rounded-lg border border-teal-100 flex items-center justify-between">
                            <span class="text-xs font-bold text-teal-700"><i class="fa-solid fa-list-check mr-2"></i> Rekap Kelas</span>
                            <span class="text-xs font-bold text-teal-700 bg-white px-3 py-1 rounded-full border border-teal-200">${item.total_pertemuan || 0} Pertemuan</span>
                        </div>
                    </div>
                    <div class="mt-5">
                        <button onclick="bukaModalDetail('${item.id_kelas}', '${item.mata_kuliah}')" class="w-full bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center shadow-sm">
                            <i class="fa-solid fa-door-open mr-1.5"></i> Lihat / Kelola Kelas
                        </button>
                    </div>
                `;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = `<p class="text-red-500 col-span-3 text-center py-10">Error: ${result.message || 'Data tidak dapat dimuat'}</p>`;
        }
    } catch (error) {
        console.error('Error loading kelas:', error);
        container.innerHTML = `<p class="text-red-500 col-span-3 text-center py-10">❌ Gagal terhubung ke server.</p>`;
    }
}

// --- FUNGSI MODAL (Sama persis seperti mahasiswa) ---
function formatTanggal(isoString) { /* ... */ }
function formatJam(isoString) { /* ... */ }
async function bukaModalDetail(id_kelas, nama_matkul) { /* ... */ }
function tutupModalDetail() { /* ... */ }
