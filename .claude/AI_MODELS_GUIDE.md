# AI 多模型系统使用指南

## 🎉 系统概览

您现在拥有一个功能强大的本地AI模型系统，支持**24个顶级AI模型**的灵活切换使用，完全免费！

### ✅ 已配置完成

- **本地API服务**：`http://localhost:8000`
- **API Key**：`aaa`（固定）
- **配置文件**：`.claude/model-config.json`
- **执行代理**：`.claude/agents/ai-model-executor.md`
- **智能技能**：`.claude/skills/ai-assistant.md`
- **启动脚本**：`.claude/start-ai-api.bat` / `.sh`

---

## 📋 支持的24个模型

### 🔵 OpenAI系列 (7个)
| 模型 ID | 说明 | 适用场景 |
|---------|------|---------|
| `gpt-5` | 最新旗舰 | 通用任务 |
| `gpt-5-codex` | 编程专用 | 代码生成 ⭐ |
| `gpt-5-mini` | 轻量快速 | 简单任务 |
| `gpt-5-nano` | 超轻量 | 快速响应 |
| `gpt-4.1` | 增强版 | 复杂任务 |
| `gpt-4o` | 经典强大 | 日常对话 ⭐ |

### 🟣 Claude系列 (7个)
| 模型 ID | 说明 | 适用场景 |
|---------|------|---------|
| `claude-4.5-sonnet` | 最新旗舰 | 日常对话 ⭐⭐⭐ |
| `claude-4.1-opus` | 超强能力 | 复杂分析 |
| `claude-4-opus` | 强大分析 | 深度思考 |
| `claude-4-sonnet` | 平衡版 | 通用任务 |
| `claude-3.7-sonnet` | 稳定版 | 可靠输出 |
| `claude-3.5-sonnet` | 经典版 | 标准任务 |
| `claude-3.5-haiku` | 快速版 | 快速响应 ⭐ |

### 🔴 Google Gemini系列 (2个)
| 模型 ID | 说明 | 适用场景 |
|---------|------|---------|
| `gemini-2.5-pro` | 2M上下文 | 超长文本 ⭐⭐⭐ |
| `gemini-2.5-flash` | 快速响应 | 即时回复 ⭐⭐ |

### 🟡 推理模型 (4个)
| 模型 ID | 说明 | 适用场景 |
|---------|------|---------|
| `deepseek-r1` | 推理之王 | 复杂推理 ⭐⭐⭐ |
| `o3` | OpenAI推理 | 科学推理 ⭐ |
| `o4-mini` | 轻量推理 | 快速推理 |
| `grok-3` / `grok-4` | X AI推理 | 创新思维 |

### 🟢 专用模型 (4个)
| 模型 ID | 说明 | 适用场景 |
|---------|------|---------|
| `code-supernova-1-million` | 1M上下文 | 编程任务 ⭐⭐⭐ |
| `deepseek-v3.1` | 通用好手 | 各类任务 ⭐ |
| `kimi-k2-instruct` | 中文优化 | 中文内容 ⭐⭐ |

---

## 🚀 快速启动

### 方式1：使用启动脚本（推荐）

```bash
# Windows
.claude\start-ai-api.bat

# Linux/Mac
bash .claude/start-ai-api.sh
```

### 方式2：手动启动

```bash
cd C:\D\cursorweb2api
python main.py
```

### 验证服务

```bash
# 查看可用模型
curl http://localhost:8000/v1/models -H "Authorization: Bearer aaa"

# 测试 Claude
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer aaa" \
  -d '{"model":"claude-4.5-sonnet","messages":[{"role":"user","content":"Hello"}]}'
```

---

## 💡 使用示例

### 方式1：通过 Claude Code 自然语言触发

```
# 指定模型
"用 Claude 4.5 分析这段代码的时间复杂度"
"让 GPT-4o 帮我写一个快速排序"
"用 DeepSeek R1 推理一下这个数学问题"
"Gemini Pro 帮我总结这篇长文档"

# 自动选择（根据任务类型）
"帮我推理这个复杂问题"  → 自动使用 DeepSeek R1
"优化这段代码"          → 自动使用 Code Supernova
"快速回答一下"          → 自动使用 Gemini Flash
"处理这段中文内容"      → 自动使用 Kimi K2
```

### 方式2：直接API调用

#### 示例1：Claude 4.5 Sonnet - 日常对话

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer aaa" \
  -d '{
    "model": "claude-4.5-sonnet",
    "messages": [
      {"role": "user", "content": "解释一下什么是递归"}
    ],
    "max_tokens": 2000
  }'
```

#### 示例2：DeepSeek R1 - 复杂推理

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer aaa" \
  -d '{
    "model": "deepseek-r1",
    "messages": [
      {"role": "user", "content": "用三种不同方法证明勾股定理"}
    ],
    "max_tokens": 3000
  }'
```

