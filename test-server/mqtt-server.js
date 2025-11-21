const aedes = require('aedes')()
const net = require('net')

const PORT = 1883
const server = net.createServer(aedes.handle)

server.listen(PORT, () => {
  console.log(`[MQTT] Broker已启动 - 端口: ${PORT}`)
})

// 客户端连接事件
aedes.on('client', (client) => {
  console.log(`[MQTT] 客户端连接 - ID: ${client.id}`)
})

// 客户端断开事件
aedes.on('clientDisconnect', (client) => {
  console.log(`[MQTT] 客户端断开 - ID: ${client.id}`)
})

// 订阅事件
aedes.on('subscribe', (subscriptions, client) => {
  console.log(`[MQTT] 订阅主题 - 客户端: ${client.id}`)
  subscriptions.forEach((sub) => {
    console.log(`[MQTT]   主题: ${sub.topic}, QoS: ${sub.qos}`)
  })
})

// 取消订阅事件
aedes.on('unsubscribe', (subscriptions, client) => {
  console.log(`[MQTT] 取消订阅 - 客户端: ${client.id}`)
  subscriptions.forEach((topic) => {
    console.log(`[MQTT]   主题: ${topic}`)
  })
})

// 发布消息事件
aedes.on('publish', (packet, client) => {
  // 过滤系统消息
  if (packet.topic.startsWith('$SYS/')) {
    return
  }

  // 只处理客户端发布的消息（避免echo死循环）
  if (!client) {
    return
  }

  const clientId = client.id
  const topic = packet.topic
  const payload = packet.payload.toString()
  const qos = packet.qos

  console.log(`[MQTT] 收到消息 - 客户端: ${clientId}`)
  console.log(`[MQTT]   主题: ${topic}`)
  console.log(`[MQTT]   内容: ${payload}`)
  console.log(`[MQTT]   QoS:  ${qos}`)
  console.log(`[MQTT]   长度: ${packet.payload.length}字节`)

  // 自动回复测试
  if (topic === 'test/request') {
    setTimeout(() => {
      aedes.publish({
        topic: 'test/response',
        payload: Buffer.from('Hello from MQTT server!'),
        qos: 0,
        retain: false
      })
      console.log(`[MQTT] 自动回复 - 主题: test/response`)
    }, 1000)
  }

  // 心跳响应
  if (topic === 'heartbeat/ping') {
    aedes.publish({
      topic: 'heartbeat/pong',
      payload: Buffer.from('PONG'),
      qos: 0,
      retain: false
    })
    console.log(`[MQTT] 心跳响应 - PONG`)
  }

  // Echo功能
  setTimeout(() => {
    aedes.publish({
      topic: `${topic}/echo`,
      payload: Buffer.from(`Echo: ${payload}`),
      qos: 0,
      retain: false
    })
    console.log(`[MQTT] Echo响应 - 主题: ${topic}/echo`)
  }, 500)
})

// 错误处理
aedes.on('clientError', (client, err) => {
  console.error(`[MQTT] 客户端错误 - ID: ${client.id}, 错误: ${err.message}`)
})

aedes.on('connectionError', (client, err) => {
  console.error(`[MQTT] 连接错误: ${err.message}`)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[MQTT] 服务器错误: 端口 ${PORT} 已被占用`)
  } else {
    console.error(`[MQTT] 服务器错误: ${err.message}`)
  }
  // 以非0退出码退出，表示启动失败
  setTimeout(() => process.exit(1), 100)
})

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n[MQTT] Broker关闭中...')
  aedes.close(() => {
    console.log('[MQTT] Broker已关闭')
    server.close(() => {
      console.log('[MQTT] 服务器已关闭')
      process.exit(0)
    })
  })
})

