const express = require('express');
const router = express.Router();
const { db } = require('./db');
const { validate } = require('./validators');

router.post('/api/identity', (req, res) => {
  const v = validate('IdentityRequest', req.body);
  if (!v.ok) return res.status(400).json({error:v.error});
  const telegramId = req.body.telegramId;
  const row = db.prepare('SELECT novaId FROM identities WHERE telegramId = ?').get(telegramId);
  if (row) return res.json({novaId: row.novaId, created:false});
  const novaId = `nova_${Date.now()}`;
  db.prepare('INSERT INTO identities(novaId, telegramId, createdAt) VALUES(?,?,?)').run(novaId, telegramId, Date.now());
  res.json({novaId, created:true});
});

router.post('/api/hatch', (req, res) => {
  const v = validate('HatchRequest', req.body);
  if (!v.ok) return res.status(400).json({error:v.error});
  const { novaId, eggType, eventId } = req.body;
  // idempotency handled in middleware
  const petId = `pet_${Date.now()}`;
  db.prepare('INSERT INTO pets(petId, owner, stage, createdAt) VALUES(?,?,?,?)').run(petId, novaId, 'hatched', Date.now());
  res.json({petId});
});

router.post('/api/action', (req, res) => {
  const v = validate('ActionRequest', req.body);
  if (!v.ok) return res.status(400).json({error:v.error});
  const { novaId, actionType, actionId, payload } = req.body;
  db.prepare('INSERT INTO actions(actionId, novaId, actionType, payload, createdAt) VALUES(?,?,?,?,?)').run(actionId, novaId, actionType, JSON.stringify(payload||{}), Date.now());
  res.json({actionId, result:'ok'});
});

router.post('/api/task', (req, res) => {
  const v = validate('TaskRequest', req.body);
  if (!v.ok) return res.status(400).json({error:v.error});
  const { novaId, op, taskId } = req.body;
  if (op === 'list' || !op) {
    const rows = db.prepare('SELECT taskId, data FROM tasks WHERE novaId = ?').all(novaId);
    return res.json({tasks: rows});
  }
  if (op === 'claim') {
    db.prepare('INSERT INTO tasks(novaId, taskId, data) VALUES(?,?,?)').run(novaId, taskId||`t_${Date.now()}`, JSON.stringify({claimed:true}));
    return res.json({ok:true});
  }
  res.status(400).json({error:'unknown op'});
});

router.post('/api/recovery', (req, res) => {
  const v = validate('RecoveryRequest', req.body);
  if (!v.ok) return res.status(400).json({error:v.error});
  // simple recovery stub: verify novaId exists
  const { novaId } = req.body;
  const row = db.prepare('SELECT novaId FROM identities WHERE novaId = ?').get(novaId);
  if (!row) return res.status(404).json({ok:false});
  res.json({ok:true});
});

router.post('/api/shop', (req, res) => {
  const v = validate('ShopRequest', req.body);
  if (!v.ok) return res.status(400).json({error:v.error});
  const { novaId, sku, quantity } = req.body;
  const orderId = `order_${Date.now()}`;
  db.prepare('INSERT INTO orders(orderId, novaId, sku, quantity, status, createdAt) VALUES(?,?,?,?,?,?)').run(orderId, novaId, sku, quantity||1, 'PAID', Date.now());
  res.json({orderId});
});

module.exports = router;
