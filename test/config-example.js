module.exports = async () => {
  return {
    middlewares: [require('cors')()],

    routes: [{
      pathRegex: '',
      prefix: '/endpoint-proxy',
      prefixRewrite: '/endpoint-proxy',
      target: 'http://localhost:3000',
      middlewares: [],
      hooks: {
      }
    }, {
      prefix: '/users',
      prefixRewrite: '',
      target: 'http://localhost:3000',
      middlewares: [],
      hooks: {
        async onRequest (req, reply) {},

        // https://github.com/fastify/fastify-reply-from#replyfromsource-opts
        onResponse (res, reply) { reply.send(res) } // NOTE: reply function is available here
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
      prefixRewrite: '',
      target: 'http://localhost:3000',
      middlewares: [],
      hooks: {
        async onRequest (req, reply) {
          throw new Error('ups, pre-processing error...')
        }
      }
    }]
  }
}
