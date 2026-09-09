// js/dosen-ujian.js - Logika Kelola Ujian Dosen

let daftarUjian = [];
let currentIdUjian = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Ambil session
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) {
        window.location.href = '../login.html';
        return;
    }
    
    const user = JSON.parse(sessionData);
    
    // Load sidebar & header
    loadSidebarDosen();
    loadHeaderDosen(user);
    
    // Event listener untuk tombol logout (delegasi)
    document.addEventListener('click', function(e) {
        const logoutBtn = e.target.closest('#btnLogout');
        if (logoutBtn) {
            localStorage.removeItem('user_session');
            window.location.href = '../login.html';
        }
    });
    
    // Load dropdown kelas
    await loadKelasDosen(user.id_dosen);
    
    // Event listener
    document.getElementById('filterKelasUjian').addEventListener('change', async (e) => {
        const idKelas = e.target.value;
        if (idKelas) {
            await loadDaftarUjian(idKelas);
            document.getElementById('btnTambahUjian').disabled = false;
        } else {
            document.getElementById('containerDaftarUjian').innerHTML = '<p class="text-slate-500 col-span-full text-center py-10">Silakan pilih mata kuliah.</p>';
            document.getElementById('btnTambahUjian').disabled = true;
        }
    });
    
    // Tombol tambah ujian
    document.getElementById('btnTambahUjian').addEventListener('click', () => {
        const idKelas = document.getElementById('filterKelasUjian').value;
        document.getElementById('ujian_id_kelas').value = idKelas;
        document.getElementById('ujian_id_ujian_edit').value = '';
        document.getElementById('modalUjianTitle').innerText = 'Tambah Ujian Baru';
        document.getElementById('formTambahUjian').reset();
        document.getElementById('modalTambahUjian').classList.remove('hidden');
    });
    
    // Submit form ujian
    document.getElementById('formTambahUjian').addEventListener('submit', async (e) => {
        e.preventDefault();
        await simpanUjian();
    });
    
    // Submit form soal
    document.getElementById('formTambahSoal').addEventListener('submit', async (e) => {
        e.preventDefault();
        await simpanSoal();
    });
});

// Load dropdown kelas dosen
async function loadKelasDosen(idDosen) {
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'get_kelas_dosen_ujian', id_dosen: idDosen })
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            const select = document.getElementById('filterKelasUjian');
            select.innerHTML = '<option value="">-- Pilih Mata Kuliah --</option>';
            
            result.data.forEach(kelas => {
                const option = document.createElement('option');
                option.value = kelas.id_kelas;
                option.textContent = kelas.nama_kelas;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading kelas:', error);
    }
}

// Load daftar ujian
async function loadDaftarUjian(idKelas) {
    const container = document.getElementById('containerDaftarUjian');
    container.innerHTML = '<p class="text-slate-400 col-span-full text-center py-10"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Memuat ujian...</p>';
    
    try {
        const user = JSON.parse(localStorage.getItem('user_session'));
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'get_ujian_dosen', id_dosen: user.id_dosen })
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            container.innerHTML = '';
            const ujianKelas = result.data.filter(u => u.id_kelas === idKelas);
            
            if (ujianKelas.length === 0) {
                container.innerHTML = '<p class="text-slate-500 col-span-full text-center py-10">Belum ada ujian untuk mata kuliah ini.</p>';
                return;
            }
            
            ujianKelas.forEach(ujian => {
                const card = document.createElement('div');
                card.className = "bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition flex flex-col justify-between";
                card.innerHTML = `
                    <div>
                        <div class="flex justify-between items-start mb-3">
                            <span class="bg-teal-50 text-teal-600 text-xs font-bold px-2.5 py-1 rounded-md border border-teal-100">Aktif</span>
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
                        <button onclick="kelolaSoal('${ujian.id_ujian}', '${ujian.judul}')" class="flex-1 bg-teal-50 text-teal-600 hover:bg-teal-100 py-2 rounded-lg text-xs font-bold transition">
                            <i class="fa-solid fa-list-check mr-1"></i> Soal
                        </button>
                        <button onclick="editUjian('${ujian.id_ujian}')" class="flex-1 bg-slate-50 text-slate-600 hover:bg-slate-100 py-2 rounded-lg text-xs font-bold transition">
                            <i class="fa-solid fa-edit mr-1"></i> Edit
                        </button>
                        <button onclick="hapusUjian('${ujian.id_ujian}')" class="flex-1 bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-lg text-xs font-bold transition">
                            <i class="fa-solid fa-trash mr-1"></i> Hapus
                        </button>
                    </div>
                `;
                container.appendChild(card);
            });
        }
    } catch (error) {
        container.innerHTML = '<p class="text-red-500 col-span-full text-center py-10">Gagal terhubung ke server.</p>';
    }
}

