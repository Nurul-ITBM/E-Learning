// js/dosen-tugas.js
// Fitur: Kelola Tugas + Jenis Tugas (Tugas / Praktikum)

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

    // 1. Set Judul Halaman di Header Komponen
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) pageTitle.innerText = 'Kelola Tugas';

    // 2. Load dropdown kelas
    await loadKelasDropdown(user.id_dosen);
});

// ==========================================
// 1. LOAD DROPDOWN KELAS
// ==========================================
async function loadKelasDropdown(id_dosen) {
    const select = document.getElementById('filterKelasDosen');
    const btnTambah = document.getElementById('btnTambahTugas');
    
    if (!id_dosen) {
        console.error("ID Dosen tidak ditemukan di session!");
        return;
    }

    try {
        console.log(">>> Mengambil kelas untuk ID Dosen:", id_dosen);
        const res = await fetch(CONFIG.API_URL, { 
            method: 'POST', 
            body: JSON.stringify({ action: 'get_kelas_dosen', id_dosen: id_dosen }) 
        });
        
        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
        
        const result = await res.json();
        console.log(">>> Response Kelas Dosen:", result);

        if (result.status === 'success') {
            if (result.data.length > 0) {
                let html = '<option value="">-- Pilih Mata Kuliah --</option>';
                result.data.forEach(k => { 
                    html += `<option value="${k.id_kelas}">${k.nama_kelas}</option>`; 
                });
                select.innerHTML = html;
                btnTambah.disabled = false;
                
                select.addEventListener('change', async (e) => {
                    const idKelas = e.target.value;
                    if (idKelas) {
                        document.getElementById('containerPengumpulanTugas').innerHTML = 
                            '<p class="text-sm text-slate-500 italic text-center py-10">Pilih tugas di sebelah kiri.</p>';
                        document.getElementById('judulTugasTerpilih').innerText = '(Pilih tugas)';
                        await loadProgressTugas(idKelas);
                    } else {
                        document.getElementById('containerProgressTugas').innerHTML = 
                            '<p class="text-sm text-slate-500 italic text-center py-6">Silakan pilih mata kuliah di dropdown atas.</p>';
                        document.getElementById('containerPengumpulanTugas').innerHTML = '';
                    }
                });
            } else {
                select.innerHTML = '<option value="">Belum ada kelas yang diampu</option>';
                btnTambah.disabled = true;
            }
        } else {
            console.error("Gagal mengambil data kelas:", result.message);
            select.innerHTML = `<option value="">Error: ${result.message}</option>`;
            btnTambah.disabled = true;
        }
    } catch (error) {
        console.error("ERROR di loadKelasDropdown:", error);
        select.innerHTML = `<option value="">Error load data</option>`;
        btnTambah.disabled = true;
    }
}

// ==========================================
// 2. LOAD PROGRESS TUGAS (CHART KIRI)
// ✅ Dengan Skeleton Loading & Error Handling
// ==========================================
let dataProgressTugas = [];

