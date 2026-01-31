const auth = require('./auth');
const fs = require('fs');
const path = require('path');

// Load pets data
const petsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../pets.json'), 'utf8'));

/**
 * Get user's inventory
 */
function getInventory(username) {
  const user = auth.getUser(username);
  if (!user) {
    throw new Error('User not found');
  }
  return user.inventory || [];
}

/**
 * Add a pet to user's inventory
 */
function addPet(username, petId) {
  const user = auth.getUser(username);
  if (!user) {
    throw new Error('User not found');
  }
  
  const pet = petsData.pets.find(p => p.id === petId);
  if (!pet) {
    throw new Error('Pet not found');
  }
  
  // Create a unique instance of the pet
  const petInstance = {
    instanceId: crypto.randomUUID(),
    ...pet,
    level: 1,
    purchasePrice: pet.cost
  };
  
  if (!user.inventory) {
    user.inventory = [];
  }
  
  user.inventory.push(petInstance);
  return petInstance;
}

/**
 * Remove a pet from user's inventory
 */
function removePet(username, instanceId) {
  const user = auth.getUser(username);
  if (!user) {
    throw new Error('User not found');
  }
  
  if (!user.inventory) {
    user.inventory = [];
  }
  
  const index = user.inventory.findIndex(p => p.instanceId === instanceId);
  if (index === -1) {
    throw new Error('Pet not found in inventory');
  }
  
  const removedPet = user.inventory.splice(index, 1)[0];
  return removedPet;
}

/**
 * Get a specific pet from inventory
 */
function getPet(username, instanceId) {
  const user = auth.getUser(username);
  if (!user) {
    throw new Error('User not found');
  }
  
  if (!user.inventory) {
    return null;
  }
  
  return user.inventory.find(p => p.instanceId === instanceId);
}

/**
 * Level up a pet (increase stats)
 */
function levelUpPet(username, instanceId) {
  const pet = getPet(username, instanceId);
  if (!pet) {
    throw new Error('Pet not found in inventory');
  }
  
  pet.level += 1;
  pet.strength = Math.floor(pet.strength * 1.1);
  pet.hp = Math.floor(pet.hp * 1.1);
  
  return pet;
}

module.exports = {
  getInventory,
  addPet,
  removePet,
  getPet,
  levelUpPet
};
