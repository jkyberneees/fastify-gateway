module.exports = async () => {
  return {
    middlewares: [require('cors')()],

    routes: [{
      pathRegex: '',
      prefix: '/endpoint-proxy',
      prefixRewrite: '/endpoint-proxy',
      target: 'http://localhost:3000',
      middlewares: [(req, res, next) => {
        req.cacheDisabled = true

        return next()
      }],
      hooks: {
        async onRequest (req, reply) {},

        // https://github.com/fastify/fastify-reply-from#replyfromsource-opts
        onResponse (req, reply, res) { reply.send(res) }
      }
    }, {
      prefix: '/users',
      target: 'http://localhost:3000'
    }, {
      prefix: '/users/proxy-aborted',
      target: 'http://localhost:5000',
      hooks: {
        async onRequest (req, reply) {
          reply.header('x-cache-timeout', '1 second')
          reply.code(200).send('Hello World!')

          return true
        }
      }
    }, {
      prefix: '/users/response-time',
      prefixRewrite: '',
      target: 'http://localhost:3000',
      middlewares: [require('response-time')()],
      hooks: {
        rewriteHeaders (headers) {
          headers['post-processed'] = true

          return headers
        }
      }
    }, {
      prefix: '/users/on-request-error',
      target: 'http://localhost:3000',
      hooks: {
        async onRequest (req, reply) {
          throw new Error('ups, pre-processing error...')
        }
      }
    },
    {
      pathRegex: '',
      prefix: '/endpoint-proxy-methods',
      prefixRewrite: '/endpoint-proxy-methods',
      target: 'http://localhost:3000',
      methods: ['GET', 'POST']
    },
    {
      pathRegex: '',
      prefix: '/endpoint-proxy-methods-put',
      prefixRewrite: '/endpoint-proxy-methods-put',
      target: 'http://localhost:3000',
      methods: ['PUT']
    },
    {
      pathRegex: '',
      prefix: '/without-body-limit',
      prefixRewrite: '/without-body-limit',
      target: 'http://localhost:3000',
      methods: ['POST']
    },
    {
      pathRegex: '',
      prefix: '/with-body-limit',
      prefixRewrite: '/with-body-limit',
      target: 'http://localhost:3000',
      bodyLimit: 25600,
      methods: ['POST']
    }]
  }
}
