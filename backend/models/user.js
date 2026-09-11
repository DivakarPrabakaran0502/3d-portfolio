const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]', 'utf8');
}

function getAll() {
  ensureFile();
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

function saveAll(users) {
  ensureFile();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

function findByEmail(email) {
  return getAll().find(u => u.email === email) || null;
}

function findById(id) {
  return getAll().find(u => u.id === id) || null;
}

function create(user) {
  const users = getAll();
  users.push(user);
  saveAll(users);
  return user;
}

module.exports = { findByEmail, findById, create };
