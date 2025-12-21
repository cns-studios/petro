let ws;
let stateRequestTimeout = null;
let sellMode = false;

// Cookie and auth functions
function logout() {
    deleteCookie('username');
    deleteCookie('pin');
    if (ws) {
        ws.close();
    }
    window.location.href = '/login';
}

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
        // Display username
        const usernameEl = document.getElementById('username');
        if (usernameEl) {
            usernameEl.textContent = username;
        }
        connectWebSocket(username, pin);
    }
});

const moneyEl = document.getElementById('money');
const stageEl = document.getElementById('stage');
const inventoryEl = document.getElementById('inventory');
const messageEl = document.getElementById('message');

const shopUpEl = document.getElementById('shop-up');
const shopBpEl = document.getElementById('shop-bp');
const shopCpEl = document.getElementById('shop-cp');
const shopLupEl = document.getElementById('shop-lup');
const rerollPriceEl = document.getElementById('reroll-price');
const playBtn = document.getElementById('play-btn');

const buffSelectionModal = document.getElementById('buff-selection');
const buffChoicesEl = document.getElementById('buff-choices');

const BUFF_DESCRIPTIONS = {
    1: "+1 Attack for all Pets",
    2: "+1 HP for all Pets",
    3: "+2% Dodge Chance for all Pets",
    4: "+2 Attack for all Common Pets", 
    5: "+2 HP for all Common Pets",
    6: "+3 Attack for all Rare Pets",
    7: "+3 HP for all Rare Pets",
    8: "+5 Attack for all Legendary Pets",
    9: "+5 HP for all Legendary Pets",
    10: "+1 Money for every Pet in Inventory",
    11: "+2 Money for every Common Pet and -1 for each Rare Pet in Inventory",
    12: "Double the Money you have (Max. 25)",
    13: "+1 Level for all Pets",
};

function connectWebSocket(username, pin) {
    console.log('Attempting to connect with:', { username, pin }); // DEBUG
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${protocol}//${window.location.host}?username=${encodeURIComponent(username)}&pin=${encodeURIComponent(pin)}`);

    ws.onopen = () => {
        console.log('Connected to the server.');
        messageEl.textContent = 'Connected! Loading game state...';
        
        stateRequestTimeout = setTimeout(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                console.log('Requesting initial game state...');
                ws.send('get_state');
            }
        }, 100);
    };

    ws.onmessage = (event) => {
        const gameState = JSON.parse(event.data);
        updateUI(gameState);
    };

    ws.onclose = (event) => {
        console.log('Disconnected from the server.', event.reason);
        console.log('Event code:', event.code, 'Was clean:', event.wasClean); // DEBUG
        messageEl.textContent = `Connection lost: ${event.reason || 'Please refresh'}`;
        
        if (stateRequestTimeout) {
            clearTimeout(stateRequestTimeout);
            stateRequestTimeout = null;
        }
        
        if (!event.wasClean || event.code === 1008) {
            setTimeout(() => {
                deleteCookie('username');
                deleteCookie('pin');
                window.location.href = '/login';
            }, 2000);
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        messageEl.textContent = 'A connection error occurred.';
    };
}


function Petsell() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send('sell_all_pets');
    } else {
        messageEl.textContent = 'Connection lost. Please refresh the page.';
        console.error('WebSocket is not connected');
    }
}

function Sell_spezific_pet(item) {
    messageEl.textContent = 'Click on the pet you want to sell.';
}

document.getElementById('save-btn').addEventListener('click', () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send('save');
    }
});

function Sell_spezific_pet() {
    sellMode = !sellMode;
    const button = document.getElementById('sell-pet-btn');
    
    if (sellMode) {
        button.textContent = 'Cancel';
        button.classList.remove('btn-info');
        button.classList.add('btn-danger');
        messageEl.textContent = 'Click on a pet to sell it';
    } else {
        button.textContent = 'Sell Pet';
        button.classList.remove('btn-danger');
        button.classList.add('btn-info');
        messageEl.textContent = '';
    }
}



