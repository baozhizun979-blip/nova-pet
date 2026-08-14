const { migrate } = require('./db');
migrate();
console.log('migrations applied');
