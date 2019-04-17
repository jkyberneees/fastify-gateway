module.exports = async () => {
  return {
    middlewares: [require('cors')()],

    routes: [{
      pathRegex: '',
      prefix: '/endpoint-proxy',
      prefixRewrite: '/endpoint-proxy',
      target: 'http://localhost:3000'
    }, {
      prefix: '/users',
      prefixRewrite: '',
      target: 'http://localhost:3000',
      hooks: {
        async onRequest (req, reply) {},

        // https://github.com/fastify/fastify-reply-from#replyfromsource-opts
        onResponse (req, reply, res) { reply.send(res) }
      }
    }, {
      prefix: '/users/proxy-aborted',
      prefixRewrite: '',
      target: 'http://localhost:5000',
      middlewares: [],
      hooks: {
        async onRequest (req, reply) {
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
      middlewares: [],
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
      prefix: '/endpoint-proxy-methods',
      prefixRewrite: '/endpoint-proxy-methods-put',
      target: 'http://localhost:3000',
      methods: ['PUT'],
      middlewares: [],
      hooks: {
      }
    }]
  }
}
