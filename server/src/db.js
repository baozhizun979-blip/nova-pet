// Lightweight in-memory DB to avoid native dependencies in CI.
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const STORE_FILE = path.join(DATA_DIR, 'store.json');
let store = { identities: {}, pets: {}, actions: {}, tasks: [], orders: {}, idempotency_keys: {} };
try { store = JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8')); } catch (e) {}

function persist() {
  try { fs.writeFileSync(STORE_FILE, JSON.stringify(store)); } catch (e) {}
}

function migrate() {
  // ensure store has required keys
  store.identities = store.identities || {};
  store.pets = store.pets || {};
  store.actions = store.actions || {};
  store.tasks = store.tasks || [];
  store.orders = store.orders || {};
  store.idempotency_keys = store.idempotency_keys || {};
  persist();
}

function ensureIdempotency(key) {
  if (!key) return false;
  if (store.idempotency_keys[key]) return true;
  store.idempotency_keys[key] = { createdAt: Date.now() };
  persist();
  return false;
}

// Minimal prepare-like API used by code
const db = {
  prepare: (sql) => {
    const lower = sql.toLowerCase();
    if (lower.includes('select novaid from identities where telegramid =')) {
      return {
        get: (telegramId) => {
          const rows = Object.values(store.identities).filter(r => r.telegramId === telegramId);
          return rows[0] ? { novaId: rows[0].novaId } : undefined;
        }
      };
    }
    if (lower.includes('select novaid from identities where novaid =')) {
      return {
        get: (novaId) => store.identities[novaId] ? { novaId } : undefined
      };
    }
    if (lower.includes('insert into identities')) {
      return { run: (novaId, telegramId, createdAt) => { store.identities[novaId] = { novaId, telegramId, createdAt }; persist(); } };
    }
    if (lower.includes('insert into pets')) {
      return { run: (petId, owner, stage, createdAt) => { store.pets[petId] = { petId, owner, stage, createdAt }; persist(); } };
    }
    if (lower.includes('insert into actions')) {
      return { run: (actionId, novaId, actionType, payload, createdAt) => { store.actions[actionId] = { actionId, novaId, actionType, payload, createdAt }; persist(); } };
    }
    if (lower.includes('select taskid, data from tasks where novaid =')) {
      return { all: (novaId) => store.tasks.filter(t => t.novaId === novaId).map(t => ({ taskId: t.taskId, data: t.data })) };
    }
    if (lower.includes('insert into tasks')) {
      return { run: (novaId, taskId, data) => { store.tasks.push({ id: store.tasks.length+1, novaId, taskId, data }); persist(); } };
    }
    if (lower.includes('insert into orders')) {
      return { run: (orderId, novaId, sku, quantity, status, createdAt) => { store.orders[orderId] = { orderId, novaId, sku, quantity, status, createdAt }; persist(); } };
    }
    if (lower.includes('select * from actions where actionid =')) {
      return { get: (actionId) => store.actions[actionId] };
    }
    return {
      run: () => {},
      get: () => undefined,
      all: () => []
    };
  },
  exec: () => {}
};

module.exports = { db, migrate, ensureIdempotency };
