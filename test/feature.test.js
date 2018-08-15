/* global describe, it */
const Fastify = require('fastify')
const expect = require('chai').expect
const request = require('supertest')

const fastify = Fastify({
  logger: false
})
fastify.register(require('fastify-reply-from'))

let server

describe('API Gateway', () => {
  it('initialize', async () => {
    const gateway = require('./../index')(
      fastify,
      await require('./config-example')(fastify)
    )
    gateway.register()

    server = await fastify.listen(8080)
  })

  it('GET /users', async () => {
    await request(server)
      .get('/users/v1/welcome')
      .expect(200)
      .then((response) => {
        expect(response.text).to.equal('Hello World!')
      })
  })

  it('close', (done) => {
    fastify.close(done)
  })
})
