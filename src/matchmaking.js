const WebSocket = require('ws');
const auth = require('./auth');

// Matchmaking queue
const matchmakingQueue = [];

// Active matches (matchId -> match data)
const activeMatches = new Map();

// WebSocket connections (username -> ws)
const wsConnections = new Map();

/**
 * Add a player to the matchmaking queue
 */
function joinQueue(username) {
  // Check if player is already in queue
  if (matchmakingQueue.includes(username)) {
    throw new Error('Already in matchmaking queue');
  }
  
  // Check if player is already in a match
  for (const match of activeMatches.values()) {
    if (match.player1 === username || match.player2 === username) {
      throw new Error('Already in an active match');
    }
  }
  
  matchmakingQueue.push(username);
  
  // Try to find a match
  return tryMatch();
}

/**
 * Remove a player from the matchmaking queue
 */
function leaveQueue(username) {
  const index = matchmakingQueue.indexOf(username);
  if (index !== -1) {
    matchmakingQueue.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * Try to match players in the queue
 */
function tryMatch() {
  if (matchmakingQueue.length >= 2) {
    const player1 = matchmakingQueue.shift();
    const player2 = matchmakingQueue.shift();
    
    const matchId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    const match = {
      matchId,
      player1,
      player2,
      status: 'waiting_for_selection', // waiting_for_selection, ready, in_progress, completed
      player1Ready: false,
      player2Ready: false,
      player1Pets: [],
      player2Pets: [],
      player1Bet: 0,
      player2Bet: 0,
      createdAt: new Date()
    };
    
    activeMatches.set(matchId, match);
    
    return match;
  }
  
  return null;
}

/**
 * Get match by ID
 */
function getMatch(matchId) {
  return activeMatches.get(matchId);
}

/**
 * Get match for a specific player
 */
function getPlayerMatch(username) {
  for (const match of activeMatches.values()) {
    if (match.player1 === username || match.player2 === username) {
      return match;
    }
  }
  return null;
}

/**
 * Select pets and place bet for a match
 */
function selectPetsAndBet(username, matchId, petInstanceIds, betAmount) {
  const match = activeMatches.get(matchId);
  if (!match) {
    throw new Error('Match not found');
  }
  
  if (match.player1 !== username && match.player2 !== username) {
    throw new Error('Not a participant in this match');
  }
  
  if (petInstanceIds.length !== 3) {
    throw new Error('Must select exactly 3 pets');
  }
  
  // Validate bet amount
  const user = auth.getUser(username);
  if (!user) {
    throw new Error('User not found');
  }
  
  if (betAmount < 0 || betAmount > user.money) {
    throw new Error('Invalid bet amount');
  }
  
  // Update match data
  if (match.player1 === username) {
    match.player1Pets = petInstanceIds;
    match.player1Bet = betAmount;
    match.player1Ready = true;
  } else {
    match.player2Pets = petInstanceIds;
    match.player2Bet = betAmount;
    match.player2Ready = true;
  }
  
  // Check if both players are ready
  if (match.player1Ready && match.player2Ready) {
    match.status = 'ready';
  }
  
  return match;
}

/**
 * Complete a match and handle payouts
 */
function completeMatch(matchId, winner) {
  const match = activeMatches.get(matchId);
  if (!match) {
    throw new Error('Match not found');
  }
  
  match.status = 'completed';
  match.winner = winner;
  match.completedAt = new Date();
  
  // Handle betting payouts
  const money = require('./money');
  
  if (winner === match.player1) {
    // Player 1 wins, deduct from player 2 and add to player 1
    if (match.player2Bet > 0) {
      money.deductMoney(match.player2, match.player2Bet);
      money.addMoney(match.player1, match.player2Bet);
    }
  } else if (winner === match.player2) {
    // Player 2 wins, deduct from player 1 and add to player 2
    if (match.player1Bet > 0) {
      money.deductMoney(match.player1, match.player1Bet);
      money.addMoney(match.player2, match.player1Bet);
    }
  }
  
  // Remove match after some time
  setTimeout(() => {
    activeMatches.delete(matchId);
  }, 60000); // Remove after 1 minute
  
  return match;
}

/**
 * Register a WebSocket connection for a user
 */
function registerWebSocket(username, ws) {
  wsConnections.set(username, ws);
  
  ws.on('close', () => {
    wsConnections.delete(username);
    leaveQueue(username);
  });
}

/**
 * Send message to a specific user via WebSocket
 */
function sendToUser(username, message) {
  const ws = wsConnections.get(username);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

/**
 * Notify both players in a match
 */
function notifyMatch(matchId, message) {
  const match = activeMatches.get(matchId);
  if (match) {
    sendToUser(match.player1, message);
    sendToUser(match.player2, message);
  }
}

/**
 * Get queue status
 */
function getQueueStatus() {
  return {
    queueSize: matchmakingQueue.length,
    activeMatches: activeMatches.size
  };
}

module.exports = {
  joinQueue,
  leaveQueue,
  getMatch,
  getPlayerMatch,
  selectPetsAndBet,
  completeMatch,
  registerWebSocket,
  sendToUser,
  notifyMatch,
  getQueueStatus
};
