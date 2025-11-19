/**
 * WebSocket 测试服务器
 * 用于开发和测试 WebSocket 连接功能
 */

const WebSocket = require('ws')

const PORT = 18080
const wss = new WebSocket.Server({ port: PORT })

console.log(`[WS Server] WebSocket test server started on port ${PORT}`)

wss.on('connection', (ws, req) => {
  const clientIP = req.socket.remoteAddress
  const sn = new URL(req.url, `http://${req.headers.host}`).searchParams.get('sn')

  console.log(`[WS Server] Client connected: ${clientIP}, SN: ${sn || 'N/A'}`)

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
      // 二进制数据（HEX模式发送），转换为HEX显示
      const hexString = data.toString('hex').toUpperCase()
      // 格式化HEX显示（每两个字符加一个空格）
      const formattedHex = hexString.match(/.{1,2}/g).join(' ')
      console.log(`[WS Server] Received: ${formattedHex}`)

      // 返回二进制数据的echo
      ws.send(data, { binary: true })
    } else {
      // 文本数据（字符串模式发送），转换为ASCII的HEX值显示
      const receivedData = data.toString('utf8')
      // 将每个字符转换为HEX值
      const asciiBytes = Buffer.from(receivedData, 'utf8')
      const hexValues = []
      for (let i = 0; i < asciiBytes.length; i++) {
        hexValues.push(asciiBytes[i].toString(16).toUpperCase().padStart(2, '0'))
      }
      const formattedHex = hexValues.join(' ')
      console.log(`[WS Server] Received(str): ${formattedHex}`)

      // 原样返回接收到的数据
      ws.send(JSON.stringify({
        type: 'echo',
        data: receivedData,
        timestamp: Date.now(),
        isBinary: false
      }))
    }

    // 随机发送测试数据
    setTimeout(() => {
      ws.send(JSON.stringify({
        type: 'test-data',
        content: 'Hello from WebSocket server!',
        timestamp: Date.now()
      }))
    }, 1000)
  })

  ws.on('close', () => {
    console.log('[WS Server] Client disconnected')
  })

  ws.on('error', (error) => {
    console.error('[WS Server] WebSocket error:', error)
  })
})

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n[WS Server] Shutting down...')
  wss.close(() => {
    console.log('[WS Server] Server closed')
    process.exit(0)
  })
})
