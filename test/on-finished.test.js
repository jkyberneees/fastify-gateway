/* global describe, it, beforeEach */

const onFinished = require('../src/plugins/on-finished')
const expect = require('chai').expect

describe('on-finished', () => {
  let data
  let res

  beforeEach((done) => {
    data = ''
    res = {
      statusCode: 200,
      getHeaders: () => {
        return {}
      },
      write: function (content) {
        if (content) data += content
      },
      end: function (content, encoding) {
        if (content) data += content
      }
    }

    done()
  })

  it('should accumulate string content', function (done) {
    onFinished(res, (payload) => {
      expect(payload.data).to.equal('hello world')
      expect(data).to.equal('hello world')
      done()
    })

    res.write(undefined)
    res.write('h')
    res.write(Buffer.from('ello'))
    res.write(' ')
    res.end('world')
  })

  it('should accumulate non-string content', function (done) {
    onFinished(res, (payload) => {
      expect(payload.data).to.equal(true)
      done()
    })

    res.end(true)

    // checks recursiveness is prevented
    res.end(true)
  })
})
