const toArray = require('stream-to-array')

const gateway = require('fastify')({})
gateway.register(require('fastify-reply-from'))
gateway.register(require('..'), {

  routes: [{
    prefix: '/api',
    prefixRewrite: '',
    target: 'http://localhost:3000',
    middlewares: [],
    hooks: {
      async onResponse (req, reply, res) {
        const resBuffer = Buffer.concat(await toArray(res))

        const payload = JSON.parse(resBuffer.toString())
        payload.newProperty = 'new value'

        reply.header('Content-Length', 0).send(payload)
      }
    }
  }]
})

gateway.listen(8080).then((address) => {
  console.log(`API Gateway listening on ${address}`)
})

const service = require('restana')({})
service.get('/info', (req, res) => res.send({
  name: 'fastify-gateway'
}))
service.start(3000).then(() => {
  console.log(`Remote service listening on port 3000`)
})
