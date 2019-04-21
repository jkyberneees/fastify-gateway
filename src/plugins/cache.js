const fp = require('fastify-plugin')
const { default: createCacheInstance } = require('@nrk/nodecache-as-promised')
const ms = require('ms')
const resParser = require('./../res-parser')

const X_CACHE_EXPIRE = 'x-cache-expire'
const X_CACHE_TIMEOUT = 'x-cache-timeout'
const X_CACHE_HIT = 'x-cache-hit'

const {
  kReplyHeaders
} = require('fastify/lib/symbols')

const plugin = (fastify, opts, next) => {
  opts = Object.assign({
    maxAge: 0, // here we expire stale key immediately as a suggested setup
    redis: {}
  }, opts)
  const cache = createCacheInstance(opts)

  if (opts.redis.factory) {
    // @TODO: setup redis integration
  }

  fastify.addHook('preHandler', async (request, reply, next) => {
    const { req } = request
    let { url: key, cacheAppendKey = req => '' } = req
    cacheAppendKey = await cacheAppendKey(req)

    key = key + cacheAppendKey
    // ref cache key on req object
    req.cacheKey = key

    const cached = await cache.get(key)
    if (!cached) {
      return next()
    }

    // respond from cache if there is a hit
    const { value: { headers, payload }, cache: state } = cached
    if (state !== 'hit') {
      return next()
    }
    headers[X_CACHE_HIT] = '1'

    // set cached response headers
    Object.keys(headers).forEach(header => reply.header(header, headers[header]))

    // send cached payload
    reply.send(Buffer.from(payload))
  })

  fastify.addHook('onSend', (request, reply, payload, next) => {
    if (reply.hasHeader(X_CACHE_EXPIRE)) {
      // support service level expiration
      const keysPattern = reply.getHeader(X_CACHE_EXPIRE)
      cache.expire([keysPattern])
    } else if (reply.hasHeader(X_CACHE_TIMEOUT)) {
      const { req } = request
      // we need to cache response
      resParser(payload).then(buffer => cache.set(req.cacheKey, {
        headers: reply[kReplyHeaders],
        payload: buffer.toJSON().data
      }, ms(reply.getHeader(X_CACHE_TIMEOUT)))
      )
    }

    return next()
  })

  next()
}

module.exports = fp(plugin)
