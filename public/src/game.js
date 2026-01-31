// API Configuration
const API_BASE = '/api';
let userToken = localStorage.getItem('petro_token');
let username = localStorage.getItem('petro_username');
let userMoney = parseInt(localStorage.getItem('petro_money')) || 0;
let userInventory = [];
let shopPets = [];

// Check if user is logged in
if (!userToken) {
    window.location.href = '/login.html';
}

// Logout function
function logout() {
    localStorage.removeItem('petro_token');
    localStorage.removeItem('petro_username');
    localStorage.removeItem('petro_money');
    window.location.href = '/login.html';
}

// Initialize the game
async function init() {
    console.log('Initializing game...');
    
    // Display username
    document.getElementById('username').textContent = username;
    document.getElementById('money').textContent = userMoney;
    
    // Load user data
    await loadUserData();
    await loadShopPets();
    await loadInventory();
    
    // Show home by default
    showPage('home');
    
    // Setup navigation
    setupNavigation();
    
    // Setup play button
    document.getElementById('play-btn').addEventListener('click', () => {
        window.location.href = '/matchmaking.html';
    });
    
    // Setup save button
    document.getElementById('save-btn').addEventListener('click', saveGame);
}

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
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        showMessage(error.message, 'error');
        throw error;
    }
}

// Load user data
async function loadUserData() {
    try {
        const data = await apiCall('/auth/verify');
        username = data.username;
        updateMoney(data.money);
    } catch (error) {
        console.error('Failed to load user data:', error);
        logout();
    }
}

// Load shop pets
async function loadShopPets() {
    try {
        const data = await apiCall('/shop/pets');
        shopPets = data.pets;
        displayShop();
    } catch (error) {
        console.error('Failed to load shop:', error);
    }
}

// Load inventory
async function loadInventory() {
    try {
        const data = await apiCall('/inventory');
        userInventory = data.inventory;
        displayInventory();
    } catch (error) {
        console.error('Failed to load inventory:', error);
    }
}

// Update money display
function updateMoney(amount) {
    userMoney = amount;
    document.getElementById('money').textContent = userMoney;
    localStorage.setItem('petro_money', userMoney);
}

// Display shop
function displayShop() {
    const shopContainer = document.getElementById('shop-container');
    
    // Clear existing content
    const existingActions = shopContainer.querySelector('.shop-actions');
    if (existingActions) {
        existingActions.remove();
    }
    
    // Create pets grid
    const petsGrid = document.createElement('div');
    petsGrid.className = 'pets-grid';
    petsGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin-top: 20px;';
    
    shopPets.forEach(pet => {
        const petCard = document.createElement('div');
        petCard.className = 'pet-shop-card';
        petCard.style.cssText = 'background: #2a2a4a; border-radius: 8px; padding: 15px; text-align: center; cursor: pointer; transition: transform 0.2s;';
        
        const rarityColor = getRarityColor(pet.rarity);
        petCard.style.border = `2px solid ${rarityColor}`;
        
        petCard.innerHTML = `
            <h3 style="color: ${rarityColor}; margin: 0 0 10px 0;">${pet.name}</h3>
            <p style="font-size: 12px; color: #aaa; margin: 5px 0;">${pet.rarity.toUpperCase()}</p>
            <div style="margin: 10px 0; font-size: 14px;">
                <div>⚔️ Strength: ${pet.strength}</div>
                <div>❤️ HP: ${pet.hp}</div>
                <div>💨 Dodge: ${pet.dodge}%</div>
            </div>
            <p style="margin: 10px 0; font-size: 12px; color: #ddd;">${pet.description}</p>
            <button onclick="buyPet(${pet.id})" class="btn-buy" style="background: #4CAF50; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-size: 14px; width: 100%;">
                Buy for $${pet.cost}
            </button>
        `;
        
        petCard.addEventListener('mouseenter', () => {
            petCard.style.transform = 'translateY(-5px)';
        });
        
        petCard.addEventListener('mouseleave', () => {
            petCard.style.transform = 'translateY(0)';
        });
        
        petsGrid.appendChild(petCard);
    });
    
    shopContainer.appendChild(petsGrid);
}

