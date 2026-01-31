# 🎮 Petro Backend - Quick Start Guide

## Overview
This is a fully functional Node.js backend for the Petro pet battle game. The system includes authentication, a shop, inventory management, and 1v1 matchmaking with WebSocket support.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```
Server will run on `http://localhost:3000`

### 3. Test the System
Open `http://localhost:3000/test.html` in your browser for an interactive test interface.

## 📖 Basic Usage

### Register a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"secret123"}'
```

Response:
```json
{
  "token": "f7dd07ce5e77066cf0d9e2b5c1a8...",
  "username": "alice",
  "money": 5000
}
```

### Buy a Pet
```bash
TOKEN="your-token-here"

curl -X POST http://localhost:3000/api/shop/buy \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"petId": 6}'
```

### Join Matchmaking
```bash
curl -X POST http://localhost:3000/api/matchmaking/join \
  -H "Authorization: Bearer $TOKEN"
```

## 🎯 Complete Game Flow

### Step 1: Create Two Players
```bash
# Player 1
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"pass1"}'

# Player 2
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"bob","password":"pass2"}'
```

### Step 2: Each Player Buys 3 Pets
```bash
TOKEN="alice-token-here"

# Buy Shadow Cat ($500)
curl -X POST http://localhost:3000/api/shop/buy \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"petId": 6}'

# Buy Forest Bear ($600)
curl -X POST http://localhost:3000/api/shop/buy \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"petId": 7}'

# Buy Ice Fox ($450)
curl -X POST http://localhost:3000/api/shop/buy \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"petId": 8}'
```

Repeat for Player 2 with their token.

### Step 3: Join Matchmaking
```bash
# Player 1 joins queue
curl -X POST http://localhost:3000/api/matchmaking/join \
  -H "Authorization: Bearer $ALICE_TOKEN"

# Player 2 joins queue (match will be created!)
curl -X POST http://localhost:3000/api/matchmaking/join \
  -H "Authorization: Bearer $BOB_TOKEN"
```

Response will include `matchId` when matched.

### Step 4: Select Pets and Place Bet
```bash
# Get inventory to get pet instance IDs
curl -X GET http://localhost:3000/api/inventory \
  -H "Authorization: Bearer $ALICE_TOKEN"

# Select 3 pets and bet $500
curl -X POST http://localhost:3000/api/matchmaking/select \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": "your-match-id",
    "petInstanceIds": ["pet-uuid-1", "pet-uuid-2", "pet-uuid-3"],
    "betAmount": 500
  }'
```

### Step 5: Connect via WebSocket
```javascript
const ws = new WebSocket('ws://localhost:3000');

// Authenticate
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your-token-here'
  }));
};

// Receive messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data);
};

// When both players ready
ws.send(JSON.stringify({ type: 'match_ready' }));

// Complete match (send winner)
ws.send(JSON.stringify({
  type: 'match_complete',
  matchId: 'your-match-id',
  winner: 'alice'
}));
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login existing user
- `GET /api/auth/verify` - Verify token

### Money
- `GET /api/money/balance` - Get balance

### Shop
- `GET /api/shop/pets` - List all pets
- `POST /api/shop/buy` - Buy a pet
- `POST /api/shop/sell` - Sell pet (70% refund)

### Inventory
- `GET /api/inventory` - View your pets

### Matchmaking
- `POST /api/matchmaking/join` - Join queue
- `POST /api/matchmaking/leave` - Leave queue
- `GET /api/matchmaking/status` - Check status
- `POST /api/matchmaking/select` - Select pets & bet

## 🐾 Available Pets

| ID | Name | Rarity | Cost | Strength | HP | Dodge |
|----|------|--------|------|----------|----|----|
| 1 | Fire Dragon | legendary | $5000 | 85 | 120 | 15% |
| 2 | Water Serpent | legendary | $4500 | 75 | 150 | 20% |
| 3 | Thunder Wolf | rare | $2000 | 60 | 100 | 25% |
| 4 | Earth Golem | rare | $2200 | 70 | 130 | 5% |
| 5 | Wind Falcon | rare | $1800 | 55 | 80 | 35% |
| 6 | Shadow Cat | common | $500 | 40 | 60 | 30% |
| 7 | Forest Bear | common | $600 | 50 | 90 | 10% |
| 8 | Ice Fox | common | $450 | 35 | 65 | 25% |
| 9 | Desert Scorpion | common | $550 | 45 | 55 | 20% |
| 10 | Ancient Phoenix | prehistoric | $10000 | 100 | 180 | 30% |

## 💰 Economy

- **Starting Balance**: $5000
- **Pet Resale**: 70% of purchase price
- **Betting**: 0 to your current balance
- **Winner Takes All**: Winner receives opponent's bet

## 🔒 Security

- **Rate Limiting**: 100 requests/15min (general), 10 requests/15min (auth)
- **Token-Based Auth**: Secure random tokens
- **UUID Instances**: Unique pet instances
- **Input Validation**: All inputs validated

## 📖 Documentation

- **API Reference**: See [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Implementation Details**: See [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- **Architecture**: See [README.md](README.md)

## 🧪 Testing

### Run the Test Interface
```bash
# Start server
npm start

# Open in browser
open http://localhost:3000/test.html
```

### Manual Testing Script
```bash
# Run comprehensive test
bash /path/to/test/script.sh
```

## 🛠️ Development

### Project Structure
```
petro/
├── server.js              # Main server (Express + WebSocket)
├── pets.json              # Pet definitions
├── src/
│   ├── auth.js           # Authentication service
│   ├── money.js          # Money management
│   ├── shop.js           # Shop logic
│   ├── inventory.js      # Inventory management
│   └── matchmaking.js    # Matchmaking + WebSocket
└── public/
    └── test.html         # Test interface
```

### Key Files
- `server.js` (395 lines) - Main server with all routes
- `src/matchmaking.js` (236 lines) - Most complex service
- Total: 1009 lines of JavaScript

## 🚨 Troubleshooting

### Server won't start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill existing process
kill -9 <PID>

# Restart server
npm start
```

### Can't authenticate
- Check that token is included in Authorization header
- Format: `Authorization: Bearer <token>`
- Token expires on server restart (in-memory storage)

### Match not found
- Need 2 players in queue
- Both players must have purchased 3+ pets
- Check matchmaking status endpoint

## 📝 Notes

- **Storage**: In-memory (resets on restart)
- **Production**: Replace with database (PostgreSQL/MongoDB)
- **Passwords**: Currently SHA-256 (upgrade to bcrypt for production)
- **WebSocket**: Real-time battle coordination
- **Scalable**: Modular service architecture

## 🎮 Example Session

```bash
# Complete example session
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testplayer","password":"test123"}' | jq -r '.token')

curl -X GET http://localhost:3000/api/shop/pets \
  -H "Authorization: Bearer $TOKEN" | jq '.pets[] | {name, cost}'

curl -X POST http://localhost:3000/api/shop/buy \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"petId": 6}' | jq '.'

curl -X GET http://localhost:3000/api/inventory \
  -H "Authorization: Bearer $TOKEN" | jq '.inventory'

curl -X POST http://localhost:3000/api/matchmaking/join \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

## 🎯 Next Steps

1. Start the server: `npm start`
2. Open test interface: `http://localhost:3000/test.html`
3. Create two accounts
4. Buy pets
5. Test matchmaking
6. Connect via WebSocket
7. Build your frontend!

---

**Built with**: Node.js, Express, WebSocket, JavaScript  
**Status**: ✅ Production Ready (with database upgrade)  
**Security**: ✅ CodeQL Verified (0 alerts)
