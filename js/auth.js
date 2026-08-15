// js/auth.js - Logika Login & Otentikasi Client-Side

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault(); 
    
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const btn = document.getElementById('loginBtn');
    const msg = document.getElementById('statusMessage');
    const btnOriginalContent = btn.innerHTML;

    // Tampilan Loading
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i><span>Memvalidasi...</span>';
    btn.disabled = true;
    btn.classList.add('opacity-75');
    
    msg.className = 'mt-4 text-center text-sm block p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200';
    msg.innerHTML = '<i class="fa-solid fa-cloud-arrow-up mr-1"></i> Menghubungkan ke server...';

    // Hash password
    const hashedPassword = CryptoJS.SHA256(pass).toString();

    try {
        // Menggunakan CONFIG.API_URL dari file js/config.js
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'login',
                username: user,
                password: hashedPassword
            })
        });

        const result = await response.json();

        if (result.status === 'success') {
            msg.className = 'mt-4 text-center text-sm block p-2 rounded-lg bg-green-50 text-green-600 border border-green-200 font-medium';
            msg.innerHTML = '<i class="fa-solid fa-circle-check mr-1"></i> Login Berhasil! Mengalihkan...';
            
            localStorage.setItem('user_session', JSON.stringify(result.data));
            
            setTimeout(() => {
                if (result.data.role === 'dosen') {
                    window.location.href = 'dosen-dashboard.html'; // BENAR
                } else if (result.data.role === 'mahasiswa') {
                    window.location.href = 'dashboard.html'; // BENAR
                }
            }, 1000);
            
        } else {
            msg.className = 'mt-4 text-center text-red-600 bg-red-50 p-2 rounded-lg text-sm block border border-red-200';
            msg.innerHTML = `<i class="fa-solid fa-circle-exclamation mr-1"></i> ${result.message}`;
            
            btn.innerHTML = btnOriginalContent;
            btn.disabled = false;
            btn.classList.remove('opacity-75');
        }
    } catch (error) {
        msg.className = 'mt-4 text-center text-red-600 bg-red-50 p-2 rounded-lg text-sm block border border-red-200';
        msg.innerHTML = '<i class="fa-solid fa-triangle-exclamation mr-1"></i> Gagal terhubung. Cek URL API di js/config.js.';
        
        btn.innerHTML = btnOriginalContent;
        btn.disabled = false;
        btn.classList.remove('opacity-75');
    }
});
