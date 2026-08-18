// js/tugas.js - Halaman Tugas Mahasiswa

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Set Judul Halaman Header
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) pageTitle.innerText = 'Tugas';

    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) {
        window.location.href = '../login.html';
        return;
    }
    const user = JSON.parse(sessionData);

    // 2. Event Logout (Delegasi untuk tombol di sidebar komponen)
    document.addEventListener('click', function(e) {
        const logoutBtn = e.target.closest('#btnLogout');
        if (logoutBtn) {
            localStorage.removeItem('user_session');
            window.location.href = '../login.html';
        }
    });

    // 3. Muat Data Tugas (Kirim id_user untuk backend mencari id_mahasiswa)
    if (user.id_mahasiswa) {
        await loadTugas(user.id_mahasiswa);
    } else {
        document.getElementById('containerTugas').innerHTML = '<p class="text-red-500 col-span-3 text-center py-10">Error: Sesi tidak valid.</p>';
    }
});

async function loadTugas(id_user) {
    const container = document.getElementById('containerTugas');
    container.innerHTML = '<p class="text-center text-slate-400 py-10"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Memuat tugas...</p>';
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'get_tugas', id_user: id_user })
        });
        const result = await response.json();

        if (result.status === 'success') {
            container.innerHTML = '';
            if (result.data.length === 0) {
                container.innerHTML = '<p class="text-slate-500 col-span-3 text-center py-10">Belum ada tugas untuk mata kuliah Anda.</p>';
                return;
            }

            result.data.forEach(t => {
                const card = document.createElement('div');
                card.className = "bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all flex flex-col justify-between";
                
                // Jika sudah kumpul, tampilkan status, jika belum tampilkan tombol upload
                let actionHTML = '';
                if (t.sudah_kumpul) {
                    actionHTML = `
                        <div class="text-center text-xs text-green-600 bg-green-50 p-2 rounded-lg">
                            <i class="fa-solid fa-circle-check mr-1"></i> Sudah Dikumpulkan
                            ${t.nilai ? `<br><span class="font-bold text-slate-800">Nilai: ${t.nilai}</span>` : ''}
                            ${t.komentar_dosen ? `<br><span class="text-slate-500">Komentar: ${t.komentar_dosen}</span>` : ''}
                        </div>
                    `;
                } else {
                    actionHTML = `
                        <button onclick="bukaModalUploadTugas('${t.id_tugas}', '${t.judul_tugas}')" class="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold transition-colors">
                            <i class="fa-solid fa-cloud-arrow-up mr-2"></i> Upload Tugas
                        </button>
                    `;
                }

                card.innerHTML = `
                    <div>
                        <div class="flex justify-between items-start mb-3">
                            <span class="bg-indigo-50 text-indigo-600 text-xs font-bold px-2.5 py-1 rounded-md border border-indigo-100">${t.mata_kuliah}</span>
                            <span class="text-xs font-semibold text-slate-400">Bobot: ${t.bobot_nilai}</span>
                        </div>
                        <h3 class="text-lg font-bold text-slate-800 leading-tight mb-1">${t.judul_tugas}</h3>
                        <p class="text-sm text-slate-500 line-clamp-2">${t.deskripsi_instruksi}</p>
                        <div class="mt-3 text-xs text-slate-500 flex items-center">
                            <i class="fa-regular fa-clock mr-1"></i> Deadline: ${t.tenggat_waktu.replace('T', ' ')}
                        </div>
                        ${t.link_lampiran ? `<div class="mt-2 text-xs"><a href="${t.link_lampiran}" target="_blank" class="text-indigo-600 underline">📎 Lihat Lampiran Tugas</a></div>` : ''}
                    </div>
                    <div class="mt-5 pt-4 border-t border-slate-100">
                        ${actionHTML}
                    </div>
                `;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = `<p class="text-red-500 col-span-3 text-center py-10">Error: ${result.message}</p>`;
        }
    } catch (error) {
        console.error(error);
        container.innerHTML = `<p class="text-red-500 col-span-3 text-center py-10">❌ Gagal terhubung ke server.</p>`;
    }
}

// ==========================================
// FUNGSI UPLOAD TUGAS MAHASISWA
// ==========================================
function bukaModalUploadTugas(id_tugas, judul_tugas) {
    document.getElementById('upload_id_tugas').value = id_tugas;
    document.getElementById('modalUploadTugasTitle').innerText = `Upload: ${judul_tugas}`;
    document.getElementById('formUploadTugas').reset();
    document.getElementById('modalUploadTugas').classList.remove('hidden');
}

function tutupModal(id) {
    document.getElementById(id).classList.add('hidden');
}

// Helper: Ubah file ke Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

document.getElementById('formUploadTugas').addEventListener('submit', async function(e) {
    e.preventDefault();
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) return;
    const user = JSON.parse(sessionData);

    const btn = this.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Mengirim...';
    btn.disabled = true;

    const fileInput = document.getElementById('upload_file');
    let base64File = null, fileName = null;
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        if (file.size > 10 * 1024 * 1024) {
            alert('Ukuran file terlalu besar! Maksimal 10MB.');
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }
        fileName = file.name;
        base64File = await fileToBase64(file);
    }

    const data = {
        action: 'tambah_pengumpulan_tugas',
        id_tugas: document.getElementById('upload_id_tugas').value,
        id_mahasiswa: user.id_mahasiswa,
        file_base64: base64File,
        file_nama: fileName,
        folderType: 'pengumpulan_mahasiswa'  // <--- TAMBAHKAN BARIS INI
    };

    try {
        const res = await fetch(CONFIG.API_URL, { method: 'POST', body: JSON.stringify(data) });
        const result = await res.json();
        if (result.status === 'success') {
            alert('✅ ' + result.message);
            tutupModal('modalUploadTugas');
            location.reload(); // Refresh halaman agar status tugas berubah
        } else {
            alert('❌ Gagal: ' + result.message);
        }
    } catch (error) {
        console.error(error);
        alert('❌ Terjadi kesalahan koneksi.');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});
