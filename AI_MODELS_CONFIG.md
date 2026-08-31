# 🎯 AI 模型配置指南 - 使用本地 cursorweb2api

**配置日期**: 2026-01-04
**状态**: ✅ 已配置完成

---

## ✅ 配置总结

### 已配置的 AI 服务

| 服务 | 状态 | 模型数量 | 地址 |
|------|------|----------|------|
| **cursorweb2api** | ✅ 运行中 | 24个 | http://localhost:8000 |
| **FireCrawl** | ✅ 已配置 | - | API Key 已添加 |
| **Jina AI** | ✅ 已配置 | - | API Key 已添加 |
| **微信公众号** | ⏳ 等待白名单 | - | AppID/Secret 已配置 |

---

## 🤖 可用的 24 个 AI 模型

### OpenAI 系列（7个）
```
✅ gpt-5              - GPT-5（最新）
✅ gpt-5-codex        - GPT-5 Codex（编程专用）
✅ gpt-5-mini         - GPT-5 Mini（快速）
✅ gpt-5-nano         - GPT-5 Nano（超快）
✅ gpt-4.1            - GPT-4.1
✅ gpt-4o             - GPT-4o（多模态）
```

### Claude 系列（7个）
```
✅ claude-4.5-sonnet  - Claude 4.5 Sonnet（⭐ 推荐，平衡）
✅ claude-4.1-opus    - Claude 4.1 Opus
✅ claude-4-opus      - Claude 4 Opus（推理）
✅ claude-4-sonnet    - Claude 4 Sonnet
✅ claude-3.7-sonnet  - Claude 3.7 Sonnet
✅ claude-3.5-sonnet  - Claude 3.5 Sonnet
✅ claude-3.5-haiku   - Claude 3.5 Haiku（快速）
```

### Gemini 系列（2个）
```
✅ gemini-2.5-pro     - Gemini 2.5 Pro（⭐ 超长上下文 2M tokens）
✅ gemini-2.5-flash   - Gemini 2.5 Flash（⭐ 快速）
```

### 推理模型（4个）
```
✅ deepseek-r1        - DeepSeek R1（⭐ 推理之王）
✅ o3                 - OpenAI O3
✅ grok-3             - Grok 3
✅ grok-4             - Grok 4
```

### 专用模型（4个）
```
✅ code-supernova-1-million  - Code Supernova（⭐ 编程专用）
✅ kimi-k2-instruct          - Kimi K2（中文优化）
✅ deepseek-v3.1             - DeepSeek V3.1
```

---

## 🎯 项目中的模型使用策略

### 当前配置（.env）

```bash
# 默认模型：Claude 4.5 Sonnet（平衡性能）
DEFAULT_LLM_PROVIDER=CUSTOM
CUSTOM_LLM_MODEL=claude-4.5-sonnet

# 内容排名：DeepSeek R1（推理能力强，评分准确）
AI_CONTENT_RANKER_LLM_PROVIDER=CUSTOM:deepseek-r1

# 内容摘要：Claude 4.5 Sonnet（理解能力强，文本生成优秀）
AI_SUMMARIZER_LLM_PROVIDER=CUSTOM:claude-4.5-sonnet
```

### 推荐模型组合

#### 方案1：质量优先（当前配置）
```
采集分析  → DeepSeek R1（推理评分）
内容改写  → Claude 4.5 Sonnet（高质量文本）
```
**优点**：输出质量最高，适合正式发布
**速度**：中等

---

#### 方案2：速度优先
```
采集分析  → Gemini 2.5 Flash（快速评分）
内容改写  → Claude 3.5 Haiku（快速生成）
```
**优点**：处理速度快，适合大量文章
**质量**：良好

修改 .env：
```bash
AI_CONTENT_RANKER_LLM_PROVIDER=CUSTOM:gemini-2.5-flash
AI_SUMMARIZER_LLM_PROVIDER=CUSTOM:claude-3.5-haiku
```

---

#### 方案3：编程内容专用
```
采集分析  → DeepSeek R1（代码理解）
内容改写  → Code Supernova（代码优化）
```
**优点**：技术文章质量极高
**适用**：GitHub、技术博客内容

修改 .env：
```bash
AI_CONTENT_RANKER_LLM_PROVIDER=CUSTOM:deepseek-r1
AI_SUMMARIZER_LLM_PROVIDER=CUSTOM:code-supernova-1-million
```

---

#### 方案4：中文内容优化
```
采集分析  → DeepSeek R1（中文推理强）
内容改写  → Kimi K2（中文表达优秀）
```
**优点**：中文内容自然流畅
**适用**：中文资讯、社交媒体

修改 .env：
```bash
AI_CONTENT_RANKER_LLM_PROVIDER=CUSTOM:deepseek-r1
AI_SUMMARIZER_LLM_PROVIDER=CUSTOM:kimi-k2-instruct
```

---

