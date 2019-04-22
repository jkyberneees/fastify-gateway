const fp = require('fastify-plugin')
const CacheManager = require('cache-manager')
const ms = require('ms')
const rparser = require('./../res-parser')
const matcher = require('matcher')

const X_CACHE_EXPIRE = 'x-cache-expire'
const X_CACHE_TIMEOUT = 'x-cache-timeout'
const X_CACHE_HIT = 'x-cache-hit'

const {
  kReplyHeaders
} = require('fastify/lib/symbols')

const plugin = (fastify, opts, next) => {
  opts = Object.assign({
    stores: [CacheManager.caching({ store: 'memory', max: 1000, ttl: 30 })]
  }, opts)

  // creating multi-cache instance
  const multiCache = CacheManager.multiCaching(opts.stores)

  fastify.addHook('preHandler', async (request, reply, next) => {
    const { req } = request
    let { url: key, cacheAppendKey = req => '' } = req
    cacheAppendKey = await cacheAppendKey(req)

    key = req.method + key + cacheAppendKey
    // ref cache key on req object
    req.cacheKey = key
    const cached = await get(multiCache, key)
    if (!cached) return next()

    // respond from cache if there is a hit
    const { headers, payload } = JSON.parse(cached)
    headers[X_CACHE_HIT] = '1'

    // set cached response headers
    Object.keys(headers).forEach(header => reply.header(header, headers[header]))

    // send cached payload
    req.cacheHit = true
    reply.send(await rparser.out(payload))
  })

  fastify.addHook('onSend', (request, reply, payload, next) => {
    const { req } = request

    // avoid double caching
    if (req.cacheHit) return next()

    if (reply.hasHeader(X_CACHE_EXPIRE)) {
      // support service level expiration
      const keysPattern = reply.getHeader(X_CACHE_EXPIRE)
      // delete keys on all cache tiers
      opts.stores.forEach(cache => getKeys(cache, keysPattern).then(keys => multiCache.del(keys)))
    } else if (reply.hasHeader(X_CACHE_TIMEOUT)) {
      // we need to cache response
      rparser.in(payload).then(payload => {
        multiCache.set(req.cacheKey, JSON.stringify({
          headers: reply[kReplyHeaders],
          payload
        }), {
          // @NOTE: cache-manager uses seconds as TTL unit
          // restrict to min value "1 second"
          ttl: Math.max(ms(reply.getHeader(X_CACHE_TIMEOUT)), 1000) / 1000
        })
      })
    }

    return next()
  })

  next()
}

const get = (cache, key) => new Promise((resolve) => {
  cache.getAndPassUp(key, (_, res) => {
    resolve(res)
  })
})

const getKeys = (cache, pattern) => new Promise((resolve) => {
  if (pattern.indexOf('*') > -1) {
    cache.keys((_, res) => resolve(matcher(res, [pattern])))
  } else resolve([pattern])
})

module.exports = fp(plugin)
