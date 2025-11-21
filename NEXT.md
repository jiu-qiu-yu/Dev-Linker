# Dev-Linker 开发进度

_最后更新：2025-11-21_

---

## 当前状态

### ✅ 已完成
- **测试服务器**：5 种协议（WebSocket, TCP, UDP, MQTT, HTTP）+ 统一启动脚本
- **客户端库**：所有协议客户端实现完成（`utils/` 目录）
- **主进程管理**：TCP/UDP Socket 管理器（`src/main/`）
- **WebSocket 协议**：✅ 完整实现，状态管理、UI 集成、配置面板
- **TCP 协议**：✅ 完整实现，状态管理、UI 集成、配置面板
- **UDP 协议**：✅ **完整实现并修复所有 BUG（2025-11-21）**
  - ✅ 地址解析支持 TCP/UDP 自定义协议
  - ✅ 连接验证机制（发送测试包并等待响应）
  - ✅ 防止伪连接成功（超时检测）
  - ✅ 管理器检查修复（DataInteraction.vue）
  - ✅ 资源清理完善（定时器清理）

### ❌ 未开始
- **HTTP 协议**：状态管理、UI 集成、配置面板
- **MQTT 协议**：状态管理、UI 集成、配置面板、主题管理

---

## 下一步工作

### ✅ ~~优先级 1：修复 UDP 连接逻辑~~ **（已完成 2025-11-21）**

**修复内容**：
1. **地址解析修复**（`connection.ts:93-179`）
   - ✅ 添加 TCP/UDP 协议临时映射机制（映射为 http:// 解析）
   - ✅ 添加 hostname 空值验证，防止空地址通过验证
   - ✅ 支持完整地址格式：`tcp://localhost:18888`, `udp://localhost:19000`

2. **连接验证机制**（`udp-socket.ts:27-136`）
   - ✅ Socket bind 后自动发送初始化测试包 `jiuqiu_init_1`
   - ✅ 等待服务器响应（超时 3 秒）
   - ✅ 收到响应 → 连接成功，超时 → 连接失败
   - ✅ 解决"伪连接成功"问题（端口不存在仍显示成功）

3. **管理器检查修复**（`DataInteraction.vue:345`）
   - ✅ 添加 `udpSocket` 管理器检查
   - ✅ 修复"连接管理器未初始化"错误

4. **资源管理优化**（`udp-socket.ts:169-182`）
   - ✅ `disconnect()` 清理连接超时定时器
   - ✅ 防止内存泄漏

**测试验证**：
- ✅ localhost:19000（有服务器）→ 连接成功
- ✅ localhost:1900（无服务器）→ 连接失败（超时 3 秒）
- ✅ localhost:8333（无服务器）→ 连接失败（超时 3 秒）
- ✅ localh:19000（错误主机）→ 连接失败（发送错误）
- ✅ 数据发送接收正常工作

---

### 优先级 2：HTTP 协议集成

**需要修改的文件**：
1. `src/renderer/src/store/connection.ts`
   - 添加 `httpClient` 管理器
   - 添加 `httpConfig` 状态（endpoint, method, headers）
   - 扩展 `sendData()` 支持 HTTP
   - 添加 `updateHTTPConfig()` 方法

2. `src/renderer/src/views/MainView.vue`
   - 导入 `HTTPClient`
   - 添加 HTTP 连接/断开逻辑
   - 移除 HTTP 选项的 `disabled` 状态（line 19）

3. `src/renderer/src/components/ConnectionConfig.vue`
   - 添加 HTTP 配置面板（端点、方法、请求头编辑器）
   - 当 `protocolType === 'HTTP'` 时显示配置卡片

**特殊处理**：
- HTTP 无持久连接，"连接"概念改为测试连接（发送 GET / 请求）
- 心跳包改为定时轮询请求
- 支持 GET/POST/PUT/DELETE 方法
- 支持自定义请求头（键值对格式）

**参考实现**：
- 客户端库已完成：`src/renderer/src/utils/http.ts`
- 测试服务器已就绪：`test-server/http-server.js` (端口 18081)

---

### 优先级 3：MQTT 协议集成

**需要修改的文件**：
1. `src/renderer/src/store/connection.ts`
   - 添加 `mqttClient` 管理器
   - 添加 `mqttConfig` 状态（clientId, topic, qos, username, password）
   - 扩展 `sendData()` 支持 MQTT publish
   - 添加 `subscribeTopic()` 和 `unsubscribeTopic()` 方法
   - 添加 `updateMQTTConfig()` 方法

2. `src/renderer/src/views/MainView.vue`
   - 导入 `MQTTClient`
   - 添加 MQTT 连接/订阅逻辑
   - 移除 MQTT 选项的 `disabled` 状态（line 18）
   - 连接成功后自动订阅默认主题

