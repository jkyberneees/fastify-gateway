const fastify = require('fastify')({})
fastify.register(require('fastify-reply-from'))
fastify.register(require('..'), {

  routes: [{
    prefix: '/service',
    target: 'http://localhost:3000'
  }]
})

fastify.listen(8080).then((address) => {
  console.log(`API Gateway listening on ${address}`)
})
