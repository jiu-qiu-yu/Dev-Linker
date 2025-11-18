import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { TCPSocketManager } from './tcp-socket'

class AppWindow {
  private mainWindow: any = null
  private tcpManager: TCPSocketManager | null = null

  constructor() {
    this.setupApp()
  }

  private setupApp(): void {
    app.whenReady().then(() => {
      this.createMainWindow()
      this.setupIpcHandlers()
    })

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow()
      }
    })
  }

  private createMainWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 900,
      minWidth: 800,
      minHeight: 700,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, 'preload.js')
      },
      titleBarStyle: 'default',
      autoHideMenuBar: true // 隐藏菜单栏节省空间
    })

    // 开发模式下加载 Vite 开发服务器
    if (process.env.VITE_DEV_SERVER_URL) {
      this.mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
      this.mainWindow.webContents.openDevTools()
    } else {
      this.mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show()
    })

    this.mainWindow.on('closed', () => {
      this.mainWindow = null
    })
  }

  private setupIpcHandlers(): void {
    // 创建 TCP 连接管理器实例
    this.tcpManager = new TCPSocketManager()

    // 监听 TCP 事件并转发到渲染进程
    this.tcpManager.on('connected', () => {
      this.mainWindow?.webContents.send('tcp-connected')
    })

    this.tcpManager.on('disconnected', () => {
      this.mainWindow?.webContents.send('tcp-disconnected')
    })

    this.tcpManager.on('data', (data: Buffer) => {
      this.mainWindow?.webContents.send('tcp-data', data.toString())
    })

    this.tcpManager.on('error', (error: Error) => {
      this.mainWindow?.webContents.send('tcp-error', error.message)
    })

    this.tcpManager.on('timeout', () => {
      this.mainWindow?.webContents.send('tcp-error', 'Connection timeout')
    })

    // 文件对话框
    ipcMain.handle('show-save-dialog', async (_event: any, options: any) => {
      const result = await dialog.showSaveDialog(this.mainWindow!, options)
      return result
    })

    // TCP 连接处理
    ipcMain.handle('tcp-connect', async (_event: any, { host, port }: { host: string, port: number }) => {
      if (!this.tcpManager) {
        this.tcpManager = new TCPSocketManager()
      }
      try {
        await this.tcpManager.connect({ host, port })
        return true
      } catch (error) {
        console.error('[Main] TCP connect error:', error)
        throw error
      }
    })

    // TCP 断开连接
    ipcMain.handle('tcp-disconnect', async () => {
      if (this.tcpManager) {
        this.tcpManager.disconnect()
        return true
      }
      return false
    })

    // TCP 发送数据
    ipcMain.handle('tcp-send', async (_event: any, { data }: { data: string }) => {
      if (this.tcpManager && this.tcpManager.isConnected()) {
        return this.tcpManager.send(data)
      }
      return false
    })

    // TCP 连接状态
    ipcMain.handle('tcp-is-connected', async () => {
      return this.tcpManager?.isConnected() || false
    })
  }
}

new AppWindow()
