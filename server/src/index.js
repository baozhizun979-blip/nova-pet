const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes');
const { migrate } = require('./db');

const app = express();
app.use(bodyParser.json());

// idempotency middleware
const { ensureIdempotency } = require('./db');
app.use((req, res, next) => {
  const key = req.headers['x-event-id'] || req.body && req.body.eventId;
  if (key) {
    const existed = ensureIdempotency(key);
    if (existed) return res.json({ok:true, idempotent:true});
  }
  next();
});

app.use(routes);

const PORT = process.env.PORT || 4000;

async function start() {
  migrate();
  app.listen(PORT, () => console.log('Server listening on', PORT));
}

if (require.main === module) start();

module.exports = app;
