let ws;
let stateRequestTimeout = null;

//Cookie Handler
function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function deleteCookie(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
}


// Check authentication on page load
window.addEventListener('DOMContentLoaded', () => {
    const username = getCookie('username');
    const pin = getCookie('pin');

    if (!username || !pin) {
        window.location.href = '/login';
    } else {
        connectWebSocket(username, pin);
    }
});

function connectWebSocket(username, pin) {
    console.log('Connecting to matchmaking...', { username, pin });
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${protocol}//${window.location.host}?username=${encodeURIComponent(username)}&pin=${encodeURIComponent(pin)}`);

    ws.onopen = () => {
        console.log('Connected to server. Joining matchmaking...');
        ws.send('join_matchmaking');
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('Received:', data);
            
            if (data.type === 'searching') {
                document.body.innerHTML = `
                    <div style="text-align: center; padding: 50px;">
                        <h1>Searching for opponent...</h1>
                        <p>Queue position: ${data.queuePosition}</p>
                        <div class="spinner"></div>
                        <button onclick="leaveQueue()">Cancel</button>
                    </div>
                `;
            } else if (data.type === 'match_found') {
                document.body.innerHTML = `
                    <div style="text-align: center; padding: 50px;">
                        <h1>Match Found!</h1>
                        <p>Opponent: ${data.opponent}</p>
                        <p>Starting battle...</p>
                    </div>
                `;
                
                setTimeout(() => {
                    window.location.href = `/battle?battleId=${data.battleId}&username=${username}&pin=${pin}`;
                }, 2000);
            } else if (data.type === 'matchmaking_disabled') {
                document.body.innerHTML = `
                    <div style="text-align: center; padding: 50px;">
                        <h1>Matchmaking Disabled</h1>
                        <p>${data.message}</p>
                    </div>
                `;
                setTimeout(() => {
                    window.location.href = '/game';
                }, 5000);
            } else if (data.type === 'left_queue') {
                window.location.href = '/game';
            }
        } catch (e) {
            console.error('Failed to parse message:', e);
        }
    };

    ws.onclose = () => {
        console.log('Disconnected from matchmaking');
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}

function leaveQueue() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send('leave_matchmaking');
    }
}
function updateUI(state) {

};