import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ProtocolType, ConnectionProtocol, ServerConfig, DeviceConfig, HeartbeatConfig, LoginConfig, DataInteractionConfig, HTTPConfig } from '@shared/types'
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

export interface UDPSocket {
  send(data: string | Uint8Array): Promise<boolean>
  connect(host: string, port: number, localPort?: number): Promise<void>
  disconnect(): void
  isConnected(): Promise<boolean>
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Error) => void
  onData?: (data: Buffer | string) => void
}

export interface HTTPClient {
  send(data: string | object | Uint8Array, path?: string, method?: 'GET' | 'POST'): Promise<boolean>
  connect(url: string): Promise<void>
  disconnect(): void
  setDefaultHeaders(headers: Record<string, string>): void
  get(path: string, options?: any): Promise<any>
  post(path: string, data?: any, options?: any): Promise<any>
  put(path: string, data?: any, options?: any): Promise<any>
  delete(path: string, options?: any): Promise<any>
  onResponse?: (response: any) => void
  onError?: (error: Error) => void
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

  // HTTP 协议配置
  const httpConfig = ref<HTTPConfig>({
    fullUrl: 'http://localhost:18081/api/data',
    method: 'POST',
    headers: {},
    parsedScheme: 'http',
    parsedHost: 'localhost',
    parsedPort: 18081,
    parsedPath: '/api/data'
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
  const udpSocket = ref<UDPSocket | null>(null)
  const httpClient = ref<HTTPClient | null>(null)

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
      // 🔧 TCP/UDP 协议不是标准 URL 协议，需要特殊处理
      // 将 tcp:// 和 udp:// 临时替换为 http:// 进行解析，然后再改回来
      let tempInput = input
      let originalProtocol = ''

      if (input.startsWith('tcp://')) {
        tempInput = input.replace('tcp://', 'http://')
        originalProtocol = 'tcp'
      } else if (input.startsWith('udp://')) {
        tempInput = input.replace('udp://', 'http://')
        originalProtocol = 'udp'
      }

      const url = new URL(tempInput)

      // 2. 解析并更新底层参数
      serverConfig.value.parsedHost = url.hostname

      // 🔧 验证 hostname 不能为空（修复 UDP 地址解析 BUG）
      if (!serverConfig.value.parsedHost || serverConfig.value.parsedHost.trim() === '') {
        console.error('地址解析失败: hostname 为空')
        return false
      }

      // 端口处理：如果没填端口，根据协议给默认值
      if (!url.port) {
        const defaultPorts: Record<string, number> = {
          'ws:': 80,
          'wss:': 443,
          'http:': 18081,
          'https:': 443,
          'mqtt:': 1883,
          'tcp:': 18888,
          'udp:': 19000
        }
        // 如果是 tcp/udp 协议，使用原始协议名查询默认端口
        const protocolKey = originalProtocol ? `${originalProtocol}:` : url.protocol
        serverConfig.value.parsedPort = defaultPorts[protocolKey] || 80
      } else {
        serverConfig.value.parsedPort = parseInt(url.port)
      }

      // 协议处理：如果是临时替换的协议，改回原始协议
      let protocolStr: string
      if (originalProtocol) {
        protocolStr = originalProtocol
      } else {
        protocolStr = url.protocol.replace(':', '')
      }

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
  const setConnectionManager = (
    type: 'ws' | 'tcp' | 'udp' | 'http',
    manager: WebSocketManager | TCPSocket | UDPSocket | HTTPClient | null
  ) => {
    if (type === 'ws') {
      wsManager.value = manager as WebSocketManager
    } else if (type === 'tcp') {
      tcpSocket.value = manager as TCPSocket
    } else if (type === 'udp') {
      udpSocket.value = manager as UDPSocket
    } else if (type === 'http') {
      httpClient.value = manager as HTTPClient
    }
  }

  // 方法：发送数据
  const sendData = async (data: string | Uint8Array): Promise<boolean> => {
    if (serverConfig.value.parsedProtocol === 'ws' || serverConfig.value.parsedProtocol === 'wss') {
      return wsManager.value?.send(data) || false
    } else if (serverConfig.value.parsedProtocol === 'tcp') {
      return await tcpSocket.value?.send(data) || false
    } else if (serverConfig.value.parsedProtocol === 'udp') {
      return await udpSocket.value?.send(data) || false
    } else if (serverConfig.value.parsedProtocol === 'http' || serverConfig.value.parsedProtocol === 'https') {
      // HTTP 使用用户选择的请求方法和完整路径
      const method = httpConfig.value.method  // 使用用户配置的 GET/POST
      const path = httpConfig.value.parsedPath || '/'
      return await httpClient.value?.send(data, path, method) || false
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

  // 方法：更新 HTTP 配置
  const updateHTTPConfig = (config: Partial<HTTPConfig>) => {
    httpConfig.value = { ...httpConfig.value, ...config }
    saveConfig()
  }

  // 方法：解析 HTTP URL
  const parseHTTPUrl = (url: string): { success: boolean; autoCompleted: boolean; message?: string } => {
    let inputUrl = url.trim()
    let autoCompleted = false

    // 1. 如果没有协议头，自动补全为 http://
    if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
      inputUrl = 'http://' + inputUrl
      autoCompleted = true
    }

    try {
      const urlObj = new URL(inputUrl)

      // 2. 验证协议必须是 http 或 https
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        return {
          success: false,
          autoCompleted: false,
          message: 'URL 格式错误，请使用 http:// 或 https:// 开头'
        }
      }

      // 3. 解析各个组件
      const parsedScheme = urlObj.protocol.replace(':', '') as 'http' | 'https'
      const parsedHost = urlObj.hostname
      const parsedPath = urlObj.pathname + urlObj.search + urlObj.hash

      // 4. 处理端口（如果未指定，根据协议使用默认端口）
      let parsedPort: number
      if (urlObj.port) {
        parsedPort = parseInt(urlObj.port)
      } else {
        parsedPort = parsedScheme === 'https' ? 443 : 80
      }

      // 5. 更新 httpConfig
      httpConfig.value.fullUrl = inputUrl
      httpConfig.value.parsedScheme = parsedScheme
      httpConfig.value.parsedHost = parsedHost
      httpConfig.value.parsedPort = parsedPort
      httpConfig.value.parsedPath = parsedPath

      saveConfig()

      return {
        success: true,
        autoCompleted,
        message: autoCompleted ? '已自动补全为 http:// 协议，如需 HTTPS 请自行修改' : undefined
      }
    } catch (error) {
      console.error('HTTP URL 解析失败:', error)
      return {
        success: false,
        autoCompleted: false,
        message: 'URL 格式错误，请使用 http:// 或 https:// 开头'
      }
    }
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
      dataInteraction: dataInteractionConfig.value,
      http: httpConfig.value
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
        httpConfig.value = config.http || httpConfig.value

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
    httpConfig,
    connectionStatus,
    currentConnection,
    wsManager,
    tcpSocket,
    udpSocket,
    httpClient,
    // actions
    updateServerConfig,
    updateDeviceConfig,
    updateHeartbeatConfig,
    updateLoginConfig,
    updateDataInteractionConfig,
    updateHTTPConfig,
    parseAddress,
    parseHTTPUrl,
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
