/* global describe, it */

const getKeys = require('../src/plugins/get-keys')
const expect = require('chai').expect

describe('get-keys', () => {
  const pattern = '*/numbers'
  const redisCache = {
    store: { name: 'redis' },
    keys: (pattern, callback) => {
      if (!pattern) throw new Error('pattern is missing')
      return callback(null, ['GET/numbers'])
    }
  }

  const memoryCache = {
    store: { name: 'memory' },
    keys: (callback) => {
      return callback(null, ['GET/numbers'])
    }
  }

  it('should retrieve redis keys', function (done) {
    getKeys(redisCache, pattern).then(keys => {
      expect(keys.includes('GET/numbers')).to.equal(true)
      done()
    })
  })

  it('should retrieve memory keys', function (done) {
    getKeys(memoryCache, pattern).then(keys => {
      expect(keys.includes('GET/numbers')).to.equal(true)
      done()
    })
  })
})
