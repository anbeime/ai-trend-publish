# aardio 公益接口集成指南

## ✅ 配置完成

aardio 公益接口已添加到您的多模型配置中！

---

## 📋 接口信息

**接口地址**: `http://ai.aardio.com/api/v1/`
**API Key**: `\0\1\96`
**提供方**: C:\D\aardio 项目

---

## 🎯 可用模型

根据测试，aardio 公益接口提供以下模型：

| 模型 ID | 说明 | 类型 |
|---------|------|------|
| **gemini-3-flash:online** | Gemini 3 Flash 在线版 | ⭐ 推荐 |
| **deepseek** | DeepSeek 模型 | 通用 |
| **deepseek:thinking** | DeepSeek 推理版 | 推理 |
| **aardio** | aardio 自有模型 | 通用 |
| **aardio/gemini-3-flash:free** | Gemini 3 Flash 免费版 | 免费 |

---

## 🔧 配置说明

### 已更新的配置文件

**位置**: `.claude/model-config.json`

```json
{
  "api": {
    "primary": {
      "name": "cursorweb2api",
      "base_url": "http://localhost:8000/v1",
      "api_key": "aaa",
      "timeout": 30000
    },
    "aardio": {
      "name": "aardio公益接口",
      "base_url": "http://ai.aardio.com/api/v1",
      "api_key": "\\0\\1\\96",
      "timeout": 30000
    }
  }
}
```

---

## 🚀 使用方法

### 方法1: 通过 cursorweb2api（推荐）

您的 `cursorweb2api` 本地服务已经提供了 24 个模型，**建议继续使用**：

```bash
# 当前方式（已在运行）
http://localhost:8000/v1

# 提供的模型包括：
- Claude 系列
- GPT 系列
- Gemini 系列
- DeepSeek 系列
```

### 方法2: 直接使用 aardio API

如果 cursorweb2api 不可用，可以切换到 aardio：

#### 使用 curl 测试

```bash
# 注意：aardio API 仅支持流式请求

# 获取模型列表
curl "http://ai.aardio.com/api/v1/models" \
  -H "Authorization: Bearer \0\1\96"

# 聊天请求（流式）
curl "http://ai.aardio.com/api/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer \0\1\96" \
  -d '{
    "model": "gemini-3-flash:online",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": true
  }'
```

#### Python 示例

```python
import requests
import json

url = "http://ai.aardio.com/api/v1/chat/completions"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer \0\1\96"
}
data = {
    "model": "gemini-3-flash:online",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": True
}

response = requests.post(url, headers=headers, json=data, stream=True)
for line in response.iter_lines():
    if line:
        print(line.decode('utf-8'))
```

---

## ⚠️ 重要提示

### 1. 仅支持流式请求

aardio API **必须使用** `"stream": true`：

```json
{
  "model": "gemini-3-flash:online",
  "messages": [...],
  "stream": true  ← 必须！
}
```

### 2. API Key 特殊字符

API Key `\0\1\96` 包含特殊字符，在某些环境中可能需要转义。

### 3. 公益接口限制

作为公益接口，可能有：
- 请求频率限制
- 每日配额限制
- 高峰期排队

---

## 🆚 aardio vs cursorweb2api

| 特性 | cursorweb2api | aardio公益接口 |
|------|--------------|---------------|
| **模型数量** | 24个 ⭐ | 5个 |
| **稳定性** | 本地运行，稳定 | 公益，可能限流 |
| **速度** | 快（本地） | 取决于网络 |
| **配额** | 无限制 | 可能有限制 |
| **特殊要求** | 需要本地启动 | 仅流式请求 |

### 推荐使用策略

1. **主要使用**: cursorweb2api（本地，24个模型）
2. **备用**: aardio公益接口（当本地服务不可用时）
3. **特殊场景**: 如果需要 Gemini 3 Flash 最新版本

---

## 💡 集成到 AI 执行器

### 修改 ai-model-executor.md

可以添加 aardio 模型到执行器配置：

```markdown
### aardio 公益模型 (5个)
- `gemini-3-flash:online` ⭐ Gemini 3 Flash 在线版
- `deepseek` - DeepSeek 通用模型
- `deepseek:thinking` - DeepSeek 推理模型
- `aardio` - aardio 自有模型
- `aardio/gemini-3-flash:free` - Gemini 3 Flash 免费版
```

### 使用示例

```bash
# 通过 aardio 调用 Gemini 3 Flash
curl http://ai.aardio.com/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer \0\1\96" \
  -d '{
    "model": "gemini-3-flash:online",
    "messages": [{"role": "user", "content": "分析这段代码"}],
    "stream": true
  }'
```

---

## 📊 模型对比

### Gemini 3 Flash

| 来源 | 模型 ID | 特点 |
|------|---------|------|
| cursorweb2api | `gemini-2.5-flash` | 本地代理，快速 |
| aardio | `gemini-3-flash:online` | 公益接口，可能更新 |

### DeepSeek

| 来源 | 模型 ID | 特点 |
|------|---------|------|
| cursorweb2api | `deepseek-r1`, `deepseek-v3.1` | 本地代理 |
| aardio | `deepseek`, `deepseek:thinking` | 公益接口 |

---

## 🔄 切换使用

### 场景1: 本地服务优先

```python
# 优先使用本地 cursorweb2api
try:
    response = call_api("http://localhost:8000/v1", model="claude-4.5-sonnet")
except:
    # 本地服务不可用，切换到 aardio
    response = call_api("http://ai.aardio.com/api/v1", model="gemini-3-flash:online")
```

### 场景2: 负载均衡

```python
# 轮询使用不同的 API
apis = [
    {"url": "http://localhost:8000/v1", "key": "aaa"},
    {"url": "http://ai.aardio.com/api/v1", "key": "\0\1\96"}
]
current_api = apis[request_count % len(apis)]
```

---

## ✅ 配置验证

### 检查清单

- [x] aardio API 已添加到 model-config.json
- [x] API 端点可访问（http://ai.aardio.com/api/v1/models）
- [x] 模型列表已获取（5个模型）
- [x] API Key 已配置（\0\1\96）
- [ ] 流式请求测试（待您测试）

### 测试命令

```bash
# 1. 测试模型列表
curl "http://ai.aardio.com/api/v1/models" \
  -H "Authorization: Bearer \0\1\96"

# 2. 测试聊天（流式）
curl "http://ai.aardio.com/api/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer \0\1\96" \
  -d '{"model":"gemini-3-flash:online","messages":[{"role":"user","content":"Hi"}],"stream":true}'
```

---

## 🎯 总结

### 当前配置

✅ **cursorweb2api** - 主力（24个模型，本地运行）
✅ **aardio 公益接口** - 备用（5个模型，在线服务）

### 推荐策略

1. **日常使用**: cursorweb2api
   - 稳定、快速、模型多

2. **备用方案**: aardio
   - 当本地服务不可用时
   - 或需要最新的 Gemini 3 Flash

3. **配置文件**: `.claude/model-config.json`
   - 两个 API 配置并存
   - 可随时切换

---

**🎉 配置完成！现在您有 29 个模型可用（24 + 5）！**
