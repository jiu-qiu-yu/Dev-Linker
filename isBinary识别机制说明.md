# WebSocket isBinary 识别机制说明

## 核心问题

**Q**: 后端是怎么识别是HEX模式还是字符串模式的？

**A**: 通过WebSocket的`isBinary`参数，不是通过数据内容！

## 传输机制详解

### WebSocket发送数据的方式

#### 1. 字符串模式发送
```javascript
// 前端代码
const data = "Hello"
ws.send(data)  // 发送字符串
```

**传输层发生了什么？**
- WebSocket框架将字符串编码为UTF-8字节流
- 设置传输标志：`isBinary = false`
- 发送字节：`0x48 0x65 0x6C 0x6C 0x6F`

**后端接收：**
```javascript
ws.on('message', (data, isBinary) => {
  // data: Buffer 对象 (包含UTF-8编码的字节)
  // isBinary: false  ← 关键：这是文本数据
})
```

#### 2. HEX模式发送
```javascript
// 前端代码
const bytes = [0x48, 0x65, 0x6C, 0x6C, 0x6F]
ws.send(Buffer.from(bytes))  // 发送二进制
```

**传输层发生了什么？**
- 直接发送原始字节
- 设置传输标志：`isBinary = true`
- 发送字节：`0x48 0x65 0x6C 0x6C 0x6F`（相同字节）

**后端接收：**
```javascript
ws.on('message', (data, isBinary) => {
  // data: Buffer 对象 (原始二进制数据)
  // isBinary: true  ← 关键：这是二进制数据
})
```

## 后端识别逻辑

```javascript
ws.on('message', (data, isBinary) => {
  if (isBinary) {
    // 这是HEX模式发送的二进制数据
    console.log('Received: XX XX XX')  // 显示HEX格式

    // 返回二进制echo
    ws.send(data, { binary: true })
  } else {
    // 这是字符串模式发送的文本数据
    const receivedData = data.toString('utf8')

    // 将每个字符转换为ASCII的HEX值
    const asciiBytes = Buffer.from(receivedData, 'utf8')
    const hexValues = asciiBytes.map(b => b.toString(16).toUpperCase().padStart(2, '0'))
    console.log(`Received(str): ${hexValues.join(' ')}`)

    // 返回JSON echo
    ws.send(JSON.stringify({
      type: 'echo',
      data: receivedData,
      timestamp: Date.now(),
      isBinary: false
    }))
  }
})
```

## 关键演示：相同字节，不同传输方式

### 场景A: 发送 "AB"（字符串模式）
```javascript
ws.send("AB")
```

**发送的字节：** `0x41 0x42`（ASCII字符'A'和'B'）
**isBinary：** `false`
**后端显示：** `Received(str): 41 42`（将'A'和'B'转换为ASCII的HEX值）

### 场景B: 发送 [0x41, 0x42]（HEX模式）
```javascript
ws.send(Buffer.from([0x41, 0x42]))
```

**发送的字节：** `0x41 0x42`（**完全相同的字节**）
**isBinary：** `true`
**后端显示：** `Received: 41 42`（直接显示原始HEX值）

**注意：** 即使字节完全相同，由于`isBinary`不同，后端的处理和显示完全不同！

## 流程图

```
[用户选择模式]
       ↓
[字符串模式]              [HEX模式]
       ↓                       ↓
ws.send("DD")        ws.send(Buffer.from([0xDD]))
       ↓                       ↓
[UTF-8编码]            [直接二进制]
       ↓                       ↓
  isBinary=false        isBinary=true
       ↓                       ↓
   [网络传输]              [网络传输]
       ↓                       ↓
  后端接收：              后端接收：
  data, false            data, true
       ↓                       ↓
  转换为ASCII            直接显示HEX
  的HEX值                值
       ↓                       ↓
Received(str): 44 44   Received: DD
```

## 总结

1. **不是通过内容判断** - 后端不看数据是"DD"还是"Hello"
2. **通过传输类型判断** - `isBinary`是WebSocket协议自带的传输类型标记
3. **传输层标记** - 当发送字符串时，框架设置`isBinary=false`；发送二进制时，设置`isBinary=true`
4. **机制透明** - 前端开发者只需调用`ws.send()`，WebSocket框架自动处理标记

## 验证方法

观察前端日志：
```javascript
// 字符串模式
console.log('[WebSocket] Sending string data:', data)
// 输出: Sending string data: DD

// HEX模式
console.log('[WebSocket] Sending binary data (HEX format), length:', data.length)
// 输出: Sending binary data (HEX format), length: 1
```

后端会收到不同的`isBinary`值，从而采取不同的处理方式。

**这就是WebSocket协议的机制 - 通过传输类型标记区分数据格式！**
