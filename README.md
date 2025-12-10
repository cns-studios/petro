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
- **Python 3** - Game logic and battle engine
- **SQLite3** - User accounts and game state database
- **WebSocket (ws)** - Real-time bidirectional communication
- **dotenv** - Environment configuration

### Frontend
- **HTML5** - Multi-page interface (login, game, battle, matchmaking)
- **CSS3** - Styling and pixel art visuals
- **Vanilla JavaScript** - Client-side game interactions

## Project Structure

```
Petro/
├── server.js                 # Main Node.js server
├── package.json              # npm dependencies
├── public/                   # Frontend files
│   ├── index.html
│   ├── login.html           # Authentication UI
│   ├── game.html            # Main game interface
│   ├── battle.html          # Battle UI
│   ├── matchmaking.html     # Matchmaking queue
│   ├── style.css
│   ├── battle.css
│   └── src/
│       ├── login.js         # Authentication logic
│       ├── game.js          # Game client logic
│       ├── battle.js        # Battle client logic
│       └── matchmaking.js   # Matchmaking client logic
├── src/                     # Backend Python game logic
│   ├── logic.py             # State management & persistence
│   ├── shop.py              # Game class & shop mechanics
│   ├── ingame.py            # Battle system implementation
│   ├── inventory.py         # Pet inventory management
│   └── assets/
│       └── pets.py          # Pet definitions & stats
├── db/                      # Database directory
│   └── users.db             # SQLite database
└── bannednames.txt          # Banned username list
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- Python 3
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

The game uses a multi-process architecture:

- **Frontend** (HTML/CSS/JavaScript) communicates with the backend via WebSocket
- **Node.js Server** handles user authentication, WebSocket connections, and game state management
- **Python Subprocesses** run the core game logic (shop mechanics, battle system, inventory management)
- **SQLite Database** persists user accounts and game state

### Real-time Communication

- WebSocket connections handle gameplay updates
- JSON messaging protocol for client-server communication
- Separate WebSocket server for battle matchmaking

## Development

### Important Files

- `server.js` - Main server entry point
- `public/src/game.js` - Client-side game logic
- `src/ingame.py` - Server-side battle system
- `src/assets/pets.py` - Pet definitions and stats

### Environment Variables

Create a `.env` file in the root directory:
```
PORT=3000
```

## License

[Add your license here]

## Contributing

[Add contribution guidelines here]
