import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ConnectionProtocol = 'ws' | 'wss' | 'tcp'
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'failed' | 'reconnecting'

// 前置声明，避免循环导入
export interface WebSocketManager {
  send(data: string): boolean
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Event) => void
  onMessage?: (data: string) => void
}

export interface TCPSocket {
  send(data: string): boolean
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Error) => void
  onData?: (data: string) => void
}

export interface ServerConfig {
  host: string
  port: number
  protocol: ConnectionProtocol
}

export interface DeviceConfig {
  sn: string
}

export interface HeartbeatConfig {
  enabled: boolean
  interval: number
  content: string
  format: 'string' | 'hex'
}

export const useConnectionStore = defineStore('connection', () => {
  // 服务器配置
  const serverConfig = ref<ServerConfig>({
    host: 'localhost',
    port: 18080,
    protocol: 'ws'
  })

  // 设备配置
  const deviceConfig = ref<DeviceConfig>({
    sn: 'DEV-' + Date.now()
  })

  // 心跳包配置
  const heartbeatConfig = ref<HeartbeatConfig>({
    enabled: false,
    interval: 30,
    content: '',
    format: 'string'
  })

  // 连接状态
  const connectionStatus = ref<ConnectionStatus>('disconnected')

  // 当前连接实例
  const currentConnection = ref<WebSocket | net.Socket | null>(null)

  // 连接管理器实例
  const wsManager = ref<WebSocketManager | null>(null)
  const tcpSocket = ref<TCPSocket | null>(null)

  // 心跳包定时器
  let heartbeatTimer: NodeJS.Timeout | null = null

  // 方法：更新服务器配置
  const updateServerConfig = (config: Partial<ServerConfig>) => {
    serverConfig.value = { ...serverConfig.value, ...config }
    saveConfig()
  }

  // 方法：更新设备配置
  const updateDeviceConfig = (config: Partial<DeviceConfig>) => {
    deviceConfig.value = { ...deviceConfig.value, ...config }
    saveConfig()
  }

  // 方法：设置连接状态
  const setConnectionStatus = (status: ConnectionStatus) => {
    connectionStatus.value = status

    // 连接状态改变时处理心跳包
    if (status === 'connected') {
      startHeartbeat()
    } else {
      stopHeartbeat()
    }
  }

  // 方法：设置连接管理器
  const setConnectionManager = (type: 'ws' | 'tcp', manager: WebSocketManager | TCPSocket | null) => {
    if (type === 'ws') {
      wsManager.value = manager as WebSocketManager
    } else {
      tcpSocket.value = manager as TCPSocket
    }
  }

  // 方法：发送数据
  const sendData = async (data: string | Uint8Array): Promise<boolean> => {
    if (serverConfig.value.protocol === 'ws' || serverConfig.value.protocol === 'wss') {
      return wsManager.value?.send(data) || false
    } else if (serverConfig.value.protocol === 'tcp') {
      return await tcpSocket.value?.send(data) || false
    }
    return false
  }

  // 方法：启动心跳包
  const startHeartbeat = () => {
    if (!heartbeatConfig.value.enabled || !heartbeatConfig.value.content) {
      console.log('[Heartbeat] Heartbeat disabled or content empty')
      return
    }

    stopHeartbeat() // 清除已有定时器

    console.log(`[Heartbeat] Starting heartbeat, interval: ${heartbeatConfig.value.interval}s`)
    heartbeatTimer = setInterval(() => {
      if (connectionStatus.value === 'connected') {
        let dataToSend = heartbeatConfig.value.content

        // 根据格式转换数据
        if (heartbeatConfig.value.format === 'hex') {
          // 如果选择HEX格式，需要将字符串转换为十六进制
          dataToSend = heartbeatConfig.value.content.split('')
            .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
            .join('')
        }

        console.log('[Heartbeat] Sending heartbeat:', dataToSend)
        sendData(dataToSend)
      }
    }, heartbeatConfig.value.interval * 1000)
  }

  // 方法：停止心跳包
  const stopHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
      console.log('[Heartbeat] Stopped')
    }
  }

  // 方法：更新心跳包配置
  const updateHeartbeatConfig = (config: Partial<HeartbeatConfig>) => {
    heartbeatConfig.value = { ...heartbeatConfig.value, ...config }
    saveConfig()

    // 如果心跳包已启用且正在连接，重新启动定时器
    if (connectionStatus.value === 'connected' && heartbeatConfig.value.enabled) {
      startHeartbeat()
    }
  }

  // 方法：保存配置到本地存储
  const saveConfig = () => {
    const config = {
      server: serverConfig.value,
      device: deviceConfig.value,
      heartbeat: heartbeatConfig.value
    }
    localStorage.setItem('devlinker-config', JSON.stringify(config))
  }

  // 方法：从本地存储加载配置
  const loadConfig = () => {
    const saved = localStorage.getItem('devlinker-config')
    if (saved) {
      try {
        const config = JSON.parse(saved)
        serverConfig.value = config.server || serverConfig.value
        deviceConfig.value = config.device || deviceConfig.value
        heartbeatConfig.value = config.heartbeat || heartbeatConfig.value

        // 端口兼容处理：如果端口是旧端口，自动迁移到新端口
        if (serverConfig.value.port === 8080) {
          console.log('Migrating port from 8080 to 18080')
          serverConfig.value.port = 18080
        }
        if (serverConfig.value.port === 8888) {
          console.log('Migrating port from 8888 to 18888')
          serverConfig.value.port = 18888
        }

        // 验证必要字段
        if (!deviceConfig.value.sn || deviceConfig.value.sn.trim() === '') {
          deviceConfig.value.sn = 'DEV-' + Date.now()
          console.log('Generated new SN:', deviceConfig.value.sn)
        }

        // 保存更新后的配置
        saveConfig()
      } catch (error) {
        console.error('Failed to load config:', error)
      }
    }
  }

  return {
    // state
    serverConfig,
    deviceConfig,
    heartbeatConfig,
    connectionStatus,
    currentConnection,
    wsManager,
    tcpSocket,
    // actions
    updateServerConfig,
    updateDeviceConfig,
    updateHeartbeatConfig,
    setConnectionStatus,
    setConnectionManager,
    sendData,
    startHeartbeat,
    stopHeartbeat,
    saveConfig,
    loadConfig
  }
})
