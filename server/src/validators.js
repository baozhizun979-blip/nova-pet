const fs = require('fs');
const path = require('path');

const openapiPath = path.join(__dirname, '..', '..', 'api', 'openapi.json');
const openapi = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));

function validate(schemaName, obj) {
  const schema = openapi.components.schemas[schemaName];
  if (!schema) throw new Error('Schema not found: ' + schemaName);
  if (schema.required) {
    for (const r of schema.required) {
      if (obj[r] === undefined || obj[r] === null) return {ok:false, error:`missing ${r}`};
    }
  }
  // basic type checks
  if (schema.properties) {
    for (const [k, prop] of Object.entries(schema.properties)) {
      if (obj[k] == null) continue;
      const t = typeof obj[k];
      if (prop.type === 'integer' && !Number.isInteger(obj[k])) return {ok:false, error:`${k} must be integer`};
      if (prop.type === 'string' && t !== 'string') return {ok:false, error:`${k} must be string`};
      if (prop.type === 'object' && (t !== 'object' || Array.isArray(obj[k]))) return {ok:false, error:`${k} must be object`};
      if (prop.type === 'array' && !Array.isArray(obj[k])) return {ok:false, error:`${k} must be array`};
      if (prop.type === 'boolean' && t !== 'boolean') return {ok:false, error:`${k} must be boolean`};
      if (prop.minimum !== undefined && obj[k] < prop.minimum) return {ok:false, error:`${k} must be at least ${prop.minimum}`};
      if (prop.enum && !prop.enum.includes(obj[k])) return {ok:false, error:`${k} must be one of ${prop.enum.join(', ')}`};
    }
  }
  return {ok:true};
}

module.exports = { validate };
