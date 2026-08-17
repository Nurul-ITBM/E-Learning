// js/tugas.js - Menarik dan menampilkan data Tugas Mahasiswa

document.addEventListener('DOMContentLoaded', async () => {
    const sessionData = localStorage.getItem('user_session');
    
    // 1. Set Judul Halaman di Header Komponen
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) pageTitle.innerText = 'Tugas Saya';

    // 2. Cek apakah ada sesi login
    if (!sessionData) {
        window.location.href = '../login.html';
        return;
    }

    const user = JSON.parse(sessionData);

    // 3. Logout dengan Event Delegation (Karena tombol ada di komponen dinamis)
    document.addEventListener('click', function(e) {
        const logoutBtn = e.target.closest('#btnLogout');
        if (logoutBtn) {
            localStorage.removeItem('user_session');
            window.location.href = '../login.html';
        }
    });

    // 4. Panggil data tugas
    if (user.id_mahasiswa) {
        await loadTugasMahasiswa(user.id_mahasiswa);
    } else {
        const container = document.getElementById('containerTugas');
        if (container) container.innerHTML = '<p class="text-red-500 text-center py-10">Error: ID Mahasiswa tidak ditemukan.</p>';
    }
});

async function loadTugasMahasiswa(id_mahasiswa) {
    const container = document.getElementById('containerTugas');
    container.innerHTML = '<p class="text-center py-10 text-slate-400"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Memuat tugas...</p>';

    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'get_tugas', id_mahasiswa: id_mahasiswa })
        });
        const result = await response.json();

        if (result.status === 'success') {
            container.innerHTML = '';
            if (!result.data || result.data.length === 0) {
                container.innerHTML = '<p class="text-center py-10 text-slate-500">Belum ada tugas yang diberikan.</p>';
                return;
            }

            result.data.forEach(tugas => {
                const card = document.createElement('div');
                card.className = "bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all flex flex-col justify-between";
                
                // Tentukan status dan warna badge berdasarkan status pengumpulan
                let statusText = tugas.sudah_kumpul ? 'Sudah Dikumpulkan' : 'Belum Dikumpulkan';
                let statusColor = tugas.sudah_kumpul ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';

                // Jika sudah dinilai, tampilkan nilainya
                let nilaiDisplay = '';
                if (tugas.nilai && tugas.nilai > 0) {
                    nilaiDisplay = `<span class="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full ml-2">Nilai: ${tugas.nilai}</span>`;
                }

                card.innerHTML = `
                    <div>
                        <div class="flex justify-between items-start mb-3">
                            <span class="text-xs font-semibold text-slate-400">${tugas.mata_kuliah || 'Mata Kuliah'}</span>
                            <span class="text-xs font-bold text-slate-400">${tugas.bobot_nilai || '-'} SKS</span>
                        </div>
                        <h3 class="text-lg font-bold text-slate-800 leading-tight mb-1">${tugas.judul_tugas}</h3>
                        <p class="text-sm text-slate-500 mb-3 line-clamp-2">${tugas.deskripsi_instruksi || 'Tidak ada deskripsi.'}</p>
                        <div class="flex items-center justify-between text-xs text-slate-500">
                            <span><i class="fa-regular fa-clock mr-1"></i> Deadline: ${tugas.tenggat_waktu || '-'}</span>
                            <span class="${statusColor} px-2 py-1 rounded-full font-medium">${statusText}</span>
                        </div>
                        ${nilaiDisplay ? `<div class="mt-2 text-xs text-right">${nilaiDisplay}</div>` : ''}
                    </div>
                    <div class="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center gap-3">
                        ${tugas.link_lampiran ? `<a href="${tugas.link_lampiran}" target="_blank" class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition">📎 Lihat Lampiran</a>` : '<span class="text-xs text-slate-400">Tidak ada lampiran</span>'}
                        <button onclick="alert('Fitur upload tugas belum diimplementasikan')" class="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition" ${tugas.sudah_kumpul ? 'disabled' : ''}>${tugas.sudah_kumpul ? 'Sudah Dikumpulkan' : 'Kumpulkan'}</button>
                    </div>
                `;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = `<p class="text-red-500 text-center py-10">${result.message || 'Gagal memuat data'}</p>`;
        }
    } catch (error) {
        console.error('Error loading tugas:', error);
        container.innerHTML = `<p class="text-red-500 text-center py-10">❌ Gagal terhubung ke server.<br><small>${error.message}</small></p>`;
    }
}
