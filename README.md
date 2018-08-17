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
fastify.register(require('fastify-reply-from'))
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

fastify.listen(8080).then((address) => {
  console.log(`API Gateway listening on ${address}`)
})
```

## WIP