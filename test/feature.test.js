/* global describe, it, setImmediate */
const Fastify = require('fastify')
const expect = require('chai').expect
const request = require('supertest')
const configValidate = require('./../src/config-validate')

const fastify = Fastify({
  logger: false
})

let gateway, remote

describe('API Gateway', () => {
  it('config validate should fail', function (done) {
    try {
      configValidate({})
    } catch (err) {
      expect(err.message).to.equal('Gateway configuration is invalid!')
      done()
    }
  })

  it('config validate success', async () => {
    const config = await require('./config-example')()
    configValidate(config)
  })

  it('initialize', async () => {
    // init gateway
    fastify.register(require('./../src/plugins/cache'), {})
    fastify.register(require('fastify-reply-from'))
    fastify.register(require('./../index'),
      await require('./config-example')()
    )
    gateway = await fastify.listen(8080)

    // init remote service
    remote = require('restana')({})
    remote.get('/endpoint-proxy', (req, res) => res.send({
      name: 'endpoint-proxy'
    }))
    remote.get('/info', (req, res) => res.send({
      name: 'fastify-gateway'
    }))
    remote.get('/cache', (req, res) => {
      res.setHeader('x-cache-timeout', '1 second')
      res.send({
        time: new Date().getTime()
      })
    })
    remote.get('/cache-expire', (req, res) => {
      res.setHeader('x-cache-expire', 'GET/users/cache')
      res.send({})
    })
    remote.get('/cache-expire-pattern', (req, res) => {
      res.setHeader('x-cache-expire', 'GET/users/*')
      res.send({})
    })
    remote.post('/204', (req, res) => res.send(204)) // https://github.com/jkyberneees/fastify-gateway/issues/11
    remote.get('/endpoint-proxy-methods', (req, res) => res.send({
      name: 'endpoint-proxy-methods'
    }))
    remote.put('/endpoint-proxy-methods-put', (req, res) => res.send({
      name: 'endpoint-proxy-methods-put'
    }))
    remote.post('/endpoint-proxy-methods', (req, res) => res.send({
      name: 'endpoint-proxy-methods'
    }))
    remote.post('/without-body-limit', (req, res) => res.send({
      name: 'endpoint-large-body'
    }))
    remote.post('/with-body-limit', (req, res) => res.send({
      name: 'endpoint-large-body'
    }))
    await remote.start(3000)
  })

  it('remote is proxied /users/response-time/204 - 204', async () => {
    await request(gateway)
      .post('/users/response-time/204')
      .expect(204)
  })

  it('(cors present) OPTIONS /users/response-time/info - 204', async () => {
    await request(gateway)
      .options('/users/response-time/info')
      .expect(204)
      .then((response) => {
        expect(response.header['access-control-allow-origin']).to.equal('*')
      })
  })

  it('(cors present) OPTIONS /users/info - 204', async () => {
    await request(gateway)
      .options('/users/info')
      .expect(204)
      .then((response) => {
        expect(response.header['access-control-allow-origin']).to.equal('*')
      })
  })

  it('(response-time not present) OPTIONS /users/info - 204', async () => {
    await request(gateway)
      .options('/users/info')
      .expect(204)
      .then((response) => {
        expect(response.header['x-response-time']).to.equal(undefined)
      })
  })

  it('(response-time present) GET /users/response-time/info - 200', async () => {
    await request(gateway)
      .get('/users/response-time/info')
      .expect(200)
      .then((response) => {
        expect(typeof response.header['x-response-time']).to.equal('string')
      })
  })

  it('(cache created 1) GET /users/cache - 200', async () => {
    await request(gateway)
      .get('/users/cache')
      .expect(200)
      .then((response) => {
        expect(response.headers['x-cache-hit']).to.equal(undefined)
        expect(typeof response.body.time).to.equal('number')
      })
  })

  it('(cache hit) GET /users/cache - 200', async () => {
    await request(gateway)
      .get('/users/cache')
      .expect(200)
      .then((response) => {
        expect(response.headers['x-cache-hit']).to.equal('1')
        expect(typeof response.body.time).to.equal('number')
      })
  })

  it('(cache expire) GET /users/cache-expire - 200', async () => {
    await request(gateway)
      .get('/users/cache-expire')
      .expect(200)
  })

  it('(cache created 2) GET /users/cache - 200', async () => {
    return request(gateway)
      .get('/users/cache')
      .expect(200)
      .then((response) => {
        expect(response.headers['x-cache-hit']).to.equal(undefined)
      })
  })

  it('(cache expire pattern) GET /users/cache-expire-pattern - 200', async () => {
    await request(gateway)
      .get('/users/cache-expire-pattern')
      .expect(200)
  })

  it('(cache created 3) GET /users/cache - 200', async () => {
    return request(gateway)
      .get('/users/cache')
      .expect(200)
      .then((response) => {
        expect(response.headers['x-cache-hit']).to.equal(undefined)
      })
  })

  it('GET /users/info - 200', async () => {
    await request(gateway)
      .get('/users/info')
      .expect(200)
      .then((response) => {
        expect(response.body.name).to.equal('fastify-gateway')
      })
  })

  it('GET /endpoint-proxy - 200', async () => {
    await request(gateway)
      .get('/endpoint-proxy')
      .expect(200)
      .then((response) => {
        expect(response.body.name).to.equal('endpoint-proxy')
      })
  })

  it('GET /endpoint-proxy-methods - 200', async () => {
    await request(gateway)
      .get('/endpoint-proxy-methods')
      .expect(200)
      .then((response) => {
        expect(response.body.name).to.equal('endpoint-proxy-methods')
      })
  })

  it('POST /endpoint-proxy-methods - 200', async () => {
    await request(gateway)
      .post('/endpoint-proxy-methods')
      .expect(200)
      .then((response) => {
        expect(response.body.name).to.equal('endpoint-proxy-methods')
      })
  })

  it('PUT /endpoint-proxy-methods - 404', async () => {
    await request(gateway)
      .put('/endpoint-proxy-methods')
      .expect(404)
  })

  it('PUT /endpoint-proxy-methods-put - 200', async () => {
    await request(gateway)
      .put('/endpoint-proxy-methods-put')
      .expect(200)
      .then((response) => {
        expect(response.body.name).to.equal('endpoint-proxy-methods-put')
      })
  })

  it('GET /endpoint-proxy-sdfsfsfsf - should fail with 404 because pathRegex=""', async () => {
    await request(gateway)
      .get('/endpoint-proxy-sdfsfsfsf')
      .expect(404)
  })

  it('(aggregation cache created) GET /users/proxy-aborted/info - 200', async () => {
    await request(gateway)
      .get('/users/proxy-aborted/info')
      .expect(200)
      .then((response) => {
        expect(response.text).to.equal('Hello World!')
      })
  })

  it('(aggregation cache hit) GET /users/proxy-aborted/info - 200', async () => {
    await request(gateway)
      .get('/users/proxy-aborted/info')
      .expect(200)
      .then((response) => {
        expect(response.text).to.equal('Hello World!')
        expect(response.headers['x-cache-hit']).to.equal('1')
      })
  })

  it('(aggregation cache created after expire) GET /users/proxy-aborted/info - 200', (done) => {
    setTimeout(() => {
      request(gateway)
        .get('/users/proxy-aborted/info')
        .expect(200)
        .then((response) => {
          expect(response.text).to.equal('Hello World!')
          expect(response.headers['x-cache-hit']).to.equal(undefined)
          done()
        })
    }, 1100)
  })

  it('POST /users/info - 404', async () => {
    await request(gateway)
      .post('/users/find')
      .expect(404)
  })

  it('(hooks) GET /users/response-time/info - 200', async () => {
    await request(gateway)
      .get('/users/response-time/info')
      .expect(200)
      .then((response) => {
        expect(response.header['post-processed']).to.equal('true')
      })
  })

  it('(hooks) GET /users/on-request-error/info - 500', async () => {
    await request(gateway)
      .get('/users/on-request-error/info')
      .expect(500)
      .then((response) => {
        expect(response.body.message).to.equal('ups, pre-processing error...')
      })
  })

  it('(default bodyLimit 1 MB, posting body with 26 KB) POST /without-body-limit - 200', async () => {
    await request(gateway)
      .post('/without-body-limit')
      .send({ array: new Uint8Array(1024 * 3) })
      .expect(200)
  })

  it('(bodyLimit set to 25 KB, posting body with 26 KB) POST /with-body-limit - 413', async () => {
    await request(gateway)
      .post('/with-body-limit')
      .send({ array: new Uint8Array(1024 * 3) })
      .expect(413)
  })

  it('close', async () => {
    await remote.close()
    await fastify.close()
  })
})