3. `src/renderer/src/components/ConnectionConfig.vue`
   - 添加 MQTT 配置面板（ClientID、认证、主题、QoS）
   - 当 `protocolType === 'MQTT'` 时显示配置卡片

**特殊处理**：
- 需要实现主题管理（多主题订阅/取消订阅）
- 发布消息时需要指定主题参数
- 支持 QoS 0/1/2 三种质量等级
- 支持 username/password 认证（可选）

**参考实现**：
- 客户端库已完成：`src/renderer/src/utils/mqtt.ts`
- 测试服务器已就绪：`test-server/mqtt-server.js` (端口 1883)

---

## 技术要点

### UDP 协议特点（已完整实现）
- 无连接协议，通过发送测试包验证目标可达性
- 主进程实现（`src/main/udp-socket.ts`）
- 默认端口：19000
- 连接验证：3 秒超时，收到响应即认为连接成功
- 初始化标识：`jiuqiu_init_1`

### HTTP 协议特点
- 无持久连接，每次请求独立
- 纯前端实现（fetch API）
- 需要配置：endpoint（路径）、method（GET/POST/PUT/DELETE）、headers
- "心跳包"改为定时 GET 请求
- 默认端口：18081（测试服务器）

### MQTT 协议特点
- 发布/订阅模式
- 纯前端实现（mqtt.js）
- 需要配置：clientId、topic、qos、username/password（可选）
- 默认端口：1883
- QoS：0（最多一次）、1（至少一次）、2（恰好一次）

---

## 测试服务器

```bash
# 启动所有测试服务器（端口占用时显示失败状态，不会卡住）
npm run test:servers

# 单独启动
npm run test:ws    # WebSocket - 18080
npm run test:tcp   # TCP - 18888
npm run test:udp   # UDP - 19000
npm run test:mqtt  # MQTT - 1883
npm run test:http  # HTTP - 18081
```

---

## 已修改文件清单

### 测试服务器优化
- `test-server/start-all.js` - 改进启动检测，失败服务器不阻塞其他服务器
- `test-server/*-server.js` - 统一错误处理，端口占用时退出码为 1

### UDP 完整修复（2025-11-21）
- `src/renderer/src/store/connection.ts` (line 93-179)
  - ✅ 添加 TCP/UDP 协议解析支持（临时映射为 http://）
  - ✅ 添加 hostname 空值验证
  - ✅ 优化错误消息

- `src/main/udp-socket.ts` (line 1-136)
  - ✅ 添加连接验证机制（发送测试包并等待响应）
  - ✅ 添加超时检测（3 秒）
  - ✅ 添加 `connectionTimer` 定时器管理
  - ✅ 优化 `disconnect()` 资源清理

- `src/renderer/src/views/MainView.vue` (line 182, 272, 282)
  - ✅ 优化地址解析错误提示
  - ✅ 优化 UDP 连接成功/断开消息

- `src/renderer/src/components/DataInteraction.vue` (line 345)
  - ✅ 添加 `udpSocket` 管理器检查

### 配置修正
- UDP 默认端口：18888 → 19000（多处）

---

## 预估工作量

- ✅ ~~**UDP 问题修复**：1-2 小时~~ **（已完成）**
- **HTTP 集成**：2-3 小时
- **MQTT 集成**：3-4 小时
- **完整测试**：1-2 小时

**剩余工作量：5-9 小时**

---

## 开发建议

### HTTP 协议集成步骤
1. **先修改 Store**（`connection.ts`）
   - 参考 UDP 的集成方式
   - 注意 HTTP 的 send 方法需要 endpoint 参数

2. **再修改 MainView**（`MainView.vue`）
   - 参考 UDP 的连接逻辑
   - HTTP "连接"实际是测试 GET / 请求

3. **最后添加配置面板**（`ConnectionConfig.vue`）
   - 参考心跳包配置卡片的布局
   - 使用 `v-if="store.serverConfig.protocolType === 'HTTP'"`

### MQTT 协议集成步骤
1. **先修改 Store**（`connection.ts`）
   - 参考 UDP 的集成方式
   - 特别注意 `subscribeTopic()` 和 `unsubscribeTopic()` 方法

2. **再修改 MainView**（`MainView.vue`）
   - 参考 WebSocket 的连接逻辑（都有持久连接）
   - 连接成功后自动订阅默认主题

3. **最后添加配置面板**（`ConnectionConfig.vue`）
   - 需要更多配置项（ClientID、主题、QoS、认证）
   - 使用 `v-if="store.serverConfig.protocolType === 'MQTT'"`

---

## 遵循原则

- ✅ **KISS**：保持简单，避免过度设计
- ✅ **DRY**：复用现有代码，避免重复
- ✅ **SOLID**：单一职责，开闭原则，依赖倒置
- ✅ **先读后写**：修改前充分理解现有代码
- ✅ **测试验证**：每次修改后立即测试

---

_文档维护：浮浮酱 & Claude Code_
