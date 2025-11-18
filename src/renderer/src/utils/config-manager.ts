/**
 * 配置管理器
 * 负责配置的保存、加载和持久化
 */

import type { ServerConfig, DeviceConfig, HeartbeatConfig } from '@shared/types'

export interface AppConfig {
  server: ServerConfig
  device: DeviceConfig
  heartbeat: HeartbeatConfig
}

export class ConfigManager {
  private static readonly CONFIG_KEY = 'devlinker-config'
  private static readonly CONFIG_VERSION = '1.0.0'

  /**
   * 保存配置
   */
  static save(config: AppConfig): void {
    try {
      const configWithVersion = {
        ...config,
        _version: this.CONFIG_VERSION,
        _savedAt: new Date().toISOString()
      }
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(configWithVersion))
      console.log('Configuration saved successfully')
    } catch (error) {
      console.error('Failed to save configuration:', error)
      throw new Error('配置保存失败')
    }
  }

  /**
   * 加载配置
   */
  static load(): AppConfig | null {
    try {
      const saved = localStorage.getItem(this.CONFIG_KEY)
      if (!saved) {
        console.log('No saved configuration found')
        return null
      }

      const config = JSON.parse(saved)

      // 验证配置版本（如果需要向后兼容）
      if (config._version && config._version !== this.CONFIG_VERSION) {
        console.warn('Configuration version mismatch:', config._version, this.CONFIG_VERSION)
        // 这里可以添加版本升级逻辑
      }

      // 返回主要配置，忽略内部字段
      const { _version, _savedAt, ...mainConfig } = config
      console.log('Configuration loaded successfully')
      return mainConfig as AppConfig
    } catch (error) {
      console.error('Failed to load configuration:', error)
      return null
    }
  }

  /**
   * 清除配置
   */
  static clear(): void {
    localStorage.removeItem(this.CONFIG_KEY)
    console.log('Configuration cleared')
  }

  /**
   * 导出配置为 JSON 文件
   */
  static async exportConfig(): Promise<string> {
    const config = this.load()
    if (!config) {
      throw new Error('没有可导出的配置')
    }

    const exportData = {
      ...config,
      _version: this.CONFIG_VERSION,
      _exportedAt: new Date().toISOString()
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * 从 JSON 文件导入配置
   */
  static async importConfig(jsonString: string): Promise<AppConfig> {
    try {
      const imported = JSON.parse(jsonString)

      // 验证必需字段
      if (!imported.server || !imported.device || !imported.heartbeat) {
        throw new Error('配置文件格式不正确')
      }

      // 清理内部字段
      const { _version, _exportedAt, ...config } = imported

      return config as AppConfig
    } catch (error) {
      console.error('Failed to import configuration:', error)
      throw new Error('配置文件导入失败: ' + (error as Error).message)
    }
  }

  /**
   * 获取默认配置
   */
  static getDefaultConfig(): AppConfig {
    return {
      server: {
        host: 'localhost',
        port: 8080,
        protocol: 'ws'
      },
      device: {
        sn: 'DEV-' + Date.now()
      },
      heartbeat: {
        enabled: false,
        interval: 30,
        content: 'PING',
        format: 'string'
      }
    }
  }
}
