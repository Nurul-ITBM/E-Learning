// ==========================================
// js/dosen-ujian.js - Logika Kelola Ujian Dosen (FINAL)
// Fitur: CRUD Ujian + Jenis Ujian + CRUD Soal + Loading State
// ==========================================

let daftarUjian = [];
let currentIdUjian = null;

// ==========================================
// KONFIGURASI WARNA BADGE JENIS UJIAN
// ==========================================
const JENIS_UJIAN_CONFIG = {
    'UTS': {
        label: 'UTS',
        class: 'bg-blue-50 text-blue-600 border-blue-100'
    },
    'UAS': {
        label: 'UAS',
        class: 'bg-purple-50 text-purple-600 border-purple-100'
    },
    'Quiz': {
        label: 'Quiz',
        class: 'bg-amber-50 text-amber-600 border-amber-100'
    },
    'Tugas Besar': {
        label: 'Tugas Besar',
        class: 'bg-rose-50 text-rose-600 border-rose-100'
    }
};

// ==========================================
// INISIALISASI HALAMAN
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Ambil session
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) {
        window.location.href = '../login.html';
        return;
    }
    
    const user = JSON.parse(sessionData);
    console.log(">>> User session:", user);
    
    // 2. Event listener untuk tombol logout (delegasi)
    document.addEventListener('click', function(e) {
        const logoutBtn = e.target.closest('#btnLogout');
        if (logoutBtn) {
            localStorage.removeItem('user_session');
            window.location.href = '../login.html';
        }
    });
    
    // 3. Load dropdown kelas
    if (user.id_dosen) {
        await loadKelasDosen(user.id_dosen);
    } else {
        console.error('❌ id_dosen tidak ditemukan di session!');
        const select = document.getElementById('filterKelasUjian');
        if (select) {
            select.innerHTML = '<option value="">-- Error: ID Dosen tidak ditemukan --</option>';
        }
    }
    
    // 4. Event listener dropdown kelas
    const filterKelas = document.getElementById('filterKelasUjian');
    if (filterKelas) {
        filterKelas.addEventListener('change', async (e) => {
            const idKelas = e.target.value;
            if (idKelas) {
                await loadDaftarUjian(idKelas);
                document.getElementById('btnTambahUjian').disabled = false;
            } else {
                document.getElementById('containerDaftarUjian').innerHTML = 
                    '<p class="text-slate-500 col-span-full text-center py-10">Silakan pilih mata kuliah.</p>';
                document.getElementById('btnTambahUjian').disabled = true;
            }
        });
    }
    
    // 5. Tombol tambah ujian
    document.getElementById('btnTambahUjian').addEventListener('click', () => {
        const idKelas = document.getElementById('filterKelasUjian').value;
        document.getElementById('ujian_id_kelas').value = idKelas;
        document.getElementById('ujian_id_ujian_edit').value = '';
        document.getElementById('modalUjianTitle').innerText = 'Tambah Ujian Baru';
        document.getElementById('formTambahUjian').reset();
        document.getElementById('ujian_id_kelas').value = idKelas;
        // Set default jenis ujian
        document.getElementById('ujian_jenis').value = 'UTS';
        document.getElementById('modalTambahUjian').classList.remove('hidden');
    });
    
    // 6. Submit form ujian
    document.getElementById('formTambahUjian').addEventListener('submit', async (e) => {
        e.preventDefault();
        await simpanUjian();
    });
    
    // 7. Submit form soal
    document.getElementById('formTambahSoal').addEventListener('submit', async (e) => {
        e.preventDefault();
        await simpanSoal();
    });
});