async function loadProgressTugas(id_kelas) {
    const container = document.getElementById('containerProgressTugas');
    
    // ==========================================
    // SKELETON LOADING
    // ==========================================
    container.innerHTML = Array(3).fill(`
        <div class="bg-white border border-slate-100 rounded-xl p-4 animate-pulse">
            <div class="flex justify-between items-start mb-2">
                <div class="flex-1">
                    <div class="h-3 bg-slate-200 rounded w-24 mb-2"></div>
                    <div class="h-4 bg-slate-200 rounded w-3/4"></div>
                </div>
                <div class="h-5 bg-slate-200 rounded w-10"></div>
            </div>
            <div class="h-3 bg-slate-200 rounded w-full mb-1"></div>
            <div class="h-2 bg-slate-200 rounded w-full"></div>
        </div>
    `).join('');

    // ==========================================
    // FETCH DATA
    // ==========================================
    try {
        const res = await fetch(CONFIG.API_URL, { 
            method: 'POST', 
            body: JSON.stringify({ 
                action: 'get_progress_tugas', 
                id_kelas: id_kelas 
            }) 
        });
        
        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
        
        const result = await res.json();
        console.log('>>> Response progress tugas:', result);

        // ==========================================
        // HANDLE RESPONSE
        // ==========================================
        if (result.status === 'success') {
            dataProgressTugas = result.data;
            container.innerHTML = ''; 
            
            // Empty state
            if (result.data.length === 0) {
                container.innerHTML = `
                    <p class="text-slate-500 text-center py-4">
                        Belum ada tugas untuk kelas ini.
                    </p>
                `;
                return;
            }
            
            // Render setiap tugas
            result.data.forEach(tugas => {
                const persentase = tugas.total_mahasiswa > 0 
                    ? Math.round((tugas.sudah_kumpul / tugas.total_mahasiswa) * 100) 
                    : 0;
                
                // ✅ Tentukan jenis tugas (Tugas / Praktikum)
                const isPraktikum = (tugas.jenis_tugas || 'Tugas').toLowerCase() === 'praktikum';
                const badgeColor = isPraktikum 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-teal-100 text-teal-700';
                const badgeIcon = isPraktikum ? 'fa-flask-vial' : 'fa-file-pen';
                const badgeText = isPraktikum ? 'Praktikum' : 'Tugas';
                const borderHover = isPraktikum 
                    ? 'hover:border-purple-300' 
                    : 'hover:border-teal-300';
                const progressColor = isPraktikum ? 'bg-purple-600' : 'bg-teal-600';
                
                const card = document.createElement('div');
                card.className = `bg-slate-50 hover:bg-white border border-slate-200 ${borderHover} rounded-xl p-4 cursor-pointer transition-all shadow-sm relative`;
                card.onclick = () => loadPengumpulanTugas(tugas.id_tugas, tugas.judul_tugas);
                
                card.innerHTML = `
                    <div class="flex justify-between items-start mb-2">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 text-[10px] mb-1 flex-wrap">
                                <span class="${badgeColor} px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                    <i class="fa-solid ${badgeIcon}"></i> ${badgeText}
                                </span>
                                <span class="text-slate-500">
                                    <i class="fa-regular fa-calendar mr-1"></i> Pertemuan ke-${tugas.pertemuan_ke || '-'}
                                </span>
                            </div>
                            <h4 class="text-sm font-bold text-slate-800 line-clamp-1">${tugas.judul_tugas}</h4>
                        </div>
                        <span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full ml-2 flex-shrink-0">${tugas.bobot_nilai}</span>
                    </div>
                    <div class="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>Deadline: ${tugas.tenggat_waktu.replace('T', ' ')}</span>
                        <span>${tugas.sudah_kumpul}/${tugas.total_mahasiswa} Kumpul</span>
                    </div>
                    <div class="w-full bg-slate-200 rounded-full h-2">
                        <div class="${progressColor} h-2 rounded-full transition-all duration-500" style="width: ${persentase}%"></div>
                    </div>
                `;
                container.appendChild(card);
            });
            
        } else {
            // Error dari backend
            container.innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                    <i class="fa-solid fa-circle-exclamation text-red-500 text-2xl mb-2"></i>
                    <p class="text-red-600 text-sm font-medium">Gagal memuat data</p>
                    <p class="text-red-400 text-xs mt-1">${result.message || 'Error tidak diketahui'}</p>
                    <button onclick="loadProgressTugas('${id_kelas}')" 
                        class="mt-3 bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                        <i class="fa-solid fa-rotate mr-1"></i> Coba Lagi
                    </button>
                </div>
            `;
        }
        
    } catch (error) { 
        console.error('Error loadProgressTugas:', error);
        container.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <i class="fa-solid fa-circle-xmark text-red-500 text-2xl mb-2"></i>
                <p class="text-red-600 text-sm font-medium">Gagal terhubung ke server</p>
                <p class="text-red-400 text-xs mt-1">${error.message}</p>
                <button onclick="loadProgressTugas('${id_kelas}')" 
                    class="mt-3 bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                    <i class="fa-solid fa-rotate mr-1"></i> Coba Lagi
                </button>
            </div>
        `;
    }
}

// ==========================================
// 3. LOAD PENGUMPULAN & PENILAIAN (CHART KANAN)
// ✅ Dengan Skeleton Loading & Error Handling
// ==========================================
async function loadPengumpulanTugas(id_tugas, judul_tugas) {
    document.getElementById('judulTugasTerpilih').innerText = ` (${judul_tugas})`;
    const container = document.getElementById('containerPengumpulanTugas');
    
    // ==========================================
    // SKELETON LOADING
    // ==========================================
    container.innerHTML = `
        <div class="animate-pulse space-y-3">
            <div class="h-10 bg-slate-100 rounded"></div>
            <div class="h-12 bg-slate-50 rounded"></div>
            <div class="h-12 bg-slate-50 rounded"></div>
            <div class="h-12 bg-slate-50 rounded"></div>
            <div class="h-12 bg-slate-50 rounded"></div>
        </div>
    `;

    // ==========================================
    // FETCH DATA
    // ==========================================
    try {
        const res = await fetch(CONFIG.API_URL, { 
            method: 'POST', 
            body: JSON.stringify({ 
                action: 'get_pengumpulan_tugas', 
                id_tugas: id_tugas 
            }) 
        });
        
        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
        
        const result = await res.json();
        console.log('>>> Response pengumpulan tugas:', result);

        // ==========================================
        // HANDLE RESPONSE
        // ==========================================
        if (result.status === 'success') {
            
            // Empty state
            if (result.data.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-10">
                        <i class="fa-solid fa-inbox text-slate-300 text-5xl mb-3"></i>
                        <p class="text-slate-500 italic">Belum ada mahasiswa yang mengumpulkan tugas ini.</p>
                    </div>
                `;
                return;
            }
            
            // Render tabel
            let html = `
                <table class="w-full text-sm text-left text-slate-600 min-w-[700px]">
                    <thead class="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                        <tr>
                            <th class="px-4 py-3">NIM</th>
                            <th class="px-4 py-3">Nama</th>
                            <th class="px-4 py-3 hidden md:table-cell">Waktu Kumpul</th>
                            <th class="px-4 py-3">File</th>
                            <th class="px-4 py-3 text-center">Nilai</th>
                            <th class="px-4 py-3 hidden lg:table-cell w-1/4">Komentar</th>
                            <th class="px-4 py-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
            `;
            
            result.data.forEach(k => {
                const statusBg = k.nilai > 0 
                    ? 'bg-green-50 text-green-700' 
                    : (k.status === 'Tepat Waktu' ? 'bg-slate-50' : 'bg-red-50 text-red-700');
                
                html += `
                    <tr class="hover:bg-slate-50/50">
                        <td class="px-4 py-3 font-medium">${k.nim}</td>
                        <td class="px-4 py-3">${k.nama_mahasiswa}</td>
                        <td class="px-4 py-3 hidden md:table-cell text-xs">${k.waktu_kumpul}</td>
                        <td class="px-4 py-3">
                            <a href="${k.nama_file}" target="_blank" 
                                class="text-teal-600 hover:underline text-xs">
                                📄 Lihat File
                            </a>
                        </td>
                        <td class="px-4 py-3 text-center">
                            <span class="px-3 py-1 rounded-full text-xs font-semibold ${statusBg}">
                                ${k.nilai || '-'}
                            </span>
                        </td>
                        <td class="px-4 py-3 hidden lg:table-cell text-xs text-slate-500 truncate max-w-[200px]" 
                            title="${k.komentar_dosen || ''}">
                            ${k.komentar_dosen || '-'}
                        </td>
                        <td class="px-4 py-3 text-center">
                            <button onclick="bukaModalNilai('${k.id_pengumpulan}', ${k.nilai || 0}, '${(k.komentar_dosen || '').replace(/'/g, "\\'")}')" 
                                class="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1 rounded border border-indigo-200 transition-colors">
                                <i class="fa-solid fa-pen mr-1"></i>Nilai
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            html += `</tbody></table>`;
            container.innerHTML = html;
            
        } else {
            // Error dari backend
            container.innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <i class="fa-solid fa-circle-exclamation text-red-500 text-3xl mb-2"></i>
                    <p class="text-red-600 text-sm font-medium">Gagal memuat data pengumpulan</p>
                    <p class="text-red-400 text-xs mt-1">${result.message || 'Error tidak diketahui'}</p>
                    <button onclick="loadPengumpulanTugas('${id_tugas}', '${judul_tugas.replace(/'/g, "\\'")}')" 
                        class="mt-3 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                        <i class="fa-solid fa-rotate mr-1"></i> Coba Lagi
                    </button>
                </div>
            `;
        }
        
    } catch (error) { 
        console.error('Error loadPengumpulanTugas:', error);
        container.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <i class="fa-solid fa-circle-xmark text-red-500 text-3xl mb-2"></i>
                <p class="text-red-600 text-sm font-medium">Gagal terhubung ke server</p>
                <p class="text-red-400 text-xs mt-1">${error.message}</p>
                <button onclick="loadPengumpulanTugas('${id_tugas}', '${judul_tugas.replace(/'/g, "\\'")}')" 
                    class="mt-3 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                    <i class="fa-solid fa-rotate mr-1"></i> Coba Lagi
                </button>
            </div>
        `;
    }
}

// ==========================================
// 4. MODAL PENILAIAN
// ==========================================
let idPengumpulanTerpilih = null;

function bukaModalNilai(id_pengumpulan, nilai_sekarang, komentar_sekarang) {
    idPengumpulanTerpilih = id_pengumpulan;
    document.getElementById('nilai_input').value = nilai_sekarang || '';
    document.getElementById('komentar_input').value = komentar_sekarang || '';
    document.getElementById('modalNilaiTugas').classList.remove('hidden');
}

function tutupModal(id) { 
    document.getElementById(id).classList.add('hidden'); 
}

document.getElementById('formNilaiTugas').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = this.querySelector('button');
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Menyimpan...';
    btn.disabled = true;

    const data = {
        action: 'nilai_tugas',
        id_pengumpulan: idPengumpulanTerpilih,
        nilai: document.getElementById('nilai_input').value,
        komentar: document.getElementById('komentar_input').value
    };
    const res = await fetch(CONFIG.API_URL, { method: 'POST', body: JSON.stringify(data) });
    const result = await res.json();
    if (result.status === 'success') {
        alert(result.message);
        tutupModal('modalNilaiTugas');
        // Reload data di chart kanan
        const selectedTaskId = dataProgressTugas.find(t => t.judul_tugas === document.getElementById('judulTugasTerpilih').innerText.replace(/[()]/g, '').trim())?.id_tugas;
        if (selectedTaskId) loadPengumpulanTugas(selectedTaskId, document.getElementById('judulTugasTerpilih').innerText.replace(/[()]/g, '').trim());
    } else {
        alert('Gagal: ' + result.message);
        btn.innerHTML = original;
        btn.disabled = false;
    }
});

