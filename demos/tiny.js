const gateway = require('fastify')({})
gateway.register(require('fastify-reply-from'))
gateway.register(require('./../index'), {

  routes: [{
    prefix: '/users',
    target: 'http://users-api.develop:3000'
  }]
})

gateway.listen(8080)
