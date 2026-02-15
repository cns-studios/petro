// Handlers
const handleLogin = async (e) => {
    e.preventDefault();
    const ign = document.getElementById('ign').value;
    const pw = document.getElementById('pw').value;
    const errorEl = document.getElementById('error');

    try {
        const data = await api.login(ign, pw);
        if (data.success) {
            window.location.href = '/home';
        } else {
            errorEl.textContent = data.message || 'Login failed';
        }
    } catch (error) {
        errorEl.textContent = 'An error occurred';
    }
};

// API
const api = {
    login: async (ign, pw) => {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ign, pw })
        });
        return response.json();
    }
};

// Other
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
}