// ==========================================
// 5. TAMBAH TUGAS (Tombol +)
// ==========================================
document.getElementById('btnTambahTugas').addEventListener('click', function() {
    const idKelas = document.getElementById('filterKelasDosen').value;
    if (!idKelas) { alert('Pilih mata kuliah terlebih dahulu!'); return; }
    
    document.getElementById('tugas_id_kelas').value = idKelas;
    document.getElementById('tugas_id_tugas_edit').value = '';
    document.getElementById('modalTugasTitle').innerText = 'Tambah Tugas Baru';
    document.getElementById('formTambahTugas').reset();
    
    // ✅ Reset dropdown jenis ke default "Tugas"
    const jenisDropdown = document.getElementById('tugas_jenis');
    if (jenisDropdown) jenisDropdown.value = 'Tugas';
    
    document.getElementById('existing_lampiran_wrapper').classList.add('hidden');
    document.getElementById('modalTambahTugas').classList.remove('hidden');
});

// ==========================================
// 6. LOGOUT (Event Delegation)
// ==========================================
document.addEventListener('click', function(e) {
    const logoutBtn = e.target.closest('#btnLogout');
    if (logoutBtn) {
        localStorage.removeItem('user_session');
        window.location.href = '../login.html';
    }
});

// ==========================================
// 7. SIMPAN TUGAS (Event Listener Form)
// ==========================================
document.getElementById('formTambahTugas').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = this.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Menyimpan...';
    btn.disabled = true;

    const fileInput = document.getElementById('tugas_lampiran');
    let base64File = null, fileName = null;
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        if (file.size > 10 * 1024 * 1024) {
            alert('Ukuran file terlalu besar! Maksimal 10MB.');
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }
        fileName = file.name.replace(/\s+/g, '_');
        base64File = await fileToBase64(file);
    }

    // ✅ Ambil jenis_tugas dari dropdown
    const jenisTugas = document.getElementById('tugas_jenis') 
        ? document.getElementById('tugas_jenis').value 
        : 'Tugas';

    const data = {
        action: 'tambah_tugas',
        id_kelas: document.getElementById('tugas_id_kelas').value,
        pertemuan_ke: document.getElementById('tugas_pertemuan_ke').value,
        judul_tugas: document.getElementById('tugas_judul').value,
        deskripsi_instruksi: document.getElementById('tugas_deskripsi').value,
        tenggat_waktu: document.getElementById('tugas_deadline').value,
        bobot_nilai: document.getElementById('tugas_bobot').value,
        jenis_tugas: jenisTugas,   // ✅ KIRIM JENIS_TUGAS
        lampiran_base64: base64File,
        lampiran_nama_file: fileName
    };

    console.log('>>> Data tugas yang dikirim:', data);

    try {
        const res = await fetch(CONFIG.API_URL, { method: 'POST', body: JSON.stringify(data) });
        if (!res.ok) throw new Error(`Server Error: ${res.status}`);
        const result = await res.json();
        if (result.status === 'success') {
            alert('✅ ' + result.message);
            tutupModal('modalTambahTugas');
            location.reload();
        } else {
            alert('❌ Gagal: ' + result.message);
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    } catch (error) {
        console.error(error);
        alert('❌ Error koneksi. Pastikan URL API benar dan backend sudah di-deploy.');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

// Fungsi helper fileToBase64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}
