const configValidate = require('./src/config-validate')
const fp = require('fastify-plugin')

const proxy = route => async (request, reply) => {
  try {
    request.req.url = request.req.url.replace(route.prefix, route.prefixRewrite)
    const shouldAbortProxy = await route.hooks.onRequest(request, reply)
    if (!shouldAbortProxy) {
      reply.from(route.target + request.req.url, Object.assign({}, route.hooks))
    }
  } catch (err) {
    reply.send(err)
  }
}

const plugin = (fastify, opts, next) => {
  opts = Object.assign({
    middlewares: [],
    pathRegex: '/*'
  }, opts)
  configValidate(opts)

  // registering global middlewares
  opts.middlewares.forEach(middleware => {
    fastify.use(middleware)
  })

  opts.routes.forEach(route => {
    if (undefined === route.prefixRewrite) {
      route.prefixRewrite = ''
    }

    // registering routes level middlewares
    if (route.middlewares) {
      route.middlewares.forEach(middleware => {
        fastify.use(route.prefix, middleware)
      })
    }

    // populating required NOOPS
    route.hooks = route.hooks || {}
    route.hooks.onRequest = route.hooks.onRequest || (async (req, reply) => { })
    route.hooks.onResponse = route.hooks.onResponse || ((req, reply, res) => reply.send(res))

    // populating pathRegex if missing
    route.pathRegex = undefined === route.pathRegex ? opts.pathRegex : String(route.pathRegex)
    bodyLimit = (route.bodyLimit) ? {  bodyLimit: route.bodyLimit } : null;
    // registering route handler
    route.methods
      ? fastify.route({ method: route.methods, ...bodyLimit, url: route.prefix + route.pathRegex, handler: proxy(route) })
      : fastify.all(route.prefix + route.pathRegex, proxy(route))
  })

  next()
}

module.exports = fp(plugin)
