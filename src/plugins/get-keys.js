const matcher = require('matcher')

const getKeys = (cache, pattern) => new Promise((resolve) => {
  if (pattern.indexOf('*') > -1) {
    const args = [pattern, (_, res) => resolve(matcher(res, [pattern]))]
    if (cache.store.name !== 'redis') {
      args.shift()
    }

    cache.keys.apply(cache, args)
  } else resolve([pattern])
})

module.exports = getKeys
