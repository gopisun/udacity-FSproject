
import http from 'http'
import app from './server'

// http = require('http')
// app = require('./server')

const server = http.createServer(app)
let currentApp = app
server.listen(3000)
/*
server.listen(3001)
server.listen(3002)
server.listen(3003)
server.listen(3004)
server.listen(3005)
server.listen(3006)
server.listen(3007)
server.listen(3008)
server.listen(3009)
server.listen(3010)
server.listen(3011)
*/

if (module.hot) {
 module.hot.accept('./server', () => {
  server.removeListener('request', currentApp)
  server.on('request', app)
  currentApp = app
 })
}
