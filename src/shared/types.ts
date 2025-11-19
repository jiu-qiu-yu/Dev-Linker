// 共享类型定义

export type ConnectionProtocol = 'ws' | 'wss' | 'tcp'

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'failed'
  | 'reconnecting'

export type DataFormat = 'string' | 'hex'

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
  format: DataFormat
nexport interface DataInteractionConfig {
  logFormat: DataFormat
}
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
