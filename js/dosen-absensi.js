// ==========================================
// js/dosen-absensi.js - Logika Rekap Absensi Dosen
// Fitur: Filter Kelas, Tabel Matriks, Detail Kehadiran, Koreksi, Export
// ==========================================

// ==========================================
// VARIABEL GLOBAL
// ==========================================
let currentIdKelas = null;
let currentRekapData = null;
let currentUser = null;

// ==========================================
// KONFIGURASI WARNA STATUS
// ==========================================
const STATUS_CONFIG = {
    'Hadir': { class: 'cell-hadir', icon: 'fa-check', label: 'Hadir' },
    'Izin': { class: 'cell-izin', icon: 'fa-envelope', label: 'Izin' },
    'Sakit': { class: 'cell-sakit', icon: 'fa-notes-medical', label: 'Sakit' },
    'Terlambat': { class: 'cell-telat', icon: 'fa-clock', label: 'Terlambat' },
    'Alpha': { class: 'cell-alpha', icon: 'fa-times', label: 'Alpha' },
    'Belum': { class: 'cell-belum', icon: 'fa-minus', label: 'Belum Absen' }
};

// ==========================================
// INISIALISASI
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Validasi Sesi
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) {
        window.location.href = '../login.html';
        return;
    }
    
    currentUser = JSON.parse(sessionData);
    console.log(">>> User session:", currentUser);

    // 2. ✅ Tunggu DOM siap (karena sidebar/header dimuat dinamis)
    await new Promise(resolve => setTimeout(resolve, 100));

    // 3. ✅ Cek elemen ada
    const filterKelas = document.getElementById('filterKelasAbsen');
    const btnRefresh = document.getElementById('btnRefreshAbsen');
    const btnGenerate = document.getElementById('btnGenerateNilaiHadir');
    const btnExport = document.getElementById('btnExportExcel');
    
    if (!filterKelas || !btnRefresh || !btnGenerate || !btnExport) {
        console.error('❌ Elemen HTML tidak ditemukan!');
        return;
    }

    // 4. Load Dropdown Kelas
    if (currentUser.id_dosen) {
        await loadKelasDosen(currentUser.id_dosen);
    }

    // 5. Event Listener Dropdown
    filterKelas.addEventListener('change', async (e) => {
        currentIdKelas = e.target.value;
        
        if (!currentIdKelas) {
            document.getElementById('containerRekapAbsen').innerHTML = `
                <div class="text-center py-16 text-slate-400">
                    <i class="fa-solid fa-clipboard-list text-5xl mb-4 block opacity-30"></i>
                    <p class="text-sm font-medium">Silakan pilih mata kuliah di dropdown atas untuk melihat rekap absensi.</p>
                </div>
            `;
            document.getElementById('infoCard').classList.add('hidden');
            btnRefresh.disabled = true;
            btnGenerate.disabled = true;
            btnExport.disabled = true;
            return;
        }
        
        await loadRekapAbsensi(currentIdKelas);
        btnRefresh.disabled = false;
        btnGenerate.disabled = false;
        btnExport.disabled = false;
    });

    // 6. Tombol Refresh
    btnRefresh.addEventListener('click', async () => {
        if (currentIdKelas) await loadRekapAbsensi(currentIdKelas);
    });

    // 7. Tombol Generate Nilai Kehadiran
    btnGenerate.addEventListener('click', generateNilaiKehadiran);

    // 8. Tombol Export Excel
    btnExport.addEventListener('click', exportExcel);
});

