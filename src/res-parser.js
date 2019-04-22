const toArray = require('stream-to-array')
const http = require('http')

module.exports.in = async (payload) => {
  if (payload instanceof http.IncomingMessage || payload instanceof Buffer) {
    payload = {
      _t: 'buffer',
      d: Buffer.concat(await toArray(payload)).toJSON().data
    }
  } else {
    payload = {
      _t: typeof payload,
      d: payload
    }
  }

  return payload
}

module.exports.out = async (payload) => {
  const { _t: type, d: data } = payload
  if (type === 'buffer') {
    payload = Buffer.from(data)
  } else {
    // @TODO: we could support more data types here in the future
    payload = data
  }

  return payload
}
