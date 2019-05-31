const fastify = require('fastify')({})
fastify.register(require('fastify-reply-from'))
fastify.register(require('./../index'), {

  middlewares: [
    require('cors')()
  ],

  routes: [{
    prefix: '/httpbin',
    target: 'https://httpbin.org'
  }]
})

fastify.listen(8080).then((address) => {
  console.log(`API Gateway listening on ${address}`)
})
