import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ProtocolType, ConnectionProtocol, ServerConfig, DeviceConfig, HeartbeatConfig, LoginConfig, DataInteractionConfig } from '@shared/types'
import type { ConnectionStatus } from '@shared/types'
import { DataFormatter } from '../utils/data-formatter'

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

export const useConnectionStore = defineStore('connection', () => {
  // 服务器配置 - 新增字段以支持完整地址输入
  const serverConfig = ref<ServerConfig>({
    // UI 绑定的数据
    protocolType: 'WebSocket',
    fullAddress: 'ws://localhost:18080',

    // 解析后的底层连接数据
    parsedHost: 'localhost',
    parsedPort: 18080,
    parsedProtocol: 'ws',
    parsedPath: '',

    // 保留旧字段用于兼容
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

  // 登录包配置
  const loginConfig = ref<LoginConfig>({
    enabled: false,
    content: '',
    format: 'string'
  })

  // 数据交互配置（独立于心跳包）
  const dataInteractionConfig = ref<DataInteractionConfig>({
    logFormat: 'string'
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

  // 核心逻辑：智能地址解析
  const parseAddress = (): boolean => {
    let input = serverConfig.value.fullAddress.trim()

    // 1. 如果没有协议头，根据选择的大类自动补全
    if (!input.includes('://')) {
      const prefixMap: Record<ProtocolType, string> = {
        'WebSocket': 'ws://',
        'TCP': 'tcp://',
        'UDP': 'udp://',
        'MQTT': 'mqtt://',
        'HTTP': 'http://'
      }
      input = (prefixMap[serverConfig.value.protocolType] || 'ws://') + input
    }

    try {
      const url = new URL(input)

      // 2. 解析并更新底层参数
      serverConfig.value.parsedHost = url.hostname

      // 端口处理：如果没填端口，根据协议给默认值
      if (!url.port) {
        const defaultPorts: Record<string, number> = {
          'ws:': 80,
          'wss:': 443,
          'http:': 80,
          'https:': 443,
          'mqtt:': 1883,
          'tcp:': 18888,
          'udp:': 18888
        }
        serverConfig.value.parsedPort = defaultPorts[url.protocol] || 80
      } else {
        serverConfig.value.parsedPort = parseInt(url.port)
      }

      // 协议处理：区分 ws/wss
      const protocolStr = url.protocol.replace(':', '')
      serverConfig.value.parsedProtocol = protocolStr as ConnectionProtocol
      serverConfig.value.parsedPath = url.pathname + url.search // 保留 /ws/4g?token=xxx

      // 更新兼容字段
      serverConfig.value.host = serverConfig.value.parsedHost
      serverConfig.value.port = serverConfig.value.parsedPort
      serverConfig.value.protocol = serverConfig.value.parsedProtocol

      console.log('地址解析结果:', {
        host: serverConfig.value.parsedHost,
        port: serverConfig.value.parsedPort,
        protocol: serverConfig.value.parsedProtocol,
        path: serverConfig.value.parsedPath
      })
      return true
    } catch (e) {
      console.error('地址解析失败:', e)
      return false
    }
  }

  // 方法：更新服务器配置
  const updateServerConfig = (config: Partial<ServerConfig>) => {
    serverConfig.value = { ...serverConfig.value, ...config }

    // 如果更新了 protocolType 或 fullAddress，需要重新解析
    if (config.protocolType || config.fullAddress) {
      parseAddress()
    }

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
    if (serverConfig.value.parsedProtocol === 'ws' || serverConfig.value.parsedProtocol === 'wss') {
      return wsManager.value?.send(data) || false
    } else if (serverConfig.value.parsedProtocol === 'tcp') {
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
        let dataToSend: string | Uint8Array = heartbeatConfig.value.content

        // 根据格式转换数据
        if (heartbeatConfig.value.format === 'hex') {
          // 如果选择HEX格式，需要将HEX字符串转换为二进制数据
          dataToSend = DataFormatter.hexToUint8Array(heartbeatConfig.value.content)
          console.log('[Heartbeat] Sending heartbeat (HEX)')
        } else {
          console.log('[Heartbeat] Sending heartbeat (STRING)')
        }

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

  // 方法：更新数据交互配置
  const updateDataInteractionConfig = (config: Partial<DataInteractionConfig>) => {
    dataInteractionConfig.value = { ...dataInteractionConfig.value, ...config }
    saveConfig()
  }

  // 方法：更新登录包配置
  const updateLoginConfig = (config: Partial<LoginConfig>) => {
    loginConfig.value = { ...loginConfig.value, ...config }
    saveConfig()
  }

  // 方法：解析完整的 URL 地址（兼容旧版本）
  const parseConnectionString = (urlStr: string): boolean => {
    try {
      // 简单的补全，如果用户没写协议，默认 ws://
      if (!urlStr.includes('://')) {
        urlStr = 'ws://' + urlStr
      }

      const url = new URL(urlStr)
      const protocolStr = url.protocol.replace(':', '')

      // 更新 serverConfig
      if (['ws', 'wss', 'tcp', 'udp', 'mqtt', 'http'].includes(protocolStr)) {
        serverConfig.value.protocol = protocolStr as ConnectionProtocol
        serverConfig.value.parsedProtocol = protocolStr as ConnectionProtocol
      }

      serverConfig.value.host = url.hostname
      serverConfig.value.parsedHost = url.hostname
      serverConfig.value.port = parseInt(url.port) || (protocolStr === 'http' ? 80 : 18080)
      serverConfig.value.parsedPort = serverConfig.value.port

      // 如果 URL 里面带了 ?sn=xxx，也同步更新 deviceConfig
      const sn = url.searchParams.get('sn')
      if (sn) {
        deviceConfig.value.sn = sn
      }

      return true
    } catch (e) {
      console.error('URL Parse Error', e)
      return false
    }
  }

  // 方法:保存配置到本地存储
  const saveConfig = () => {
    const config = {
      server: serverConfig.value,
      device: deviceConfig.value,
      heartbeat: heartbeatConfig.value,
      login: loginConfig.value,
      dataInteraction: dataInteractionConfig.value
    }
    localStorage.setItem('devlinker-config', JSON.stringify(config))
  }

  // 方法：从本地存储加载配置
  const loadConfig = () => {
    const saved = localStorage.getItem('devlinker-config')
    if (saved) {
      try {
        const config = JSON.parse(saved)

        // 加载服务器配置
        if (config.server) {
          serverConfig.value = {
            ...serverConfig.value,
            ...config.server
          }

          // 如果旧版本配置没有新字段，初始化它们
          if (!serverConfig.value.protocolType) {
            serverConfig.value.protocolType = 'WebSocket'
          }
          if (!serverConfig.value.fullAddress) {
            serverConfig.value.fullAddress = `${serverConfig.value.protocol || 'ws'}://${serverConfig.value.host || 'localhost'}:${serverConfig.value.port || 18080}`
          }
          if (!serverConfig.value.parsedHost) {
            serverConfig.value.parsedHost = serverConfig.value.host || 'localhost'
          }
          if (!serverConfig.value.parsedPort) {
            serverConfig.value.parsedPort = serverConfig.value.port || 18080
          }
          if (!serverConfig.value.parsedProtocol) {
            serverConfig.value.parsedProtocol = serverConfig.value.protocol || 'ws'
          }
        }

        deviceConfig.value = config.device || deviceConfig.value
        heartbeatConfig.value = config.heartbeat || heartbeatConfig.value
        loginConfig.value = config.login || loginConfig.value
        dataInteractionConfig.value = config.dataInteraction || dataInteractionConfig.value

        // 端口兼容处理：如果端口是旧端口，自动迁移到新端口
        if (serverConfig.value.port === 8080) {
          console.log('Migrating port from 8080 to 18080')
          serverConfig.value.port = 18080
          serverConfig.value.parsedPort = 18080
        }
        if (serverConfig.value.port === 8888) {
          console.log('Migrating port from 8888 to 18888')
          serverConfig.value.port = 18888
          serverConfig.value.parsedPort = 18888
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
    loginConfig,
    dataInteractionConfig,
    connectionStatus,
    currentConnection,
    wsManager,
    tcpSocket,
    // actions
    updateServerConfig,
    updateDeviceConfig,
    updateHeartbeatConfig,
    updateLoginConfig,
    updateDataInteractionConfig,
    parseAddress,
    parseConnectionString,
    setConnectionStatus,
    setConnectionManager,
    sendData,
    startHeartbeat,
    stopHeartbeat,
    saveConfig,
    loadConfig
  }
})
