// Handlers

// API
const api = {
    verify: async () => {
        const response = await fetch('/api/verify');
        if (!response.ok) throw new Error('Verification failed');
        return response.json();
    }
};

// Other
(async function init() {
    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    };

    const token = getCookie('auth_token');

    if (!token) {
        window.location.href = '/login';
        return;
    }

    try {
        const data = await api.verify();
        if (data.success) {
            window.location.href = '/home';
        } else {
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Auth verification failed:', error);
        window.location.href = '/login';
    }
})();
