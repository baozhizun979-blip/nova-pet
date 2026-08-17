const request = require('supertest');
const app = require('../src/index');
const { db, migrate } = require('../src/db');
const fs = require('fs');

beforeAll(() => {
  // ensure fresh DB file
  const p = process.env.NOVA_DB_PATH || require('path').join(__dirname, '..', 'data', 'nova.db');
  try { fs.unlinkSync(p); } catch(e){}
  migrate();
});

test('identity create and dedupe', async () => {
  const res = await request(app).post('/api/identity').send({telegramId:'tg_1'});
  expect(res.statusCode).toBe(200);
  expect(res.body.novaId).toBeDefined();
  const res2 = await request(app).post('/api/identity').send({telegramId:'tg_1'});
  expect(res2.body.created).toBe(false);
});

test('hatch and idempotency', async () => {
  const id = 'evt_123';
  const res = await request(app).post('/api/hatch').set('x-event-id', id).send({novaId:'nova_1', eggType:'鼠'});
  expect(res.statusCode).toBe(200);
  expect(res.body.petId).toBeDefined();
  const res2 = await request(app).post('/api/hatch').set('x-event-id', id).send({novaId:'nova_1', eggType:'鼠'});
  expect(res2.body.idempotent).toBe(true);
});

test('action stores record', async () => {
  const res = await request(app).post('/api/action').send({novaId:'nova_1', actionType:'feed', actionId:'a1'});
  expect(res.statusCode).toBe(200);
  const row = db.prepare('SELECT * FROM actions WHERE actionId = ?').get('a1');
  expect(row).toBeDefined();
});

test('shop creates order', async () => {
  const res = await request(app).post('/api/shop').send({novaId:'nova_1', sku:'hat', quantity:1});
  expect(res.statusCode).toBe(200);
  expect(res.body.orderId).toBeDefined();
});

test('recovery finds an existing identity', async () => {
  const identity = await request(app).post('/api/identity').send({telegramId:'tg_recovery'});
  const res = await request(app).post('/api/recovery').send({novaId:identity.body.novaId, method:'telegram'});
  expect(res.statusCode).toBe(200);
  expect(res.body.ok).toBe(true);
});

test('shop rejects quantities below the OpenAPI minimum', async () => {
  const res = await request(app).post('/api/shop').send({novaId:'nova_1', sku:'hat', quantity:0});
  expect(res.statusCode).toBe(400);
  expect(res.body.error).toMatch(/at least 1/);
});

test('task rejects operations outside the OpenAPI enum', async () => {
  const res = await request(app).post('/api/task').send({novaId:'nova_1', op:'delete'});
  expect(res.statusCode).toBe(400);
  expect(res.body.error).toMatch(/must be one of/);
});
