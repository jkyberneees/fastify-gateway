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
    stores: [CacheManager.caching({ store: 'memory', max: 1000, ttl: 10 })]
  }, opts)
  // creating multi-cache instance
  const mcache = CacheManager.multiCaching(opts.stores)

  fastify.addHook('preHandler', async (request, reply, next) => {
    const { req } = request
    let { url: key, cacheAppendKey = req => '' } = req
    cacheAppendKey = await cacheAppendKey(req)

    key = key + cacheAppendKey
    // ref cache key on req object
    req.cacheKey = key
    const cached = await get(mcache, key)
    if (!cached) return next()

    // respond from cache if there is a hit
    const { headers, payload } = JSON.parse(cached)
    headers[X_CACHE_HIT] = '1'

    // set cached response headers
    Object.keys(headers).forEach(header => reply.header(header, headers[header]))

    // send cached payload
    reply.send(await rparser.out(payload))
  })

  fastify.addHook('onSend', (request, reply, payload, next) => {
    if (reply.hasHeader(X_CACHE_EXPIRE)) {
      // support service level expiration
      const keysPattern = reply.getHeader(X_CACHE_EXPIRE)
      for (let cache of opts.stores) {
        getKeys(cache, keysPattern)
          .then(keys => {
            keys.forEach(key => mcache.del(key))
          })
      }
    } else if (reply.hasHeader(X_CACHE_TIMEOUT)) {
      const { req } = request
      // we need to cache response
      rparser.in(payload).then(payload => {
        mcache.set(req.cacheKey, JSON.stringify({
          headers: reply[kReplyHeaders],
          payload
        }), {
          ttl: Math.max(ms(reply.getHeader(X_CACHE_TIMEOUT)), 1000) / 1000 // restrict to min value "1 second"
        })
      })
    }

    return next()
  })

  next()
}

const get = (cache, key) => new Promise((resolve, reject) => {
  cache.get(key, (_, res) => {
    resolve(res)
  })
})

const getKeys = (cache, pattern) => new Promise((resolve, reject) => {
  if (pattern.indexOf('*') > -1) {
    cache.keys((_, res) => {
      const matches = matcher(res, [pattern])
      resolve(matches)
    })
  } else resolve([pattern])
})

module.exports = fp(plugin)
