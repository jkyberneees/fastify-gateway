const Ajv = require('ajv')
const ajv = new Ajv()
const schema = require('./config-schema.json')

module.exports = (data) => {
  const valid = ajv.validate(schema, data)
  if (!valid) {
    console.log(ajv.errors)
    throw new Error('Gateway configuration is invalid!')
  }
}
