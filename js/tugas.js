// js/tugas.js - Halaman Tugas Mahasiswa (VERSI DENGAN JENIS TUGAS)
// Fitur: Tampilkan Tugas + Praktikum dengan badge & filter

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Set Judul Halaman Header
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) pageTitle.innerText = 'Tugas & Praktikum';

    // 2. Ambil Session
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

    // 3. Event Logout
    document.addEventListener('click', function(e) {
        const logoutBtn = e.target.closest('#btnLogout');
        if (logoutBtn) {
            localStorage.removeItem('user');
            localStorage.removeItem('user_session');
            window.location.href = '../login.html';
        }
    });

    // 4. Setup Filter Tab
    setupFilterTab();

    // 5. Muat Data Tugas
    const identifier = user.id_user || user.id_mahasiswa;
    
    if (identifier) {
        await loadTugas(identifier);
    } else {
        document.getElementById('containerTugas').innerHTML = 
            '<p class="text-red-500 col-span-3 text-center py-10">Error: Data user tidak lengkap.</p>';
    }
});

// ==========================================
// SIMPAN DATA TUGAS GLOBAL (untuk filter)
// ==========================================
let allTugasData = [];
let currentFilter = 'Semua'; // 'Semua' | 'Tugas' | 'Praktikum'

// ==========================================
// SETUP FILTER TAB
// ==========================================
function setupFilterTab() {
    const filterButtons = document.querySelectorAll('[data-filter]');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            currentFilter = this.dataset.filter;
            
            // Update visual
            filterButtons.forEach(b => {
                b.classList.remove('bg-indigo-500', 'text-white');
                b.classList.add('bg-white', 'text-slate-600', 'border', 'border-slate-200');
            });
            this.classList.add('bg-indigo-500', 'text-white');
            this.classList.remove('bg-white', 'text-slate-600', 'border', 'border-slate-200');
            
            // Re-render
            renderTugas();
        });
    });
}

