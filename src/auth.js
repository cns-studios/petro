const crypto = require('crypto');

// Simple in-memory user storage (in production, use a database)
const users = new Map();

/**
 * Hash a password using SHA-256
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Generate a simple token for authentication
 */
function generateToken(username) {
  return crypto.createHash('sha256').update(username + Date.now()).digest('hex');
}

/**
 * Register a new user
 */
function register(username, password) {
  if (!username || !password) {
    throw new Error('Username and password are required');
  }
  
  if (users.has(username)) {
    throw new Error('Username already exists');
  }
  
  const hashedPassword = hashPassword(password);
  const token = generateToken(username);
  
  users.set(username, {
    username,
    password: hashedPassword,
    token,
    money: 5000, // Starting money
    inventory: [],
    createdAt: new Date()
  });
  
  return { token, username, money: 5000 };
}

/**
 * Login an existing user
 */
function login(username, password) {
  const user = users.get(username);
  
  if (!user) {
    throw new Error('Invalid username or password');
  }
  
  const hashedPassword = hashPassword(password);
  
  if (user.password !== hashedPassword) {
    throw new Error('Invalid username or password');
  }
  
  // Generate new token on login
  const token = generateToken(username);
  user.token = token;
  
  return { token, username, money: user.money };
}

/**
 * Verify a token and return user data
 */
function verifyToken(token) {
  for (const [username, user] of users.entries()) {
    if (user.token === token) {
      return { username, money: user.money };
    }
  }
  return null;
}

/**
 * Get user by username
 */
function getUser(username) {
  return users.get(username);
}

/**
 * Get user by token
 */
function getUserByToken(token) {
  for (const user of users.values()) {
    if (user.token === token) {
      return user;
    }
  }
  return null;
}

module.exports = {
  register,
  login,
  verifyToken,
  getUser,
  getUserByToken
};
