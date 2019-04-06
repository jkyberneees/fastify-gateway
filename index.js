const configValidate = require('./src/config-validate')
const fp = require('fastify-plugin')

const proxy = route => (request, reply) => {
  request.req.url = request.req.url.replace(route.prefix, route.prefixRewrite)
  route.hooks.onRequest(request, reply).then(shouldAbortProxy => {
    // check if request proxy to remote should be aborted
    if (!shouldAbortProxy) {
      reply.from(route.target + request.req.url, Object.assign({}, route.hooks))
    }
  }).catch(err => {
    reply.send(err)
  })
}

const gateway = (fastify, opts, next) => {
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
    route.hooks.onResponse = route.hooks.onResponse || ((req, reply, res) => reply.send(res))

    // populating pathRegex if missing
    route.pathRegex = undefined === route.pathRegex ? '/*' : String(route.pathRegex)

    // registering route handler
    route.methods
      ? fastify.route({ method: route.methods, url: route.prefix + route.pathRegex, handler: proxy(route) })
      : fastify.all(route.prefix + route.pathRegex, proxy(route))
  })

  next()
}

module.exports = fp(gateway)
