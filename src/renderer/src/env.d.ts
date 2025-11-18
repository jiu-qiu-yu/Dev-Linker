/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare global {
  interface Window {
    electronAPI: {
      showSaveDialog: (options: any) => Promise<any>
      onFileSaved: (callback: (path: string) => void) => void
      removeAllListeners: (channel: string) => void
    }
    nodeEnv: {
      platform: string
      versions: any
    }
  }
}

export {}