// Simpan ujian (tambah/edit)
async function simpanUjian() {
    const btn = document.querySelector('#formTambahUjian button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Menyimpan...';
    btn.disabled = true;
    
    try {
        const idEdit = document.getElementById('ujian_id_ujian_edit').value;
        
        const data = {
            action: idEdit ? 'update_ujian' : 'tambah_ujian',
            id_ujian: idEdit,
            id_kelas: document.getElementById('ujian_id_kelas').value,
            judul: document.getElementById('ujian_judul').value,
            deskripsi: document.getElementById('ujian_deskripsi').value,
            mulai: document.getElementById('ujian_mulai').value,
            selesai: document.getElementById('ujian_selesai').value,
            bobot: document.getElementById('ujian_bobot').value,
            link: document.getElementById('ujian_link').value || '-'
        };
        
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            alert('✅ ' + result.message);
            tutupModal('modalTambahUjian');
            const idKelas = document.getElementById('filterKelasUjian').value;
            await loadDaftarUjian(idKelas);
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        alert('❌ Terjadi kesalahan: ' + error.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Edit ujian
async function editUjian(idUjian) {
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'get_detail_ujian', id_ujian: idUjian })
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            const ujian = result.data;
            document.getElementById('ujian_id_ujian_edit').value = ujian.id_ujian;
            document.getElementById('ujian_id_kelas').value = ujian.id_kelas;
            document.getElementById('ujian_judul').value = ujian.judul;
            document.getElementById('ujian_deskripsi').value = ujian.deskripsi;
            document.getElementById('ujian_mulai').value = ujian.mulai;
            document.getElementById('ujian_selesai').value = ujian.selesai;
            document.getElementById('ujian_bobot').value = ujian.bobot;
            document.getElementById('ujian_link').value = ujian.link || '';
            document.getElementById('modalUjianTitle').innerText = 'Edit Ujian';
            document.getElementById('modalTambahUjian').classList.remove('hidden');
        }
    } catch (error) {
        alert('❌ Gagal memuat data ujian');
    }
}

// Hapus ujian
async function hapusUjian(idUjian) {
    if (!confirm('Apakah Anda yakin ingin menghapus ujian ini?')) return;
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'delete_ujian', id_ujian: idUjian })
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            alert('✅ ' + result.message);
            const idKelas = document.getElementById('filterKelasUjian').value;
            await loadDaftarUjian(idKelas);
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        alert('❌ Terjadi kesalahan');
    }
}

// Kelola soal
async function kelolaSoal(idUjian, judulUjian) {
    currentIdUjian = idUjian;
    document.getElementById('modalSoalTitle').innerText = `Kelola Soal: ${judulUjian}`;
    document.getElementById('modalKelolaSoal').classList.remove('hidden');
    
    await loadDaftarSoal(idUjian);
}

// Load daftar soal
async function loadDaftarSoal(idUjian) {
    const container = document.getElementById('containerDaftarSoal');
    container.innerHTML = '<p class="text-slate-400 text-center py-6"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Memuat soal...</p>';
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'get_soal_ujian', id_ujian: idUjian })
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            container.innerHTML = '';
            if (result.data.length === 0) {
                container.innerHTML = '<p class="text-slate-500 text-center py-6">Belum ada soal untuk ujian ini.</p>';
                return;
            }
            
            result.data.forEach((soal, index) => {
                const div = document.createElement('div');
                div.className = "bg-slate-50 p-4 rounded-lg border border-slate-200";
                div.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-xs font-bold text-slate-500 mb-1">Soal ${index + 1}</p>
                            <p class="text-sm font-semibold text-slate-700">${soal.pertanyaan}</p>
                            <div class="mt-2 text-xs text-slate-500 space-y-0.5">
                                <p>A. ${soal.opsi_a}</p>
                                <p>B. ${soal.opsi_b}</p>
                                <p>C. ${soal.opsi_c}</p>
                                <p>D. ${soal.opsi_d}</p>
                                <p class="text-teal-600 font-bold mt-1">Jawaban: ${soal.jawaban_benar}</p>
                            </div>
                        </div>
                        <div class="flex gap-2 ml-4">
                            <button onclick="editSoal('${soal.id_soal}')" class="text-teal-600 hover:text-teal-800"><i class="fa-solid fa-edit"></i></button>
                            <button onclick="hapusSoal('${soal.id_soal}')" class="text-red-600 hover:text-red-800"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                `;
                container.appendChild(div);
            });
        }
    } catch (error) {
        container.innerHTML = '<p class="text-red-500 text-center py-6">Gagal memuat soal.</p>';
    }
}

// Tampilkan form tambah soal
function tampilkanFormTambahSoal() {
    document.getElementById('soal_id_ujian').value = currentIdUjian;
    document.getElementById('soal_id_soal_edit').value = '';
    document.getElementById('modalTambahSoalTitle').innerText = 'Tambah Soal';
    document.getElementById('formTambahSoal').reset();
    document.getElementById('modalTambahSoal').classList.remove('hidden');
}

// Simpan soal
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
        
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            alert('✅ ' + result.message);
            tutupModal('modalTambahSoal');
            await loadDaftarSoal(currentIdUjian);
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        alert('❌ Terjadi kesalahan: ' + error.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Edit soal
async function editSoal(idSoal) {
    // Implementasi edit soal (bisa ditambahkan nanti)
    alert('Fitur edit soal akan segera tersedia!');
}

// Hapus soal
async function hapusSoal(idSoal) {
    if (!confirm('Apakah Anda yakin ingin menghapus soal ini?')) return;
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
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
        alert('❌ Terjadi kesalahan');
    }
}

// Tutup modal
function tutupModal(id) {
    document.getElementById(id).classList.add('hidden');
}