// ==========================================
// LOAD DROPDOWN KELAS DOSEN
// ==========================================
async function loadKelasDosen(idDosen) {
    const select = document.getElementById('filterKelasUjian');
    if (!select) return;
    
    console.log(">>> Loading kelas untuk dosen:", idDosen);
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({ 
                action: 'get_kelas_dosen_ujian', 
                id_dosen: idDosen 
            })
        });
        
        const result = await response.json();
        console.log(">>> Response kelas:", result);
        
        if (result.status === 'success') {
            select.innerHTML = '<option value="">-- Pilih Mata Kuliah --</option>';
            
            if (result.data.length === 0) {
                select.innerHTML = '<option value="">-- Tidak ada mata kuliah --</option>';
                return;
            }
            
            result.data.forEach(kelas => {
                const option = document.createElement('option');
                option.value = kelas.id_kelas;
                option.textContent = kelas.nama_kelas;
                select.appendChild(option);
            });
            
            console.log(">>> Dropdown berhasil diisi dengan", result.data.length, "mata kuliah");
        } else {
            console.error('>>> Error dari server:', result.message);
            select.innerHTML = '<option value="">-- Error: ' + result.message + ' --</option>';
        }
    } catch (error) {
        console.error('>>> Error loading kelas:', error);
        select.innerHTML = '<option value="">-- Error koneksi --</option>';
    }
}

// ==========================================
// LOAD DAFTAR UJIAN BERDASARKAN KELAS
// ==========================================
async function loadDaftarUjian(idKelas) {
    const container = document.getElementById('containerDaftarUjian');
    container.innerHTML = '<p class="text-slate-400 col-span-full text-center py-10"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Memuat ujian...</p>';
    
    try {
        const user = JSON.parse(localStorage.getItem('user_session'));
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({ 
                action: 'get_ujian_dosen', 
                id_dosen: user.id_dosen 
            })
        });
        const result = await response.json();
        console.log(">>> Daftar ujian:", result);
        
        if (result.status === 'success') {
            container.innerHTML = '';
            const ujianKelas = result.data.filter(u => u.id_kelas === idKelas);
            
            if (ujianKelas.length === 0) {
                container.innerHTML = '<p class="text-slate-500 col-span-full text-center py-10">Belum ada ujian untuk mata kuliah ini.</p>';
                return;
            }
            
            ujianKelas.forEach(ujian => {
                // ✅ Ambil config warna badge berdasarkan jenis ujian
                const jenisUjian = ujian.jenis_ujian || 'UTS';
                const jenisConfig = JENIS_UJIAN_CONFIG[jenisUjian] || JENIS_UJIAN_CONFIG['UTS'];
                
                const card = document.createElement('div');
                card.className = "bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition flex flex-col justify-between";
                card.innerHTML = `
                    <div>
                        <div class="flex justify-between items-start mb-3">
                            <span class="${jenisConfig.class} text-xs font-bold px-2.5 py-1 rounded-md border">${jenisConfig.label}</span>
                            <span class="text-xs font-bold text-slate-400">Bobot: ${ujian.bobot}</span>
                        </div>
                        <h3 class="text-lg font-bold text-slate-800 mb-1">${ujian.judul}</h3>
                        <p class="text-xs text-slate-500 mb-4 line-clamp-2">${ujian.deskripsi}</p>
                        <div class="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600 space-y-1">
                            <div class="flex items-center"><i class="fa-regular fa-clock w-4 text-teal-500 mr-1.5"></i> Mulai: ${ujian.mulai}</div>
                            <div class="flex items-center"><i class="fa-regular fa-hourglass-end w-4 text-slate-400 mr-1.5"></i> Selesai: ${ujian.selesai}</div>
                        </div>
                    </div>
                    <div class="mt-4 flex gap-2">
                        <button id="btnSoal-${ujian.id_ujian}" onclick="kelolaSoal('${ujian.id_ujian}', '${ujian.judul.replace(/'/g, "\\'")}')" class="flex-1 bg-teal-50 text-teal-600 hover:bg-teal-100 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1">
                            <i class="fa-solid fa-list-check"></i> Soal
                        </button>
                        <button id="btnEdit-${ujian.id_ujian}" onclick="editUjian('${ujian.id_ujian}')" class="flex-1 bg-slate-50 text-slate-600 hover:bg-slate-100 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1">
                            <i class="fa-solid fa-edit"></i> Edit
                        </button>
                        <button id="btnHapus-${ujian.id_ujian}" onclick="hapusUjian('${ujian.id_ujian}')" class="flex-1 bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1">
                            <i class="fa-solid fa-trash"></i> Hapus
                        </button>
                    </div>
                `;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = '<p class="text-red-500 col-span-full text-center py-10">Error: ' + result.message + '</p>';
        }
    } catch (error) {
        console.error("Error loadDaftarUjian:", error);
        container.innerHTML = '<p class="text-red-500 col-span-full text-center py-10">Gagal terhubung ke server.</p>';
    }
}

