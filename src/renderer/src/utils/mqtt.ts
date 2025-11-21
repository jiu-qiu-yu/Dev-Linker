/**
 * MQTT 客户端管理器
 * 用于处理 MQTT 连接和消息通信
 * 使用 MQTT.js 库实现
 */

import * as mqtt from 'mqtt'

export interface MQTTConnectOptions {
  url: string  // mqtt://host:port 或 ws://host:port
  clientId?: string
  username?: string
  password?: string
  clean?: boolean  // 清除会话
  keepalive?: number  // 保活时间（秒）
  reconnectPeriod?: number  // 重连间隔（毫秒）
}

export class MQTTClient {
  private client: mqtt.MqttClient | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private subscriptions: Set<string> = new Set()

  // 事件回调
  public onConnect?: () => void
  public onDisconnect?: () => void
  public onError?: (error: Error) => void
  public onMessage?: (topic: string, payload: string | Buffer) => void
  public onReconnect?: () => void

  /**
   * 连接到 MQTT Broker
   */
  async connect(options: MQTTConnectOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('[MQTT] Connecting to:', options.url)

      try {
        // 创建 MQTT 客户端
        this.client = mqtt.connect(options.url, {
          clientId: options.clientId || `devlinker_${Date.now()}`,
          username: options.username,
          password: options.password,
          clean: options.clean !== false,  // 默认清除会话
          keepalive: options.keepalive || 60,
          reconnectPeriod: options.reconnectPeriod || 3000
        })

        // 连接成功事件
        this.client.on('connect', () => {
          console.log('[MQTT] Connected successfully')
          this.onConnect?.()
          resolve()
        })

        // 断开连接事件
        this.client.on('disconnect', () => {
          console.log('[MQTT] Disconnected')
          this.onDisconnect?.()
        })

        // 关闭事件
        this.client.on('close', () => {
          console.log('[MQTT] Connection closed')
          this.onDisconnect?.()
        })

        // 重连事件
        this.client.on('reconnect', () => {
          console.log('[MQTT] Reconnecting...')
          this.onReconnect?.()
        })

        // 错误事件
        this.client.on('error', (error: Error) => {
          console.error('[MQTT] Error:', error)
          this.onError?.(error)
          reject(error)
        })

        // 接收消息事件
        this.client.on('message', (topic: string, payload: Buffer) => {
          console.log(`[MQTT] Message received on topic: ${topic}`)
          this.onMessage?.(topic, payload)
        })
      } catch (error) {
        console.error('[MQTT] Failed to connect:', error)
        reject(error)
      }
    })
  }

  /**
   * 订阅主题
   */
  async subscribe(topic: string | string[], qos: 0 | 1 | 2 = 0): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.client.connected) {
        reject(new Error('MQTT client is not connected'))
        return
      }

      const topics = Array.isArray(topic) ? topic : [topic]

      this.client.subscribe(topics, { qos }, (err) => {
        if (err) {
          console.error('[MQTT] Subscribe error:', err)
          reject(err)
        } else {
          topics.forEach(t => this.subscriptions.add(t))
          console.log('[MQTT] Subscribed to:', topics)
          resolve()
        }
      })
    })
  }

  /**
   * 取消订阅主题
   */
  async unsubscribe(topic: string | string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.client.connected) {
        reject(new Error('MQTT client is not connected'))
        return
      }

      const topics = Array.isArray(topic) ? topic : [topic]

      this.client.unsubscribe(topics, (err) => {
        if (err) {
          console.error('[MQTT] Unsubscribe error:', err)
          reject(err)
        } else {
          topics.forEach(t => this.subscriptions.delete(t))
          console.log('[MQTT] Unsubscribed from:', topics)
          resolve()
        }
      })
    })
  }

  /**
   * 发布消息
   */
  async publish(
    topic: string,
    message: string | Buffer | Uint8Array,
    options?: { qos?: 0 | 1 | 2; retain?: boolean }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.client.connected) {
        reject(new Error('MQTT client is not connected'))
        return
      }

      // 转换 Uint8Array 为 Buffer
      let payload: Buffer
      if (message instanceof Uint8Array) {
        payload = Buffer.from(message)
      } else if (Buffer.isBuffer(message)) {
        payload = message
      } else {
        payload = Buffer.from(message)
      }

      this.client.publish(
        topic,
        payload,
        {
          qos: options?.qos || 0,
          retain: options?.retain || false
        },
        (err) => {
          if (err) {
            console.error('[MQTT] Publish error:', err)
            reject(err)
          } else {
            console.log(`[MQTT] Published to topic: ${topic}`)
            resolve()
          }
        }
      )
    })
  }

  /**
   * 发送数据（兼容其他协议的接口）
   */
  async send(data: string | Buffer | Uint8Array, topic: string = 'default'): Promise<boolean> {
    try {
      await this.publish(topic, data)
      return true
    } catch (error) {
      console.error('[MQTT] Failed to send data:', error)
      return false
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.client) {
      console.log('[MQTT] Disconnecting...')
      this.client.end(true)  // 强制断开
      this.client = null
      this.subscriptions.clear()
    }
  }

  /**
   * 获取连接状态
   */
  getStatus(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    if (!this.client) {
      return 'disconnected'
    }

    if (this.client.connected) {
      return 'connected'
    }

    if (this.client.reconnecting) {
      return 'connecting'
    }

    return 'disconnected'
  }

  /**
   * 是否已连接
   */
  isConnected(): boolean {
    return this.client?.connected || false
  }

  /**
   * 获取已订阅的主题列表
   */
  getSubscriptions(): string[] {
    return Array.from(this.subscriptions)
  }
}
