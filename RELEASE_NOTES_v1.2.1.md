# Dev-Linker v1.2.1 发布说明

**发布日期：** 2025-11-18
**版本：** v1.2.1
**标签：** https://github.com/jiu-qiu-yu/Dev-Linker/releases/tag/v1.2.1

---

## 🔧 修复内容

### v1.2.1 (2025-11-18)

#### 功能增强
1. **心跳包配置格式转换功能**
   - 为心跳包配置添加完整的字符串/HEX格式实时转换功能
   - 与数据发送区域保持一致的用户体验

**具体功能**：
- 自动格式转换
  - 点击 "HEX" 按钮时，心跳包内容自动转换为HEX显示格式
  - 例如：心跳内容 "PING" → HEX模式显示 "50 49 4E 47"
  - 例如：心跳内容 "jiuqiu" → HEX模式显示 "6A 69 75 71 69 75"

- 自动格式转换（反向）
  - 点击 "字符串" 按钮时，HEX内容自动转换为字符串显示
  - 例如：HEX "50 49 4E 47" → 字符串模式显示 "PING"

- HEX输入过滤
  - 心跳包HEX模式下只允许输入有效的HEX字符（0-9, A-F, a-f）
  - 非HEX字符（如TTT、汉字等）自动过滤，输入无效果
  - 例如：输入 "TEST" → 输入框为空（被过滤）

- 输入框优化
  - 添加 @input 事件处理HEX输入过滤
  - 保持 spellcheck="false" 禁用拼写检查

---

## 📊 变更统计

- **修改文件数：** 1
- **新增代码行：** +29
- **删除代码行：** -1

---

## 🔧 技术实现

### 核心文件
**src/renderer/src/components/ConnectionConfig.vue**
- 导入 DataFormatter 和 watch
- 添加 lastHeartbeatFormat 记录上次格式
- handleHeartbeatInput() 处理HEX输入过滤
- watch 监听心跳包格式变化，自动转换内容

### 转换示例

| 心跳包内容 | HEX显示 | 字符串显示 |
|------------|---------|------------|
| PING | 50 49 4E 47 | PING |
| jiuqiu | 6A 69 75 71 69 75 | jiuqiu |
| 你好 | E4 BD A0 E5 A5 BD | 你好 |

---

## 🧪 测试建议

### 心跳包格式转换测试
1. 在心跳包配置中输入 "PING"
2. 点击 "HEX" 按钮
3. 验证显示：50 49 4E 47
4. 点击 "字符串" 按钮
5. 验证显示：PING
6. 切换到HEX模式，输入 "TTT"
7. 验证输入框为空（被过滤）

---

## 📎 相关提交

- `3701bcd` - feat: 为心跳包配置添加实时格式转换功能

---

## 🚀 升级说明

从 v1.2.0 升级到 v1.2.1：

```bash
git pull origin main
npm install
npm run build
```

---

## 🙏 致谢

感谢用户的反馈，让心跳包配置和数据发送区域保持一致的用户体验！

---

**Dev-Linker Team**
