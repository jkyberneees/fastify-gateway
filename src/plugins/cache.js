const fp = require('fastify-plugin')
const CacheManager = require('cache-manager')
const ms = require('ms')
const onFinished = require('./on-finished')
const getKeys = require('./get-keys')

const X_CACHE_EXPIRE = 'x-cache-expire'
const X_CACHE_TIMEOUT = 'x-cache-timeout'
const X_CACHE_HIT = 'x-cache-hit'

const plugin = (fastify, opts, next) => {
  opts = Object.assign({
    stores: [CacheManager.caching({ store: 'memory', max: 1000, ttl: 30 })]
  }, opts)

  // creating multi-cache instance
  const multiCache = CacheManager.multiCaching(opts.stores)

  fastify.addHook('onRequest', (request, reply, next) => {
    const { res } = reply
    const { req } = request

    onFinished(res, (payload) => {
      // avoid double caching
      if (req.cacheHit) return

      if (payload.headers[X_CACHE_EXPIRE]) {
        // support service level expiration
        const keysPattern = payload.headers[X_CACHE_EXPIRE]
        // delete keys on all cache tiers
        opts.stores.forEach(cache => getKeys(cache, keysPattern).then(keys => multiCache.del(keys)))
      } else if (payload.headers[X_CACHE_TIMEOUT]) {
        // we need to cache response
        multiCache.set(req.cacheKey, JSON.stringify(payload), {
          // @NOTE: cache-manager uses seconds as TTL unit
          // restrict to min value "1 second"
          ttl: Math.max(ms(payload.headers[X_CACHE_TIMEOUT]), 1000) / 1000
        })
      }
    })

    return next()
  })

  fastify.addHook('preHandler', async (request, reply) => {
    const { req } = request
    if (req.cacheDisabled) return

    let { url: key, cacheAppendKey = req => '' } = req
    cacheAppendKey = await cacheAppendKey(req)

    key = req.method + key + cacheAppendKey
    // ref cache key on req object
    req.cacheKey = key
    const cached = await get(multiCache, key)
    if (!cached) return

    // respond from cache if there is a hit
    let { status, headers, data } = JSON.parse(cached)
    if (typeof data === 'object' && data.type === 'Buffer') {
      data = Buffer.from(data.data)
    }
    headers[X_CACHE_HIT] = '1'

    // set cached response headers
    Object.keys(headers).forEach(header => reply.header(header, headers[header]))

    // send cached payload
    req.cacheHit = true
    reply.code(status).send(data)
  })

  return next()
}

const get = (cache, key) => new Promise((resolve) => {
  cache.getAndPassUp(key, (_, res) => {
    resolve(res)
  })
})

module.exports = fp(plugin)