// ==========================================
// LOAD TUGAS
// ==========================================
async function loadTugas(identifier) {
    const container = document.getElementById('containerTugas');
    container.innerHTML = '<p class="text-center text-slate-400 py-10 col-span-full"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Memuat tugas...</p>';
    
    try {
        console.log(">>> Loading tugas dengan identifier:", identifier);
        
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({ 
                action: 'get_tugas', 
                id_user: identifier
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log(">>> Response dari server:", result);

        if (result.status === 'success') {
            // Simpan data global untuk filter
            allTugasData = result.data || [];
            
            // Update statistik
            updateStatistik(allTugasData);
            
            // Render
            renderTugas();
        } else {
            container.innerHTML = `<p class="text-red-500 col-span-full text-center py-10">Error: ${result.message}</p>`;
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
// RENDER TUGAS (dengan filter)
// ==========================================
function renderTugas() {
    const container = document.getElementById('containerTugas');
    
    // Filter berdasarkan currentFilter
    let filteredData = allTugasData;
    if (currentFilter === 'Tugas') {
        filteredData = allTugasData.filter(t => (t.jenis_tugas || 'Tugas').toLowerCase() === 'tugas');
    } else if (currentFilter === 'Praktikum') {
        filteredData = allTugasData.filter(t => (t.jenis_tugas || 'Tugas').toLowerCase() === 'praktikum');
    }
    
    container.innerHTML = '';
    
    if (filteredData.length === 0) {
        const msg = currentFilter === 'Semua' 
            ? 'Belum ada tugas untuk mata kuliah Anda.'
            : `Belum ada ${currentFilter.toLowerCase()}.`;
        container.innerHTML = `<p class="text-slate-500 col-span-full text-center py-10">${msg}</p>`;
        return;
    }

    filteredData.forEach(t => {
        // ✅ Tentukan jenis tugas
        const isPraktikum = (t.jenis_tugas || 'Tugas').toLowerCase() === 'praktikum';
        
        // Warna & ikon badge
        const badgeColor = isPraktikum 
            ? 'bg-purple-100 text-purple-700 border-purple-200' 
            : 'bg-indigo-50 text-indigo-600 border-indigo-100';
        const badgeIcon = isPraktikum ? 'fa-flask-vial' : 'fa-file-pen';
        const badgeText = isPraktikum ? 'Praktikum' : 'Tugas';
        
        // Warna border hover card
        const hoverBorder = isPraktikum ? 'hover:border-purple-300' : 'hover:border-indigo-300';
        
        // Tombol upload warna
        const btnColor = isPraktikum 
            ? 'bg-purple-500 hover:bg-purple-600' 
            : 'bg-indigo-500 hover:bg-indigo-600';
        
        const card = document.createElement('div');
        card.className = `bg-white p-6 rounded-2xl shadow-sm border border-slate-100 ${hoverBorder} hover:shadow-md transition-all flex flex-col justify-between`;
        
        // ✅ Action HTML
        let actionHTML = '';
        if (t.sudah_kumpul) {
            // Sudah dikumpulkan
            const nilaiHTML = t.nilai ? `<br><span class="font-bold text-slate-800">Nilai: ${t.nilai}</span>` : '';
            const komentarHTML = t.komentar_dosen ? `<br><span class="text-slate-500 text-[10px] italic">"${t.komentar_dosen}"</span>` : '';
            
            actionHTML = `
                <div class="text-center text-xs text-green-600 bg-green-50 p-3 rounded-lg border border-green-100">
                    <i class="fa-solid fa-circle-check mr-1"></i> <span class="font-semibold">Sudah Dikumpulkan</span>
                    ${nilaiHTML}
                    ${komentarHTML}
                </div>
            `;
        } else {
            // Belum dikumpulkan
            actionHTML = `
                <button onclick="bukaModalUploadTugas('${t.id_tugas}', '${t.judul_tugas.replace(/'/g, "\\'")}')" class="w-full ${btnColor} text-white py-2 rounded-lg text-sm font-bold transition-colors">
                    <i class="fa-solid fa-cloud-arrow-up mr-2"></i> Upload ${isPraktikum ? 'Laporan' : 'Tugas'}
                </button>
            `;
        }
        
        // ✅ Cek deadline (lewat atau belum)
        let deadlineHTML = '';
        if (t.tenggat_waktu) {
            const deadline = new Date(t.tenggat_waktu.replace(' ', 'T'));
            const now = new Date();
            const isLewat = now > deadline;
            
            deadlineHTML = `
                <span class="${isLewat ? 'text-red-500 font-semibold' : 'text-slate-500'}">
                    <i class="fa-regular fa-clock mr-1"></i> 
                    ${isLewat ? 'Lewat: ' : 'Deadline: '}
                    ${t.tenggat_waktu.replace('T', ' ')}
                </span>
            `;
        } else {
            deadlineHTML = `<span class="text-slate-500"><i class="fa-regular fa-clock mr-1"></i> Tidak ditentukan</span>`;
        }
        
        card.innerHTML = `
            <div>
                <div class="flex justify-between items-start mb-3 gap-2">
                    <span class="${badgeColor} text-xs font-bold px-2.5 py-1 rounded-md border flex items-center gap-1 flex-shrink-0">
                        <i class="fa-solid ${badgeIcon}"></i> ${badgeText}
                    </span>
                    <span class="text-xs font-semibold text-slate-400 flex-shrink-0">Bobot: ${t.bobot_nilai}</span>
                </div>
                <div class="mb-2">
                    <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">${t.mata_kuliah}</p>
                </div>
                <h3 class="text-lg font-bold text-slate-800 leading-tight mb-2">${t.judul_tugas}</h3>
                <p class="text-sm text-slate-500 line-clamp-2 mb-3">${t.deskripsi_instruksi}</p>
                <div class="text-xs flex items-center mb-2">
                    ${deadlineHTML}
                </div>
                ${t.link_lampiran ? `<div class="text-xs mb-2"><a href="${t.link_lampiran}" target="_blank" class="text-indigo-600 hover:underline"><i class="fa-solid fa-paperclip mr-1"></i>Lihat Lampiran</a></div>` : ''}
            </div>
            <div class="mt-4 pt-4 border-t border-slate-100">
                ${actionHTML}
            </div>
        `;
        container.appendChild(card);
    });
}

// ==========================================
// UPDATE STATISTIK (jumlah tugas & praktikum)
// ==========================================
function updateStatistik(data) {
    const totalTugas = data.length;
    const totalPraktikum = data.filter(t => (t.jenis_tugas || 'Tugas').toLowerCase() === 'praktikum').length;
    const totalTugasBiasa = totalTugas - totalPraktikum;
    const belumKumpul = data.filter(t => !t.sudah_kumpul).length;
    
    // Update elemen statistik
    const elTotal = document.getElementById('statTotal');
    const elTugas = document.getElementById('statTugas');
    const elPraktikum = document.getElementById('statPraktikum');
    const elBelum = document.getElementById('statBelum');
    
    if (elTotal) elTotal.innerText = totalTugas;
    if (elTugas) elTugas.innerText = totalTugasBiasa;
    if (elPraktikum) elPraktikum.innerText = totalPraktikum;
    if (elBelum) elBelum.innerText = belumKumpul;
    
    // Update badge di filter
    const filterTugasBadge = document.getElementById('filterTugasCount');
    const filterPraktikumBadge = document.getElementById('filterPraktikumCount');
    
    if (filterTugasBadge) filterTugasBadge.innerText = totalTugasBiasa;
    if (filterPraktikumBadge) filterPraktikumBadge.innerText = totalPraktikum;
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
            if (file && file.size > 10 * 1024 * 1024) {
                alert('File terlalu besar! Maksimal 10MB.');
                this.value = '';
            }
        });
    }
});

// ==========================================
// SUBMIT UPLOAD TUGAS
// ==========================================
document.getElementById('formUploadTugas').addEventListener('submit', async function(e) {
    e.preventDefault();
    
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
            
            if (file.size > 10 * 1024 * 1024) {
                alert('Ukuran file terlalu besar! Maksimal 10MB.');
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
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const result = await res.json();
        console.log(">>> Response upload:", result);
        
        if (result.status === 'success') {
            alert('✅ ' + result.message);
            tutupModal('modalUploadTugas');
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
