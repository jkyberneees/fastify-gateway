// inspired on https://github.com/kwhitley/apicache/blob/master/src/apicache.js

module.exports = (res, cb) => {
  res._parent = {
    write: res.write,
    end: res.end,
    content: undefined
  }

  res.write = function (content) {
    accumulate(res, content)
    return res._parent.write.apply(res, arguments)
  }

  res.end = function (content, encoding) {
    accumulate(res, content)
    const headers = res._headers
    const payload = map(res.statusCode, headers, res._parent.content, encoding)

    setImmediate(() => {
      cb(payload)
    })

    return res._parent.end.apply(res, arguments)
  }
}

function map (status, headers, data, encoding) {
  return {
    status: status,
    headers: headers,
    data: data,
    encoding: encoding
  }
}

function accumulate (res, content) {
  if (content) {
    if (typeof (content) === 'string') {
      res._parent.content = (res._parent.content || '') + content
    } else if (Buffer.isBuffer(content)) {
      let oldContent = res._parent.content

      if (typeof oldContent === 'string') {
        oldContent = Buffer.from(oldContent)
      }
      if (!oldContent) {
        oldContent = Buffer.alloc(0)
      }

      res._parent.content = Buffer.concat([oldContent, content], oldContent.length + content.length)
    } else {
      res._parent.content = content
    }
  }
}