// Buy a pet
async function buyPet(petId) {
    try {
        const data = await apiCall('/shop/buy', 'POST', { petId });
        updateMoney(data.newBalance);
        showMessage(`Successfully bought ${data.pet.name}!`, 'success');
        await loadInventory();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// Display inventory
function displayInventory() {
    const inventoryContainer = document.getElementById('inventory');
    inventoryContainer.innerHTML = '';
    
    if (userInventory.length === 0) {
        inventoryContainer.innerHTML = '<p style="color: #aaa; text-align: center; padding: 20px;">No pets yet. Visit the shop to buy some!</p>';
        return;
    }
    
    const inventoryGrid = document.createElement('div');
    inventoryGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px;';
    
    userInventory.forEach(pet => {
        const petCard = document.createElement('div');
        petCard.className = 'pet-inv-card';
        const rarityColor = getRarityColor(pet.rarity);
        
        petCard.style.cssText = `
            background: #2a2a4a;
            border: 2px solid ${rarityColor};
            border-radius: 8px;
            padding: 12px;
            text-align: center;
            position: relative;
        `;
        
        petCard.innerHTML = `
            <h4 style="color: ${rarityColor}; margin: 0 0 8px 0; font-size: 16px;">${pet.name}</h4>
            <div style="font-size: 12px; color: #aaa; margin-bottom: 8px;">Level ${pet.level}</div>
            <div style="font-size: 13px; margin: 5px 0;">
                <div>⚔️ ${pet.strength}</div>
                <div>❤️ ${pet.hp}</div>
                <div>💨 ${pet.dodge}%</div>
            </div>
            <button onclick="sellPet('${pet.instanceId}')" class="btn-sell" style="background: #f44336; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-top: 8px; width: 100%;">
                Sell ($${Math.floor(pet.purchasePrice * 0.7)})
            </button>
        `;
        
        inventoryGrid.appendChild(petCard);
    });
    
    inventoryContainer.appendChild(inventoryGrid);
}

// Sell a pet
async function sellPet(instanceId) {
    if (!confirm('Are you sure you want to sell this pet? You will get 70% of the purchase price.')) {
        return;
    }
    
    try {
        const data = await apiCall('/shop/sell', 'POST', { instanceId });
        updateMoney(data.newBalance);
        showMessage(`Pet sold for $${data.refund}!`, 'success');
        await loadInventory();
    } catch (error) {
        showMessage(error.message, 'error');
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

// Show message
function showMessage(message, type = 'info') {
    const messageEl = document.getElementById('message');
    const messageContainer = document.getElementById('message-container');
    
    messageEl.textContent = message;
    messageContainer.style.display = 'block';
    messageContainer.className = `message-${type}`;
    
    setTimeout(() => {
        messageContainer.style.display = 'none';
    }, 3000);
}

// Setup navigation
function setupNavigation() {
    document.getElementById('goto-home').addEventListener('click', () => showPage('home'));
    document.getElementById('goto-shop').addEventListener('click', () => showPage('shop'));
    document.getElementById('goto-inv').addEventListener('click', () => showPage('inv'));
    
    const settingsBtn = document.getElementById('goto-settings');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => showPage('settings'));
    }
}

// Show page
function showPage(page) {
    // Hide all pages
    const pages = ['home', 'shop', 'inv', 'settings'];
    pages.forEach(p => {
        const el = document.getElementById(p);
        if (el) {
            el.style.display = 'none';
        }
    });
    
    // Show selected page
    const selectedPage = document.getElementById(page);
    if (selectedPage) {
        selectedPage.style.display = 'block';
    }
}

// Save game
async function saveGame() {
    showMessage('Game saved!', 'success');
}

// Legacy functions for compatibility
function buy(type) {
    showMessage('Use the pet cards to buy pets!', 'info');
}

function Petsell() {
    if (userInventory.length === 0) {
        showMessage('No pets to sell!', 'error');
        return;
    }
    
    if (!confirm(`Sell all ${userInventory.length} pets?`)) {
        return;
    }
    
    userInventory.forEach(pet => {
        sellPet(pet.instanceId);
    });
}

function Sell_spezific_pet(event) {
    showMessage('Click the sell button on individual pet cards!', 'info');
}

function rerollShop() {
    showMessage('Shop inventory is fixed. Browse all available pets!', 'info');
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
