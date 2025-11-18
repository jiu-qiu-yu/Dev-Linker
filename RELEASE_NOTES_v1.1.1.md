# Dev-Linker v1.1.1 发布说明

**发布日期：** 2025-11-18
**版本：** v1.1.1
**标签：** https://github.com/jiu-qiu-yu/Dev-Linker/releases/tag/v1.1.1

---

## 🔧 修复内容

### v1.1.1 (2025-11-18)

#### Bug 修复
1. **心跳包输入框红色波浪线问题**
   - 修复输入"jiuqiu"等字符串时显示红色波浪线
   - 在心跳内容输入框添加 `spellcheck="false"` 属性
   - 文件：`src/renderer/src/components/ConnectionConfig.vue`

2. **数据格式转换问题**
   - 修复心跳包发送时格式转换失效问题
   - 修复手动发送时HEX格式验证问题
   - 现在选择HEX格式会正确转换为十六进制码
   - 例如："jiuqiu" → "6A6975716975"
   - 文件：
     - `src/renderer/src/store/connection.ts`
     - `src/renderer/src/components/DataInteraction.vue`

3. **断开连接后自动重连问题**
   - 修复点击断开连接后系统自动重连的问题
   - 现在断开后需要手动点击连接才会重连
   - 添加 `manualDisconnect` 标志位区分手动断开和意外断开
   - 文件：
     - `src/renderer/src/utils/websocket.ts`
     - `src/main/tcp-socket.ts`

---

## 📊 变更统计

- **修复文件数：** 5
- **新增代码行：** +48
- **删除代码行：** -6

---

## 🧪 测试建议

### 心跳包测试
1. 启用心跳包
2. 内容输入：jiuqiu
3. 格式选择：HEX
4. 启动连接
5. 查看后端接收到的数据：应该是 `6A6975716975`（HEX格式）

### 断开连接测试
1. 连接服务器
2. 点击断开连接
3. 验证连接状态显示为"未连接"
4. 验证不会自动重连
5. 需要重新点击"连接服务器"按钮才会重连

---

## 📎 相关提交

- `234d806` - fix: 修复心跳包输入框红色波浪线和数据格式转换问题
- `41dbcc7` - fix: 修复点击断开连接后自动重连问题

---

## 🚀 升级说明

从 v1.1.0 升级到 v1.1.1：

```bash
git pull origin main
npm install
npm run build
```

---

## 🙏 致谢

感谢用户的反馈，帮助我们发现并修复这些问题！

---

**Dev-Linker Team**
