/**
 * HTTP/HTTPS 客户端管理器
 * 用于处理 HTTP/HTTPS 请求
 * 使用浏览器原生 fetch API
 */

export interface HTTPRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: string | object | Uint8Array
  timeout?: number  // 请求超时时间（毫秒）
}

export interface HTTPResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  data: any
  raw: string
}

export class HTTPClient {
  private baseUrl: string = ''
  private defaultHeaders: Record<string, string> = {}
  private abortController: AbortController | null = null

  // 事件回调
  public onResponse?: (response: HTTPResponse) => void
  public onError?: (error: Error) => void

  /**
   * 设置基础 URL
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url.endsWith('/') ? url.slice(0, -1) : url
    console.log('[HTTP] Base URL set to:', this.baseUrl)
  }

  /**
   * 设置默认请求头
   */
  setDefaultHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...headers }
    console.log('[HTTP] Default headers set:', this.defaultHeaders)
  }

  /**
   * "连接"到服务器（设置基础 URL）
   */
  async connect(url: string): Promise<void> {
    this.setBaseUrl(url)

    // 发送一个 ping 请求验证连接
    try {
      const response = await this.get('/')
      console.log('[HTTP] Connection test successful:', response.status)
    } catch (error) {
      console.error('[HTTP] Connection test failed:', error)
      throw error
    }
  }

  /**
   * 断开连接（取消当前请求）
   */
  disconnect(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
    this.baseUrl = ''
    console.log('[HTTP] Disconnected')
  }

  /**
   * 发送 GET 请求
   */
  async get(path: string, options?: HTTPRequestOptions): Promise<HTTPResponse> {
    return this.request(path, { ...options, method: 'GET' })
  }

  /**
   * 发送 POST 请求
   */
  async post(path: string, data?: any, options?: HTTPRequestOptions): Promise<HTTPResponse> {
    return this.request(path, { ...options, method: 'POST', body: data })
  }

  /**
   * 发送 PUT 请求
   */
  async put(path: string, data?: any, options?: HTTPRequestOptions): Promise<HTTPResponse> {
    return this.request(path, { ...options, method: 'PUT', body: data })
  }

  /**
   * 发送 DELETE 请求
   */
  async delete(path: string, options?: HTTPRequestOptions): Promise<HTTPResponse> {
    return this.request(path, { ...options, method: 'DELETE' })
  }

  /**
   * 发送 HTTP 请求
   */
  async request(path: string, options: HTTPRequestOptions = {}): Promise<HTTPResponse> {
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`
    const method = options.method || 'GET'

    console.log(`[HTTP] ${method} ${url}`)

    // 创建 AbortController 用于超时和取消
    this.abortController = new AbortController()
    const { signal } = this.abortController

    // 设置超时
    const timeout = options.timeout || 10000
    const timeoutId = setTimeout(() => {
      this.abortController?.abort()
    }, timeout)

    try {
      // 准备请求头
      const headers: Record<string, string> = {
        ...this.defaultHeaders,
        ...options.headers
      }

      // 准备请求体
      let body: string | undefined

      if (options.body) {
        if (options.body instanceof Uint8Array) {
          // Uint8Array 转换为 hex 字符串
          const hexString = Array.from(options.body)
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase()
          body = hexString
          headers['Content-Type'] = headers['Content-Type'] || 'text/plain'
        } else if (typeof options.body === 'object') {
          // 对象转换为 JSON
          body = JSON.stringify(options.body)
          headers['Content-Type'] = headers['Content-Type'] || 'application/json'
        } else {
          // 字符串直接使用
          body = options.body
          headers['Content-Type'] = headers['Content-Type'] || 'text/plain'
        }
      }

      // 发送请求
      const response = await fetch(url, {
        method,
        headers,
        body,
        signal
      })

      clearTimeout(timeoutId)

      // 获取响应文本
      const raw = await response.text()

      // 尝试解析为 JSON
      let data: any = raw
      try {
        data = JSON.parse(raw)
      } catch (e) {
        // 不是 JSON，使用原始文本
        data = raw
      }

      // 获取响应头
      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      const httpResponse: HTTPResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data,
        raw
      }

      console.log(`[HTTP] Response:`, httpResponse.status, httpResponse.statusText)

      this.onResponse?.(httpResponse)

      return httpResponse
    } catch (error) {
      clearTimeout(timeoutId)

      const err = error as Error
      console.error('[HTTP] Request failed:', err.message)

      this.onError?.(err)

      throw err
    } finally {
      this.abortController = null
    }
  }

  /**
   * 发送数据（兼容其他协议的接口）
   */
  async send(data: string | object | Uint8Array, endpoint: string = '/api/data'): Promise<boolean> {
    try {
      await this.post(endpoint, data)
      return true
    } catch (error) {
      console.error('[HTTP] Failed to send data:', error)
      return false
    }
  }

  /**
   * 获取连接状态
   */
  getStatus(): 'connected' | 'disconnected' {
    return this.baseUrl ? 'connected' : 'disconnected'
  }

  /**
   * 是否已连接
   */
  isConnected(): boolean {
    return this.baseUrl !== ''
  }
}
