const CryptoJS = require('crypto-js');

// Simple password hashing using CryptoJS (no compilation issues)
const hashPassword = (password) => {
  const salt = 'patorama_salt_2024';
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256/32,
    iterations: 1000
  }).toString();
};

const comparePassword = (password, hash) => {
  const hashedInput = hashPassword(password);
  return hashedInput === hash;
};

module.exports = {
  hashPassword,
  comparePassword
};