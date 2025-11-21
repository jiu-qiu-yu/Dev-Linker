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
- **HTTP 协议**：✅ **完整实现并优化（2025-11-21）**
  - ✅ 单一 URL 输入框设计（使用顶部地址栏）
  - ✅ 自动协议补全和 URL 解析
  - ✅ 支持 HTTP/HTTPS、云服务器/本地服务器
  - ✅ 仅支持 GET/POST 请求方式
  - ✅ 可选的自定义请求头
  - ✅ 实时 URL 解析结果显示
  - ✅ 状态管理、UI 集成、配置面板
  - ✅ **支持登录包和心跳包**（与其他协议一致）
  - ✅ 请求方式正确传递（修复混乱问题）
  - ✅ 数据发送管理器检查修复

### ✅ UI/UX 优化（2025-11-21）
- ✅ 地址输入框弹性布局（真正自适应长地址）
- ✅ 提示框位置优化（offset: 100，避免遮挡按钮）
- ✅ 连接时禁用协议切换（防止误操作）
- ✅ HTTP 默认地址修复（添加完整路径 `/api/data`）

### ❌ 未开始
- **MQTT 协议**：状态管理、UI 集成、配置面板、主题管理

---

## 最近完成的工作（2025-11-21）

### ✅ HTTP 协议完整优化
1. **修复 HTTP 默认地址不完整问题**
   - `MainView.vue:148` - placeholder 添加完整路径
   - `MainView.vue:175` - 默认地址添加 `/api/data`
   - `MainView.vue:184-186` - 自动解析默认 URL

2. **修复 HTTP 请求方式混乱问题**
   - `http.ts:213` - `send()` 方法添加 method 参数
   - `connection.ts:260-264` - `sendData()` 传递正确的 method
   - `connection.ts:35-36` - 更新 `HTTPClient` 接口定义

3. **修复 HTTP 发送数据失败问题**
   - `DataInteraction.vue:345` - 添加 `httpClient` 检查
   - 修复"连接管理器未初始化"错误

4. **启用 HTTP 登录包和心跳包支持**
   - `connection.ts:269-295` - 移除 HTTP 心跳包禁用逻辑
   - HTTP 协议现在与其他协议一样支持登录包和心跳包

### ✅ UI/UX 交互优化
1. **地址输入框弹性布局重构**
   - `MainView.vue:5-49` - 完整重新设计布局
   - 使用 `flex-1` + `min-w-0` 实现真正弹性伸缩
   - 固定元素添加 `flex-shrink-0` 防止压缩

2. **提示框位置统一优化**
   - 所有 ElMessage 添加 `offset: 100`
   - 避免遮挡顶部操作按钮
   - 共修改 22 处提示框调用

3. **协议切换安全控制**
   - `MainView.vue:18` - 添加 `:disabled="isConnected || isConnecting"`
   - 连接时禁用协议下拉框，防止误操作

---

## 下一步工作

### 优先级 1：MQTT 协议集成

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
   - 移除 MQTT 选项的 `disabled` 状态（line 24）
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

### WebSocket 协议特点（已完整实现）
- 持久连接协议
- 纯前端实现（浏览器原生 WebSocket API）
- 支持 ws:// 和 wss:// 协议
- 默认端口：18080
- 支持路径和查询参数

### TCP 协议特点（已完整实现）
- 持久连接协议
- 主进程实现（Node.js net 模块）
- 通过 IPC 与渲染进程通信
- 默认端口：18888
- 支持二进制数据传输

### UDP 协议特点（已完整实现）
- 无连接协议，通过发送测试包验证目标可达性
- 主进程实现（`src/main/udp-socket.ts`）
- 默认端口：19000
- 连接验证：3 秒超时，收到响应即认为连接成功
- 初始化标识：`jiuqiu_init_1`

### HTTP 协议特点（已完整实现 + 优化）
- **无持久连接**，每次请求独立
- **纯前端实现**（fetch API）
- **单一 URL 输入框**：使用顶部地址栏输入完整 URL
- **自动解析**：失焦或回车时自动解析协议/主机/端口/路径
- **支持场景**：
  - 云服务器：`https://api.example.com/api/report`
  - 本地服务器：`http://localhost:18081/api/data`
  - 内网服务器：`http://192.168.1.100:9000/upload`
  - HTTPS 本地：`https://localhost:18082/api/report`
- **自动补全**：无协议时自动补全为 `http://`
- **请求方式**：仅支持 GET/POST（简化设计）
- **请求头**：支持可选的自定义请求头
- **登录包和心跳包**：与其他协议一致，支持自动发送
- **默认端口**：18081（测试服务器）

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

### HTTP 完整实现与优化（2025-11-21）
- `src/shared/types.ts`
  - ✅ 重新设计 `HTTPConfig` 接口
  - ✅ 添加 `fullUrl`、`parsedScheme`、`parsedHost`、`parsedPort`、`parsedPath`
  - ✅ 请求方式限制为 GET/POST

