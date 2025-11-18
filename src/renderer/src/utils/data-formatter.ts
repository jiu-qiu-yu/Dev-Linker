/**
 * 数据格式转换工具
 * 支持 String 和 Hex 之间的转换
 */

export type DataFormat = 'string' | 'hex'

export class DataFormatter {
  /**
   * 字符串转十六进制
   */
  static stringToHex(str: string): string {
    const hex = Array.from(str)
      .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('')
    return hex.toUpperCase()
  }

  /**
   * 十六进制转字符串
   */
  static hexToString(hex: string): string {
    // 移除空格和特殊字符
    const cleanHex = hex.replace(/\s/g, '').replace(/^0x/, '')

    // 验证十六进制格式
    if (!/^[0-9A-Fa-f]*$/.test(cleanHex)) {
      throw new Error('Invalid hex format')
    }

    // 转换为字符串
    const bytes = []
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes.push(parseInt(cleanHex.substr(i, 2), 16))
    }

    return String.fromCharCode(...bytes)
  }

  /**
   * 验证数据格式
   */
  static validateData(data: string, format: DataFormat): boolean {
    if (!data || data.trim().length === 0) {
      return false
    }

    if (format === 'hex') {
      // 验证十六进制格式
      const cleanHex = data.replace(/\s/g, '').replace(/^0x/, '')
      return cleanHex.length % 2 === 0 && /^[0-9A-Fa-f]*$/.test(cleanHex)
    }

    // 字符串格式总是有效
    return true
  }

  /**
   * 格式化数据用于显示
   */
  static formatForDisplay(data: string, format: DataFormat, maxLength = 100): string {
    if (data.length <= maxLength) {
      return data
    }
    return data.substring(0, maxLength) + '...'
  }

  /**
   * 十六进制格式化（添加空格分隔）
   */
  static formatHex(hex: string): string {
    const cleanHex = hex.replace(/\s/g, '').replace(/^0x/, '')
    return cleanHex.match(/.{1,2}/g)?.join(' ') || cleanHex
  }

  /**
   * 获取错误提示信息
   */
  static getErrorMessage(format: DataFormat): string {
    if (format === 'hex') {
      return '请输入有效的十六进制数据（偶数位数字）'
    }
    return '请输入有效的数据'
  }
}
