/**
 * 主进程 UDP Socket 管理器
 * 使用 Node.js dgram 模块实现 UDP 通信
 * 注意：UDP是无连接协议，但通过发送测试包验证目标可达性
 */

import * as dgram from 'dgram'
import { EventEmitter } from 'events'

export interface UDPSocketOptions {
  host: string
  port: number
  localPort?: number  // 可选的本地端口
  timeout?: number    // 连接验证超时时间（毫秒），默认 3000ms
}

export class UDPSocketManager extends EventEmitter {
  private socket: dgram.Socket | null = null
  private options: UDPSocketOptions | null = null
  private isActive = false
  private connectionTimer: NodeJS.Timeout | null = null

  constructor() {
    super()
  }

  /**
   * 创建 UDP Socket 并验证目标主机可达性
   * 通过发送初始化测试包并等待响应来验证连接
   */
  async connect(options: UDPSocketOptions): Promise<void> {
    // 如果已有连接，先断开
    if (this.socket) {
      console.log('[UDP] Closing existing socket before new connection')
      this.disconnect()
    }

    return new Promise((resolve, reject) => {
      this.options = options
      const timeout = options.timeout || 3000  // 默认 3 秒超时

      console.log(`[UDP] Setting up socket for ${options.host}:${options.port}`)

      try {
        // 创建 UDP socket
        this.socket = dgram.createSocket('udp4')
        let isResolved = false  // 防止重复 resolve/reject

        // 绑定本地端口（如果指定）
        const localPort = options.localPort || 0  // 0 表示系统自动分配

        this.socket.bind(localPort, () => {
          const address = this.socket!.address()
          console.log(`[UDP] Socket bound to ${address.address}:${address.port}`)

          // 🔧 发送初始化测试包验证连接
          console.log('[UDP] Sending connection test packet...')
          const testMessage = Buffer.from('jiuqiu_init_1')  // 初始化标识

          this.socket!.send(testMessage, this.options!.port, this.options!.host, (err) => {
            if (err) {
              console.error('[UDP] Failed to send test packet:', err)
              if (!isResolved) {
                isResolved = true
                this.isActive = false
                this.disconnect()
                reject(new Error(`无法发送数据到 ${this.options!.host}:${this.options!.port}`))
              }
            }
          })

          // 设置超时定时器
          this.connectionTimer = setTimeout(() => {
            if (!isResolved) {
              isResolved = true
              console.error('[UDP] Connection timeout - no response from server')
              this.isActive = false
              this.disconnect()
              reject(new Error(`连接超时：${this.options!.host}:${this.options!.port} 无响应（${timeout}ms）`))
            }
          }, timeout)
        })

        // 监听接收到的消息
        this.socket.on('message', (msg: Buffer, rinfo: dgram.RemoteInfo) => {
          console.log(`[UDP] Message received from ${rinfo.address}:${rinfo.port}`)

          // 🔧 收到第一个响应即认为连接成功
          if (!isResolved) {
            isResolved = true
            if (this.connectionTimer) {
              clearTimeout(this.connectionTimer)
              this.connectionTimer = null
            }
            console.log('[UDP] Connection verified successfully')
            this.isActive = true
            this.emit('connected')
            resolve()
          }

          // 触发数据接收事件
          this.emit('data', msg)
        })

        // 错误处理
        this.socket.on('error', (error: Error) => {
          console.error('[UDP] Socket error:', error)
          if (!isResolved) {
            isResolved = true
            if (this.connectionTimer) {
              clearTimeout(this.connectionTimer)
              this.connectionTimer = null
            }
            this.isActive = false
            reject(error)
          }
          this.emit('error', error)
        })

        // 关闭事件
        this.socket.on('close', () => {
          console.log('[UDP] Socket closed')
          if (this.connectionTimer) {
            clearTimeout(this.connectionTimer)
            this.connectionTimer = null
          }
          this.isActive = false
          this.emit('close')
        })
      } catch (error) {
        console.error('[UDP] Failed to create socket:', error)
        this.isActive = false
        reject(error)
      }
    })
  }

  /**
   * 发送数据到指定的主机和端口
   */
  send(data: string | Buffer): boolean {
    if (!this.socket || !this.options || !this.isActive) {
      console.error('[UDP] Socket is not ready')
      return false
    }

    try {
      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data)

      this.socket.send(buffer, this.options.port, this.options.host, (err) => {
        if (err) {
          console.error('[UDP] Failed to send data:', err)
          this.emit('error', err)
        } else {
          console.log(`[UDP] Data sent to ${this.options!.host}:${this.options!.port}`)
        }
      })

      return true
    } catch (error) {
      console.error('[UDP] Send error:', error)
      return false
    }
  }

  /**
   * 关闭 Socket
   */
  disconnect(): void {
    // 清理连接超时定时器
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer)
      this.connectionTimer = null
    }

    if (this.socket) {
      this.socket.close()
      this.socket = null
      this.isActive = false
      console.log('[UDP] Socket disconnected')
    }
  }

  /**
   * 获取连接状态
   * 注意：对于UDP，这里返回的是socket是否处于活动状态
   */
  isConnected(): boolean {
    return this.isActive && this.socket !== null
  }
}
