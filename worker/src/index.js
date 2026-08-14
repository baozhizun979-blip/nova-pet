addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

const DB = new Map(); // simple in-memory placeholder
const IDEMPOTENCY = new Set();

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '');
  if (path === '/health' && request.method === 'GET') {
    return new Response(JSON.stringify({status: 'ok'}), {headers: {'Content-Type': 'application/json'}})
  }

  // simple idempotency key header: x-event-id
  const eventId = request.headers.get('x-event-id') || '';
  if (eventId && IDEMPOTENCY.has(eventId)) {
    return new Response(JSON.stringify({ok: true, idempotent: true}), {headers: {'Content-Type': 'application/json'}})
  }

  try {
    if (path === '/api/identity' && request.method === 'POST') return handleIdentity(request, eventId)
    if (path === '/api/hatch' && request.method === 'POST') return handleHatch(request, eventId)
    if (path === '/api/action' && request.method === 'POST') return handleAction(request, eventId)
    if (path === '/api/task' && request.method === 'POST') return handleTask(request, eventId)
    if (path === '/api/recovery' && request.method === 'POST') return handleRecovery(request, eventId)
    if (path === '/api/shop' && request.method === 'POST') return handleShop(request, eventId)
    return new Response('Not Found', {status: 404})
  } catch (e) {
    return new Response(JSON.stringify({error: e.message}), {status: 500, headers: {'Content-Type':'application/json'}})
  }
}

async function jsonBody(request) {
  try {
    return await request.json()
  } catch (e) {
    return {}
  }
}

function markIdempotent(eventId) {
  if (eventId) IDEMPOTENCY.add(eventId)
}

async function handleIdentity(request, eventId) {
  const body = await jsonBody(request)
  const novaId = body.novaId || `nova_${Date.now()}`
  DB.set(novaId, {novaId, createdAt: Date.now(), data: body})
  markIdempotent(eventId)
  return new Response(JSON.stringify({ok:true, novaId}), {headers:{'Content-Type':'application/json'}})
}

async function handleHatch(request, eventId) {
  const body = await jsonBody(request)
  const novaId = body.novaId || `nova_${Date.now()}`
  const petId = `pet_${Date.now()}`
  DB.set(petId, {petId, owner: novaId, stage: 'egg', createdAt: Date.now(), data: body})
  markIdempotent(eventId)
  return new Response(JSON.stringify({ok:true, petId}), {headers:{'Content-Type':'application/json'}})
}

async function handleAction(request, eventId) {
  const body = await jsonBody(request)
  const actionId = body.actionId || `act_${Date.now()}`
  // naive processing: record action
  DB.set(actionId, {actionId, body, time: Date.now()})
  markIdempotent(eventId)
  return new Response(JSON.stringify({ok:true, actionId}), {headers:{'Content-Type':'application/json'}})
}

async function handleTask(request, eventId) {
  const body = await jsonBody(request)
  const taskId = body.taskId || `task_${Date.now()}`
  DB.set(taskId, {taskId, body, time: Date.now()})
  markIdempotent(eventId)
  return new Response(JSON.stringify({ok:true, taskId}), {headers:{'Content-Type':'application/json'}})
}

async function handleRecovery(request, eventId) {
  const body = await jsonBody(request)
  // no-op placeholder
  markIdempotent(eventId)
  return new Response(JSON.stringify({ok:true, recovery: true}), {headers:{'Content-Type':'application/json'}})
}

async function handleShop(request, eventId) {
  const body = await jsonBody(request)
  const orderId = `order_${Date.now()}`
  DB.set(orderId, {orderId, body, time: Date.now()})
  markIdempotent(eventId)
  return new Response(JSON.stringify({ok:true, orderId}), {headers:{'Content-Type':'application/json'}})
}
