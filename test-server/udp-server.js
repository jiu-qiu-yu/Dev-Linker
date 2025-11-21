const dgram = require('dgram')

const PORT = 19000
const server = dgram.createSocket('udp4')

server.on('listening', () => {
  const address = server.address()
  console.log(`[UDP] 服务器已启动 - ${address.address}:${address.port}`)
})

server.on('message', (msg, rinfo) => {
  const clientIP = rinfo.address
  const clientPort = rinfo.port

  console.log(`[UDP] 接收数据 - 来源: ${clientIP}:${clientPort}`)

  // 检测数据格式
  const isHex = /^[0-9A-Fa-f\s]+$/.test(msg.toString())

  if (isHex) {
    const hexString = msg.toString('hex').toUpperCase()
    const formattedHex = hexString.match(/.{1,2}/g).join(' ')
    console.log(`[UDP]   格式: HEX`)
    console.log(`[UDP]   内容: ${formattedHex}`)
  } else {
    const str = msg.toString('utf8')
    console.log(`[UDP]   格式: 文本`)
    console.log(`[UDP]   内容: ${str}`)
  }
  console.log(`[UDP]   长度: ${msg.length}字节`)

  // Echo响应
  const echoMessage = `Echo: ${msg}`
  server.send(echoMessage, rinfo.port, rinfo.address, (err) => {
    if (err) {
      console.error(`[UDP] 发送失败: ${err.message}`)
    } else {
      console.log(`[UDP] Echo响应已发送`)
    }
  })

  // 发送测试数据
  setTimeout(() => {
    const testMessage = 'Hello from UDP server!'
    server.send(testMessage, rinfo.port, rinfo.address, (err) => {
      if (!err) {
        console.log(`[UDP] 测试数据已发送`)
      }
    })
  }, 1000)

  // 心跳响应
  if (msg.toString() === 'PING') {
    server.send('PONG', rinfo.port, rinfo.address)
    console.log(`[UDP] 心跳响应 - PONG`)
  }
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[UDP] 服务器错误: 端口 ${PORT} 已被占用`)
  } else {
    console.error(`[UDP] 服务器错误: ${err.message}`)
  }
  server.close()
  // 以非0退出码退出，表示启动失败
  setTimeout(() => process.exit(1), 100)
})

server.on('close', () => {
  console.log('[UDP] 服务器已关闭')
})

// 绑定端口
server.bind(PORT)

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n[UDP] 服务器关闭中...')
  server.close(() => {
    console.log('[UDP] 服务器已关闭')
    process.exit(0)
  })
})

