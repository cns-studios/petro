const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const url = require('url');
const cookie = require('cookie');
const logger = require('./logger');

const dotenv = require('dotenv');

dotenv.config();

const connectionAttempts = new Map();
const app = express();
const server = http.createServer(app);



// Create ws servers with da noServer option bc stackoverflow told me so (no idea what ts does)
const wss = new WebSocket.Server({ noServer: true });
const wss_battle = new WebSocket.Server({ noServer: true });

const gameInstances = new Map();

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to check for the auth token and redirect if it's not present.
const authMiddleware = async (req, res, next) => {
    // Allow access to static assets without authentication
    if (req.path.startsWith('/assets/') || req.path.startsWith('/css/') || req.path.startsWith('/js/')) {
        return next();
    }

    const token = req.cookies.auth_token;

    if (!token) {
        const redirectUri = encodeURIComponent(`https://petro.cns-studios.com${req.originalUrl}`);
        return res.redirect(`${process.env.AUTH_SERVICE_URL}/login?redirect_uri=${redirectUri}`);
    }

    try {
        const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/api/me`, {
            headers: {
                Cookie: `auth_token=${token}`
            }
        });
        req.user = response.data;
        next();
    } catch (error) {
        logger.error('Error authenticating user:', error.message);
        const redirectUri = encodeURIComponent(`https://petro.cns-studios.com${req.originalUrl}`);
        return res.redirect(`${process.env.AUTH_SERVICE_URL}/login?redirect_uri=${redirectUri}`);
    }
};

app.use(authMiddleware);

function createGameProcess(username) {
    if (connectionAttempts.has(username)) {
        logger.info(`[Game] Process creation already in progress for ${username}`);
        return connectionAttempts.get(username);
    }

    logger.info(`[Game] Spawning new game process for user: ${username}`);
    
    const pythonCmd = process.platform === 'win32' ? 'py' : 'python3';
    const gameProcess = spawn(pythonCmd, ['-u', path.join(__dirname, 'src', 'logic.py'), username]);
    
    connectionAttempts.set(username, gameProcess);
    gameInstances.set(username, gameProcess);

    gameProcess.on('spawn', () => {
        logger.info(`[Game] Successfully spawned process for ${username} with PID: ${gameProcess.pid}`);
        connectionAttempts.delete(username);
    });

    gameProcess.stderr.on('data', (data) => {
        logger.error(`[Game ERROR] (User: ${username}): ${data.toString()}`);
    });

    gameProcess.on('close', (code) => {
        logger.info(`[Game] Process for ${username} exited with code ${code}`);
        gameInstances.delete(username);
        connectionAttempts.delete(username);
    });

    gameProcess.on('error', (err) => {
        logger.error(`[Game] Failed to start process for ${username}:`, err);
        gameInstances.delete(username);
        connectionAttempts.delete(username);
    });

    return gameProcess;
}

app.post('/shutdown', (req, res) => {
    logger.info('[Server] Shutdown initiated.');
    isShuttingDown = true;
    res.status(200).send('Server is shutting down.');

    const checkActiveBattles = () => {
        if (activeBattles.size === 0) {
            logger.info('[Server] All battles have ended. Shutting down.');
            server.close(() => {
                process.exit(0);
            });
        } else {
            logger.info(`[Server] Waiting for ${activeBattles.size} active battles to end.`);
            setTimeout(checkActiveBattles, 5000);
        }
    };

    checkActiveBattles();
});