// ==========================================
// HELPER: Set Loading pada Tombol
// ==========================================
function setButtonLoading(buttonId, isLoading, loadingText = 'Memuat...') {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    
    if (isLoading) {
        if (!btn.dataset.originalHtml) {
            btn.dataset.originalHtml = btn.innerHTML;
        }
        btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> ${loadingText}`;
        btn.disabled = true;
        btn.classList.add('opacity-70', 'cursor-not-allowed');
    } else {
        if (btn.dataset.originalHtml) {
            btn.innerHTML = btn.dataset.originalHtml;
            delete btn.dataset.originalHtml;
        }
        btn.disabled = false;
        btn.classList.remove('opacity-70', 'cursor-not-allowed');
    }
}

// ==========================================
// HELPER: Hanya Disable Tombol (Tanpa Ubah Teks)
// ==========================================
function setButtonDisabled(buttonId, isDisabled) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    
    btn.disabled = isDisabled;
    if (isDisabled) {
        btn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

// ==========================================
// SIMPAN UJIAN (TAMBAH/EDIT)
// ==========================================
async function simpanUjian() {
    const btn = document.querySelector('#formTambahUjian button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Menyimpan...';
    btn.disabled = true;
    
    try {
        const idEdit = document.getElementById('ujian_id_ujian_edit').value;
        const jenisUjian = document.getElementById('ujian_jenis').value;
        
        const data = {
            action: idEdit ? 'update_ujian' : 'tambah_ujian',
            id_ujian: idEdit,
            id_kelas: document.getElementById('ujian_id_kelas').value,
            judul: document.getElementById('ujian_judul').value,
            deskripsi: document.getElementById('ujian_deskripsi').value,
            mulai: document.getElementById('ujian_mulai').value,
            selesai: document.getElementById('ujian_selesai').value,
            bobot: document.getElementById('ujian_bobot').value,
            jenis_ujian: jenisUjian,
            link: '-'
        };
        
        console.log(">>> Data ujian yang dikirim:", data);
        
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        console.log(">>> Response simpan ujian:", result);
        
        if (result.status === 'success') {
            alert('✅ ' + result.message);
            tutupModal('modalTambahUjian');
            const idKelas = document.getElementById('filterKelasUjian').value;
            await loadDaftarUjian(idKelas);
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        console.error("Error simpanUjian:", error);
        alert('❌ Terjadi kesalahan: ' + error.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// ==========================================
// EDIT UJIAN - DENGAN LOADING STATE
// ==========================================
async function editUjian(idUjian) {
    setButtonLoading(`btnEdit-${idUjian}`, true, 'Memuat...');
    setButtonDisabled(`btnSoal-${idUjian}`, true);
    setButtonDisabled(`btnHapus-${idUjian}`, true);
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({ action: 'get_detail_ujian', id_ujian: idUjian })
        });
        const result = await response.json();
        console.log(">>> Detail ujian:", result);
        
        if (result.status === 'success') {
            const ujian = result.data;
            document.getElementById('ujian_id_ujian_edit').value = ujian.id_ujian;
            document.getElementById('ujian_id_kelas').value = ujian.id_kelas;
            document.getElementById('ujian_judul').value = ujian.judul;
            document.getElementById('ujian_deskripsi').value = ujian.deskripsi;
            document.getElementById('ujian_mulai').value = ujian.mulai;
            document.getElementById('ujian_selesai').value = ujian.selesai;
            document.getElementById('ujian_bobot').value = ujian.bobot;
            document.getElementById('ujian_jenis').value = ujian.jenis_ujian || 'UTS';  // ✅ ISI JENIS UJIAN
            document.getElementById('modalUjianTitle').innerText = 'Edit Ujian';
            document.getElementById('modalTambahUjian').classList.remove('hidden');
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        console.error("Error editUjian:", error);
        alert('❌ Gagal memuat data ujian: ' + error.message);
    } finally {
        setButtonLoading(`btnEdit-${idUjian}`, false);
        setButtonDisabled(`btnSoal-${idUjian}`, false);
        setButtonDisabled(`btnHapus-${idUjian}`, false);
    }
}

// ==========================================
// HAPUS UJIAN - DENGAN LOADING STATE
// ==========================================
async function hapusUjian(idUjian) {
    if (!confirm('Apakah Anda yakin ingin menghapus ujian ini?')) return;
    
    setButtonLoading(`btnHapus-${idUjian}`, true, 'Menghapus...');
    setButtonDisabled(`btnSoal-${idUjian}`, true);
    setButtonDisabled(`btnEdit-${idUjian}`, true);
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({ action: 'delete_ujian', id_ujian: idUjian })
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            alert('✅ ' + result.message);
            const idKelas = document.getElementById('filterKelasUjian').value;
            await loadDaftarUjian(idKelas);
        } else {
            alert('❌ ' + result.message);
            setButtonLoading(`btnHapus-${idUjian}`, false);
            setButtonDisabled(`btnSoal-${idUjian}`, false);
            setButtonDisabled(`btnEdit-${idUjian}`, false);
        }
    } catch (error) {
        console.error("Error hapusUjian:", error);
        alert('❌ Terjadi kesalahan');
        setButtonLoading(`btnHapus-${idUjian}`, false);
        setButtonDisabled(`btnSoal-${idUjian}`, false);
        setButtonDisabled(`btnEdit-${idUjian}`, false);
    }
}

// ==========================================
// KELOLA SOAL - DENGAN LOADING STATE
// ==========================================
async function kelolaSoal(idUjian, judulUjian) {
    currentIdUjian = idUjian;
    
    setButtonLoading(`btnSoal-${idUjian}`, true, 'Memuat...');
    setButtonDisabled(`btnEdit-${idUjian}`, true);
    setButtonDisabled(`btnHapus-${idUjian}`, true);
    
    document.getElementById('modalSoalTitle').innerText = `Kelola Soal: ${judulUjian}`;
    document.getElementById('modalKelolaSoal').classList.remove('hidden');
    
    try {
        await loadDaftarSoal(idUjian);
    } finally {
        setButtonLoading(`btnSoal-${idUjian}`, false);
        setButtonDisabled(`btnEdit-${idUjian}`, false);
        setButtonDisabled(`btnHapus-${idUjian}`, false);
    }
}

// ==========================================
// LOAD DAFTAR SOAL
// ==========================================
async function loadDaftarSoal(idUjian) {
    const container = document.getElementById('containerDaftarSoal');
    container.innerHTML = '<p class="text-slate-400 text-center py-6"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Memuat soal...</p>';
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({ action: 'get_soal_ujian', id_ujian: idUjian })
        });
        const result = await response.json();
        console.log(">>> Daftar soal:", result);
        
        if (result.status === 'success') {
            container.innerHTML = '';
            
            console.log(">>> Jumlah soal:", result.data.length);
            if (result.data.length > 0) {
                console.log(">>> Contoh soal:", JSON.stringify(result.data[0]));
            }
            
            if (result.data.length === 0) {
                container.innerHTML = '<p class="text-slate-500 text-center py-6">Belum ada soal untuk ujian ini.</p>';
                return;
            }
            
            result.data.forEach((soal, index) => {
                const pertanyaan = soal.pertanyaan || '-';
                const opsiA = soal.opsi_a || '-';
                const opsiB = soal.opsi_b || '-';
                const opsiC = soal.opsi_c || '-';
                const opsiD = soal.opsi_d || '-';
                const jawaban = soal.jawaban_benar || soal.kunci_jawaban || '-';
                
                const div = document.createElement('div');
                div.className = "bg-slate-50 p-4 rounded-lg border border-slate-200";
                div.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <p class="text-xs font-bold text-slate-500 mb-1">Soal ${index + 1}</p>
                            <p class="text-sm font-semibold text-slate-700">${pertanyaan}</p>
                            <div class="mt-2 text-xs text-slate-500 space-y-0.5">
                                <p>A. ${opsiA}</p>
                                <p>B. ${opsiB}</p>
                                <p>C. ${opsiC}</p>
                                <p>D. ${opsiD}</p>
                                <p class="text-teal-600 font-bold mt-1">Jawaban: ${jawaban}</p>
                            </div>
                        </div>
                        <div class="flex gap-2 ml-4">
                            <button onclick="hapusSoal('${soal.id_soal}')" class="text-red-600 hover:text-red-800">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
                container.appendChild(div);
            });
        } else {
            container.innerHTML = '<p class="text-red-500 text-center py-6">Error: ' + result.message + '</p>';
        }
    } catch (error) {
        console.error("Error loadDaftarSoal:", error);
        container.innerHTML = '<p class="text-red-500 text-center py-6">Gagal memuat soal.</p>';
    }
}

// ==========================================
// TAMPILKAN FORM TAMBAH SOAL
// ==========================================
function tampilkanFormTambahSoal() {
    document.getElementById('soal_id_ujian').value = currentIdUjian;
    document.getElementById('soal_id_soal_edit').value = '';
    document.getElementById('modalTambahSoalTitle').innerText = 'Tambah Soal';
    document.getElementById('formTambahSoal').reset();
    document.getElementById('soal_id_ujian').value = currentIdUjian;
    document.getElementById('modalTambahSoal').classList.remove('hidden');
}

// ==========================================
// SIMPAN SOAL
// ==========================================
async function simpanSoal() {
    const btn = document.querySelector('#formTambahSoal button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Menyimpan...';
    btn.disabled = true;
    
    try {
        const idEdit = document.getElementById('soal_id_soal_edit').value;
        const data = {
            action: idEdit ? 'update_soal' : 'tambah_soal',
            id_soal: idEdit,
            id_ujian: document.getElementById('soal_id_ujian').value,
            pertanyaan: document.getElementById('soal_pertanyaan').value,
            opsi_a: document.getElementById('soal_opsi_a').value,
            opsi_b: document.getElementById('soal_opsi_b').value,
            opsi_c: document.getElementById('soal_opsi_c').value,
            opsi_d: document.getElementById('soal_opsi_d').value,
            jawaban_benar: document.getElementById('soal_jawaban_benar').value
        };
        
        console.log(">>> Data soal yang dikirim:", data);
        
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        console.log(">>> Response simpan soal:", result);
        
        if (result.status === 'success') {
            alert('✅ ' + result.message);
            tutupModal('modalTambahSoal');
            await loadDaftarSoal(currentIdUjian);
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        console.error("Error simpanSoal:", error);
        alert('❌ Terjadi kesalahan: ' + error.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// ==========================================
// HAPUS SOAL
// ==========================================
async function hapusSoal(idSoal) {
    if (!confirm('Apakah Anda yakin ingin menghapus soal ini?')) return;
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({ action: 'delete_soal', id_soal: idSoal })
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            alert('✅ ' + result.message);
            await loadDaftarSoal(currentIdUjian);
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        console.error("Error hapusSoal:", error);
        alert('❌ Terjadi kesalahan');
    }
}

// ==========================================
// TUTUP MODAL
// ==========================================
function tutupModal(id) {
    document.getElementById(id).classList.add('hidden');
}
