import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ConnectionProtocol = 'ws' | 'wss' | 'tcp'
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'failed' | 'reconnecting'

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

  // 方法：更新心跳包配置
  const updateHeartbeatConfig = (config: Partial<HeartbeatConfig>) => {
    heartbeatConfig.value = { ...heartbeatConfig.value, ...config }
    saveConfig()
  }

  // 方法：设置连接状态
  const setConnectionStatus = (status: ConnectionStatus) => {
    connectionStatus.value = status
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
    // actions
    updateServerConfig,
    updateDeviceConfig,
    updateHeartbeatConfig,
    setConnectionStatus,
    saveConfig,
    loadConfig
  }
})
