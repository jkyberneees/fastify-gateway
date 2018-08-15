module.exports = async (proxy) => {
  return {
    middlewares: [],

    routes: [{
      prefix: '/users',
      prefixRewrite: '',
      target: 'http://localhost:3000',
      middlewares: [],
      hooks: {
        onRequest: async (req, reply) => {},

        // https://github.com/fastify/fastify-reply-from#replyfromsource-opts
        onResponse: (res, reply) => reply.send(res) // NOTE: reply function is available here
      }
    }]
  }
}