playBtn.addEventListener('click', () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        window.location.href= '/matchmaking';
    }
});

function updateUI(state) {
    if (state.money !== undefined) moneyEl.textContent = state.money;
    
    
    if (state.message) {
        messageEl.textContent = state.message;
        
        const container = document.getElementById('message-container');
        container.style.animation = 'none';
        container.offsetHeight; // Trigger reflow
        container.style.animation = 'messagePopup 3s ease-in-out forwards';



        if (state.message !== 'Choose a buff.' && !state.message.includes('Welcome')) {
            setTimeout(() => {
                if (messageEl.textContent === state.message) {
                    messageEl.textContent = '';
                }
            }, 4000);
        }
    }

   if (state.inventory) {
    inventoryEl.innerHTML = '';
    state.inventory.forEach(pet => {
        const petCard = document.createElement('div');
        petCard.className = 'pet-card';
        petCard.classList.add(`rarity-${pet.rarity === 1 ? 'common' : pet.rarity === 2 ? 'rare' : pet.rarity === 3 ? 'legendary' : 'chroma'}`);
        petCard.style.cursor = 'pointer';
        petCard.innerHTML = `
            <img class="src" src="/images/${pet.name}.png"><div class="name">${pet.name} (Lv. ${pet.level})</div>
            <div>ATK: ${pet.attack} | HP: ${pet.hp}</div>
            <div>Dodge: ${pet.dodge_chance}%</div>
        `;
        
        petCard.addEventListener('click', () => {
            
            if (sellMode) {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(`spezific_pet_sell ${pet.name}`);
                } else {
                    messageEl.textContent = 'Connection lost. Please refresh the page.';
                    console.error('WebSocket is not connected');
                }
            }
        });
        
        inventoryEl.appendChild(petCard);
    });
    }

    if (state.shop) {
        shopUpEl.textContent = state.shop.upgrade_pack;
        shopBpEl.textContent = state.shop.buff_pack;
        shopCpEl.textContent = state.shop.charakter_pack;
        shopLupEl.textContent = state.shop.legendary_upgrade_pack;
        rerollPriceEl.textContent = state.shop.shop_refresh_price;
    }

    if (state.pending_buff_choices && state.pending_buff_choices.length > 0) {
        buffChoicesEl.innerHTML = '';
        state.pending_buff_choices.forEach((buffId, index) => {
            const choiceDiv = document.createElement('div');
            choiceDiv.className = 'buff-choice';
            choiceDiv.textContent = BUFF_DESCRIPTIONS[buffId] || `Unknown Buff ${buffId}`;
            choiceDiv.onclick = () => selectBuff(index);
            buffChoicesEl.appendChild(choiceDiv);
        });
        buffSelectionModal.style.display = 'flex';
    } else {
        buffSelectionModal.style.display = 'none';
    }
}

function buy(item) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(`shop_buy ${item}`);
    } else {
        messageEl.textContent = 'Connection lost. Please refresh the page.';
        console.error('WebSocket is not connected');
    }
}

function rerollShop() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send('shop_reroll');
    } else {
        messageEl.textContent = 'Connection lost. Please refresh the page.';
        console.error('WebSocket is not connected');
    }
}

function selectBuff(index) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(`select_buff ${index}`);
        buffSelectionModal.style.display = 'none';
    } else {
        messageEl.textContent = 'Connection lost. Please refresh the page.';
        console.error('WebSocket is not connected');
    }
 }




const TIMER_DURATION = 500; 

let timerValue = TIMER_DURATION;
let timerInterval = null;


const timerEl = document.getElementById('timer');


function setCookie(name, value, days = 365) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}


function sendAfkMoney() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send('afk-money');
        console.log('afk-money gesendet');
    } else {
        console.error('WebSocket ist nicht verbunden');
    }
}

