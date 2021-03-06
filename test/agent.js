
var fs = require('fs')
  , path = require('path')
  , http = require('http')
  , zlib = require('zlib')
var should = require('should')
  , debug = require('debug')
  , bl = require('bl')
var request = require('@request/client')

var image0 = path.join(__dirname, './fixtures/cat0.png')
  , image1 = path.join(__dirname, './fixtures/cat1.png')
  , image2 = path.join(__dirname, './fixtures/cat2.png')
var tmp = path.join(__dirname, './tmp/cat.png')

console.server = debug('server')
console.client = debug('client')


describe('- agent', function () {

  describe('', function () {
    var server
    before(function (done) {
      server = http.createServer()
      server.on('request', function (req, res) {
        console.server(req.headers)
        var buffer = bl()
        req.on('data', function (chunk) {
          console.server('data')
          buffer.append(chunk)
        })
        req.on('end', function () {
          res.writeHead(200, {})
          res.end(buffer.slice())
        })
      })
      server.listen(6767, done)
    })

    it('0', function (done) {
      var input = fs.createReadStream(image2, {highWaterMark: 1024})

      var agent = new http.Agent({
        keepAlive: true,
        keepAliveMsecs: 5000,
        maxSockets: 1
      })

      var req = request({
        method: 'POST',
        url: 'http://localhost:6767',
        agent: agent,
        encoding: 'binary',
        end: false,
        callback: function (err, res, body) {
          fs.writeFileSync(tmp, body)
          var stats = fs.statSync(tmp)
          stats.size.should.equal(22025)
          agent.destroy()
          done()
        }
      })

      input.on('data', function (chunk) {
        input.pause()
        setTimeout(function () {
          req.write(chunk)
          input.resume()
        }, 0)
      })
      input.on('end', function () {
        setTimeout(function () {
          req.end()
        }, 0)
      })
    })

    after(function (done) {
      server.close(done)
    })
  })
})
