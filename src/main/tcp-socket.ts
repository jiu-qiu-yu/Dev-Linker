/**
 * 主进程 TCP 连接管理器
 * 使用 Node.js net 模块实现 TCP 连接
 */

import * as net from 'net'
import { EventEmitter } from 'events'

export interface TCPSocketOptions {
  host: string
  port: number
  timeout?: number
}

export class TCPSocketManager extends EventEmitter {
  private socket: net.Socket | null = null
  private options: TCPSocketOptions | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 3000
  private manualDisconnect = false  // 标记是否为手动断开

  constructor() {
    super()
  }

  /**
   * 建立 TCP 连接
   */
  async connect(options: TCPSocketOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      this.options = options
      this.reconnectAttempts = 0

      console.log(`[TCP] Connecting to ${options.host}:${options.port}`)

      try {
        this.socket = new net.Socket()

        // 连接超时
        const timeout = options.timeout || 10000
        this.socket.setTimeout(timeout)

        // 连接事件
        this.socket.connect(options.port, options.host, () => {
          console.log('[TCP] Connected successfully')
          this.reconnectAttempts = 0
          this.manualDisconnect = false  // 连接成功，重置手动断开标志
          this.emit('connected')
          resolve()
        })

        // 数据接收事件
        this.socket.on('data', (data: Buffer) => {
          console.log('[TCP] Data received:', data.toString())
          this.emit('data', data)
        })

        // 错误事件
        this.socket.on('error', (error: Error) => {
          console.error('[TCP] Connection error:', error)
          this.emit('error', error)
          reject(error)
        })

        // 关闭事件
        this.socket.on('close', () => {
          console.log('[TCP] Connection closed')
          this.emit('close')
          // 只有在非手动断开时才尝试重连
          if (!this.manualDisconnect) {
            this.handleReconnect()
          }
        })

        // 超时事件
        this.socket.on('timeout', () => {
          console.warn('[TCP] Connection timeout')
          this.emit('timeout')
          this.disconnect()
        })
      } catch (error) {
        console.error('[TCP] Failed to create socket:', error)
        reject(error)
      }
    })
  }

  /**
   * 发送数据
   */
  send(data: string | Buffer): boolean {
    if (!this.socket || !this.socket.writable) {
      console.error('[TCP] Socket is not connected or writable')
      return false
    }

    try {
      this.socket.write(data)
      return true
    } catch (error) {
      console.error('[TCP] Failed to send data:', error)
      return false
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    // 标记为手动断开
    this.manualDisconnect = true

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.socket) {
      this.socket.destroy()
      this.socket = null
    }
  }

  /**
   * 获取连接状态
   */
  isConnected(): boolean {
    return this.socket !== null && this.socket.writable
  }

  /**
   * 自动重连处理
   */
  private handleReconnect(): void {
    if (!this.options || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectInterval * this.reconnectAttempts

    console.log(`[TCP] Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    this.reconnectTimer = setTimeout(() => {
      if (this.options) {
        this.connect(this.options).catch(error => {
          console.error('[TCP] Reconnection failed:', error)
        })
      }
    }, delay)
  }
}
