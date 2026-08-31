# 环境变量配置指南

本文档说明如何在云开发中配置环境变量，以确保 API Key 等敏感信息安全存储。

---

## 🔐 安全说明

**重要**: 请勿在代码中硬编码 API Key！所有敏感信息应通过云开发环境变量管理。

---

## 📋 需要配置的环境变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `GLM_API_KEY` | 智谱AI API密钥 | `your-api-key.xxxxx` |

---

## 🛠️ 配置步骤

### 1. 微信开发者工具配置

1. 打开微信开发者工具
2. 点击「云开发」控制台
3. 选择对应的环境
4. 进入「设置」→「环境变量」
5. 添加变量：
   - 名称：`GLM_API_KEY`
   - 值：你的智谱AI API密钥
6. 点击保存

### 2. 云函数中使用

云函数中通过 `process.env.VARIABLE_NAME` 读取：

```javascript
// 正确方式
const API_KEY = process.env.GLM_API_KEY || "";

// 错误方式（不要硬编码）
// const API_KEY = "your-api-key"; 
```

### 3. 前端调用

前端通过云函数调用，避免直接暴露密钥：

```javascript
// 推荐方式：通过云函数调用
const res = await wx.cloud.callFunction({
  name: "glm-api",
  data: {
    action: "chat",
    data: { messages: [...] }
  }
});
```

---

## ✅ 已修复的文件

以下文件已移除硬编码的 API Key：

### 云函数
- `cloudfunctions/glm-api/index.js` - 从环境变量读取 `GLM_API_KEY`
- `cloudfunctions/agentAI/index.js` - 从环境变量读取 `GLM_API_KEY`

### 前端页面
- `pages/content-creator/content-creator.js` - 通过云函数调用
- `pages/agents/agents.js` - 通过云函数调用

---

## ✅ 当前配置状态

| 云函数 | 超时时间 | 环境变量 | 状态 |
|--------|----------|----------|------|
| `glm-api` | 60秒 | `GLM_API_KEY` ✅ | 已配置 |
| `agentAI` | 60秒 | `GLM_API_KEY` ✅ | 已配置 |
| `generateImage-xd0Ly2` | 120秒 | 内置混元 | ✅ 已配置 |

**注意**: 
- `glm-api` 和 `agentAI` 使用 GLM API Key
- `generateImage-xd0Ly2` 使用 CloudBase 内置混元模型，无需额外配置

---

## 🔍 验证配置

### 1. 检查云函数日志

部署云函数后，检查日志中是否有警告：
```
⚠️ GLM_API_KEY 环境变量未配置，请在云开发控制台设置
```

### 2. 测试调用

```javascript
// 在云函数测试面板中测试
{
  "action": "chat",
  "data": {
    "model": "glm-4",
    "messages": [{"role": "user", "content": "测试"}]
  }
}
```

---

## ⚠️ 注意事项

1. **不要提交 .env 文件到 Git**
2. **定期轮换 API Key**
3. **监控 API 使用量**
4. **为不同环境使用不同的 API Key**

---

## 📚 参考文档

- [微信云开发 - 环境变量](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/openapi/openapi.html)
- [智谱AI API文档](https://open.bigmodel.cn/dev/api)

---

*更新时间: 2026-02-17*
