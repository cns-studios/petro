const auth = require('./auth');

/**
 * Get user's current balance
 */
function getBalance(username) {
  const user = auth.getUser(username);
  if (!user) {
    throw new Error('User not found');
  }
  return user.money;
}

/**
 * Add money to user's account
 */
function addMoney(username, amount) {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }
  
  const user = auth.getUser(username);
  if (!user) {
    throw new Error('User not found');
  }
  
  user.money += amount;
  return user.money;
}

/**
 * Deduct money from user's account
 */
function deductMoney(username, amount) {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }
  
  const user = auth.getUser(username);
  if (!user) {
    throw new Error('User not found');
  }
  
  if (user.money < amount) {
    throw new Error('Insufficient funds');
  }
  
  user.money -= amount;
  return user.money;
}

/**
 * Transfer money between users
 */
function transferMoney(fromUsername, toUsername, amount) {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }
  
  const fromUser = auth.getUser(fromUsername);
  const toUser = auth.getUser(toUsername);
  
  if (!fromUser || !toUser) {
    throw new Error('User not found');
  }
  
  if (fromUser.money < amount) {
    throw new Error('Insufficient funds');
  }
  
  fromUser.money -= amount;
  toUser.money += amount;
  
  return { fromBalance: fromUser.money, toBalance: toUser.money };
}

module.exports = {
  getBalance,
  addMoney,
  deductMoney,
  transferMoney
};