#### 示例3：Gemini 2.5 Pro - 超长文本

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer aaa" \
  -d '{
    "model": "gemini-2.5-pro",
    "messages": [
      {"role": "user", "content": "分析这个10万字的小说... [超长文本]"}
    ],
    "max_tokens": 4000
  }'
```

#### 示例4：Code Supernova - 编程任务

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer aaa" \
  -d '{
    "model": "code-supernova-1-million",
    "messages": [
      {"role": "user", "content": "用Python实现一个LRU缓存"}
    ],
    "max_tokens": 2000
  }'
```

---

## 📊 模型选择策略

### 按任务类型推荐

| 任务类型 | 首选模型 | 备选模型 |
|----------|---------|---------|
| 💬 **日常对话** | `claude-4.5-sonnet` | `gpt-4o` |
| 🧠 **复杂推理** | `deepseek-r1` | `o3` |
| 💻 **编程任务** | `code-supernova-1-million` | `gpt-5-codex` |
| 📚 **超长文本** | `gemini-2.5-pro` | `code-supernova-1-million` |
| ⚡ **快速响应** | `gemini-2.5-flash` | `claude-3.5-haiku` |
| 🇨🇳 **中文内容** | `kimi-k2-instruct` | `deepseek-v3.1` |
| 🔬 **科学研究** | `o3` | `deepseek-r1` |
| 📝 **文本创作** | `claude-4.5-sonnet` | `gpt-5` |

### 性能对比

| 特性 | Claude 4.5 | GPT-4o | Gemini Pro | DeepSeek R1 | Code Supernova |
|------|-----------|--------|-----------|------------|---------------|
| 对话质量 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| 推理能力 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 编程能力 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 响应速度 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| 上下文长度 | 200K | 128K | 2M | 64K | 1M |
| 中文能力 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 🎯 高级技巧

### 1. 组合使用多个模型

```bash
# 第一步：用快速模型做初步分析
response1=$(curl -s http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer aaa" \
  -d '{"model":"gemini-2.5-flash","messages":[{"role":"user","content":"快速总结一下量子计算的核心概念"}]}')

# 第二步：用强大模型做深度分析
curl -s http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer aaa" \
  -d "{\"model\":\"deepseek-r1\",\"messages\":[{\"role\":\"user\",\"content\":\"基于这个总结：$response1，详细解释量子纠缠的数学原理\"}]}"
```

### 2. 并行对比多个模型

```bash
# 同时询问 Claude 和 GPT
curl -s http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer aaa" \
  -d '{"model":"claude-4.5-sonnet","messages":[{"role":"user","content":"什么是意识？"}]}' &

curl -s http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer aaa" \
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"什么是意识？"}]}' &

wait
```

### 3. 利用不同模型的特长

```
1. 用 Kimi K2 处理中文输入
2. 用 Code Supernova 生成代码
3. 用 Claude 4.5 优化文案
4. 用 DeepSeek R1 验证逻辑
5. 用 Gemini Pro 整合长文档
```

---

## ⚙️ 配置说明

### API 端点

```
Base URL: http://localhost:8000/v1
API Key: aaa
```

### 请求格式

```json
{
  "model": "模型ID",
  "messages": [
    {"role": "system", "content": "系统提示（可选）"},
    {"role": "user", "content": "用户消息"}
  ],
  "temperature": 0.7,
  "max_tokens": 2000,
  "top_p": 1.0,
  "frequency_penalty": 0.0,
  "presence_penalty": 0.0
}
```

### 响应格式

```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "created": 1767494274,
  "model": "claude-4.5-sonnet",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "回复内容"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  }
}
```

---

## 🔧 故障排除

### 问题1：连接失败

```bash
# 检查服务是否运行
curl http://localhost:8000/v1/models

# 重启服务
cd C:\D\cursorweb2api
python main.py
```

### 问题2：模型不可用

```bash
# 查看可用模型列表
curl http://localhost:8000/v1/models -H "Authorization: Bearer aaa"
```

### 问题3：响应超时

- 增加 `timeout` 参数
- 减少 `max_tokens`
- 使用更快的模型（如 `gemini-2.5-flash`）

---

## 📝 最佳实践

1. **根据任务选模型**：不要一直用同一个模型
2. **利用免费资源**：大胆尝试不同模型对比效果
3. **注意上下文限制**：超长文本用 Gemini Pro 或 Code Supernova
4. **组合使用**：快速模型筛选 + 强大模型精炼
5. **保持服务运行**：建议后台常驻API服务

---

## 🎉 总结

您现在拥有：
- ✅ 24个顶级AI模型
- ✅ 完全免费使用
- ✅ 灵活切换
- ✅ OpenAI兼容API
- ✅ 自动化配置

享受AI的强大能力吧！🚀

---

## 📞 支持

如有问题，请检查：
1. 服务是否运行在 `http://localhost:8000`
2. API Key 是否为 `aaa`
3. 模型ID是否正确
4. 配置文件：`.claude/model-config.json`
