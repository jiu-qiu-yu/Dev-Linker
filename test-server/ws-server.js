const WebSocket = require('ws')

const PORT = 18080
const wss = new WebSocket.Server({ port: PORT })

wss.on('listening', () => {
  console.log(`[WebSocket] 服务器已启动 - 端口: ${PORT}`)
})

wss.on('connection', (ws, req) => {
  const clientIP = req.socket.remoteAddress
  const sn = new URL(req.url, `http://${req.headers.host}`).searchParams.get('sn')

  console.log(`[WebSocket] 客户端连接 - IP: ${clientIP}, SN: ${sn || 'N/A'}`)

  // 发送欢迎消息
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'WebSocket connection established',
    timestamp: Date.now(),
    sn: sn || 'N/A'
  }))

  // 监听消息
  ws.on('message', (data, isBinary) => {
    if (isBinary) {
      // 二进制数据
      const hexString = data.toString('hex').toUpperCase()
      const formattedHex = hexString.match(/.{1,2}/g).join(' ')
      console.log(`[WebSocket] 接收数据(HEX) - 长度: ${data.length}字节, 内容: ${formattedHex}`)

      // 返回二进制数据的echo
      ws.send(data, { binary: true })
    } else {
      // 文本数据
      let receivedData = data.toString('utf8')
      if (receivedData.startsWith('STR:')) {
        receivedData = receivedData.substring(4)
      }
      console.log(`[WebSocket] 接收数据(STR) - 内容: ${receivedData}`)

      // 原样返回
      ws.send(JSON.stringify({
        type: 'echo',
        data: receivedData,
        timestamp: Date.now(),
        isBinary: false
      }))
    }

    // 发送测试数据
    setTimeout(() => {
      ws.send(JSON.stringify({
        type: 'test-data',
        content: 'Hello from WebSocket server!',
        timestamp: Date.now()
      }))
    }, 1000)
  })

  ws.on('close', () => {
    console.log(`[WebSocket] 客户端断开 - IP: ${clientIP}`)
  })

  ws.on('error', (error) => {
    console.error(`[WebSocket] 错误: ${error.message}`)
  })
})

wss.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`[WebSocket] 服务器错误: 端口 ${PORT} 已被占用`)
  } else {
    console.error(`[WebSocket] 服务器错误: ${error.message}`)
  }
  // 以非0退出码退出，表示启动失败
  setTimeout(() => process.exit(1), 100)
})

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n[WebSocket] 服务器关闭中...')
  wss.close(() => {
    console.log('[WebSocket] 服务器已关闭')
    process.exit(0)
  })
})

