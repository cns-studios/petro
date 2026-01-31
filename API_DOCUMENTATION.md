# Petro Backend API Documentation

A fully functional Node.js backend for the Petro pet battle game with authentication, shop, inventory, and matchmaking services.

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [WebSocket Protocol](#websocket-protocol)
- [Game Flow](#game-flow)

## Overview

The Petro backend provides:
- **Authentication**: Simple username/password-based auth with tokens
- **Money System**: Virtual currency for buying/selling pets
- **Shop**: Buy and sell pets (70% resale value)
- **Inventory**: Manage collected pets
- **Matchmaking**: 1v1 player matching with WebSocket upgrade
- **Betting**: Wager money on match outcomes

## Architecture

```
petro/
├── server.js              # Main Express + WebSocket server
├── pets.json              # Pet definitions with stats
└── src/
    ├── auth.js            # Authentication service
    ├── money.js           # Money management service
    ├── shop.js            # Shop buy/sell logic
    ├── inventory.js       # Pet inventory management
    └── matchmaking.js     # 1v1 matchmaking + WebSocket
```

## Getting Started

### Installation

```bash
npm install
```

### Start Server

```bash
npm start
# Server runs on http://localhost:3000
```

### Test Interface

Open `http://localhost:3000/test.html` for a simple test interface.

## API Endpoints

All endpoints (except auth) require an `Authorization: Bearer <token>` header.

### Authentication

#### POST `/api/auth/register`
Register a new user.

**Request:**
```json
{
  "username": "player1",
  "password": "secret123"
}
```

**Response:**
```json
{
  "token": "abc123...",
  "username": "player1",
  "money": 5000
}
```

#### POST `/api/auth/login`
Login an existing user.

**Request:**
```json
{
  "username": "player1",
  "password": "secret123"
}
```

**Response:**
```json
{
  "token": "abc123...",
  "username": "player1",
  "money": 4500
}
```

#### GET `/api/auth/verify`
Verify the current token.

**Response:**
```json
{
  "username": "player1",
  "money": 4500
}
```

### Money System

#### GET `/api/money/balance`
Get user's current balance.

**Response:**
```json
{
  "balance": 4500
}
```

### Shop

#### GET `/api/shop/pets`
Get all available pets in the shop.

**Response:**
```json
{
  "pets": [
    {
      "id": 1,
      "name": "Fire Dragon",
      "rarity": "legendary",
      "cost": 5000,
      "strength": 85,
      "hp": 120,
      "dodge": 15,
      "description": "A fierce dragon that breathes fire"
    },
    ...
  ]
}
```

#### POST `/api/shop/buy`
Buy a pet from the shop.

**Request:**
```json
{
  "petId": 6
}
```

**Response:**
```json
{
  "pet": {
    "instanceId": 1234567890.123,
    "id": 6,
    "name": "Shadow Cat",
    "rarity": "common",
    "cost": 500,
    "strength": 40,
    "hp": 60,
    "dodge": 30,
    "level": 1,
    "purchasePrice": 500
  },
  "newBalance": 4500
}
```

#### POST `/api/shop/sell`
Sell a pet back to the shop (70% refund).

**Request:**
```json
{
  "instanceId": 1234567890.123
}
```

**Response:**
```json
{
  "refund": 350,
  "newBalance": 4850
}
```

### Inventory

#### GET `/api/inventory`
Get user's pet collection.

**Response:**
```json
{
  "inventory": [
    {
      "instanceId": 1234567890.123,
      "id": 6,
      "name": "Shadow Cat",
      "rarity": "common",
      "cost": 500,
      "strength": 40,
      "hp": 60,
      "dodge": 30,
      "level": 1,
      "purchasePrice": 500
    }
  ]
}
```

### Matchmaking

#### POST `/api/matchmaking/join`
Join the matchmaking queue.

**Response (waiting):**
```json
{
  "matched": false,
  "message": "Added to queue, waiting for opponent..."
}
```

**Response (matched):**
```json
{
  "matched": true,
  "matchId": "1234567890-abc123",
  "opponent": "player2",
  "message": "Match found! Please upgrade to WebSocket connection"
}
```

#### POST `/api/matchmaking/leave`
Leave the matchmaking queue.

**Response:**
```json
{
  "removed": true
}
```

#### GET `/api/matchmaking/status`
Get matchmaking status and current match.

**Response:**
```json
{
  "queueSize": 1,
  "activeMatches": 2,
  "currentMatch": {
    "matchId": "1234567890-abc123",
    "player1": "alice",
    "player2": "bob",
    "status": "waiting_for_selection"
  }
}
```

#### POST `/api/matchmaking/select`
Select 3 pets and place a bet for the match.

**Request:**
```json
{
  "matchId": "1234567890-abc123",
  "petInstanceIds": [1234567890.123, 1234567890.456, 1234567890.789],
  "betAmount": 500
}
```

**Response:**
```json
{
  "match": {
    "matchId": "1234567890-abc123",
    "player1": "alice",
    "player2": "bob",
    "status": "ready",
    "player1Ready": true,
    "player2Ready": true,
    "player1Pets": [1234567890.123, 1234567890.456, 1234567890.789],
    "player2Pets": [9876543210.123, 9876543210.456, 9876543210.789],
    "player1Bet": 500,
    "player2Bet": 300
  }
}
```

## WebSocket Protocol

Connect to `ws://localhost:3000` after finding a match.

### Client → Server Messages

#### Authentication
```json
{
  "type": "auth",
  "token": "your-auth-token"
}
```

#### Match Ready
```json
{
  "type": "match_ready"
}
```

#### Match Complete
```json
{
  "type": "match_complete",
  "matchId": "1234567890-abc123",
  "winner": "alice"
}
```

#### Game Action
```json
{
  "type": "game_action",
  "action": {
    "type": "attack",
    "petIndex": 0,
    "target": 1
  }
}
```

### Server → Client Messages

#### Authentication Success
```json
{
  "type": "auth_success",
  "username": "alice"
}
```

#### Match Found
```json
{
  "type": "match_found",
  "match": {
    "matchId": "1234567890-abc123",
    "opponent": "bob",
    "status": "waiting_for_selection"
  }
}
```

#### Match Start
```json
{
  "type": "match_start",
  "matchId": "1234567890-abc123",
  "player1": "alice",
  "player2": "bob",
  "player1Pets": [1234567890.123, 1234567890.456, 1234567890.789],
  "player2Pets": [9876543210.123, 9876543210.456, 9876543210.789],
  "player1Bet": 500,
  "player2Bet": 300
}
```

#### Match Complete
```json
{
  "type": "match_complete",
  "matchId": "1234567890-abc123",
  "winner": "alice",
  "player1FinalBalance": 5300,
  "player2FinalBalance": 4700
}
```

#### Opponent Action
```json
{
  "type": "opponent_action",
  "action": {
    "type": "attack",
    "petIndex": 0,
    "target": 1
  },
  "from": "bob"
}
```

## Game Flow

### 1. Registration & Setup
```bash
# Register
POST /api/auth/register
  → Get token + starting money (5000)

# Buy pets
POST /api/shop/buy (x3 times)
  → Build inventory with at least 3 pets
```

### 2. Matchmaking
```bash
# Join queue
POST /api/matchmaking/join
  → Wait for opponent
  → Get matchId when matched

# Select pets & bet
POST /api/matchmaking/select
  → Choose 3 pets from inventory
  → Bet money (0 to current balance)
  → Both players must select to proceed
```

### 3. Battle (WebSocket)
```bash
# Upgrade to WebSocket
ws://localhost:3000
  → Send auth message
  → Receive match_start when both ready
  → Exchange game_action messages
  → Send match_complete with winner
```

### 4. Post-Battle
```bash
# Winner gets opponent's bet
# Loser loses their bet
# New balances updated automatically
```

## Pet Data Structure

```json
{
  "id": 6,
  "name": "Shadow Cat",
  "rarity": "common",
  "cost": 500,
  "strength": 40,
  "hp": 60,
  "dodge": 30,
  "description": "A stealthy feline hunter"
}
```

### Rarity Tiers
- **common**: Basic pets (450-600 cost)
- **rare**: Strong pets (1800-2200 cost)
- **legendary**: Powerful pets (4500-5000 cost)
- **prehistoric**: Ultimate pets (10000 cost)

## Betting Rules

1. Each player selects **exactly 3 pets**
2. Bet amount must be between **0 and current balance**
3. Both players must select before match starts
4. Winner receives **opponent's bet amount**
5. Loser loses their **bet amount**

## Example cURL Commands

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"pass123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"pass123"}'

# Get shop
curl -X GET http://localhost:3000/api/shop/pets \
  -H "Authorization: Bearer YOUR_TOKEN"

# Buy pet
curl -X POST http://localhost:3000/api/shop/buy \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"petId":6}'

# Join matchmaking
curl -X POST http://localhost:3000/api/matchmaking/join \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Error Handling

All errors return JSON with an `error` field:

```json
{
  "error": "Insufficient funds"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad request (validation error)
- `401`: Unauthorized (invalid/missing token)
- `500`: Server error

## Notes

- User data is stored **in-memory** (resets on server restart)
- For production, implement a database (PostgreSQL, MongoDB, etc.)
- Add rate limiting for API endpoints
- Implement proper password hashing (bcrypt)
- Add input validation and sanitization
- Consider adding JWT expiration
- Add proper error logging
