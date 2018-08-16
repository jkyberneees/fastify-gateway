/* global describe, it */
const Fastify = require('fastify')
const expect = require('chai').expect
const request = require('supertest')

const fastify = Fastify({
  logger: false
})
fastify.register(require('fastify-reply-from'))

let gateway, remote

describe('API Gateway', () => {
  it('initialize', async () => {
    // init gateway
    fastify.register(require('./../index'),
      await require('./config-example')()
    )
    gateway = await fastify.listen(8080)

    // init remote service
    remote = require('restana')({})
    remote.get('/info', (req, res) => res.send({
      name: 'fastify-gateway'
    }))
    await remote.start(3000)
  })

  it('(cors) OPTIONS /users/info - 204', async () => {
    await request(gateway)
      .options('/users/info')
      .expect(204)
      .then((response) => {
        expect(response.header['access-control-allow-origin']).to.equal('*')
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

  it('POST /users/info - 404', async () => {
    await request(gateway)
      .post('/users/find')
      .expect(404)
  })

  it('close', async () => {
    await remote.close()
    await fastify.close()
  })
})
