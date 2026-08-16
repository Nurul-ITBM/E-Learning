// js/dosen-tugas.js
document.addEventListener('DOMContentLoaded', async () => {
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) { window.location.href = '../login.html'; return; }
    const user = JSON.parse(sessionData);
    if (user.role !== 'dosen') { alert('Anda bukan dosen!'); window.location.href = '../login.html'; return; }

    document.getElementById('btnLogout').addEventListener('click', () => {
        localStorage.removeItem('user_session'); window.location.href = '../login.html';
    });

    await loadKelasDropdown(user.id_dosen);
});

async function loadKelasDropdown(id_dosen) {
    // DEKLARASI VARIABEL INI WAJIB ADA!
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
                
                // JANGAN LUPA: AKTIFKAN TOMBOL SETELAH DROPDOWN TERISI!
                btnTambah.disabled = false; 
                
                select.addEventListener('change', async (e) => {
                    const idKelas = e.target.value;
                    if (idKelas) {
                        document.getElementById('containerPengumpulanTugas').innerHTML = '<p class="text-sm text-slate-500 italic text-center py-10">Pilih tugas di sebelah kiri.</p>';
                        document.getElementById('judulTugasTerpilih').innerText = '(Pilih tugas)';
                        await loadProgressTugas(idKelas);
                    } else {
                        document.getElementById('containerProgressTugas').innerHTML = '<p class="text-sm text-slate-500 italic text-center py-6">Silakan pilih mata kuliah di dropdown atas.</p>';
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
// LOGIKA CHART 1: PROGRESS TUGAS
// ==========================================
let dataProgressTugas = []; // Simpan global agar bisa diakses saat klik

async function loadProgressTugas(id_kelas) {
    const container = document.getElementById('containerProgressTugas');
    container.innerHTML = '<p class="text-center text-slate-400 py-4"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Memuat progress...</p>';
    try {
        const res = await fetch(CONFIG.API_URL, { method: 'POST', body: JSON.stringify({ action: 'get_progress_tugas', id_kelas: id_kelas }) });
        const result = await res.json();
        if(result.status === 'success') {
            dataProgressTugas = result.data;
            container.innerHTML = ''; 
            if(result.data.length === 0) {
                container.innerHTML = `<p class="text-slate-500 text-center py-4">Belum ada tugas untuk kelas ini.</p>`;
                return;
            }
            result.data.forEach(tugas => {
                const persentase = tugas.total_mahasiswa > 0 ? Math.round((tugas.sudah_kumpul / tugas.total_mahasiswa) * 100) : 0;
                const card = document.createElement('div');
                card.className = "bg-slate-50 hover:bg-white border border-slate-200 hover:border-teal-300 rounded-xl p-4 cursor-pointer transition-all shadow-sm relative";
                // Beri event click untuk memuat Chart 2
                card.onclick = () => loadPengumpulanTugas(tugas.id_tugas, tugas.judul_tugas);
                card.innerHTML = `
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="text-sm font-bold text-slate-800 line-clamp-1">${tugas.judul_tugas}</h4>
                        <span class="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">${tugas.bobot_nilai} SKS</span>
                    </div>
                    <div class="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>Deadline: ${tugas.tenggat_waktu.replace('T', ' ')}</span>
                        <span>${tugas.sudah_kumpul}/${tugas.total_mahasiswa} Kumpul</span>
                    </div>
                    <div class="w-full bg-slate-200 rounded-full h-2">
                        <div class="bg-teal-600 h-2 rounded-full transition-all duration-500" style="width: ${persentase}%"></div>
                    </div>
                `;
                container.appendChild(card);
            });
        }
    } catch (error) { console.error(error); }
}

// ==========================================
// LOGIKA CHART 2: PENGUMPULAN & PENILAIAN
// ==========================================
let idPengumpulanTerpilih = null;

async function loadPengumpulanTugas(id_tugas, judul_tugas) {
    document.getElementById('judulTugasTerpilih').innerText = ` (${judul_tugas})`;
    const container = document.getElementById('containerPengumpulanTugas');
    container.innerHTML = '<p class="text-center text-slate-400 py-4"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Memuat data kumpul...</p>';

    try {
        const res = await fetch(CONFIG.API_URL, { method: 'POST', body: JSON.stringify({ action: 'get_pengumpulan_tugas', id_tugas: id_tugas }) });
        const result = await res.json();
        if(result.status === 'success') {
            if(result.data.length === 0) {
                container.innerHTML = `<p class="text-center text-slate-500 py-10 italic">Belum ada mahasiswa yang mengumpulkan tugas ini.</p>`;
                return;
            }
            let html = `
                <table class="w-full text-sm text-left text-slate-600">
                    <thead class="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                        <tr><th class="px-4 py-3">NIM</th><th class="px-4 py-3">Nama</th><th class="px-4 py-3 hidden md:table-cell">Waktu Kumpul</th><th class="px-4 py-3">File</th><th class="px-4 py-3 text-center">Nilai</th><th class="px-4 py-3 text-center">Aksi</th></tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
            `;
            result.data.forEach(k => {
                const statusBg = k.nilai > 0 ? 'bg-green-50 text-green-700' : (k.status === 'Tepat Waktu' ? 'bg-slate-50' : 'bg-red-50 text-red-700');
                html += `
                    <tr class="hover:bg-slate-50/50">
                        <td class="px-4 py-3 font-medium">${k.nim}</td>
                        <td class="px-4 py-3">${k.nama_mahasiswa}</td>
                        <td class="px-4 py-3 hidden md:table-cell text-xs">${k.waktu_kumpul}</td>
                        <td class="px-4 py-3"><a href="${k.nama_file}" target="_blank" class="text-teal-600 hover:underline text-xs">📄 Lihat File</a></td>
                        <td class="px-4 py-3 text-center"><span class="px-3 py-1 rounded-full text-xs font-semibold ${statusBg}">${k.nilai || '-'}</span></td>
                        <td class="px-4 py-3 text-center">
                            <button onclick="bukaModalNilai('${k.id_pengumpulan}', ${k.nilai || 0}, '${k.komentar_dosen || ''}')" class="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1 rounded border border-indigo-200">Nilai</button>
                        </td>
                    </tr>
                `;
            });
            html += `</tbody></table>`;
            container.innerHTML = html;
        }
    } catch (error) { console.error(error); }
}

// ==========================================
// MODAL PENILAIAN TUGAS
// ==========================================
function bukaModalNilai(id_pengumpulan, nilai_sekarang, komentar_sekarang) {
    idPengumpulanTerpilih = id_pengumpulan;
    document.getElementById('nilai_input').value = nilai_sekarang || '';
    document.getElementById('komentar_input').value = komentar_sekarang || '';
    document.getElementById('modalNilaiTugas').classList.remove('hidden');
}

function tutupModal(id) { document.getElementById(id).classList.add('hidden'); }

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
    if(result.status === 'success') {
        alert(result.message);
        tutupModal('modalNilaiTugas');
        // Reload Chart 2 tanpa reload halaman
        const selectedTaskId = dataProgressTugas.find(t => t.judul_tugas === document.getElementById('judulTugasTerpilih').innerText.replace(/[()]/g, '').trim())?.id_tugas;
        if(selectedTaskId) loadPengumpulanTugas(selectedTaskId, document.getElementById('judulTugasTerpilih').innerText.replace(/[()]/g, '').trim());
    } else {
        alert('Gagal: ' + result.message);
        btn.innerHTML = original;
        btn.disabled = false;
    }
});

// ... (kode-kode sebelumnya: loadKelasDropdown, loadProgressTugas, dll) ...

// ==========================================
// 5. TAMBAH TUGAS (Tombol +)
// ==========================================
document.getElementById('btnTambahTugas').addEventListener('click', function() {
    const idKelas = document.getElementById('filterKelasDosen').value;
    if (!idKelas) { 
        alert('Pilih mata kuliah terlebih dahulu!'); 
        return; 
    }
    document.getElementById('tugas_id_kelas').value = idKelas;
    document.getElementById('tugas_id_tugas_edit').value = '';
    document.getElementById('modalTugasTitle').innerText = 'Tambah Tugas Baru';
    document.getElementById('formTambahTugas').reset();
    document.getElementById('existing_lampiran_wrapper').classList.add('hidden');
    document.getElementById('modalTambahTugas').classList.remove('hidden');
});

function tutupModal(id) { 
    document.getElementById(id).classList.add('hidden'); 
}

// ==========================================
// 6. SIMPAN TUGAS (Event Listener Form - GANTI BAGIAN INI!)
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

    const data = {
        action: 'tambah_tugas',
        id_kelas: document.getElementById('tugas_id_kelas').value,
        judul_tugas: document.getElementById('tugas_judul').value,
        deskripsi_instruksi: document.getElementById('tugas_deskripsi').value,
        tenggat_waktu: document.getElementById('tugas_deadline').value,
        bobot_nilai: document.getElementById('tugas_bobot').value,
        lampiran_base64: base64File,
        lampiran_nama_file: fileName
    };

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
