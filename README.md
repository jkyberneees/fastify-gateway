# k-fastify-gateway
A Node.js API gateway that just works!

[![Build Status](https://travis-ci.org/jkyberneees/fastify-gateway.svg?branch=master)](https://travis-ci.org/jkyberneees/fastify-gateway)
[![NPM version](https://img.shields.io/npm/v/k-fastify-gateway.svg?style=flat)](https://www.npmjs.com/package/k-fastify-gateway) [![Greenkeeper badge](https://badges.greenkeeper.io/jkyberneees/fastify-gateway.svg)](https://greenkeeper.io/)

## Get started in two steps

Install required dependencies:
```bash
npm i fastify fastify-reply-from k-fastify-gateway
```

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
      // onResponse (res, reply) { reply.send(res) }
    }
  }, {
    prefix: '/admin',
    prefixRewrite: '',
    target: 'http://localhost:3001',
    middlewares: [
      require('basic-auth-connect')('admin', 's3cr3t-pass')
    ],
    hooks: {
    }
  }]
})

// start the gateway HTTP server
fastify.listen(8080).then((address) => {
  console.log(`API Gateway listening on ${address}`)
})
```

## Introduction

Node.js API Gateway plugin implementation for the [fastify](https://fastify.io) ecosystem, a low footprint plugin implementation that uses the [fastify-reply-from](https://github.com/fastify/fastify-reply-from) HTTP proxy library.  

Yeap, this is a super fast gateway implementation!

### Motivation

Creating fine graned REST microservices in Node.js is the [easy part](https://thenewstack.io/introducing-fastify-speedy-node-js-web-framework/), difficult is to correctly integrate them as one single solution afterwards!  

This gateway implementation is not only a classic HTTP proxy router, it is also a Node.js frienly `cross-cutting concerns` management solution. You don't have to: 
 - repeat in/out middleware logic anymore (cors, authentication, authorization, caching, ...)
 - blame Node.js because the asynchronous post processing of proxied requests was hard to implement...
 - ...
 - or just learn Lua to extend nginx ;)

## Configuration options explained

```js 
{
  // global middlewares (https://www.fastify.io/docs/latest/Middlewares/)
  middlewares: [],

  // HTTP proxy
  routes: [{
    // route prefix
    prefix: '/public',
    // prefix rewrite before request is forwarded
    prefixRewrite: '',
    // remote HTTP server URL to forward the request
    target: 'http://localhost:3000',
    // route level middlewares
    middlewares: [],
    // proxy lifecycle hooks
    hooks: {
      async onRequest (req, reply) {
      //   // we can optionally reply from here if required
      //   reply.send('Hello World!')
      //
      //   return true // truthy value returned will abort the request forwarding
      },
      onResponse (res, reply) {
        // do some post-processing here
        // ...
        // forward response to origin client
        reply.send(res) 
      }

      // other options allowed https://github.com/fastify/fastify-reply-from#replyfromsource-opts
    }
  }]
}
```

