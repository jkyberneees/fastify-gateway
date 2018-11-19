const configValidate = require('./src/config-validate')
const fp = require('fastify-plugin')

function gateway (fastify, opts, next) {
  configValidate(opts)

  // registering global middlewares
  opts.middlewares.forEach(middleware => {
    fastify.use(middleware)
  })

  opts.routes.forEach(route => {
    // registering routes level middlewares
    route.middlewares.forEach(middleware => {
      fastify.use(route.prefix, middleware)
    })

    // populating required NOOPS
    route.hooks.onRequest = route.hooks.onRequest || (async (req, reply) => { })
    route.hooks.onResponse = route.hooks.onResponse || ((res, reply) => reply.send(res))

    // registering route handler
    fastify.all(route.prefix + (route.pathRegex || '/*'), (request, reply) => {
      request.req.url = request.req.url.replace(route.prefix, route.prefixRewrite)
      route.hooks.onRequest(request, reply).then(shouldAbortProxy => {
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

  next()
}

module.exports = fp(gateway)
