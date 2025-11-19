# 4G模块模拟器 - 字符串与HEX格式区分修复总结

## 问题描述

**原始问题**：
- 字符串发送"aadd"，后端误判为HEX数据显示：`[WS Server] Received(HEX):AA DD`
- 应该显示：`[WS Server] Received:aadd`

**根本原因**：
- 字符串和HEX数据都以文本形式发送
- 后端通过数据格式自动判断，导致纯字母字符串（如"aadd"）被误判为HEX

## 解决方案

### 核心思路
为字符串数据添加特殊前缀"STR:"，让后端能明确区分：
- **字符串模式**：发送 `STR:{data}`
- **HEX模式**：发送二进制数据 `0xAA 0xDD 0xAC`

### 修改内容

#### 1. 前端发送逻辑（WebSocket）

**文件**: `src/renderer/src/utils/websocket.ts`

**发送修改**：
```typescript
if (data instanceof Uint8Array) {
  // HEX格式：发送二进制数据
  console.log('[WebSocket] Sending binary data (HEX format), length:', data.length)
  this.ws.send(data.buffer)
} else {
  // 字符串格式：添加"STR:"前缀
  const prefixedData = `STR:${data}`
  console.log('[WebSocket] Sending string data with STR prefix:', data)
  this.ws.send(prefixedData)
}
```

**接收修改**：
```typescript
this.ws.onmessage = (event) => {
  try {
    const jsonData = JSON.parse(event.data)
    if (jsonData.type === 'echo' && jsonData.data) {
      // 处理echo消息，提取实际数据
      const actualData = jsonData.data
      // 移除"STR:"前缀
      const cleanedData = actualData.startsWith('STR:') ?
        actualData.substring(4) : actualData
      this.onMessage?.(cleanedData)
    }
  } catch (error) {
    this.onMessage?.(event.data)
  }
}
```

#### 2. 后端接收逻辑（WebSocket服务器）

**文件**: `test-server/ws-server.js`

```javascript
ws.on('message', (data, isBinary) => {
  if (isBinary) {
    // 二进制数据 → HEX显示
    const hexString = data.toString('hex').toUpperCase()
    const formattedHex = hexString.match(/.{1,2}/g).join(' ')
    console.log(`[WS Server] Received(HEX):${formattedHex}`)
    ws.send(data, { binary: true })
  } else {
    // 文本数据
    const receivedData = data.toString('utf8')

    if (receivedData.startsWith('STR:')) {
      // 字符串格式，移除前缀显示
      const actualString = receivedData.substring(4)
      console.log(`[WS Server] Received:${actualString}`)
    } else {
      // 自动判断是否为HEX格式
      const cleanData = receivedData.replace(/\s/g, '')
      if (cleanData.length > 0 && cleanData.length % 2 === 0 &&
          /^[0-9A-Fa-f]+$/.test(cleanData)) {
        const formattedHex = cleanData.toUpperCase().match(/.{1,2}/g).join(' ')
        console.log(`[WS Server] Received(HEX):${formattedHex}`)
      } else {
        console.log(`[WS Server] Received:${receivedData}`)
      }
    }
  }
})
```

## 测试结果

### 测试用例1: 字符串"aadd"
- **发送**: `STR:aadd`
- **后端接收**: 检测到"STR:"前缀
- **显示**: `[WS Server] Received:aadd` ✅

### 测试用例2: 字符串"dd"
- **发送**: `STR:dd`
- **后端接收**: 检测到"STR:"前缀
- **显示**: `[WS Server] Received:dd` ✅

### 测试用例3: HEX数据"AA DD AC"
- **发送**: 二进制 `[0xAA, 0xDD, 0xAC]`
- **后端接收**: 二进制数据
- **显示**: `[WS Server] Received(HEX):AA DD AC` ✅

### 测试用例4: 无前缀HEX字符串"AADDAC"
- **发送**: `AADDAC`
- **后端接收**: 自动识别为HEX（偶数位，全为0-9A-F）
- **显示**: `[WS Server] Received(HEX):AA DD AC` ✅

## 数据对比

| 发送格式 | 输入内容 | 实际发送 | 后端显示 |
|---------|---------|---------|---------|
| 字符串 | `aadd` | `STR:aadd` | `Received:aadd` |
| 字符串 | `dd` | `STR:dd` | `Received:dd` |
| HEX | `AA DD AC` | `[0xAA,0xDD,0xAC]` | `Received(HEX):AA DD AC` |

## 关键改进

1. **前端区分机制**
   - 字符串模式：添加"STR:"前缀
   - HEX模式：发送二进制数据

2. **后端识别逻辑**
   - 检测"STR:"前缀 → 字符串格式
   - 二进制数据 → HEX格式
   - 无前缀纯字母数字 → 自动判断

3. **回显处理**
   - 前端收到echo消息时移除"STR:"前缀
   - 确保显示数据正确

## 兼容性

✅ **向后兼容**：无STR前缀的HEX字符串仍可被自动识别
✅ **错误处理**：非JSON格式数据直接透传
✅ **调试友好**：前端日志显示是否添加STR前缀

## 验证方法

```bash
# 启动WebSocket服务器
node test-server/ws-server.js

# 启动前端应用
npm run dev

# 在前端应用中测试：
# 1. 字符串模式输入 "aadd" → 应显示 "Received:aadd"
# 2. HEX模式输入 "AA DD AC" → 应显示 "Received(HEX):AA DD AC"
```

## 总结

修复成功解决了字符串与HEX格式的区分问题，通过"STR:"前缀机制确保：
- ✅ 字符串发送正确显示为字符串格式
- ✅ HEX发送正确显示为HEX格式
- ✅ 无STR前缀的HEX字符串仍可自动识别
- ✅ 后端能准确区分两种格式并正确显示

**问题完全解决！** (*^▽^*) ♡
