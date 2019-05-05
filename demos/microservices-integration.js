const PORT = process.env.PORT || 8080
const iu = require('middleware-if-unless')()

// gateway client
const gclient = require('axios').create({
  baseURL: `http://localhost:${PORT}`
})
const boom = require('boom')

// logger
const morgan = require('morgan')
morgan.token('cached', function (req, res) { return res.getHeader('x-cache-hit') === '1' ? '1' : '0' })

// GATEWAY
const gateway = require('fastify')({})
gateway.register(require('fastify-boom'))
gateway.register(require('fastify-reply-from'))
gateway.register(require('../src/plugins/cache'), {})
gateway.register(require('../index'), {
  middlewares: [
    morgan(':method :url :status :res[content-length] - :response-time ms - cache :cached')
  ],

  routes: [{
    prefix: '/user-api',
    target: 'http://localhost:3000'
  }, {
    prefix: '/task-api',
    target: 'http://localhost:3001',
    middlewares: [
      iu(async (req, res, next) => {
        try {
          await gclient.get(`/user-api/users/exist/${req.params.userId}`)
          next()
        } catch (err) {
          next(boom.notFound('Target user does not exist!'))
        }
      }).iff([
        {
          methods: ['POST'],
          url: '/tasks/assign/:taskId/:userId',
          updateParams: true
        }
      ])
    ]
  }]
})

gateway.listen(PORT).then((address) => {
  console.log(`API Gateway listening on ${address}`)
})

// USER SERVICE
const users = require('restana')({})
users
  .get('/users/exist/:userId', (req, res) => {
    res.setHeader('x-cache-timeout', '1 day')
    setTimeout(() => {
      if (req.params.userId !== '1') {
        return res.send(404)
      }

      res.send(200)
    }, 100)
  })
  .patch('/users/:userId', (req, res) => {
    res.setHeader('x-cache-expire', '*/users/*')
    // ...

    res.send(200)
  })
users.start(3000)

// TASK SERVICE
const tasks = require('restana')({})
tasks
  .post('/tasks/assign/:taskId/:userId', (req, res) => {
    res.send({
      taskId: req.params.taskId,
      userId: req.params.userId
    })
  })
tasks.start(3001)
