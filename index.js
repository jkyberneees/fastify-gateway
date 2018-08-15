const configValidate = require('./src/config-validate')

module.exports = (fastify, config) => {
  configValidate(config)

  return {
    register: () => {
      // registering global middlewares
      config.middlewares.forEach(middleware => {
        fastify.use(middleware)
      })

      config.routes.forEach(route => {
        // registering routes level middlewares
        route.middlewares.forEach(middleware => {
          fastify.use(route.prefix, middleware)
        })

        // populating required NOOPS
        route.hooks = route.hooks || {}
        route.hooks.onRequest = route.hooks.onRequest || (async (req, reply) => { })
        route.hooks.onResponse = route.hooks.onResponse || ((res, reply) => reply.send(res))

        // registering route handler
        fastify.all(route.prefix + '/*', (request, reply) => {
          request.req.url = request.req.url.replace(route.prefix, route.prefixRewrite)
          route.hooks.onRequest(request).then(shouldAbortProxy => {
            // check if request proxy to remote should be aborted
            if (!shouldAbortProxy) {
              reply.from(route.target + request.req.url, Object.assign({}, route.hooks, {
                // override onResponse hook to pass the "reply" object
                onResponse: (res) => route.hooks.onResponse(res, reply)
              }))
            }
          }).catch(err => {
            reply.send(err)
          })
        })
      })
    }
  }
}
