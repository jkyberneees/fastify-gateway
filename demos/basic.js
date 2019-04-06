const fastify = require('fastify')({})
fastify.register(require('fastify-reply-from'))
fastify.register(require('..'), {

  middlewares: [
    require('cors')(),
    require('helmet')()
  ],

  routes: [{
    prefix: '/public',
    prefixRewrite: '',
    target: 'http://localhost:3000',
    middlewares: [],
    hooks: {
      // async onRequest (req, reply) {},
      // onResponse (res, reply) { reply.send(res) }
    }
  }, {
    prefix: '/admin',
    prefixRewrite: '',
    target: 'http://localhost:3001',
    middlewares: [
      require('express-jwt')({ secret: 'shhhhhhared-secret' })
    ],
    hooks: {
    }
  }]
})

fastify.listen(8080).then((address) => {
  console.log(`API Gateway listening on ${address}`)
})
