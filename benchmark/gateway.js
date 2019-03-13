const fastify = require('fastify')({})
fastify.register(require('fastify-reply-from'))
fastify.register(require('..'), {

  middlewares: [
  ],

  routes: [{
    prefix: '/service',
    prefixRewrite: '',
    target: 'http://localhost:3000',
    middlewares: [],
    hooks: {
      // async onRequest (req, reply) {},
      // onResponse (res, reply) { reply.send(res) }
    }
  }]
})

fastify.listen(8080).then((address) => {
  console.log(`API Gateway listening on ${address}`)
})
