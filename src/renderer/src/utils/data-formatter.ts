/**
 * 数据格式转换工具
 * 支持 String 和 Hex 之间的转换和实时格式化
 */

export type DataFormat = 'string' | 'hex'

export class DataFormatter {
  /**
   * 字符串转十六进制（紧凑格式，无空格）
   */
  static stringToHexCompact(str: string): string {
    const hex = Array.from(str)
      .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('')
    return hex.toUpperCase()
  }

  /**
   * 字符串转十六进制（带空格格式，每两个字符一个空格）
   */
  static stringToHex(str: string): string {
    return this.formatHexWithSpaces(this.stringToHexCompact(str))
  }

  /**
   * 十六进制转字符串
   */
  static hexToString(hex: string): string {
    // 移除空格和特殊字符
    const cleanHex = hex.replace(/\s/g, '').replace(/^0x/, '')

    // 验证十六进制格式
    if (cleanHex.length === 0) {
      return ''
    }
    if (!/^[0-9A-Fa-f]*$/.test(cleanHex)) {
      throw new Error('Invalid hex format')
    }

    // 转换为字符串
    const bytes = []
    for (let i = 0; i < cleanHex.length; i += 2) {
      if (i + 1 < cleanHex.length) {
        bytes.push(parseInt(cleanHex.substr(i, 2), 16))
      } else {
        // 奇数位时，用0填充
        bytes.push(parseInt(cleanHex.substr(i, 1) + '0', 16))
      }
    }

    return String.fromCharCode(...bytes)
  }

  /**
   * 清理HEX输入，只保留有效的HEX字符
   */
  static sanitizeHexInput(input: string): string {
    return input.replace(/[^0-9A-Fa-f]/g, '').toUpperCase()
  }

  /**
   * 格式化HEX显示（每两个字符加一个空格）
   */
  static formatHexWithSpaces(hex: string): string {
    const cleanHex = hex.replace(/\s/g, '').toUpperCase()
    if (cleanHex.length === 0) return ''

    // 每两个字符分组
    const groups = []
    for (let i = 0; i < cleanHex.length; i += 2) {
      if (i + 1 < cleanHex.length) {
        groups.push(cleanHex.substr(i, 2))
      } else {
        // 奇数位时，单独显示
        groups.push(cleanHex.substr(i, 1) + '?')
      }
    }
    return groups.join(' ')
  }

  /**
   * 转换数据格式
   */
  static convert(data: string, fromFormat: DataFormat, toFormat: DataFormat): string {
    if (fromFormat === toFormat) {
      return data
    }

    if (fromFormat === 'string' && toFormat === 'hex') {
      // 字符串转HEX显示格式
      return this.stringToHex(data)
    } else if (fromFormat === 'hex' && toFormat === 'string') {
      // HEX转字符串
      return this.hexToString(data)
    }

    return data
  }

  /**
   * 验证数据格式
   */
  static validateData(data: string, format: DataFormat): boolean {
    if (!data || data.trim().length === 0) {
      return false
    }

    if (format === 'hex') {
      // 验证十六进制格式（允许奇数位）
      const cleanHex = data.replace(/\s/g, '').replace(/^0x/, '')
      return cleanHex.length > 0 && /^[0-9A-Fa-f]*$/.test(cleanHex)
    }

    // 字符串格式总是有效
    return true
  }

  /**
   * 验证并清理数据
   */
  static validateAndClean(data: string, format: DataFormat): { valid: boolean, cleaned: string, error?: string } {
    if (format === 'hex') {
      const cleaned = this.sanitizeHexInput(data)
      if (cleaned.length === 0) {
        return { valid: false, cleaned: '', error: '请输入有效的十六进制数据' }
      }
      return { valid: true, cleaned }
    }

    // 字符串格式总是有效
    return { valid: true, cleaned: data }
  }

  /**
   * 格式化数据用于显示
   */
  static formatForDisplay(data: string, format: DataFormat, maxLength = 100): string {
    if (format === 'hex') {
      // HEX格式显示时，如果过长则保持空格分隔但截断
      const displayData = this.formatHexWithSpaces(data)
      if (displayData.length <= maxLength) {
        return displayData
      }
      return displayData.substring(0, maxLength) + '...'
    }

    if (data.length <= maxLength) {
      return data
    }
    return data.substring(0, maxLength) + '...'
  }

  /**
   * 获取错误提示信息
   */
  static getErrorMessage(format: DataFormat): string {
    if (format === 'hex') {
      return '请输入有效的十六进制数据（0-9, A-F）'
    }
    return '请输入有效的数据'
  }

  /**
   * 自动检测数据格式
   */
  static autoDetectFormat(data: string): DataFormat {
    // 如果全是有效的HEX字符，则认为是HEX格式
    const cleanData = data.replace(/\s/g, '')
    if (cleanData.length > 0 && /^[0-9A-Fa-f]+$/.test(cleanData)) {
      return 'hex'
    }
    return 'string'
  }
}
