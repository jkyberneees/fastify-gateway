const fastify = require('fastify')({})
fastify.register(require('fastify-reply-from'))
fastify.register(require('./../index'), {

  middlewares: [
    require('cors')(),
    require('helmet')()
  ],

  routes: [{
    prefix: '/public',
    target: 'http://localhost:3000',
    middlewares: []
  }, {
    prefix: '/admin',
    target: 'http://localhost:3001',
    middlewares: [
      require('express-jwt')({ secret: 'shhhhhhared-secret' })
    ]
  }]
})

fastify.listen(8080).then((address) => {
  console.log(`API Gateway listening on ${address}`)
})
