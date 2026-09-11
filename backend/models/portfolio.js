const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const PORTFOLIO_FILE = path.join(DATA_DIR, 'portfolio.json');

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(PORTFOLIO_FILE)) fs.writeFileSync(PORTFOLIO_FILE, '[]', 'utf8');
}

function getAll() {
  ensureFile();
  return JSON.parse(fs.readFileSync(PORTFOLIO_FILE, 'utf8'));
}

function saveAll(items) {
  ensureFile();
  fs.writeFileSync(PORTFOLIO_FILE, JSON.stringify(items, null, 2), 'utf8');
}

function findByUser(userId) {
  return getAll().filter(i => i.userId === userId);
}

function findById(id) {
  return getAll().find(i => i.id === id) || null;
}

function create(item) {
  const items = getAll();
  items.push(item);
  saveAll(items);
  return item;
}

function update(id, updates) {
  const items = getAll();
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
  saveAll(items);
  return items[idx];
}

function remove(id) {
  const items = getAll();
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return false;
  items.splice(idx, 1);
  saveAll(items);
  return true;
}

module.exports = { findByUser, findById, create, update, remove };