wss.on('connection', (ws, req) => {
    const { username } = req.user; // This will be populated by our auth middleware
    logger.info(`[Game WS] New connection from ${username}`);

    let gameProcess = createGameProcess(username);

    // Load game state from auth service
    axios.get(`${process.env.AUTH_SERVICE_URL}/api/data/petro`, {
        headers: { Cookie: `auth_token=${req.cookies.auth_token}` }
    }).then(response => {
        if (response.data && response.data.game_state) {
            gameProcess.stdin.write(JSON.stringify({ type: 'load_state', state: response.data.game_state }) + '\n');
        }
    }).catch(error => {
        if (error.response && error.response.status !== 404) {
            logger.error('Error loading game state:', error.message);
        }
    });

    gameProcess.stdout.on('data', (data) => {
        const message = data.toString();
        try {
            const parsed = JSON.parse(message);
            if (parsed.type === 'save_state') {
                axios.post(`${process.env.AUTH_SERVICE_URL}/api/data/petro`, { game_state: parsed.state }, {
                    headers: { Cookie: `auth_token=${req.cookies.auth_token}` }
                }).catch(error => {
                    logger.error('Error saving game state:', error.message);
                });
            } else {
                ws.send(message);
            }
        } catch (e) {
            ws.send(message); // Send non-JSON messages to client
        }
    });

    ws.on('message', (message) => {
        const command = message.toString();
        logger.info(`[Client -> Server] (User: ${username}) Received command: ${command}`);

        if (command === "join_matchmaking") {
            logger.info(`[Matchmaking] ${username} joining matchmaking`);

            const matchResult = findMatch(username);

            if (matchResult.matched) {
                // Create battle process
                const battleProcess = createBattleProcess(
                    matchResult.battleId,
                    username,
                    matchResult.opponent
                );

                ws.send(JSON.stringify({
                    type: 'match_found',
                    battleId: matchResult.battleId,
                    opponent: matchResult.opponent
                }));
            } else {
                // Add ws reference to queue
                const queueEntry = matchmakingQueue.find(p => p.username === username);
                if (queueEntry) {
                    queueEntry.ws = ws;
                }

                if (matchResult.reason === 'disabled') {
                    ws.send(JSON.stringify({
                        type: 'matchmaking_disabled',
                        message: 'Matchmaking is temporarily disabled for a server update. Please try again in a moment.'
                    }));
                } else {
                    ws.send(JSON.stringify({
                        type: 'searching',
                        message: 'Searching for opponent...',
                        queuePosition: matchmakingQueue.length
                    }));
                }
            }
        } else if (command === "leave_matchmaking") {
            const index = matchmakingQueue.findIndex(p => p.username === username);
            if (index !== -1) {
                matchmakingQueue.splice(index, 1);
                logger.info(`[Matchmaking] ${username} left queue`);
                ws.send(JSON.stringify({
                    type: 'left_queue',
                    message: 'Left matchmaking queue'
                }));
            }
        } else if (!gameProcess.killed) {
            gameProcess.stdin.write(command + '\n');
        }
    });

    ws.on('close', () => {
        logger.info(`[Game WS] Connection closed for ${username}`);
    });

    ws.on('error', (error) => {
        logger.error(`[Game WS] Error for ${username}:`, error);
    });
});

wss_battle.on('connection', (ws, req, battleId, username) => {
    logger.info(`[Battle WS] Player ${username} connected to battle #${battleId}`);

    const battle = activeBattles.get(parseInt(battleId));
    if (!battle) {
        logger.warn(`[Battle WS] Battle #${battleId} not found`);
        ws.close(1008, 'Battle not found');
        return;
    }

    const battleProcess = battle.process;

    const onData = (data) => {
        const output = data.toString();
        output.split('\n').filter(line => line.trim() !== '').forEach(line => {
            try {
                const parsed = JSON.parse(line);
                // Send updates to the specific player or broadcast to both
                if (ws.readyState === WebSocket.OPEN) {
                    logger.info(`[Battle -> Client] Battle #${battleId}: ${line.trim()}`);
                    ws.send(line);
                }
            } catch (e) {
                logger.error(`[Battle] Failed to parse output: ${line}`);
            }
        });
    };

    const onProcessClose = (code) => {
        logger.info(`[Battle WS] Battle #${battleId} process closed`);
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'battle_ended', message: 'Battle ended' }));
            ws.close(1000, 'Battle ended');
        }
        cleanup();
    };

    const cleanup = () => {
        battleProcess.stdout.removeListener('data', onData);
        battleProcess.removeListener('close', onProcessClose);
    };

    battleProcess.stdout.on('data', onData);
    battleProcess.once('close', onProcessClose);

    ws.on('message', (message) => {
        const command = message.toString();
        logger.info(`[Battle Client -> Server] ${username} in battle #${battleId}: ${command}`);
        if (!battleProcess.killed) {
            battleProcess.stdin.write(`${username}:${command}\n`);
        }
    });

    ws.on('close', () => {
        logger.info(`[Battle WS] ${username} disconnected from battle #${battleId}`);
        cleanup();
    });

    ws.on('error', (error) => {
        logger.error(`[Battle WS] Error for ${username} in battle #${battleId}:`, error);
        cleanup();
    });
});

app.get('/', (req, res) => {
    // This will be the main entry point to the game now
    res.sendFile(path.join(__dirname, 'public', 'game.html'));
});

app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'game.html'));
});

app.use('/images', express.static(path.join(__dirname, 'src/assets/pets')));

app.use('/sprites', express.static(path.join(__dirname, 'assets/images/sprites')));

app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'game.html'));
});
    
app.get('/matchmaking', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'matchmaking.html'));
    logger.info(`[Server] New Matchmaking attempt`)
});

