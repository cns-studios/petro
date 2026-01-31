const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import services
const auth = require('./src/auth');
const money = require('./src/money');
const shop = require('./src/shop');
const inventory = require('./src/inventory');
const matchmaking = require('./src/matchmaking');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Auth middleware to verify token
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const user = auth.verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  req.user = user;
  next();
}

// ============================================
// Authentication Routes
// ============================================

/**
 * POST /api/auth/register
 * Register a new user
 */
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password } = req.body;
    const result = auth.register(username, password);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/auth/login
 * Login an existing user
 */
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const result = auth.login(username, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

/**
 * GET /api/auth/verify
 * Verify current token
 */
app.get('/api/auth/verify', authMiddleware, (req, res) => {
  res.json({ 
    username: req.user.username, 
    money: req.user.money 
  });
});

// ============================================
// Money Routes
// ============================================

/**
 * GET /api/money/balance
 * Get user's balance
 */
app.get('/api/money/balance', authMiddleware, (req, res) => {
  try {
    const balance = money.getBalance(req.user.username);
    res.json({ balance });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================
// Shop Routes
// ============================================

/**
 * GET /api/shop/pets
 * Get all available pets in the shop
 */
app.get('/api/shop/pets', authMiddleware, (req, res) => {
  try {
    const pets = shop.getShopPets();
    res.json({ pets });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/shop/buy
 * Buy a pet from the shop
 */
app.post('/api/shop/buy', authMiddleware, (req, res) => {
  try {
    const { petId } = req.body;
    const result = shop.buyPet(req.user.username, petId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/shop/sell
 * Sell a pet back to the shop
 */
app.post('/api/shop/sell', authMiddleware, (req, res) => {
  try {
    const { instanceId } = req.body;
    const result = shop.sellPet(req.user.username, instanceId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================
// Inventory Routes
// ============================================

/**
 * GET /api/inventory
 * Get user's pet inventory
 */
app.get('/api/inventory', authMiddleware, (req, res) => {
  try {
    const userInventory = inventory.getInventory(req.user.username);
    res.json({ inventory: userInventory });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================
// Matchmaking Routes
// ============================================

/**
 * POST /api/matchmaking/join
 * Join the matchmaking queue
 */
app.post('/api/matchmaking/join', authMiddleware, (req, res) => {
  try {
    const match = matchmaking.joinQueue(req.user.username);
    
    if (match) {
      // Match found! Notify both players to upgrade to WebSocket
      res.json({ 
        matched: true, 
        matchId: match.matchId,
        opponent: match.player1 === req.user.username ? match.player2 : match.player1,
        message: 'Match found! Please upgrade to WebSocket connection'
      });
    } else {
      res.json({ 
        matched: false, 
        message: 'Added to queue, waiting for opponent...' 
      });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/matchmaking/leave
 * Leave the matchmaking queue
 */
app.post('/api/matchmaking/leave', authMiddleware, (req, res) => {
  try {
    const removed = matchmaking.leaveQueue(req.user.username);
    res.json({ removed });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/matchmaking/status
 * Get matchmaking queue status
 */
app.get('/api/matchmaking/status', authMiddleware, (req, res) => {
  try {
    const status = matchmaking.getQueueStatus();
    const playerMatch = matchmaking.getPlayerMatch(req.user.username);
    
    res.json({ 
      ...status,
      currentMatch: playerMatch
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/matchmaking/select
 * Select pets and place bet for a match
 */
app.post('/api/matchmaking/select', authMiddleware, (req, res) => {
  try {
    const { matchId, petInstanceIds, betAmount } = req.body;
    const match = matchmaking.selectPetsAndBet(
      req.user.username, 
      matchId, 
      petInstanceIds, 
      betAmount
    );
    res.json({ match });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================
// WebSocket Connection Handler
// ============================================

wss.on('connection', (ws, req) => {
  console.log('WebSocket connection attempt');
  
  let username = null;
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // Handle authentication
      if (data.type === 'auth') {
        const user = auth.verifyToken(data.token);
        if (user) {
          username = user.username;
          matchmaking.registerWebSocket(username, ws);
          ws.send(JSON.stringify({ type: 'auth_success', username }));
          console.log(`User ${username} authenticated via WebSocket`);
          
          // Check if user has a pending match
          const match = matchmaking.getPlayerMatch(username);
          if (match) {
            ws.send(JSON.stringify({ 
              type: 'match_found', 
              match: {
                matchId: match.matchId,
                opponent: match.player1 === username ? match.player2 : match.player1,
                status: match.status
              }
            }));
          }
        } else {
          ws.send(JSON.stringify({ type: 'auth_failed', error: 'Invalid token' }));
          ws.close();
        }
      }
      
      // Handle match updates
      if (data.type === 'match_ready' && username) {
        const match = matchmaking.getPlayerMatch(username);
        if (match && match.status === 'ready') {
          // Notify both players that the match is starting
          matchmaking.notifyMatch(match.matchId, {
            type: 'match_start',
            matchId: match.matchId,
            player1: match.player1,
            player2: match.player2,
            player1Pets: match.player1Pets,
            player2Pets: match.player2Pets,
            player1Bet: match.player1Bet,
            player2Bet: match.player2Bet
          });
        }
      }
      
      // Handle match completion
      if (data.type === 'match_complete' && username) {
        const { matchId, winner } = data;
        const match = matchmaking.completeMatch(matchId, winner);
        
        // Notify both players of the result
        matchmaking.notifyMatch(matchId, {
          type: 'match_complete',
          matchId: match.matchId,
          winner: match.winner,
          player1FinalBalance: money.getBalance(match.player1),
          player2FinalBalance: money.getBalance(match.player2)
        });
      }
      
      // Handle general game messages
      if (data.type === 'game_action' && username) {
        const match = matchmaking.getPlayerMatch(username);
        if (match) {
          const opponent = match.player1 === username ? match.player2 : match.player1;
          matchmaking.sendToUser(opponent, {
            type: 'opponent_action',
            action: data.action,
            from: username
          });
        }
      }
      
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({ type: 'error', error: error.message }));
    }
  });
  
  ws.on('close', () => {
    if (username) {
      console.log(`User ${username} disconnected from WebSocket`);
      matchmaking.leaveQueue(username);
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// ============================================
// Start Server
// ============================================

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('REST API endpoints available:');
  console.log('  POST /api/auth/register');
  console.log('  POST /api/auth/login');
  console.log('  GET  /api/auth/verify');
  console.log('  GET  /api/money/balance');
  console.log('  GET  /api/shop/pets');
  console.log('  POST /api/shop/buy');
  console.log('  POST /api/shop/sell');
  console.log('  GET  /api/inventory');
  console.log('  POST /api/matchmaking/join');
  console.log('  POST /api/matchmaking/leave');
  console.log('  GET  /api/matchmaking/status');
  console.log('  POST /api/matchmaking/select');
  console.log('WebSocket server ready for connections');
});
