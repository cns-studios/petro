// API Configuration
const API_BASE = '/api';
const WS_URL = `ws://${window.location.host}`;

let userToken = localStorage.getItem('petro_token');
let username = localStorage.getItem('petro_username');
let ws = null;
let matchId = null;
let opponent = null;
let userInventory = [];
let selectedPets = [];
let betAmount = 0;

// Check if user is logged in
if (!userToken) {
    window.location.href = '/login.html';
}

// Display username
document.getElementById('username').textContent = username;

// API Helper function
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${userToken}`,
            'Content-Type': 'application/json'
        }
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'API request failed');
    }
    
    return data;
}

// Initialize
async function init() {
    try {
        // Load inventory first
        const inventoryData = await apiCall('/inventory');
        userInventory = inventoryData.inventory;
        
        if (userInventory.length < 3) {
            alert('You need at least 3 pets to play! Go to the shop first.');
            window.location.href = '/game.html';
            return;
        }
        
        // Join matchmaking queue
        const matchData = await apiCall('/matchmaking/join', 'POST');
        
        if (matchData.matched) {
            // Match found immediately
            matchId = matchData.matchId;
            opponent = matchData.opponent;
            showPetSelection();
        } else {
            // Waiting for opponent
            updateStatus('Searching for opponent...');
            connectWebSocket();
        }
    } catch (error) {
        console.error('Matchmaking error:', error);
        alert(error.message);
        window.location.href = '/game.html';
    }
}

// Update status display
function updateStatus(message) {
    const h1 = document.querySelector('h1');
    if (h1) {
        h1.textContent = message;
    }
}

// Connect to WebSocket
function connectWebSocket() {
    ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
        console.log('WebSocket connected');
        // Authenticate
        ws.send(JSON.stringify({ type: 'auth', token: userToken }));
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('WebSocket message:', data);
        
        if (data.type === 'auth_success') {
            console.log('Authenticated via WebSocket');
        } else if (data.type === 'match_found') {
            matchId = data.match.matchId;
            opponent = data.match.opponent;
            updateStatus('Match found!');
            showPetSelection();
        } else if (data.type === 'match_start') {
            // Both players ready, start battle
            localStorage.setItem('petro_match_data', JSON.stringify(data));
            window.location.href = '/battle.html';
        }
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
        console.log('WebSocket disconnected');
    };
}

// Show pet selection modal
function showPetSelection() {
    updateStatus(`Match found! Opponent: ${opponent}`);
    
    // Create selection modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
        overflow-y: auto;
    `;
    
    modal.innerHTML = `
        <div style="background: #1a1a2e; padding: 30px; border-radius: 10px; max-width: 800px; width: 100%;">
            <h2 style="color: #fff; text-align: center; margin-bottom: 20px;">Select 3 Pets for Battle</h2>
            <div id="pet-selection-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;"></div>
            
            <div style="margin: 20px 0; padding: 15px; background: #0f3460; border-radius: 5px;">
                <label style="color: #fff; display: block; margin-bottom: 10px;">Place Your Bet (max: $${localStorage.getItem('petro_money')})</label>
                <input type="number" id="bet-amount" min="0" max="${localStorage.getItem('petro_money')}" value="0" 
                       style="width: 100%; padding: 10px; border-radius: 5px; border: none; font-size: 16px;">
            </div>
            
            <div style="text-align: center;">
                <button id="confirm-selection" disabled 
                        style="background: #4CAF50; color: white; border: none; padding: 15px 40px; border-radius: 5px; cursor: pointer; font-size: 18px;">
                    Confirm Selection
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const grid = document.getElementById('pet-selection-grid');
    
    // Display pets
    userInventory.forEach(pet => {
        const petCard = document.createElement('div');
        petCard.className = 'selectable-pet';
        petCard.dataset.instanceId = pet.instanceId;
        const rarityColor = getRarityColor(pet.rarity);
        
        petCard.style.cssText = `
            background: #2a2a4a;
            border: 2px solid ${rarityColor};
            border-radius: 8px;
            padding: 12px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
        `;
        
        petCard.innerHTML = `
            <h4 style="color: ${rarityColor}; margin: 0 0 8px 0; font-size: 14px;">${pet.name}</h4>
            <div style="font-size: 11px; color: #aaa; margin-bottom: 8px;">Level ${pet.level}</div>
            <div style="font-size: 12px;">
                <div>⚔️ ${pet.strength}</div>
                <div>❤️ ${pet.hp}</div>
                <div>💨 ${pet.dodge}%</div>
            </div>
        `;
        
        petCard.addEventListener('click', () => togglePetSelection(petCard, pet));
        grid.appendChild(petCard);
    });
    
    // Setup confirm button
    document.getElementById('confirm-selection').addEventListener('click', confirmSelection);
}

// Toggle pet selection
function togglePetSelection(card, pet) {
    const instanceId = pet.instanceId;
    const index = selectedPets.indexOf(instanceId);
    
    if (index > -1) {
        // Deselect
        selectedPets.splice(index, 1);
        card.style.opacity = '1';
        card.style.transform = 'scale(1)';
    } else {
        // Select
        if (selectedPets.length >= 3) {
            alert('You can only select 3 pets!');
            return;
        }
        selectedPets.push(instanceId);
        card.style.opacity = '0.7';
        card.style.transform = 'scale(0.95)';
        card.style.background = '#4CAF50';
    }
    
    // Update button state
    const confirmBtn = document.getElementById('confirm-selection');
    confirmBtn.disabled = selectedPets.length !== 3;
    confirmBtn.style.opacity = selectedPets.length === 3 ? '1' : '0.5';
    confirmBtn.style.cursor = selectedPets.length === 3 ? 'pointer' : 'not-allowed';
}

// Confirm selection
async function confirmSelection() {
    betAmount = parseInt(document.getElementById('bet-amount').value) || 0;
    
    const maxBet = parseInt(localStorage.getItem('petro_money'));
    if (betAmount < 0 || betAmount > maxBet) {
        alert(`Bet must be between 0 and ${maxBet}`);
        return;
    }
    
    try {
        // Send selection to server
        await apiCall('/matchmaking/select', 'POST', {
            matchId: matchId,
            petInstanceIds: selectedPets,
            betAmount: betAmount
        });
        
        updateStatus('Waiting for opponent to select pets...');
        
        // If WebSocket not connected, connect now
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            connectWebSocket();
        }
        
        // Send ready message via WebSocket
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'match_ready' }));
        }
    } catch (error) {
        alert('Failed to submit selection: ' + error.message);
    }
}

// Get rarity color
function getRarityColor(rarity) {
    const colors = {
        common: '#808080',
        rare: '#4169E1',
        legendary: '#FF8C00',
        prehistoric: '#9400D3'
    };
    return colors[rarity] || '#fff';
}

// Initialize when page loads
init();
