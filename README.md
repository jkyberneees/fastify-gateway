# k-fastify-gateway
A Node.js API gateway that just works!

[![Build Status](https://travis-ci.org/jkyberneees/fastify-gateway.svg?branch=master)](https://travis-ci.org/jkyberneees/fastify-gateway)
[![NPM version](https://img.shields.io/npm/v/k-fastify-gateway.svg?style=flat)](https://www.npmjs.com/package/k-fastify-gateway) [![Greenkeeper badge](https://badges.greenkeeper.io/jkyberneees/fastify-gateway.svg)](https://greenkeeper.io/)

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
  // global middlewares (https://www.fastify.io/docs/latest/Middlewares/)
  middlewares: [],

  // HTTP proxy
  routes: [{
    // Optional path matching regex. Default value: '/*'
    // In order to disable the 'pathRegex' at all, you can use an empty string: ''
    pathRegex: '/*'
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
### Breaking changes
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