import { contextBridge, ipcRenderer } from 'electron'

// 暴露安全的 API 到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 文件对话框
  showSaveDialog: (options: any) => ipcRenderer.invoke('show-save-dialog', options),

  // 监听文件保存结果
  onFileSaved: (callback: (path: string) => void) => {
    ipcRenderer.on('file-saved', (event, path) => callback(path))
  },

  // 移除监听器
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  },

  // TCP 连接相关
  tcp: {
    connect: (host: string, port: number) => ipcRenderer.invoke('tcp-connect', { host, port }),
    disconnect: () => ipcRenderer.invoke('tcp-disconnect'),
    send: (data: string) => ipcRenderer.invoke('tcp-send', { data }),
    isConnected: () => ipcRenderer.invoke('tcp-is-connected')
  },

  // TCP 事件监听
  onTCPConnected: (callback: () => void) => {
    ipcRenderer.on('tcp-connected', callback)
  },
  onTCPDisconnected: (callback: () => void) => {
    ipcRenderer.on('tcp-disconnected', callback)
  },
  onTCPData: (callback: (data: string) => void) => {
    ipcRenderer.on('tcp-data', (event, data) => callback(data))
  },
  onTCPError: (callback: (error: string) => void) => {
    ipcRenderer.on('tcp-error', (event, error) => callback(error))
  }
})

// 暴露 Node.js 环境信息
contextBridge.exposeInMainWorld('nodeEnv', {
  platform: process.platform,
  versions: process.versions
})

declare global {
  interface Window {
    electronAPI: {
      showSaveDialog: (options: any) => Promise<any>
      onFileSaved: (callback: (path: string) => void) => void
      removeAllListeners: (channel: string) => void
      tcp: {
        connect: (host: string, port: number) => Promise<void>
        disconnect: () => Promise<void>
        send: (data: string) => Promise<boolean>
        isConnected: () => Promise<boolean>
      }
      onTCPConnected: (callback: () => void) => void
      onTCPDisconnected: (callback: () => void) => void
      onTCPData: (callback: (data: string) => void) => void
      onTCPError: (callback: (error: string) => void) => void
    }
    nodeEnv: {
      platform: string
      versions: any
    }
  }
}
