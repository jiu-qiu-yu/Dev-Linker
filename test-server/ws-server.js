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
  ws.on('message', (data) => {
    // 所有WebSocket数据在Node.js中都是Buffer
    // 我们需要检查数据类型来决定如何显示

    const textData = data.toString('utf8')

    // 智能检测：以下情况认为是文本
    // 1. 包含小写字母（a-z）→ 文本
    // 2. 包含非HEX字符 → 文本
    // 3. 纯数字 → 文本
    // 4. 只包含大写字母A-F但没有数字 → 文本（避免AADDDA误判为HEX）
    const hasLowercase = /[a-z]/.test(textData)
    const hasNonHexChar = /[^0-9A-F]/.test(textData)
    const hasOnlyDigits = /^[0-9]+$/.test(textData)
    const isOnlyUppercaseLetters = /^[A-Z]+$/.test(textData)
    const hasDigits = /[0-9]/.test(textData)

    // 如果是文本数据，直接显示
    const isTextData = hasLowercase || hasNonHexChar || hasOnlyDigits || (isOnlyUppercaseLetters && !hasDigits)

    if (isTextData) {
      console.log(`[WS Server] Received: ${textData}`)
      ws.send(JSON.stringify({
        type: 'echo',
        data: textData,
        timestamp: Date.now(),
        isBinary: false
      }))
    } else {
      // 认为是十六进制数据，格式化显示（每两个字符加一个空格）
      const hexWithSpaces = textData.match(/.{1,2}/g)?.join(' ') || textData
      console.log(`[WS Server] Received: ${hexWithSpaces}`)
      ws.send(JSON.stringify({
        type: 'echo',
        data: hexWithSpaces,
        timestamp: Date.now(),
        isBinary: true
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