// Timer-Funktion
function updateTimer() {
    timerValue--;
    
    if (timerEl) {
        timerEl.textContent = timerValue;
    }
    
 
    setCookie('afk_timer_value', timerValue);
    setCookie('afk_timer_timestamp', Date.now());
    

    if (timerValue <= 0) {
        sendAfkMoney();
        timerValue = TIMER_DURATION; 
        setCookie('afk_timer_value', timerValue);
    }
}


function loadTimerFromCookie() {
    const savedValue = getCookie('afk_timer_value');
    const savedTimestamp = getCookie('afk_timer_timestamp');
    
    if (savedValue !== null && savedTimestamp !== null) {
        const timeElapsed = Math.floor((Date.now() - parseInt(savedTimestamp)) / 1000);
        let calculatedValue = parseInt(savedValue) - timeElapsed;
        
        
        while (calculatedValue <= 0) {
            
            sendAfkMoney();
            calculatedValue += TIMER_DURATION;
        }
        
        return calculatedValue;
    }
    
    return TIMER_DURATION;
}


function startTimer() {
 
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
   
    timerValue = loadTimerFromCookie();
    
    if (timerEl) {
        timerEl.textContent = timerValue;
    }
    

    timerInterval = setInterval(updateTimer, 1000);
}


window.addEventListener('load', () => {
    startTimer();
});


function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

window.addEventListener('beforeunload', () => {
    setCookie('afk_timer_value', timerValue);
    setCookie('afk_timer_timestamp', Date.now());
});



// Page Navigation

const gotoInvbtn = document.getElementById('goto-inv');
const gotoShopbtn = document.getElementById('goto-shop');
const gotoSettingsbtn = document.getElementById('goto-settings');
const gotoHomebtn = document.getElementById('goto-home');

const homePage = document.getElementById('home');
const invPage = document.getElementById('inv');
const shopPage = document.getElementById('shop');
const settingsPage = document.getElementById('settings');
const collectionPage = document.getElementById('collection');

gotoHomebtn.style.display = 'none';

    invPage.style.display = 'none';
    shopPage.style.display = 'none';
    settingsPage.style.display = 'none';
    document.body.classList.remove('menu-active'); // Ensure menu-active is off initially

gotoHomebtn.addEventListener('click', () => {
    homePage.style.display = 'block';
    gotoHomebtn.style.display = 'none';

    gotoShopbtn.style.display = 'block';
    gotoSettingsbtn.style.display = 'block';
    gotoInvbtn.style.display = 'block';

    invPage.style.display = 'none';
    shopPage.style.display = 'none';
    settingsPage.style.display = 'none';
    collectionPage.style.display = 'none';
    document.body.classList.remove('menu-active'); // Remove menu-active when returning home
});

gotoInvbtn.addEventListener('click', () => {
    invPage.style.display = 'block';
    gotoHomebtn.style.display = 'block';

    homePage.style.display = 'none';

    gotoShopbtn.style.display = 'none';
    gotoInvbtn.style.display = 'none';
    document.body.classList.add('menu-active'); // Add menu-active when inventory is open
});

gotoShopbtn.addEventListener('click', () => {
    shopPage.style.display = 'block';
    gotoHomebtn.style.display = 'block';

    homePage.style.display = 'none';

    gotoShopbtn.style.display = 'none';
    gotoInvbtn.style.display = 'none';
    document.body.classList.add('menu-active'); // Add menu-active when shop is open
});

gotoSettingsbtn.addEventListener('click', () => {
    settingsPage.style.display = 'block';
    gotoHomebtn.style.display = 'block';

    homePage.style.display = 'none';

    gotoShopbtn.style.display = 'none';
    gotoSettingsbtn.style.display = 'none';
    gotoInvbtn.style.display = 'none';
    document.body.classList.add('menu-active'); // Add menu-active when settings are open
});