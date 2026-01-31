// API Configuration
const API_BASE = '/api';
const WS_URL = `ws://${window.location.host}`;

let userToken = localStorage.getItem('petro_token');
let username = localStorage.getItem('petro_username');
let ws = null;
let matchData = null;
let currentTurn = null;
let player1Pets = [];
let player2Pets = [];
let activePetP1 = 0;
let activePetP2 = 0;
let isMyTurn = false;
let battleEnded = false;

// Check if user is logged in
if (!userToken) {
    window.location.href = '/login.html';
}

// Load match data from storage
const matchDataStr = localStorage.getItem('petro_match_data');
if (!matchDataStr) {
    alert('No match data found!');
    window.location.href = '/game.html';
} else {
    matchData = JSON.parse(matchDataStr);
}

// Initialize battle
async function init() {
    console.log('Match data:', matchData);
    
    // Set player names
    document.getElementById('player1-name').textContent = matchData.player1;
    document.getElementById('player2-name').textContent = matchData.player2;
    
    // Load pet details
    await loadPetDetails();
    
    // Display pets
    displayBattle();
    
    // Set initial turn (player1 starts)
    currentTurn = matchData.player1;
    isMyTurn = (currentTurn === username);
    updateTurnIndicator();
    
    // Connect WebSocket for real-time updates
    connectWebSocket();
    
    logMessage(`Battle started! ${matchData.player1} vs ${matchData.player2}`);
    logMessage(`${matchData.player1} bet $${matchData.player1Bet}, ${matchData.player2} bet $${matchData.player2Bet}`);
}

// Load pet details from inventory
async function loadPetDetails() {
    try {
        const response = await fetch(`${API_BASE}/inventory`, {
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        });
        
        const data = await response.json();
        const inventory = data.inventory;
        
        // Find pets for player1
        player1Pets = matchData.player1Pets.map(instanceId => {
            const pet = inventory.find(p => p.instanceId === instanceId);
            if (pet) {
                return { ...pet, currentHp: pet.hp, maxHp: pet.hp };
            }
            // If not found in our inventory, create a placeholder
            return { 
                instanceId, 
                name: 'Unknown Pet', 
                strength: 50, 
                hp: 100, 
                maxHp: 100,
                currentHp: 100, 
                dodge: 10,
                rarity: 'common'
            };
        });
        
        // Find pets for player2
        player2Pets = matchData.player2Pets.map(instanceId => {
            const pet = inventory.find(p => p.instanceId === instanceId);
            if (pet) {
                return { ...pet, currentHp: pet.hp, maxHp: pet.hp };
            }
            return { 
                instanceId, 
                name: 'Unknown Pet', 
                strength: 50, 
                hp: 100,
                maxHp: 100, 
                currentHp: 100,
                dodge: 10,
                rarity: 'common'
            };
        });
        
    } catch (error) {
        console.error('Failed to load pet details:', error);
    }
}

// Display battle
function displayBattle() {
    displayPlayerPets('player1-pets', player1Pets, matchData.player1);
    displayPlayerPets('player2-pets', player2Pets, matchData.player2);
}

// Display pets for a player
function displayPlayerPets(containerId, pets, playerName) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    pets.forEach((pet, index) => {
        const petCard = document.createElement('div');
        petCard.className = 'pet-card';
        petCard.dataset.index = index;
        
        const isActive = (playerName === matchData.player1 && index === activePetP1) ||
                        (playerName === matchData.player2 && index === activePetP2);
        
        if (isActive) {
            petCard.classList.add('active');
        }
        
        if (pet.currentHp <= 0) {
            petCard.classList.add('dead');
        }
        
        const hpPercent = (pet.currentHp / pet.maxHp) * 100;
        const rarityColor = getRarityColor(pet.rarity);
        
        petCard.innerHTML = `
            <h3 style="color: ${rarityColor}; margin: 0 0 10px 0;">${pet.name}</h3>
            <div>Level ${pet.level || 1}</div>
            <div>⚔️ Strength: ${pet.strength}</div>
            <div>💨 Dodge: ${pet.dodge}%</div>
            <div class="hp-bar">
                <div class="hp-fill" style="width: ${hpPercent}%"></div>
            </div>
            <div>HP: ${Math.max(0, pet.currentHp)} / ${pet.maxHp}</div>
        `;
        
        container.appendChild(petCard);
    });
}

// Connect WebSocket
function connectWebSocket() {
    ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
        console.log('Battle WebSocket connected');
        ws.send(JSON.stringify({ type: 'auth', token: userToken }));
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('WebSocket message:', data);
        
        if (data.type === 'opponent_action') {
            handleOpponentAction(data.action);
        } else if (data.type === 'match_complete') {
            handleMatchComplete(data);
        }
    };
}

