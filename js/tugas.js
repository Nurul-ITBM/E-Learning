// js/tugas.js - Halaman Tugas Mahasiswa (VERSI FIXED)

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Set Judul Halaman Header
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) pageTitle.innerText = 'Tugas';

    // 2. Ambil Session - PERBAIKAN: gunakan 'user' bukan 'user_session'
    const sessionData = localStorage.getItem('user') || localStorage.getItem('user_session');
    if (!sessionData) {
        window.location.href = '../login.html';
        return;
    }
    
    let user;
    try {
        user = JSON.parse(sessionData);
    } catch (e) {
        console.error('Session tidak valid:', e);
        window.location.href = '../login.html';
        return;
    }

    // 3. Event Logout (Delegasi untuk tombol di sidebar komponen)
    document.addEventListener('click', function(e) {
        const logoutBtn = e.target.closest('#btnLogout');
        if (logoutBtn) {
            localStorage.removeItem('user');
            localStorage.removeItem('user_session');
            window.location.href = '../login.html';
        }
    });

    // 4. Muat Data Tugas
    // PERBAIKAN: Kirim id_user jika ada, atau id_mahasiswa langsung
    const identifier = user.id_user || user.id_mahasiswa;
    
    if (identifier) {
        await loadTugas(identifier);
    } else {
        document.getElementById('containerTugas').innerHTML = '<p class="text-red-500 col-span-3 text-center py-10">Error: Data user tidak lengkap.</p>';
    }
});

async function loadTugas(identifier) {
    const container = document.getElementById('containerTugas');
    container.innerHTML = '<p class="text-center text-slate-400 py-10"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Memuat tugas...</p>';
    
    try {
        console.log(">>> Loading tugas dengan identifier:", identifier);
        
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({ 
                action: 'get_tugas', 
                id_user: identifier  // PERBAIKAN: kirim sebagai id_user
            })
        });

        // Cek apakah response valid
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log(">>> Response dari server:", result);

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
                        <button onclick="bukaModalUploadTugas('${t.id_tugas}', '${t.judul_tugas.replace(/'/g, "\\'")}')" class="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold transition-colors">
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
                            <i class="fa-regular fa-clock mr-1"></i> Deadline: ${t.tenggat_waktu ? t.tenggat_waktu.replace('T', ' ') : 'Tidak ditentukan'}
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
        console.error("Error loading tugas:", error);
        container.innerHTML = `
            <div class="col-span-full bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <i class="fa-solid fa-circle-xmark text-red-500 text-3xl mb-2"></i>
                <p class="text-red-600 font-medium">❌ Gagal terhubung ke server.</p>
                <p class="text-red-400 text-sm mt-1">${error.message}</p>
                <button onclick="loadTugas('${identifier}')" class="mt-3 bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600">
                    <i class="fa-solid fa-rotate mr-1"></i> Coba Lagi
                </button>
            </div>
        `;
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

// ==========================================
// VALIDASI UKURAN FILE SAAT PILIH FILE
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('upload_file');
    
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && file.size > 10 * 1024 * 1024) { // 10MB
                alert('File terlalu besar! Maksimal 10MB.');
                this.value = ''; // Reset input
            }
        });
    }
});

// ==========================================
// SUBMIT UPLOAD TUGAS
// ==========================================
document.getElementById('formUploadTugas').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Ambil session - PERBAIKAN
    const sessionData = localStorage.getItem('user') || localStorage.getItem('user_session');
    if (!sessionData) {
        alert('Sesi tidak valid. Silakan login ulang.');
        window.location.href = '../login.html';
        return;
    }
    
    const user = JSON.parse(sessionData);

    const btn = this.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Mengirim...';
    btn.disabled = true;

    try {
        const fileInput = document.getElementById('upload_file');
        let base64File = null, fileName = null;
        
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            
            // Validasi ukuran file
            if (file.size > 10 * 1024 * 1024) {
                alert('Ukuran file terlalu besar! Maksimal 10MB.');
                btn.innerHTML = originalText;
                btn.disabled = false;
                return;
            }
            
            // Validasi tipe file
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'image/jpeg', 'image/png'];
            if (!allowedTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.doc') && !file.name.endsWith('.docx') && !file.name.endsWith('.zip') && !file.name.endsWith('.jpg') && !file.name.endsWith('.jpeg') && !file.name.endsWith('.png')) {
                alert('Format file tidak didukung! Gunakan PDF, DOCX, ZIP, atau gambar.');
                btn.innerHTML = originalText;
                btn.disabled = false;
                return;
            }
            
            fileName = file.name;
            base64File = await fileToBase64(file);
        } else {
            alert('Silakan pilih file terlebih dahulu!');
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }

        // PERBAIKAN: id_mahasiswa dari user
        const idMahasiswa = user.id_mahasiswa || user.id_user;
        
        if (!idMahasiswa) {
            alert('Data mahasiswa tidak ditemukan. Silakan login ulang.');
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }

        const data = {
            action: 'tambah_pengumpulan_tugas',
            id_tugas: document.getElementById('upload_id_tugas').value,
            id_mahasiswa: idMahasiswa,
            file_base64: base64File,
            file_nama: fileName
        };
        
        console.log(">>> DATA YANG AKAN DIKIRIM:", JSON.stringify(data));

        const res = await fetch(CONFIG.API_URL, { 
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(data) 
        });
        
        // Cek response
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const result = await res.json();
        console.log(">>> Response upload:", result);
        
        if (result.status === 'success') {
            alert('✅ ' + result.message);
            tutupModal('modalUploadTugas');
            // Refresh halaman agar status tugas berubah
            setTimeout(() => {
                location.reload();
            }, 1000);
        } else {
            alert('❌ Gagal: ' + result.message);
        }
    } catch (error) {
        console.error("Error upload:", error);
        alert('❌ Terjadi kesalahan: ' + error.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});
