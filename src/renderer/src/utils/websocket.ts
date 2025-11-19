/**
 * WebSocket 连接管理器
 * 用于处理 WebSocket 客户端连接
 */

export class WebSocketManager {
  private ws: WebSocket | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 3000
  private manualDisconnect = false  // 标记是否为手动断开

  // 事件回调
  public onOpen?: () => void
  public onClose?: () => void
  public onError?: (error: Event) => void
  public onMessage?: (data: string) => void

  constructor() {}

  /**
   * 建立 WebSocket 连接
   */
  async connect(url: string, sn?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 构建带 SN 参数的 URL
        const fullUrl = sn ? `${url}?sn=${encodeURIComponent(sn)}` : url

        console.log('Connecting to WebSocket:', fullUrl)

        this.ws = new WebSocket(fullUrl)

        this.ws.onopen = () => {
          console.log('WebSocket connected')
          this.reconnectAttempts = 0
          this.manualDisconnect = false  // 连接成功，重置手动断开标志

          this.onOpen?.()
          resolve()
        }

        this.ws.onmessage = (event) => {
          console.log('WebSocket message received:', event.data)
          // 直接传递接收到的数据，不做任何处理
          this.onMessage?.(event.data)
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.onError?.(error)
          reject(new Error('WebSocket connection failed'))
        }

        this.ws.onclose = () => {
          console.log('WebSocket disconnected')
          this.onClose?.()
          // 只有在非手动断开时才尝试重连
          if (!this.manualDisconnect) {
            this.handleReconnect(url, sn)
          }
        }
      } catch (error) {
        console.error('Failed to connect WebSocket:', error)
        reject(error)
      }
    })
  }

  /**
   * 发送数据
   */
  send(data: string | Uint8Array): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected')
      return false
    }

    try {
      if (data instanceof Uint8Array) {
        // 如果是Uint8Array，发送二进制数据（HEX格式）
        console.log('[WebSocket] Sending binary data (HEX format), length:', data.length)
        // 将Uint8Array转换为ArrayBuffer发送
        this.ws.send(data.buffer)
      } else {
        // 字符串数据直接发送
        console.log('[WebSocket] Sending string data:', data)
        this.ws.send(data)
      }
      return true
    } catch (error) {
      console.error('Failed to send data:', error)
      return false
    }
  }

  /**
   * 关闭连接
   */
  disconnect(): void {
    // 标记为手动断开
    this.manualDisconnect = true

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.reconnectAttempts = 0
  }

  /**
   * 获取连接状态
   */
  getStatus(): number {
    if (!this.ws) return WebSocket.CLOSED
    return this.ws.readyState
  }

  /**
   * 是否已连接
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  /**
   * 处理重连逻辑
   */
  private handleReconnect(url: string, sn?: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)

    this.reconnectTimer = setTimeout(() => {
      this.connect(url, sn).catch((error) => {
        console.error('Reconnection failed:', error)
      })
    }, this.reconnectInterval)
  }
}