// Attack function
function attack() {
    if (!isMyTurn) {
        logMessage('Not your turn!');
        return;
    }
    
    if (battleEnded) {
        return;
    }
    
    const isPlayer1 = (username === matchData.player1);
    const attackerPets = isPlayer1 ? player1Pets : player2Pets;
    const defenderPets = isPlayer1 ? player2Pets : player1Pets;
    const attackerIndex = isPlayer1 ? activePetP1 : activePetP2;
    const defenderIndex = isPlayer1 ? activePetP2 : activePetP1;
    
    const attacker = attackerPets[attackerIndex];
    const defender = defenderPets[defenderIndex];
    
    if (attacker.currentHp <= 0) {
        logMessage('Your active pet is defeated!');
        return;
    }
    
    // Calculate damage
    const dodgeRoll = Math.random() * 100;
    let damage = 0;
    
    if (dodgeRoll < defender.dodge) {
        logMessage(`${defender.name} dodged the attack!`);
    } else {
        damage = Math.floor(attacker.strength * (0.8 + Math.random() * 0.4));
        defender.currentHp = Math.max(0, defender.currentHp - damage);
        logMessage(`${attacker.name} dealt ${damage} damage to ${defender.name}!`);
    }
    
    // Update display
    displayBattle();
    
    // Check if defender is defeated
    if (defender.currentHp <= 0) {
        logMessage(`${defender.name} was defeated!`);
        
        // Check if all defender pets are defeated
        if (defenderPets.every(p => p.currentHp <= 0)) {
            endBattle(isPlayer1 ? matchData.player1 : matchData.player2);
            return;
        }
        
        // Auto-switch to next alive pet
        const nextIndex = defenderPets.findIndex(p => p.currentHp > 0);
        if (nextIndex !== -1) {
            if (isPlayer1) {
                activePetP2 = nextIndex;
            } else {
                activePetP1 = nextIndex;
            }
        }
    }
    
    // Send action to opponent
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'game_action',
            action: {
                type: 'attack',
                damage: damage,
                dodged: dodgeRoll < defender.dodge
            }
        }));
    }
    
    // Switch turns
    currentTurn = isPlayer1 ? matchData.player2 : matchData.player1;
    isMyTurn = false;
    updateTurnIndicator();
}

// Handle opponent action
function handleOpponentAction(action) {
    if (action.type === 'attack') {
        // Opponent attacked, now it's our turn
        isMyTurn = true;
        currentTurn = username;
        updateTurnIndicator();
        displayBattle();
    }
}

// End battle
async function endBattle(winner) {
    if (battleEnded) return;
    battleEnded = true;
    
    logMessage(`${winner} wins the battle!`);
    
    // Show winner banner
    const banner = document.getElementById('winner-banner');
    banner.textContent = `${winner} WINS!`;
    banner.style.display = 'block';
    
    // Send match completion to server
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'match_complete',
            matchId: matchData.matchId,
            winner: winner
        }));
    }
    
    // Redirect after delay
    setTimeout(() => {
        localStorage.removeItem('petro_match_data');
        window.location.href = '/game.html';
    }, 5000);
}

// Handle match complete
function handleMatchComplete(data) {
    logMessage(`Final balances - ${data.player1}: $${data.player1FinalBalance}, ${data.player2}: $${data.player2FinalBalance}`);
}

// Update turn indicator
function updateTurnIndicator() {
    const indicator = document.getElementById('turn-indicator');
    if (isMyTurn) {
        indicator.textContent = 'Your Turn!';
        indicator.style.color = '#0f0';
    } else {
        indicator.textContent = `${currentTurn}'s Turn`;
        indicator.style.color = '#f00';
    }
    
    // Highlight active player section
    const p1Section = document.getElementById('player1-section');
    const p2Section = document.getElementById('player2-section');
    
    if (currentTurn === matchData.player1) {
        p1Section.classList.add('active');
        p2Section.classList.remove('active');
    } else {
        p2Section.classList.add('active');
        p1Section.classList.remove('active');
    }
}

// Log message to battle log
function logMessage(message) {
    const logMessages = document.getElementById('log-messages');
    const msgDiv = document.createElement('div');
    msgDiv.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    msgDiv.style.cssText = 'margin: 5px 0; padding: 5px; background: #2a2a4a; border-left: 3px solid #4CAF50;';
    logMessages.appendChild(msgDiv);
    logMessages.scrollTop = logMessages.scrollHeight;
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
