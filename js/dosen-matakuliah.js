/**
 * Logika JavaScript untuk Halaman Dosen & Mata Kuliah
 * Mengelola pemuatan data, pencarian, filter, dan modal form.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Inisialisasi komponen saat DOM siap
    loadDosenMatakuliahData();
    initEventListeners();
});

/**
 * Memuat data Dosen dan Mata Kuliah dari API / localStorage
 */
function loadDosenMatakuliahData() {
    const tableBody = document.getElementById('dosenMatkulTableBody');
    if (!tableBody) return;

    // Tampilkan indikator loading
    tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center py-4 text-muted">
                <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                Memuat data...
            </td>
        </tr>
    `;

    // Simulasi pengambilan data (Ganti dengan endpoint fetch API yang sesuai)
    setTimeout(() => {
        // Contoh data dummy (Sesuaikan dengan struktur database/backend Anda)
        const dummyData = [
            {
                id: 1,
                kodeDosen: 'DSN001',
                namaDosen: 'Dr. Ir. H. Ahmad, M.P.',
                mataKuliah: [
                    { kode: 'AGR101', nama: 'Dasar-Dasar Agronomi', sks: 3, semester: 1 },
                    { kode: 'AGR302', nama: 'Fisiologi Tumbuhan', sks: 3, semester: 3 }
                ]
            },
            {
                id: 2,
                kodeDosen: 'DSN002',
                namaDosen: 'Siti Rahma, S.P., M.Sc.',
                mataKuliah: [
                    { kode: 'AGR201', nama: 'Ilmu Tanah & Kesuburan', sks: 3, semester: 2 },
                    { kode: 'AGR405', nama: 'Bioteknologi Pertanian', sks: 3, semester: 4 }
                ]
            }
        ];

        renderTable(dummyData);
    }, 500);
}

/**
 * Merender data ke dalam tabel HTML
 * @param {Array} data - Array objek data dosen dan mata kuliah
 */
function renderTable(data) {
    const tableBody = document.getElementById('dosenMatkulTableBody');
    tableBody.innerHTML = '';

    if (data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4 text-muted">Tidak ada data ditemukan.</td>
            </tr>
        `;
        return;
    }

    data.forEach((item, index) => {
        // Gabungkan daftar mata kuliah menjadi format list HTML
        const matkulList = item.mataKuliah.map(mk => 
            `<span class="badge bg-light text-dark border me-1 mb-1" title="SKS: ${mk.sks}, Semester: ${mk.semester}">
                [${mk.kode}] ${mk.nama} (${mk.sks} SKS)
             </span>`
        ).join('');

        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="text-center">${index + 1}</td>
            <td>
                <strong>${item.namaDosen}</strong><br>
                <small class="text-muted">NIDN/Kode: ${item.kodeDosen}</small>
            </td>
            <td>${matkulList}</td>
            <td class="text-center">
                <span class="badge bg-primary">${item.mataKuliah.reduce((acc, curr) => acc + curr.sks, 0)} SKS</span>
            </td>
            <td class="text-center">
                <button class="btn btn-sm btn-outline-warning me-1" onclick="editData(${item.id})" title="Edit">
                    <i class="bi bi-pencil-square"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteData(${item.id})" title="Hapus">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

/**
 * Inisialisasi Event Listener untuk Pencarian dan Aksi Form
 */
function initEventListeners() {
    const searchInput = document.getElementById('searchDosenMatkul');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const keyword = e.target.value.toLowerCase();
            filterData(keyword);
        });
    }

    const form = document.getElementById('formDosenMatkul');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            saveData();
        });
    }
}

/**
 * Filter data berdasarkan kata kunci pencarian
 * @param {String} keyword 
 */
function filterData(keyword) {
    // Implementasi pencarian lokal atau panggil ulang API dengan parameter query
    const rows = document.querySelectorAll('#dosenMatkulTableBody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(keyword) ? '' : 'none';
    });
}

/**
 * Fungsi untuk memproses penyimpanan data (Simpan / Update)
 */
function saveData() {
    // Ambil data dari form modal
    const dosenId = document.getElementById('dosenId')?.value;
    // ... proses kirim via AJAX/Fetch ke backend ...

    // Contoh penutupan modal setelah simpan sukses
    const modalElement = document.getElementById('modalDosenMatkul');
    if (modalElement) {
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
    }

    // Muat ulang data tabel
    loadDosenMatakuliahData();
}

/**
 * Fungsi placeholder untuk Edit Data
 * @param {Number} id 
 */
function editData(id) {
    console.log(`Edit data dengan ID: ${id}`);
    // Buka modal dan isi form dengan data terkait
}

/**
 * Fungsi placeholder untuk Hapus Data
 * @param {Number} id 
 */
function deleteData(id) {
    if (confirm('Apakah Anda yakin ingin menghapus penugasan mata kuliah ini?')) {
        console.log(`Hapus data dengan ID: ${id}`);
        // Lakukan pemanggilan API delete, lalu muat ulang tabel
        loadDosenMatakuliahData();
    }
}
