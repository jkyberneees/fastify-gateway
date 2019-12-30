const fastify = require('fastify')({})
fastify.register(require('fastify-reply-from'))
fastify.register(require('./../index'), {

  routes: [{
    pathRegex: '',
    prefix: '/user/:id/details',
    methods: ['GET'],
    target: 'http://localhost:3000',
    hooks: {
      async onRequest ({ req, params }, reply) {
        req.url = `/userdetails/${params.id}`
      }
    }
  }]
})

fastify.listen(8080).then((address) => {
  console.log('Gateway endpoint: http://localhost:8080/user/1/details is mapped as -> http://localhost:3000/userdetails/:id')
})

const remote = require('restana')({})
remote.get('/userdetails/:id', (req, res) => res.send({
  name: 'k-fastify-gateway',
  id: req.params.id
}))
remote.start(3000)