app.get('/battle', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'battle.html'));
});

app.use((req, res) => {
    res.status(404).send('File not found');
});

// Handle WebSocket upgrade - route to appropriate handler
server.on('upgrade', async (request, socket, head) => {
    const pathname = url.parse(request.url).pathname;
    
    const cookies = cookie.parse(request.headers.cookie || '');
    const token = cookies.auth_token;

    if (!token) {
        logger.warn('[WebSocket] Upgrade request rejected: No auth token.');
        socket.destroy();
        return;
    }

    try {
        const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/api/me`, {
            headers: {
                Cookie: `auth_token=${token}`
            }
        });
        request.user = response.data; // Attach user data to the request
    } catch (error) {
        logger.warn('[WebSocket] Upgrade request rejected: Invalid token.');
        socket.destroy();
        return;
    }

    const { username } = request.user;
    logger.info(`[WebSocket] Upgrade request for user ${username} for path: ${pathname}`);
    
    if (pathname === '/battle') {
        const { battleId } = url.parse(request.url, true).query;
        logger.info(`[Battle WS] Upgrade attempt for battle #${battleId} by ${username}`);
        
        if (!battleId) {
            logger.warn('[Battle WS] Missing battleId, destroying socket');
            socket.destroy();
            return;
        }
        
        wss_battle.handleUpgrade(request, socket, head, (ws) => {
            wss_battle.emit('connection', ws, request, battleId, username);
        });
    } else {
        // Default WebSocket connection
        wss.handleUpgrade(request, socket, head, (ws) => {
            ws.user = request.user; // Pass user context to the connection handler
            wss.emit('connection', ws, request);
        });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}. Access at http://localhost:${PORT}`);
});


// Matchmaking and the queue shit
const matchmakingQueue = [];
const activeBattles = new Map(); // FORMAType shii: battleId -> {player1, player2, process}
let battleIdCounter = 0;
let isShuttingDown = false;

function findMatch(username) {
    if (isShuttingDown) {
        logger.info('[Matchmaking] Matchmaking is disabled due to server shutdown.');
        return { matched: false, reason: 'disabled' };
    }
    // Remove player from queue if already there  --> GETOUTTTTT
    const existingIndex = matchmakingQueue.findIndex(p => p.username === username);
    if (existingIndex !== -1) {
        matchmakingQueue.splice(existingIndex, 1);
    }
    
    if (matchmakingQueue.length > 0) {
        // Match found:
        const opponent = matchmakingQueue.shift();
        const battleId = ++battleIdCounter;
        
        logger.info(`[Matchmaking] Match found! ${username} vs ${opponent.username} (Battle #${battleId})`);
        
        // Notify players
        if (opponent.ws && opponent.ws.readyState === WebSocket.OPEN) {
            opponent.ws.send(JSON.stringify({
                type: 'match_found',
                battleId: battleId,
                opponent: username
            }));
        }
        
        return { matched: true, opponent: opponent.username, battleId };
    } else {
        // Add to da damnnn queue
        matchmakingQueue.push({ username });
        logger.info(`[Matchmaking] ${username} added to queue. Queue size: ${matchmakingQueue.length}`);
        return { matched: false };
    }
}

function createBattleProcess(battleId, player1, player2) {
    if (activeBattles.has(battleId)) {
        logger.warn(`[Battle] Battle #${battleId} already exists`);
        return activeBattles.get(battleId).process;
    }

    logger.info(`[Battle] Creating battle #${battleId}: ${player1} vs ${player2}`);
    
    const pythonCmd = process.platform === 'win32' ? 'py' : 'python3';
    const battleProcess = spawn(pythonCmd, [
        '-u', 
        path.join(__dirname, 'src', 'ingame.py'),
        battleId.toString(),
        player1,
        player2
    ]);
    
    activeBattles.set(battleId, {
        player1,
        player2,
        process: battleProcess
    });

    battleProcess.on('spawn', () => {
        logger.info(`[Battle] Battle #${battleId} process spawned with PID: ${battleProcess.pid}`);
    });

    battleProcess.stderr.on('data', (data) => {
        logger.error(`[Battle ERROR] #${battleId}: ${data.toString()}`);
    });

    battleProcess.on('close', (code) => {
        logger.info(`[Battle] Battle #${battleId} ended with code ${code}`);
        activeBattles.delete(battleId);
    });

    battleProcess.on('error', (err) => {
        logger.error(`[Battle] Failed to start battle #${battleId}:`, err);
        activeBattles.delete(battleId);
    });

    return battleProcess;
}
