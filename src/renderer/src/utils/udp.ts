/**
 * UDP Socket 客户端
 * 用于处理 UDP 通信
 * 注意：UDP是无连接协议
 */

export class UDPSocket {
  // 事件回调
  public onOpen?: () => void
  public onClose?: () => void
  public onError?: (error: Error) => void
  public onData?: (data: Buffer | string) => void

  constructor() {
    // 监听来自主进程的 UDP 事件
    if (window.electronAPI) {
      window.electronAPI.onUDPConnected?.(async () => {
        console.log('[UDP] Socket ready event received')
        this.onOpen?.()
      })

      window.electronAPI.onUDPDisconnected?.(() => {
        console.log('[UDP] Socket closed event received')
        this.onClose?.()
      })

      window.electronAPI.onUDPData?.((data: string) => {
        console.log('[UDP] Data received:', data)
        this.onData?.(data)
      })

      window.electronAPI.onUDPError?.((error: string) => {
        console.error('[UDP] Error received:', error)
        this.onError?.(new Error(error))
      })
    }
  }

  /**
   * 建立 UDP Socket（设置目标地址）
   */
  async connect(host: string, port: number, localPort?: number): Promise<void> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }

    try {
      console.log(`[UDP] Setting up socket for ${host}:${port}`)
      await window.electronAPI.udp.connect(host, port, localPort)
      console.log('[UDP] Socket setup initiated')
    } catch (error) {
      console.error('[UDP] Failed to setup socket:', error)
      throw error
    }
  }

  /**
   * 发送数据
   */
  async send(data: string | Buffer | Uint8Array): Promise<boolean> {
    if (!window.electronAPI) {
      console.error('[UDP] Electron API not available')
      return false
    }

    try {
      console.log('[UDP] Sending data:', data)

      // 如果是Uint8Array，转换为hex字符串（大写，不带空格）
      let dataToSend: string
      if (data instanceof Uint8Array) {
        // 转换为hex字符串（每字节2位十六进制，大写）
        const hexString = Array.from(data)
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase()
        dataToSend = hexString
        console.log('[UDP] Sending HEX data:', dataToSend)
      } else {
        dataToSend = data.toString()
      }

      const result = await window.electronAPI.udp.send(dataToSend)
      return result
    } catch (error) {
      console.error('[UDP] Failed to send data:', error)
      return false
    }
  }

  /**
   * 关闭 Socket
   */
  disconnect(): void {
    if (window.electronAPI) {
      window.electronAPI.udp.disconnect()
    }
  }

  /**
   * 获取连接状态
   */
  async getStatus(): Promise<'connecting' | 'connected' | 'disconnected' | 'error'> {
    if (!window.electronAPI) {
      return 'disconnected'
    }

    try {
      const isConnected = await window.electronAPI.udp.isConnected()
      return isConnected ? 'connected' : 'disconnected'
    } catch (error) {
      console.error('[UDP] Failed to get status:', error)
      return 'error'
    }
  }

  /**
   * 是否已连接（激活）
   */
  async isConnected(): Promise<boolean> {
    if (!window.electronAPI) {
      return false
    }

    try {
      return await window.electronAPI.udp.isConnected()
    } catch (error) {
      console.error('[UDP] Failed to check connection:', error)
      return false
    }
  }
}
