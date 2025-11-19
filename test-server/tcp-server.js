/**
 * TCP 测试服务器
 * 用于开发和测试 TCP 连接功能
 */

const net = require('net')

const PORT = 18888
const server = net.createServer()

console.log(`[TCP Server] TCP test server started on port ${PORT}`)

server.on('connection', (socket) => {
  const clientIP = socket.remoteAddress
  const clientPort = socket.remotePort

  console.log(`[TCP Server] Client connected: ${clientIP}:${clientPort}`)

  // 发送欢迎消息
  socket.write(`Welcome! You are connected from ${clientIP}:${clientPort}\r\n`)

  socket.on('data', (data) => {
    // 直接显示原始接收的数据
    const str = data.toString('utf8')
    console.log(`[TCP Server] Received: ${str}`)

    // 回显消息
    socket.write(`Echo: ${data}\r\n`)

    // 随机发送测试数据
    setTimeout(() => {
      socket.write('Hello from TCP server!\r\n')
    }, 1000)

    // 心跳响应
    if (data.toString() === 'PING') {
      socket.write('PONG\r\n')
    }
  })

  socket.on('close', () => {
    console.log('[TCP Server] Client disconnected')
  })

  socket.on('error', (error) => {
    console.error('[TCP Server] Socket error:', error)
  })
})

server.on('error', (error) => {
  console.error('[TCP Server] Server error:', error)
})

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n[TCP Server] Shutting down...')
  server.close(() => {
    console.log('[TCP Server] Server closed')
    process.exit(0)
  })
})