#### 方案5：超长文本处理
```
采集分析  → Gemini 2.5 Pro（2M tokens上下文）
内容改写  → Gemini 2.5 Pro（长文本理解）
```
**优点**：处理超长文章无压力
**适用**：长篇报告、研究论文

修改 .env：
```bash
AI_CONTENT_RANKER_LLM_PROVIDER=CUSTOM:gemini-2.5-pro
AI_SUMMARIZER_LLM_PROVIDER=CUSTOM:gemini-2.5-pro
```

---

## 🔧 如何切换模型

### 方法1：修改 .env 文件

编辑 `C:\D\ai-trend-publish\.env`：

```bash
# 修改这两行即可
AI_CONTENT_RANKER_LLM_PROVIDER=CUSTOM:模型名称
AI_SUMMARIZER_LLM_PROVIDER=CUSTOM:模型名称
```

例如切换到 GPT-5：
```bash
AI_CONTENT_RANKER_LLM_PROVIDER=CUSTOM:gpt-5
AI_SUMMARIZER_LLM_PROVIDER=CUSTOM:gpt-5
```

### 方法2：动态切换（代码中）

项目支持运行时动态切换模型，无需重启。

---

## 📊 模型性能对比

| 模型 | 速度 | 质量 | 推理 | 代码 | 中文 | 适用场景 |
|------|------|------|------|------|------|----------|
| **Claude 4.5 Sonnet** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 通用（⭐推荐） |
| **DeepSeek R1** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 内容分析 |
| **GPT-5** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 创意内容 |
| **Gemini 2.5 Flash** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | 快速处理 |
| **Gemini 2.5 Pro** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | 超长文本 |
| **Code Supernova** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 技术文章 |
| **Kimi K2** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 中文内容 |
| **Claude 3.5 Haiku** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | 快速生成 |

---

## 💰 成本对比

### 使用 cursorweb2api（当前配置）

```
✅ 成本：免费（本地运行）
✅ 限制：无限制
✅ 速度：取决于本地服务
✅ 稳定性：本地控制
```

### 对比使用云端 API

| 服务 | 月费用（预估） | 限制 |
|------|---------------|------|
| OpenAI GPT-5 | $20-100+ | API 调用限制 |
| Claude API | $20-100+ | API 调用限制 |
| DeepSeek API | $10-50+ | 相对便宜 |
| **cursorweb2api** | **$0** | **无限制** ✅ |

**节省**：每月 $50-200+

---

## 🧪 测试模型连接

### 快速测试脚本

创建 `test_ai_models.py`：

```python
import requests

# cursorweb2api 配置
API_BASE = "http://localhost:8000/v1"
API_KEY = "aaa"

# 测试的模型
test_models = [
    "claude-4.5-sonnet",
    "deepseek-r1",
    "gpt-5",
    "gemini-2.5-flash"
]

print("🧪 测试 AI 模型连接\n")

for model in test_models:
    try:
        response = requests.post(
            f"{API_BASE}/chat/completions",
            headers={"Authorization": f"Bearer {API_KEY}"},
            json={
                "model": model,
                "messages": [{"role": "user", "content": "Hello"}],
                "max_tokens": 10
            },
            timeout=10
        )

        if response.status_code == 200:
            print(f"✅ {model:<25} - 连接正常")
        else:
            print(f"❌ {model:<25} - 错误: {response.status_code}")
    except Exception as e:
        print(f"❌ {model:<25} - 异常: {str(e)[:30]}")

print("\n✅ 测试完成！")
```

运行：
```bash
cd C:\D\ai-trend-publish
python test_ai_models.py
```

---

## 🎯 当前配置状态

### ✅ 已完成

- [x] **cursorweb2api 服务** - 运行中 (localhost:8000)
- [x] **24个 AI 模型** - 可用
- [x] **项目 .env 配置** - 已设置使用本地模型
- [x] **FireCrawl API** - 已配置
- [x] **Jina AI API** - 已配置
- [x] **微信公众号凭证** - 已配置

### ⏳ 待完成

- [ ] **微信 IP 白名单** - 需要添加 `104.28.157.115`
- [ ] **测试完整工作流** - IP 白名单添加后
- [ ] **配置工作流调度** - 每天凌晨3点自动运行

---

## 🚀 优势总结

### 使用本地 cursorweb2api 的好处

1. **💰 零成本** - 完全免费，无API费用
2. **🚀 高性能** - 本地运行，速度快
3. **🔄 灵活切换** - 24个模型随意切换
4. **📊 无限制** - 没有调用次数限制
5. **🔒 隐私** - 数据不离开本地
6. **⚡ 稳定** - 不受外部 API 限流影响

---

## 📝 下一步

1. **等待 IP 白名单配置完成**
2. **测试微信草稿箱发布**
3. **配置完整工作流**
4. **启动自动化服务**

---

**🎉 配置完成！现在只需等待 IP 白名单，就可以开始自动发布了！**
