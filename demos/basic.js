const fastify = require('fastify')({})
fastify.register(require('fastify-reply-from'))
fastify.register(require('..'), {

  middlewares: [
    require('cors')()
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
      require('basic-auth-connect')('admin', 's3cr3t-pass')
    ],
    hooks: {
    }
  }]
})

fastify.listen(8080).then((address) => {
  console.log(`API Gateway listening on ${address}`)
})