- `src/renderer/src/store/connection.ts`
  - ✅ 添加 `httpConfig` 状态
  - ✅ 添加 `httpClient` 管理器引用
  - ✅ 添加 `parseHTTPUrl()` 方法：自动解析和校验 HTTP URL
  - ✅ 添加 `updateHTTPConfig()` 方法
  - ✅ 扩展 `setConnectionManager()` 支持 HTTP
  - ✅ 扩展 `sendData()` 支持 HTTP（传递正确的 method）
  - ✅ 添加 HTTP 配置持久化
  - ✅ 移除 HTTP 心跳包禁用逻辑（启用心跳包支持）
  - ✅ 更新 `HTTPClient` 接口定义

- `src/renderer/src/views/MainView.vue`
  - ✅ 导入 `HTTPClient`
  - ✅ 创建 `httpClient` 实例
  - ✅ 移除 HTTP 选项的 `disabled` 状态
  - ✅ 添加地址栏失焦事件：`handleAddressBlur()`
  - ✅ HTTP 协议时自动解析 URL
  - ✅ 添加 HTTP 连接逻辑（使用完整 URL）
  - ✅ 添加 HTTP 断开逻辑
  - ✅ 修正默认端口和路径为 `18081/api/data`
  - ✅ 协议切换时自动解析 HTTP URL
  - ✅ 地址输入框弹性布局重构
  - ✅ 协议下拉框添加禁用状态控制
  - ✅ 所有提示框添加 `offset: 100`

- `src/renderer/src/components/ConnectionConfig.vue`
  - ✅ 添加 HTTP 配置卡片（完整重新设计）
  - ✅ 请求方式选择器（GET/POST）
  - ✅ 自定义请求头编辑器（键值对，支持添加/删除）
  - ✅ URL 解析结果显示（蓝色背景，只读）
  - ✅ 工整对齐布局，视觉清晰

- `src/renderer/src/utils/http.ts`
  - ✅ 优化 `send()` 方法：添加 method 参数，使用传入的请求方式

- `src/renderer/src/components/DataInteraction.vue`
  - ✅ 添加 `httpClient` 管理器检查
  - ✅ 所有提示框添加 `offset: 100`

### 配置修正
- UDP 默认端口：18888 → 19000（多处）
- HTTP 默认端口：8080 → 18081（多处）
- HTTP 默认地址：`http://localhost:18081` → `http://localhost:18081/api/data`

---

## 预估工作量

- ✅ ~~**UDP 问题修复**：1-2 小时~~ **（已完成）**
- ✅ ~~**HTTP 集成**：2-3 小时~~ **（已完成，重新设计 3 小时）**
- ✅ ~~**HTTP 优化和 Bug 修复**：2 小时~~ **（已完成 2025-11-21）**
- ✅ ~~**UI/UX 交互优化**：1 小时~~ **（已完成 2025-11-21）**
- **MQTT 集成**：3-4 小时
- **完整测试**：1-2 小时

**剩余工作量：4-6 小时**

---

## 开发建议

### MQTT 协议集成步骤
1. **先修改 Store**（`connection.ts`）
   - 参考 HTTP 的集成方式
   - 特别注意 `subscribeTopic()` 和 `unsubscribeTopic()` 方法
   - 添加 `mqttConfig` 状态和持久化

2. **再修改 MainView**（`MainView.vue`）
   - 参考 WebSocket 的连接逻辑（都有持久连接）
   - 连接成功后自动订阅默认主题
   - 处理 MQTT 特有的消息接收（包含 topic）

3. **最后添加配置面板**（`ConnectionConfig.vue`）
   - 需要更多配置项（ClientID、主题、QoS、认证）
   - 使用 `v-if="store.serverConfig.protocolType === 'MQTT'"`
   - 参考 HTTP 配置面板的布局风格

---

## 遵循原则

- ✅ **KISS**：保持简单，避免过度设计
- ✅ **DRY**：复用现有代码，避免重复
- ✅ **SOLID**：单一职责，开闭原则，依赖倒置
- ✅ **先读后写**：修改前充分理解现有代码
- ✅ **测试验证**：每次修改后立即测试

---

## HTTP 协议使用说明

### URL 输入示例
```
# 云服务器
https://api.example.com/api/report
http://api.example.com:8080/api/report

# 本地服务器
http://localhost:18081/api/data
https://localhost:18082/api/report

# 内网服务器
http://192.168.1.100:9000/upload

# 简写（自动补全）
localhost:18081/api/data  →  http://localhost:18081/api/data
```

### 配置流程
1. 选择 HTTP 协议
2. 顶部地址栏输入完整 URL
3. 失焦或按回车，自动解析
4. 左下角查看解析结果
5. 配置请求方式（GET/POST）
6. （可选）添加自定义请求头
7. （可选）启用登录包和心跳包
8. 点击"连接"测试

### URL 解析结果
- **协议**：HTTP / HTTPS
- **主机**：域名或 IP 地址
- **端口**：自动或指定（http默认80，https默认443）
- **路径**：完整的请求路径

### 登录包和心跳包
- HTTP 协议现在完全支持登录包和心跳包
- 连接成功后自动发送登录包（如果启用）
- 定时发送心跳包（如果启用）
- 根据配置的请求方式（GET/POST）和路径发送

---

_文档维护：浮浮酱 & Claude Code_
