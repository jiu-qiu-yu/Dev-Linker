const net = require('net')

const PORT = 18888
const server = net.createServer()

server.on('connection', (socket) => {
  const clientIP = socket.remoteAddress
  const clientPort = socket.remotePort

  console.log(`[TCP] 客户端连接 - ${clientIP}:${clientPort}`)

  // 发送欢迎消息
  socket.write(`Welcome! You are connected from ${clientIP}:${clientPort}\r\n`)

  socket.on('data', (data) => {
    const str = data.toString('utf8')
    const hexString = data.toString('hex').toUpperCase()
    const formattedHex = hexString.match(/.{1,2}/g).join(' ')

    console.log(`[TCP] 接收数据 - 来源: ${clientIP}:${clientPort}`)
    console.log(`[TCP]   文本: ${str.trim()}`)
    console.log(`[TCP]   HEX:  ${formattedHex}`)
    console.log(`[TCP]   长度: ${data.length}字节`)

    // 回显消息
    socket.write(`Echo: ${data}\r\n`)

    // 发送测试数据
    setTimeout(() => {
      socket.write('Hello from TCP server!\r\n')
    }, 1000)

    // 心跳响应
    if (data.toString().trim() === 'PING') {
      socket.write('PONG\r\n')
      console.log(`[TCP] 心跳响应 - PONG`)
    }
  })

  socket.on('close', () => {
    console.log(`[TCP] 客户端断开 - ${clientIP}:${clientPort}`)
  })

  socket.on('error', (error) => {
    console.error(`[TCP] Socket错误: ${error.message}`)
  })
})

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`[TCP] 服务器错误: 端口 ${PORT} 已被占用`)
  } else {
    console.error(`[TCP] 服务器错误: ${error.message}`)
  }
  // 以非0退出码退出，表示启动失败
  setTimeout(() => process.exit(1), 100)
})

// 启动服务器监听
server.listen(PORT, () => {
  console.log(`[TCP] 服务器已启动 - 端口: ${PORT}`)
})

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n[TCP] 服务器关闭中...')
  server.close(() => {
    console.log('[TCP] 服务器已关闭')
    process.exit(0)
  })
})

