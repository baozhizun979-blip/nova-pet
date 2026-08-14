const openapi = require('../../api/openapi.json');

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
      if (prop.type === 'object' && t !== 'object') return {ok:false, error:`${k} must be object`};
    }
  }
  return {ok:true};
}

module.exports = { validate };
