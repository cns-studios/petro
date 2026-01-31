# Petro Online

A browser-based multiplayer pet battle arena game where players collect, level up, and battle pets in turn-based combat against other players.

## Overview

Petro Online is a web-based game inspired by creature-collecting games like Pokémon. Players manage an inventory of pets across different rarity tiers, upgrade them, and engage in real-time multiplayer battles. The game features a dynamic economy system with passive income, a shop for upgrading and purchasing pet packs, and competitive matchmaking.

## Features

### Core Gameplay
- **Pet Collection System** - Collect pets across 4 rarity tiers:
  - Common (28 pets)
  - Rare (14 pets)
  - Legendary (11 pets)
  - Prehistoric (1 pet)

- **Pet Progression** - Level up pets to improve their stats:
  - Attack power
  - HP (health points)
  - Dodge chance

- **Game Economy**
  - Passive income system (+$3 per second)
  - Pet buying and selling
  - Upgradeable shop packs
  - Shop refresh mechanics

- **Multiplayer Battles**
  - Real-time turn-based combat system
  - Pet switching mechanics during battles
  - Matchmaking queue system
  - Battle logging and history

- **User Accounts**
  - Signup/Login with username + PIN authentication
  - Username validation (alphanumeric only)
  - Persistent game state storage

## Technology Stack

### Backend
- **Node.js & Express** - Web server and HTTP routing
- **JavaScript Services** - Game logic (auth, shop, inventory, matchmaking)
- **In-Memory Storage** - User accounts and game state (can be replaced with database)
- **WebSocket (ws)** - Real-time bidirectional communication for battles
- **dotenv** - Environment configuration

### Frontend
- **HTML5** - Multi-page interface (login, game, battle, matchmaking)
- **CSS3** - Styling and pixel art visuals
- **Vanilla JavaScript** - Client-side game interactions

## Project Structure

```
Petro/
├── server.js                 # Main Node.js + WebSocket server
├── package.json              # npm dependencies
├── pets.json                 # Pet definitions with stats
├── API_DOCUMENTATION.md      # Complete API documentation
├── public/                   # Frontend files
│   ├── index.html
│   ├── login.html           # Authentication UI
│   ├── game.html            # Main game interface
│   ├── battle.html          # Battle UI
│   ├── matchmaking.html     # Matchmaking queue
│   ├── test.html            # Test interface for API
│   ├── style.css
│   └── battle.css
└── src/                     # Backend JavaScript services
    ├── auth.js              # Authentication service
    ├── money.js             # Money management
    ├── shop.js              # Shop buy/sell logic
    ├── inventory.js         # Pet inventory management
    └── matchmaking.js       # 1v1 matchmaking + WebSocket
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or pnpm

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd Petro
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

The game will be available at `http://localhost:3000`

### Docker Setup

Alternatively, build and run with Docker:
```bash
docker build -t petro .
docker run -p 3000:3000 petro
```

## How to Play

1. **Create an Account** - Sign up with a username and 4-digit PIN
2. **Login** - Enter your credentials to access your game
3. **Collect Pets** - Use your passive income to buy pets from the shop
4. **Level Up** - Spend money to increase your pet's stats
5. **Battle** - Enter the matchmaking queue to battle other players
6. **Win & Earn** - Defeat opponents to earn rewards

## Game Architecture

The game uses a service-oriented architecture:

- **Frontend** (HTML/CSS/JavaScript) communicates with the backend via REST API and WebSocket
- **Node.js Server** (server.js) handles HTTP routing and WebSocket connections
- **JavaScript Services** (src/) provide modular game logic:
  - `auth.js` - User authentication and token management
  - `money.js` - Virtual currency system
  - `shop.js` - Pet buying/selling with 70% resale
  - `inventory.js` - Pet collection management
  - `matchmaking.js` - 1v1 player matching and WebSocket coordination
- **In-Memory Storage** stores user accounts and game state (can be replaced with a database)

### Real-time Communication

- **REST API** for authentication, shop, inventory operations
- **WebSocket** upgrade after successful matchmaking
- JSON messaging protocol for all communication
- Integrated WebSocket server for battle coordination

## Development

### Important Files

- `server.js` - Main server entry point with Express and WebSocket
- `pets.json` - Pet definitions with stats (cost, strength, HP, dodge)
- `src/auth.js` - Authentication service
- `src/shop.js` - Shop service (buy/sell pets)
- `src/inventory.js` - Inventory management
- `src/matchmaking.js` - Matchmaking and battle coordination
- `API_DOCUMENTATION.md` - Complete API reference

### API Documentation

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete REST API and WebSocket protocol documentation.

### Environment Variables

Create a `.env` file in the root directory:
```
PORT=3000
```

## License

[Add your license here]

## Contributing

[Add contribution guidelines here]
