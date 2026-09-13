// js/auth.js - Logika Login & Otentikasi Client-Side
// ✅ Selaras dengan Auth.gs - Login
// ✅ Content-Type header
// ✅ Debug log lengkap
// ✅ Storage key konsisten
// ✅ Toggle password visibility

// ==========================================
// TOGGLE PASSWORD VISIBILITY
// ==========================================
function togglePassword() {
    const input = document.getElementById('password');
    const icon = document.getElementById('eyeIcon');
    
    if (!input || !icon) {
        console.warn('Element password atau eyeIcon tidak ditemukan');
        return;
    }
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// ==========================================
// LOGIN HANDLER
// ==========================================
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault(); 
    
    const user = document.getElementById('username').value.trim();
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

    // Hash password SHA-256
    const hashedPassword = CryptoJS.SHA256(pass).toString();

    console.log('>>> Login attempt:', user);
    console.log('>>> Hashed password:', hashedPassword);

    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'login',
                username: user,
                password: hashedPassword
            })
        });

        const rawText = await response.text();
        console.log('>>> Raw response:', rawText);
        
        let result;
        try {
            result = JSON.parse(rawText);
        } catch (parseErr) {
            console.error('❌ Response bukan JSON:', rawText);
            throw new Error('Response server bukan JSON. Cek deployment Apps Script.');
        }

        console.log('>>> Parsed response:', result);

        if (result.status === 'success') {
            msg.className = 'mt-4 text-center text-sm block p-2 rounded-lg bg-green-50 text-green-600 border border-green-200 font-medium';
            msg.innerHTML = '<i class="fa-solid fa-circle-check mr-1"></i> Login Berhasil! Mengalihkan...';
            
            // Simpan ke multiple key
            localStorage.setItem('user_session', JSON.stringify(result.data));
            localStorage.setItem('user', JSON.stringify(result.data));
            localStorage.setItem('isLoggedIn', 'true');

            console.log('>>> Saved to localStorage');
            console.log('>>> Role:', result.data.role);

            setTimeout(() => {
                const role = (result.data.role || '').toLowerCase().trim();
                const origin = window.location.origin;
                const basePath = window.location.pathname.replace(/\/[^/]*$/, '/');
                
                let redirectUrl = '';
                
                // ⚠️ Sesuaikan dengan nama file dashboard Anda
                if (role === 'admin') {
                    redirectUrl = origin + basePath + 'admin/admin-dashboard.html';
                } else if (role === 'dosen') {
                    redirectUrl = origin + basePath + 'dosen/dosen-dashboard.html';
                } else if (role === 'mahasiswa') {
                    redirectUrl = origin + basePath + 'mahasiswa/dashboard.html';
                } else {
                    console.error("❌ Role tidak dikenali:", role);
                    redirectUrl = origin + basePath + 'index.html';
                }
                
                console.log(">>> Redirect ke:", redirectUrl);
                
                // Redirect langsung
                window.location.href = redirectUrl;
                
            }, 800);
            
        } else {
            msg.className = 'mt-4 text-center text-red-600 bg-red-50 p-2 rounded-lg text-sm block border border-red-200';
            msg.innerHTML = `<i class="fa-solid fa-circle-exclamation mr-1"></i> ${result.message || 'Login gagal.'}`;
            
            btn.innerHTML = btnOriginalContent;
            btn.disabled = false;
            btn.classList.remove('opacity-75');
        }
    } catch (error) {
        console.error('❌ Error login:', error);
        msg.className = 'mt-4 text-center text-red-600 bg-red-50 p-2 rounded-lg text-sm block border border-red-200';
        msg.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1"></i> Error: ${error.message}`;
        
        btn.innerHTML = btnOriginalContent;
        btn.disabled = false;
        btn.classList.remove('opacity-75');
    }
});