// ==========================================
// LOAD DROPDOWN KELAS DOSEN
// ==========================================
async function loadKelasDosen(idDosen) {
    const select = document.getElementById('filterKelasAbsen');
    if (!select) return;

    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ 
                action: 'get_kelas_dosen_ujian', 
                id_dosen: idDosen 
            })
        });
        const result = await response.json();
        console.log(">>> Kelas dosen:", result);

        if (result.status === 'success') {
            select.innerHTML = '<option value="">-- Pilih Mata Kuliah --</option>';
            result.data.forEach(kelas => {
                const option = document.createElement('option');
                option.value = kelas.id_kelas;
                option.textContent = kelas.nama_kelas;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error load kelas:', error);
    }
}

// ==========================================
// LOAD REKAP ABSENSI KELAS
// ==========================================
async function loadRekapAbsensi(idKelas) {
    const container = document.getElementById('containerRekapAbsen');
    container.innerHTML = `
        <div class="text-center py-16 text-slate-400">
            <i class="fa-solid fa-circle-notch fa-spin text-4xl mb-3 block"></i>
            <p class="text-sm">Memuat rekap absensi...</p>
        </div>
    `;

    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ 
                action: 'get_rekap_absensi_kelas', 
                id_kelas: idKelas 
            })
        });
        const result = await response.json();
        console.log(">>> Rekap absensi:", result);

        if (result.status === 'success' && result.data) {
            currentRekapData = result.data;
            renderInfoCard(result.data);
            renderTabelMatriks(result.data);
        } else {
            container.innerHTML = `
                <div class="text-center py-16 text-red-400">
                    <i class="fa-solid fa-circle-exclamation text-4xl mb-3 block"></i>
                    <p class="text-sm font-medium">${result.message || 'Gagal memuat data.'}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error("Error load rekap:", error);
        container.innerHTML = `
            <div class="text-center py-16 text-red-400">
                <i class="fa-solid fa-circle-exclamation text-4xl mb-3 block"></i>
                <p class="text-sm font-medium">Gagal terhubung ke server.</p>
            </div>
        `;
    }
}

// ==========================================
// RENDER INFO CARD
// ==========================================
function renderInfoCard(data) {
    document.getElementById('infoCard').classList.remove('hidden');
    
    const ringkasan = data.ringkasan || {};
    document.getElementById('infoTotalPertemuan').innerText = ringkasan.total_pertemuan || 0;
    document.getElementById('infoTotalMhs').innerText = ringkasan.total_mahasiswa || 0;
    document.getElementById('infoRataKehadiran').innerText = (ringkasan.rata_kehadiran || 0) + '%';
    
    // Hitung mahasiswa dengan kehadiran < 75%
    const mhsKurang = (data.mahasiswa || []).filter(m => 
        m.persentase_kehadiran < 75
    ).length;
    document.getElementById('infoMhsKurang').innerText = mhsKurang;
}

// ==========================================
// RENDER TABEL MATRIKS
// ==========================================
function renderTabelMatriks(data) {
    const container = document.getElementById('containerRekapAbsen');
    
    const kelas = data.kelas || {};
    const pertemuan = data.pertemuan || [];
    const mahasiswa = data.mahasiswa || [];
    
    if (mahasiswa.length === 0) {
        container.innerHTML = `
            <div class="text-center py-16 text-slate-400">
                <i class="fa-regular fa-folder-open text-5xl mb-4 block opacity-30"></i>
                <p class="text-sm font-medium">Belum ada mahasiswa di kelas ini.</p>
            </div>
        `;
        return;
    }
    
    if (pertemuan.length === 0) {
        container.innerHTML = `
            <div class="text-center py-16 text-slate-400">
                <i class="fa-regular fa-calendar-xmark text-5xl mb-4 block opacity-30"></i>
                <p class="text-sm font-medium">Belum ada pertemuan di kelas ini.</p>
            </div>
        `;
        return;
    }
    
    // Header info
    let html = `
        <div class="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <div>
                <h3 class="text-base font-bold text-slate-800">
                    <i class="fa-solid fa-table-cells text-teal-600 mr-2"></i>${kelas.nama_matkul || 'Mata Kuliah'}
                </h3>
                <p class="text-xs text-slate-500 mt-0.5">${kelas.nama_kelas || '-'} • ${pertemuan.length} Pertemuan • ${mahasiswa.length} Mahasiswa</p>
            </div>
            <div class="text-xs text-slate-500">
                <i class="fa-regular fa-clock mr-1"></i>Diperbarui: ${new Date().toLocaleString('id-ID')}
            </div>
        </div>
        
        <div class="overflow-x-auto" style="max-height: 600px;">
            <table class="min-w-full text-xs border-collapse">
                <thead class="sticky top-0 bg-slate-100 z-10">
                    <tr>
                        <th class="sticky-col-header px-3 py-3 text-left font-bold text-slate-700 border-b-2 border-slate-200 min-w-[200px]">
                            Mahasiswa
                        </th>
    `;
    
    // Header pertemuan
    pertemuan.forEach(p => {
        html += `
            <th class="px-2 py-3 text-center font-bold text-slate-700 border-b-2 border-slate-200 min-w-[70px]" title="${p.tanggal} • ${p.jam_mulai}-${p.jam_selesai}">
                <div class="text-xs">P${p.pertemuan_ke}</div>
                <div class="text-[9px] text-slate-400 font-normal">${p.tanggal ? p.tanggal.split(' ')[0] : '-'}</div>
            </th>
        `;
    });
    
    // Header kolom persentase
    html += `
                        <th class="px-3 py-3 text-center font-bold text-slate-700 border-b-2 border-slate-200 bg-teal-50 min-w-[80px]">
                            <div class="text-xs">Kehadiran</div>
                        </th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Baris mahasiswa
    mahasiswa.forEach((mhs, idx) => {
        // Warna baris jika kehadiran < 75%
        const rowClass = mhs.persentase_kehadiran < 75 ? 'bg-red-50/50' : (idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50');
        
        html += `
            <tr class="${rowClass} hover:bg-teal-50/30 transition-colors border-b border-slate-100">
                <td class="sticky-col px-3 py-2 border-r border-slate-100 ${rowClass}">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            ${(mhs.nama || '?').charAt(0).toUpperCase()}
                        </div>
                        <div class="min-w-0">
                            <div class="font-bold text-slate-800 text-xs truncate">${mhs.nama || '-'}</div>
                            <div class="text-[10px] text-slate-500">${mhs.nim || '-'}</div>
                        </div>
                    </div>
                </td>
        `;
        
        // Cell absensi per pertemuan
        mhs.absensi.forEach(abs => {
            const statusConfig = STATUS_CONFIG[abs.status] || STATUS_CONFIG['Belum'];
            const tooltip = `P${abs.pertemuan_ke}: ${statusConfig.label}${abs.waktu_masuk !== '-' ? ' • Masuk: ' + abs.waktu_masuk : ''}${abs.waktu_keluar !== '-' ? ' • Keluar: ' + abs.waktu_keluar : ''}`;
            
            html += `
                <td class="px-1 py-2 text-center border-r border-slate-100">
                    <button onclick="bukaDetailKehadiran('${abs.id_pertemuan}', '${mhs.id_mahasiswa}')" 
                        class="tooltip-cell w-9 h-9 rounded-lg ${statusConfig.class} hover:scale-110 transition-transform inline-flex items-center justify-center font-bold text-[10px]"
                        data-tooltip="${tooltip}">
                        <i class="fa-solid ${statusConfig.icon}"></i>
                    </button>
                </td>
            `;
        });
        
        // Kolom persentase
        let persenColor = 'text-emerald-600 bg-emerald-50';
        if (mhs.persentase_kehadiran < 50) persenColor = 'text-red-600 bg-red-50';
        else if (mhs.persentase_kehadiran < 75) persenColor = 'text-amber-600 bg-amber-50';
        
        html += `
                <td class="px-3 py-2 text-center bg-teal-50/30">
                    <div class="inline-flex flex-col items-center">
                        <span class="px-2 py-1 rounded-lg text-xs font-bold ${persenColor}">
                            ${mhs.persentase_kehadiran}%
                        </span>
                        <span class="text-[9px] text-slate-400 mt-0.5">${mhs.jumlah_hadir}/${mhs.total_pertemuan}</span>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        
        <!-- Ringkasan Bawah -->
        <div class="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div class="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                <p class="text-slate-600 mb-1"><i class="fa-solid fa-check-circle text-emerald-500 mr-1"></i> Kehadiran ≥ 75%</p>
                <p class="text-lg font-bold text-emerald-700">
                    ${mahasiswa.filter(m => m.persentase_kehadiran >= 75).length} mahasiswa
                </p>
            </div>
            <div class="bg-amber-50 rounded-lg p-3 border border-amber-100">
                <p class="text-slate-600 mb-1"><i class="fa-solid fa-exclamation-triangle text-amber-500 mr-1"></i> Kehadiran 50-74%</p>
                <p class="text-lg font-bold text-amber-700">
                    ${mahasiswa.filter(m => m.persentase_kehadiran >= 50 && m.persentase_kehadiran < 75).length} mahasiswa
                </p>
            </div>
            <div class="bg-red-50 rounded-lg p-3 border border-red-100">
                <p class="text-slate-600 mb-1"><i class="fa-solid fa-times-circle text-red-500 mr-1"></i> Kehadiran &lt; 50%</p>
                <p class="text-lg font-bold text-red-700">
                    ${mahasiswa.filter(m => m.persentase_kehadiran < 50).length} mahasiswa
                </p>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// ==========================================
// BUKA DETAIL KEHADIRAN
// ==========================================
async function bukaDetailKehadiran(idPertemuan, idMahasiswa) {
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ 
                action: 'get_detail_kehadiran', 
                id_pertemuan: idPertemuan,
                id_mahasiswa: idMahasiswa 
            })
        });
        const result = await response.json();
        console.log(">>> Detail kehadiran:", result);

        if (result.status === 'success' && result.data) {
            const d = result.data;
            
            // Isi data
            document.getElementById('detailInisial').innerText = (d.mahasiswa.nama || '?').charAt(0).toUpperCase();
            document.getElementById('detailNamaMhs').innerText = d.mahasiswa.nama || '-';
            document.getElementById('detailNimMhs').innerText = d.mahasiswa.nim || '-';
            document.getElementById('detailPertemuanKe').innerText = 'Pertemuan ' + (d.pertemuan_ke || '-');
            document.getElementById('detailTanggal').innerText = d.tanggal || '-';
            document.getElementById('detailJamKuliah').innerText = `${d.jam_mulai} - ${d.jam_selesai}`;
            document.getElementById('detailMateri').innerText = d.judul_materi || '-';
            document.getElementById('detailWaktuMasuk').innerText = d.absensi.waktu_masuk || '-';
            document.getElementById('detailWaktuKeluar').innerText = d.absensi.waktu_keluar || '-';
            
            // Status badge
            const statusEl = document.getElementById('detailStatus');
            const statusConfig = STATUS_CONFIG[d.absensi.status] || STATUS_CONFIG['Belum'];
            statusEl.innerText = statusConfig.label;
            statusEl.className = `font-bold px-2 py-1 rounded ${statusConfig.class}`;
            
            // Simpan untuk koreksi
            document.getElementById('detailKoreksiStatus').dataset.idPertemuan = idPertemuan;
            document.getElementById('detailKoreksiStatus').dataset.idMahasiswa = idMahasiswa;
            document.getElementById('detailKoreksiStatus').value = '';
            
            // Buka modal
            document.getElementById('modalDetailKehadiran').classList.remove('hidden');
        } else {
            alert('❌ ' + (result.message || 'Gagal memuat detail.'));
        }
    } catch (error) {
        console.error("Error detail kehadiran:", error);
        alert('❌ Terjadi kesalahan koneksi.');
    }
}

// ==========================================
// SIMPAN KOREKSI KEHADIRAN
// ==========================================
async function simpanKoreksi() {
    const statusBaru = document.getElementById('detailKoreksiStatus').value;
    const idPertemuan = document.getElementById('detailKoreksiStatus').dataset.idPertemuan;
    const idMahasiswa = document.getElementById('detailKoreksiStatus').dataset.idMahasiswa;
    
    if (!statusBaru) {
        alert('⚠️ Pilih status baru terlebih dahulu.');
        return;
    }
    
    if (!confirm(`Ubah status kehadiran menjadi "${statusBaru}"?`)) return;
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ 
                action: 'koreksi_kehadiran', 
                id_pertemuan: idPertemuan,
                id_mahasiswa: idMahasiswa,
                status_baru: statusBaru,
                keterangan: 'Koreksi oleh dosen'
            })
        });
        const result = await response.json();
        console.log(">>> Koreksi:", result);

        if (result.status === 'success') {
            alert('✅ ' + result.message);
            tutupModal('modalDetailKehadiran');
            if (currentIdKelas) await loadRekapAbsensi(currentIdKelas);
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        console.error("Error koreksi:", error);
        alert('❌ Terjadi kesalahan koneksi.');
    }
}

// ==========================================
// GENERATE NILAI KEHADIRAN
// ==========================================
async function generateNilaiKehadiran() {
    if (!currentIdKelas) {
        alert('⚠️ Pilih mata kuliah dulu.');
        return;
    }
    
    if (!confirm('Generate nilai kehadiran untuk semua mahasiswa di kelas ini?\n\nNilai kehadiran akan dihitung dari persentase kehadiran dan disimpan ke sheet Nilai.')) {
        return;
    }
    
    const btn = document.getElementById('btnGenerateNilaiHadir');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Memproses...';
    btn.disabled = true;
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ 
                action: 'generate_nilai_kehadiran', 
                id_kelas: currentIdKelas 
            })
        });
        const result = await response.json();
        console.log(">>> Generate nilai:", result);

        if (result.status === 'success') {
            alert(`✅ ${result.message}\n\nTotal mahasiswa: ${result.total}\nBerhasil: ${result.sukses}`);
            await loadRekapAbsensi(currentIdKelas);
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        console.error("Error generate nilai:", error);
        alert('❌ Terjadi kesalahan koneksi.');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// ==========================================
// EXPORT EXCEL (Sederhana - CSV)
// ==========================================
function exportExcel() {
    if (!currentRekapData) {
        alert('⚠️ Tidak ada data untuk di-export.');
        return;
    }
    
    const data = currentRekapData;
    const kelas = data.kelas || {};
    const pertemuan = data.pertemuan || [];
    const mahasiswa = data.mahasiswa || [];
    
    // Header CSV
    let csv = `Rekap Absensi: ${kelas.nama_matkul || 'Mata Kuliah'}\n`;
    csv += `Kelas: ${kelas.nama_kelas || '-'}\n`;
    csv += `Tanggal Export: ${new Date().toLocaleString('id-ID')}\n\n`;
    
    // Header tabel
    csv += 'No,NIM,Nama';
    pertemuan.forEach(p => {
        csv += `,P${p.pertemuan_ke}`;
    });
    csv += ',Kehadiran (%)\n';
    
    // Baris mahasiswa
    mahasiswa.forEach((mhs, idx) => {
        csv += `${idx + 1},${mhs.nim || '-'},${mhs.nama || '-'}`;
        mhs.absensi.forEach(abs => {
            csv += `,${abs.status}`;
        });
        csv += `,${mhs.persentase_kehadiran}%\n`;
    });
    
    // Download
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Rekap_Absensi_${kelas.nama_kelas || 'kelas'}_${Date.now()}.csv`;
    link.click();
    
    console.log('✅ Export berhasil');
}

// ==========================================
// TUTUP MODAL
// ==========================================
function tutupModal(id) {
    document.getElementById(id).classList.add('hidden');
}
