let ws;
let currentUsername;
let battleState = null;

function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        battleId: params.get('battleId'),
        username: params.get('username'),
        pin: params.get('pin')
    };
}

window.addEventListener('DOMContentLoaded', () => {
    const params = getQueryParams();
    
    if (!params.battleId || !params.username || !params.pin) {
        alert('Invalid battle parameters');
        window.location.href = '/game';
        return;
    }
    
    currentUsername = params.username;
    connectBattle(params.battleId, params.username, params.pin);
});

function connectBattle(battleId, username, pin) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${protocol}//${window.location.host}/battle?battleId=${battleId}&username=${encodeURIComponent(username)}&pin=${encodeURIComponent(pin)}`);
    
    ws.onopen = () => {
        console.log('Connected to battle');
        ws.send('get_state');
    };
    
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('Battle update:', data);
            
            if (data.type === 'battle_state') {
                battleState = data;
                updateBattleUI(data);
            } else if (data.type === 'battle_ended') {
                setTimeout(() => {
                    window.location.href = '/game';
                }, 5000);
            } else if (data.type === 'error') {
                alert(data.message);
            }
        } catch (e) {
            console.error('Failed to parse battle data:', e);
        }
    };
    
    ws.onclose = () => {
        console.log('Battle connection closed');
    };
    
    ws.onerror = (error) => {
        console.error('Battle WebSocket error:', error);
    };
}

function updateBattleUI(state) {
    // turn indicator
    const turnIndicator = document.getElementById('turn-indicator');
    const isMyTurn = state.current_turn === currentUsername;
    turnIndicator.innerHTML = `<h2>Turn ${state.turn_number} - ${isMyTurn ? 'YOUR TURN' : state.current_turn + "'s Turn"}</h2>`;
    
    // player sections
    document.getElementById('player1-name').textContent = state.player1.name;
    document.getElementById('player2-name').textContent = state.player2.name;
    
    document.getElementById('player1-section').classList.toggle('active', state.current_turn === state.player1.name);
    document.getElementById('player2-section').classList.toggle('active', state.current_turn === state.player2.name);
    
    updatePets('player1-pets', state.player1.pets, state.player1.active_pet);
    updatePets('player2-pets', state.player2.pets, state.player2.active_pet);
    
    // battle log
    const logMessages = document.getElementById('log-messages');
    logMessages.innerHTML = state.battle_log.map(msg => `<p>${msg}</p>`).join('');
    logMessages.scrollTop = logMessages.scrollHeight;
    
    // Enable/disable attack button
    document.getElementById('attack-btn').disabled = !isMyTurn || state.winner;
    
    if (state.winner) {
        const banner = document.getElementById('winner-banner');
        banner.textContent = state.winner === currentUsername ? 'YOU WIN!' : state.winner + ' WINS!';
        banner.style.display = 'block';
    }
}

function updatePets(elementId, pets, activeIndex) {
    const container = document.getElementById(elementId);
    container.innerHTML = pets.map((pet, index) => {
        const hpPercent = (pet.hp / pet.max_hp) * 100;
        return `
            <div class="pet-card ${index === activeIndex ? 'active' : ''} ${!pet.alive ? 'dead' : ''}">
                <strong>${pet.name}</strong> (Lv. ${pet.level})
                <div>ATK: ${pet.attack} | Dodge: ${pet.dodge_chance}%</div>
                <div>HP: ${pet.hp}/${pet.max_hp}</div>
                <div class="hp-bar">
                    <div class="hp-fill" style="width: ${hpPercent}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

function attack() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send('attack');
    }
}