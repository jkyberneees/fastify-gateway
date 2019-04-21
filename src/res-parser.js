const toArray = require('stream-to-array')

module.exports = async (res) => {
  const buffer = Buffer.concat(await toArray(res))

  return buffer
}
