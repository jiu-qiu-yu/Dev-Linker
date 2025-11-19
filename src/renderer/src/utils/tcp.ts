/**
 * TCP 连接管理器
 * 用于处理 TCP 客户端连接
 */

export class TCPSocket {
  private reconnectTimer: NodeJS.Timeout | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 3000

  // 事件回调
  public onOpen?: () => void
  public onClose?: () => void
  public onError?: (error: Error) => void
  public onData?: (data: Buffer | string) => void

  constructor() {
    // 监听来自主进程的 TCP 事件
    if (window.electronAPI) {
      window.electronAPI.onTCPConnected(() => {
        console.log('[TCP] Connected event received')
        this.onOpen?.()
      })

      window.electronAPI.onTCPDisconnected(() => {
        console.log('[TCP] Disconnected event received')
        this.onClose?.()
      })

      window.electronAPI.onTCPData((data: string) => {
        console.log('[TCP] Data received:', data)
        this.onData?.(data)
      })

      window.electronAPI.onTCPError((error: string) => {
        console.error('[TCP] Error received:', error)
        this.onError?.(new Error(error))
      })
    }
  }

  /**
   * 建立 TCP 连接
   */
  async connect(host: string, port: number): Promise<void> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }

    try {
      console.log(`[TCP] Connecting to ${host}:${port}`)
      await window.electronAPI.tcp.connect(host, port)
      console.log('[TCP] Connection initiated')
    } catch (error) {
      console.error('[TCP] Failed to connect:', error)
      throw error
    }
  }

  /**
   * 发送数据
   */
  async send(data: string | Buffer | Uint8Array): Promise<boolean> {
    if (!window.electronAPI) {
      console.error('[TCP] Electron API not available')
      return false
    }

    try {
      console.log('[TCP] Sending data:', data)

      // 如果是Uint8Array，转换为hex字符串（大写，不带空格）
      let dataToSend: string
      if (data instanceof Uint8Array) {
        // 转换为hex字符串（每字节2位十六进制，大写）
        const hexString = Array.from(data)
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase()
        dataToSend = hexString
        console.log('[TCP] Sending HEX data:', dataToSend)
      } else {
        dataToSend = data.toString()
      }

      const result = await window.electronAPI.tcp.send(dataToSend)
      return result
    } catch (error) {
      console.error('[TCP] Failed to send data:', error)
      return false
    }
  }

  /**
   * 关闭连接
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (window.electronAPI) {
      window.electronAPI.tcp.disconnect()
    }

    this.reconnectAttempts = 0
  }

  /**
   * 获取连接状态
   */
  async getStatus(): Promise<'connecting' | 'connected' | 'disconnected' | 'error'> {
    if (!window.electronAPI) {
      return 'disconnected'
    }

    try {
      const isConnected = await window.electronAPI.tcp.isConnected()
      return isConnected ? 'connected' : 'disconnected'
    } catch (error) {
      console.error('[TCP] Failed to get status:', error)
      return 'error'
    }
  }

  /**
   * 是否已连接
   */
  async isConnected(): Promise<boolean> {
    if (!window.electronAPI) {
      return false
    }

    try {
      return await window.electronAPI.tcp.isConnected()
    } catch (error) {
      console.error('[TCP] Failed to check connection:', error)
      return false
    }
  }

  /**
   * 处理重连逻辑
   */
  private handleReconnect(host: string, port: number): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)

    this.reconnectTimer = setTimeout(() => {
      this.connect(host, port).catch((error) => {
        console.error('Reconnection failed:', error)
      })
    }, this.reconnectInterval)
  }
}
