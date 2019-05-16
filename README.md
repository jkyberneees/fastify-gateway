# k-fastify-gateway
A Node.js API gateway that just works!

[![Build Status](https://travis-ci.org/jkyberneees/fastify-gateway.svg?branch=master)](https://travis-ci.org/jkyberneees/fastify-gateway)
[![NPM version](https://img.shields.io/npm/v/k-fastify-gateway.svg?style=flat)](https://www.npmjs.com/package/k-fastify-gateway) [![Greenkeeper badge](https://badges.greenkeeper.io/jkyberneees/fastify-gateway.svg)](https://greenkeeper.io/)  
Read more about it: https://medium.com/sharenowtech/k-fastify-gateway-a-node-js-api-gateway-that-you-control-e7388c229b21

## Get started in two steps

Install required dependencies:
```bash
npm i fastify k-fastify-gateway
```
> NOTE: From v2.x, `fastify-reply-from` is a direct dependency.

Launch your gateway 🔥:
```js
const fastify = require('fastify')({})

// required plugin for HTTP requests proxy
fastify.register(require('fastify-reply-from'))

// gateway plugin
fastify.register(require('k-fastify-gateway'), {

  middlewares: [
    require('cors')()
  ],

  routes: [{
    prefix: '/public',
    prefixRewrite: '',
    target: 'http://localhost:3000',
    middlewares: [],
    hooks: {
      // async onRequest (req, reply) {},
      // onResponse (req, reply, res) { reply.send(res) }
    }
  }, {
    prefix: '/admin',
    target: 'http://localhost:3001',
    middlewares: [
      require('basic-auth-connect')('admin', 's3cr3t-pass')
    ]
  }, {
    prefix: '/user',
    target: 'http://localhost:3001'
  }]
})

// start the gateway HTTP server
fastify.listen(8080).then((address) => {
  console.log(`API Gateway listening on ${address}`)
})
```

## Introduction

Node.js API Gateway plugin for the [fastify](https://fastify.io) [ecosystem](https://www.fastify.io/ecosystem/), a low footprint implementation that uses the [fastify-reply-from](https://github.com/fastify/fastify-reply-from) HTTP proxy library.  

Yeap, this is a super fast gateway implementation!

### Motivation

Creating fine grained REST microservices in Node.js is the [easy part](https://thenewstack.io/introducing-fastify-speedy-node-js-web-framework/), difficult is to correctly integrate them as one single solution afterwards!  

This gateway implementation is not only a classic HTTP proxy router, it is also a Node.js friendly `cross-cutting concerns` management solution. You don't have to:
 - repeat in/out middleware logic anymore (cors, authentication, authorization, caching, ...)
 - blame Node.js because the asynchronous post processing of proxied requests was hard to implement...
 - ...
 - or just learn Lua to extend nginx ;)

## Configuration options explained

```js
{
  // Optional global middlewares (https://www.fastify.io/docs/latest/Middlewares/). Default value: []
  middlewares: [],
  // Optional global value for routes "pathRegex". Default value: '/*'
  pathRegex: '/*',

  // HTTP proxy
  routes: [{
    // Optional path matching regex. Default value: '/*'
    // In order to disable the 'pathRegex' at all, you can use an empty string: ''
    pathRegex: '/*',
    // route prefix
    prefix: '/public',
    // Optional "prefix rewrite" before request is forwarded. Default value: ''
    prefixRewrite: '',
    // Optional body limit setting for fastify JSON body parser. Default value: 1048576 (1 MiB)
    bodyLimit: 1048576,
    // remote HTTP server URL to forward the request
    target: 'http://localhost:3000',
    // optional HTTP methods to limit the requests proxy to certain verbs only
    methods: ['GET', 'POST', ...], // any of supported HTTP methods: https://github.com/fastify/fastify/blob/master/docs/Routes.md#full-declaration
    // Optional route level middlewares. Default value: []
    middlewares: [],
    // Optional proxy lifecycle hooks. Default value: {}
    hooks: {
      async onRequest (req, reply) {
      //   // we can optionally reply from here if required
      //   reply.send('Hello World!')
      //
      //   return true // truthy value returned will abort the request forwarding
      },
      onResponse (req, reply, res) {  
        // do some post-processing here
        // ...
        // forward response to origin client once finished
        reply.send(res)
      }

      // other options allowed https://github.com/fastify/fastify-reply-from#replyfromsource-opts
    }
  }]
}
```
## Gateway level caching
### Why?
> Because `caching` is the last mile for low latency distributed systems!  

Enabling proper caching strategies at gateway level will drastically reduce the latency of your system,
as it reduces network round-trips and remote services processing.  
We are talking here about improvements in response times from `X ms` to `~2ms`, as an example.  

###  Setting up gateway cache
#### Single node cache (memory):
```js
// cache plugin setup
const gateway = require('fastify')({})
gateway.register(require('k-fastify-gateway/src/plugins/cache'), {})
```
> Recommended if there is only one gateway instance

#### Multi nodes cache (redis):
```js
// redis setup
const CacheManager = require('cache-manager')
const redisStore = require('cache-manager-ioredis')
const redisCache = CacheManager.caching({
  store: redisStore,
  db: 0,
  host: 'localhost',
  port: 6379,
  ttl: 30
})

// cache plugin setup
const gateway = require('fastify')({})
gateway.register(require('k-fastify-gateway/src/plugins/cache'), {
  stores: [redisCache]
})
```
> Required if there are more than one gateway instances

### Enabling cache for service endpoints
Although API Gateway level cache aims as a centralized cache for all services behind the wall, are the services
the ones who indicate the responses to be cached and for how long.  

Cache entries will be created for all remote responses coming with the `x-cache-timeout` header:
```js
res.setHeader('x-cache-timeout', '1 hour')
```
> Here we use the [`ms`](`https://www.npmjs.com/package/ms`) package to convert timeout to seconds. Please note that `millisecond` unit is not supported!  

Example on remote service using `restana`:
```js
service.get('/numbers', (req, res) => {
  res.setHeader('x-cache-timeout', '1 hour')

  res.send([
    1, 2, 3
  ])
})
```

### Invalidating cache
> Let's face it, gateway level cache invalidation was complex..., until now!  

Remote services can also expire cache entries on demand, i.e: when the data state changes. Here we use the `x-cache-expire` header to indicate the gateway cache entries to expire using a matching pattern:
```js
res.setHeader('x-cache-expire', '*/numbers')
```
> Here we use the [`matcher`](`https://www.npmjs.com/package/matcher`) package for matching patterns evaluation.

Example on remote service using `restana`:
```js
service.patch('/numbers', (req, res) => {
  res.setHeader('x-cache-expire', '*/numbers')

  // ...
  res.send(200)
})
```

### Custom cache keys
Cache keys are generated using: `req.method + req.url`, however, for indexing/segmenting requirements it makes sense to allow cache keys extensions.  
Unfortunately, this feature can't be implemented at remote service level, because the gateway needs to know the entire lookup key when a request
reaches the gateway.  

For doing this, we simply recommend using middlewares on the service configuration:
```js
routes: [{
  prefix: '/users',
  target: 'http://localhost:3000',
  middlewares: [(req, res, next) => {
    req.cacheAppendKey = (req) => req.user.id // here cache key will be: req.method + req.url + req.user.id
    return next()
  }]
}]
```
> In this example we also distinguish cache entries by `user.id`, very common case!

### Disable cache for custom endpoints
You can also disable cache checks for certain requests programmatically:
```js
routes: [{
  prefix: '/users',
  target: 'http://localhost:3000',
  middlewares: [(req, res, next) => {
    req.cacheDisabled = true
    return next()
  }]
}]
```

## Breaking changes
In `v2.x` the `hooks.onResponse` signature has changed from:
```js
onResponse (res, reply)
```
to:
```js
onResponse (req, reply, res)
```
> More details: https://github.com/fastify/fastify-reply-from/pull/43

## Benchmarks
`Version`: 2.0.1  
`Node`: 10.15.3  
`Machine`: MacBook Pro 2016, 2,7 GHz Intel Core i7, 16 GB 2133 MHz LPDDR3  
`Gateway processes`: 1  
`Service processes`: 1

```bash
Running 30s test @ http://127.0.0.1:8080/service/hi
  8 threads and 8 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency   841.58us  662.17us  35.22ms   98.66%
    Req/Sec     1.23k   130.62     1.29k    95.02%
  293897 requests in 30.10s, 42.60MB read
Requests/sec:   9763.61
Transfer/sec:      1.42MB
```

## Want to contribute?
This is your repo ;)  

> Note: We aim to be 100% code coverage, please consider it on your pull requests.

## Related projects
- middleware-if-unless (https://www.npmjs.com/package/middleware-if-unless)
