const http = require('http')
const url = require('url')

const PORT = 18081

// 存储消息记录
const messageLog = []
let requestCounter = 0

const server = http.createServer((req, res) => {
  requestCounter++
  const parsedUrl = url.parse(req.url, true)
  const pathname = parsedUrl.pathname
  const query = parsedUrl.query
  const method = req.method

  console.log(`[HTTP] 收到请求 - ${method} ${pathname}`)
  if (Object.keys(query).length > 0) {
    console.log(`[HTTP]   查询参数: ${JSON.stringify(query)}`)
  }

  // 设置CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  // OPTIONS 预检请求
  if (method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  // 根路径
  if (pathname === '/' && method === 'GET') {
    res.writeHead(200)
    res.end(JSON.stringify({
      status: 'success',
      message: 'HTTP Test Server is running',
      version: '1.0.0',
      timestamp: Date.now()
    }, null, 2))
    console.log('[HTTP] 响应: 200 OK - 服务器信息')
    return
  }

  // 设备注册/查询
  if (pathname === '/api/device') {
    if (method === 'POST') {
      let body = ''
      req.on('data', chunk => {
        body += chunk.toString()
      })
      req.on('end', () => {
        try {
          const data = JSON.parse(body)
          const sn = data.sn || query.sn || 'UNKNOWN'

          console.log(`[HTTP] 设备注册 - SN: ${sn}`)
          console.log(`[HTTP]   请求体: ${body}`)

          res.writeHead(200)
          res.end(JSON.stringify({
            status: 'success',
            message: 'Device registered successfully',
            device: { sn: sn, registeredAt: Date.now(), status: 'active' }
          }, null, 2))
          console.log('[HTTP] 响应: 200 OK - 设备注册成功')
        } catch (error) {
          res.writeHead(400)
          res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON data' }))
          console.log('[HTTP] 响应: 400 Bad Request - JSON格式错误')
        }
      })
    } else if (method === 'GET') {
      const sn = query.sn || 'UNKNOWN'
      res.writeHead(200)
      res.end(JSON.stringify({
        status: 'success',
        device: { sn: sn, status: 'active', lastSeen: Date.now() }
      }, null, 2))
      console.log(`[HTTP] 响应: 200 OK - 设备查询 (SN: ${sn})`)
    }
    return
  }

  // 心跳端点
  if (pathname === '/api/heartbeat' && method === 'POST') {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })
    req.on('end', () => {
      console.log(`[HTTP] 心跳请求 - 内容: ${body}`)
      res.writeHead(200)
      res.end(JSON.stringify({
        status: 'success',
        message: 'PONG',
        serverTime: Date.now()
      }, null, 2))
      console.log('[HTTP] 响应: 200 OK - PONG')
    })
    return
  }

  // 数据上传/查询
  if (pathname === '/api/data') {
    if (method === 'POST') {
      let body = ''
      req.on('data', chunk => {
        body += chunk.toString()
      })
      req.on('end', () => {
        try {
          const data = JSON.parse(body)
          console.log(`[HTTP] 数据上传 - 内容: ${JSON.stringify(data)}`)

          messageLog.push({
            id: messageLog.length + 1,
            data: data,
            timestamp: Date.now()
          })

          res.writeHead(200)
          res.end(JSON.stringify({
            status: 'success',
            message: 'Data received successfully',
            echo: data,
            messageId: messageLog.length
          }, null, 2))
          console.log('[HTTP] 响应: 200 OK - 数据接收成功')
        } catch (error) {
          res.writeHead(400)
          res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON data' }))
          console.log('[HTTP] 响应: 400 Bad Request')
        }
      })
    } else if (method === 'GET') {
      const limit = parseInt(query.limit) || 10
      const recentMessages = messageLog.slice(-limit)

      res.writeHead(200)
      res.end(JSON.stringify({
        status: 'success',
        count: messageLog.length,
        messages: recentMessages
      }, null, 2))
      console.log(`[HTTP] 响应: 200 OK - 返回${recentMessages.length}条消息`)
    }
    return
  }

  // Echo服务
  if (pathname === '/api/echo' && method === 'POST') {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })
    req.on('end', () => {
      console.log(`[HTTP] Echo请求 - 内容: ${body}`)
      res.writeHead(200)
      res.end(JSON.stringify({
        status: 'success',
        echo: body,
        length: body.length,
        timestamp: Date.now()
      }, null, 2))
      console.log('[HTTP] 响应: 200 OK - Echo')
    })
    return
  }

  // 服务器状态
  if (pathname === '/api/status' && method === 'GET') {
    res.writeHead(200)
    res.end(JSON.stringify({
      status: 'success',
      server: {
        uptime: process.uptime(),
        requestCount: requestCounter,
        messageCount: messageLog.length,
        timestamp: Date.now()
      }
    }, null, 2))
    console.log('[HTTP] 响应: 200 OK - 服务器状态')
    return
  }

  // 404 未找到
  res.writeHead(404)
  res.end(JSON.stringify({
    status: 'error',
    message: 'Endpoint not found',
    path: pathname
  }))
  console.log(`[HTTP] 响应: 404 Not Found - ${pathname}`)
})

server.listen(PORT, () => {
  console.log(`[HTTP] 服务器已启动 - 端口: ${PORT}`)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[HTTP] 服务器错误: 端口 ${PORT} 已被占用`)
  } else {
    console.error(`[HTTP] 服务器错误: ${err.message}`)
  }
  // 以非0退出码退出，表示启动失败
  setTimeout(() => process.exit(1), 100)
})

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n[HTTP] 服务器关闭中...')
  server.close(() => {
    console.log('[HTTP] 服务器已关闭')
    process.exit(0)
  })
})

