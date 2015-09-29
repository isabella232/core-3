
var util = require('util')
var config = require('./lib/config')
  , utils = require('./lib/utils')
var HTTPDuplex = require('http-duplex')

util.inherits(Request, HTTPDuplex)


function Request (protocol) {
  HTTPDuplex.call(this, protocol)
}

function request (_options) {
  var options = config.init(_options)
  var req = new Request(options.protocol)
  req.on('response', function (res) {
    utils.response(res)
  })

  if (options.redirect) {
    var redirect = require('redirect')
    redirect(req, options)
  }

  if (options.gzip) {
    var type = typeof options.gzip
      , gzip
    if (type === 'boolean' || type === 'string') {
      gzip = require('gzip')
    }
    else if (type === 'function') {
      gzip = options.gzip
    }
    else {
      throw new Error('gzip should be boolean, string or a function')
    }
    gzip(req, options)
  }
  if (options.encoding && options.encoding !== 'binary') {
    var type = typeof options.encoding
      , encoding
    if (type === 'boolean' || type === 'string') {
      encoding = require('encoding')
    }
    else if (type === 'function') {
      encoding = options.encoding
    }
    else {
      throw new Error('encoding should be boolean, string or a function')
    }
    encoding(req, options)
  }

  if (options.multipart) {
    var multipart = require('multipart')
    multipart(req, options)
  }

  if (options.callback) {
    if (typeof options.callback === 'function') {
      var callback = require('callback')
      callback(req, options)
    }
    else {
      throw new Error('calback should be a function')
    }
  }

  if (options.qs) {
    var qs = require('_qs')
    qs(req, options)
  }
  if (options.form) {
    var form = require('form')
    form(req, options)
  }
  if (options.json) {
    var json = require('json')
    json(req, options)
  }

  if (process.env.DEBUG) {
    var log = require('log')
    log(req)
  }

  req.once('init', init)
  process.nextTick(init)

  function init () {
    if (req._initialized) return

    if (options.contentLength) {
      var contentLength = require('content-length')
      contentLength(req, options, function (length) {
        if (length) {
          options.headers.set('content-length', length)
        }
        _init()
      })
    }
    else {
      _init()
    }

    function _init () {
      if (options.headers.get('content-length') === undefined) {
        options.headers.set('transfer-encoding', 'chunked')
      }

      if (options.auth || options.oauth || options.hawk || options.httpSignature || options.aws) {
        var auth = require('auth')
        auth(req, options)
      }

      req.init(utils.filter(options))

      if (options.body) {
        var body = require('body')
        body(req, options)
      }

      if (options.end) {
        var end = require('end')
        end(req, options)
      }
    }
  }

  return req
}

module.exports = request
request.Request = Request
