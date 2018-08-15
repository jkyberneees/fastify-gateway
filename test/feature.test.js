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
    require('./../index')(
      fastify,
      await require('./config-example')(fastify)
    ).register()
    gateway = await fastify.listen(8080)

    // init remote
    remote = require('restana')({})
    remote.get('/info', (req, res) => {
      res.send({
        name: 'fastify-gateway'
      })
    })
    await remote.start()
  })

  it('GET /users', async () => {
    await request(gateway)
      .get('/users/info')
      .expect(200)
      .then((response) => {
        expect(response.body.name).to.equal('fastify-gateway')
      })
  })

  it('close', async () => {
    await remote.close()
    await fastify.close()
  })
})
