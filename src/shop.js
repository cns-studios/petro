const inventory = require('./inventory');
const money = require('./money');
const fs = require('fs');
const path = require('path');

// Load pets data
const petsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../pets.json'), 'utf8'));

/**
 * Get all available pets in the shop
 */
function getShopPets() {
  return petsData.pets;
}

/**
 * Get a specific pet by ID
 */
function getPetById(petId) {
  return petsData.pets.find(p => p.id === petId);
}

/**
 * Buy a pet from the shop
 */
function buyPet(username, petId) {
  const pet = getPetById(petId);
  if (!pet) {
    throw new Error('Pet not found in shop');
  }
  
  // Check if user has enough money
  const balance = money.getBalance(username);
  if (balance < pet.cost) {
    throw new Error('Insufficient funds');
  }
  
  // Deduct money
  money.deductMoney(username, pet.cost);
  
  // Add pet to inventory
  const petInstance = inventory.addPet(username, petId);
  
  return {
    pet: petInstance,
    newBalance: money.getBalance(username)
  };
}

/**
 * Sell a pet back to the shop (70% refund)
 */
function sellPet(username, instanceId) {
  const pet = inventory.getPet(username, instanceId);
  if (!pet) {
    throw new Error('Pet not found in inventory');
  }
  
  // Calculate refund (70% of purchase price)
  const refund = Math.floor(pet.purchasePrice * 0.7);
  
  // Remove pet from inventory
  inventory.removePet(username, instanceId);
  
  // Add money back
  money.addMoney(username, refund);
  
  return {
    refund,
    newBalance: money.getBalance(username)
  };
}

module.exports = {
  getShopPets,
  getPetById,
  buyPet,
  sellPet
};
