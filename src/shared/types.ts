// 共享类型定义

// 协议大类（UI显示用）
export type ProtocolType = 'WebSocket' | 'TCP' | 'UDP' | 'MQTT' | 'HTTP'

// 实际底层协议（底层逻辑用）
export type ConnectionProtocol = 'ws' | 'wss' | 'tcp' | 'udp' | 'mqtt' | 'http' | 'https'

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'failed'
  | 'reconnecting'

export type DataFormat = 'string' | 'hex'

export interface ServerConfig {
  // UI 状态
  protocolType: ProtocolType     // 用户选择的大类
  fullAddress: string            // 用户输入的完整字符串

  // 以下字段由解析函数生成，用于底层连接
  parsedHost: string
  parsedPort: number
  parsedProtocol: ConnectionProtocol
  parsedPath?: string            // WebSocket 可能需要的路径

  // 保留旧字段用于兼容
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
  format: DataFormat
}

export interface LoginConfig {
  enabled: boolean
  content: string
  format: DataFormat
}

export interface DataInteractionConfig {
  logFormat: DataFormat
}

export interface LogEntry {
  id: string
  timestamp: string
  type: 'connection' | 'send' | 'receive' | 'error'
  content: string
  format: DataFormat
}

export interface DataPacket {
  data: string
  format: DataFormat
  timestamp: number
}
