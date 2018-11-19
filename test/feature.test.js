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
    await remote.start(3000)
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

  it('GET /users/info - 200', async () => {
    await request(gateway)
      .get('/users/info')
      .expect(200)
      .then((response) => {
        expect(response.body.name).to.equal('fastify-gateway')
      })
  })

  it('GET /endpoint-proxy - 404', async () => {
    await request(gateway)
      .get('/endpoint-proxy')
      .expect(200)
      .then((response) => {
        expect(response.body.name).to.equal('endpoint-proxy')
      })
  })

  it('GET /users/proxy-aborted/info - 200', async () => {
    await request(gateway)
      .get('/users/proxy-aborted/info')
      .expect(200)
      .then((response) => {
        expect(response.text).to.equal('Hello World!')
      })
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

  it('close', async () => {
    await remote.close()
    await fastify.close()
  })
})
