# AI 模型切换使用指南

## 🎯 重要说明

您配置的 **29 个 AI 模型**分为两类：

### 1. Claude Code 内置模型（3个）

**用 `/model` 命令切换**：

```
/model              # 查看可用模型
/model opus-4.5     # 切换到 Opus 4.5 (最强)
/model sonnet-4.5   # 切换到 Sonnet 4.5 (平衡)
/model haiku-3.5    # 切换到 Haiku 3.5 (最快)
```

**这会改变我（助手）的模型。**

---

### 2. API 服务模型（29个）

**通过 API 调用使用**：

- cursorweb2api: 24个模型
- aardio: 5个模型

**这些不能用 `/model` 切换，需要通过编程调用。**

---

## 🚀 使用 API 模型的3种方法

### 方法1：命令行直接调用

```bash
# Claude 4.5 Sonnet
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer aaa" \
  -d '{"model":"claude-4.5-sonnet","messages":[{"role":"user","content":"你好"}]}'

# 切换到 GPT-4o
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer aaa" \
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"Hello"}]}'

# 切换到 Gemini 2.5 Pro
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer aaa" \
  -d '{"model":"gemini-2.5-pro","messages":[{"role":"user","content":"Hi"}]}'
```

**模型切换**：修改 `"model"` 字段即可。

---

### 方法2：Python 脚本（推荐）

#### 安装依赖

```bash
pip install requests
```

#### 使用示例脚本

```bash
# 运行切换器
cd C:\D\ai-trend-publish\.claude\examples
python model_switcher.py
```

#### 自己编写

```python
import requests

def chat(model, message):
    response = requests.post(
        "http://localhost:8000/v1/chat/completions",
        headers={
            "Content-Type": "application/json",
            "Authorization": "Bearer aaa"
        },
        json={
            "model": model,
            "messages": [{"role": "user", "content": message}]
        }
    )
    return response.json()["choices"][0]["message"]["content"]

# 使用不同模型
print(chat("claude-4.5-sonnet", "你好"))
print(chat("gpt-4o", "Hello"))
print(chat("deepseek-r1", "1+1=?"))
print(chat("gemini-2.5-flash", "快速回答"))
```

---

### 方法3：Node.js/JavaScript

#### 安装依赖

```bash
npm install axios
```

#### 使用示例脚本

```bash
# 交互式模式
cd C:\D\ai-trend-publish\.claude\examples
node model_switcher.js
```

**交互式命令**：
```
/model claude-4.5-sonnet  # 切换模型
/list                     # 列出所有模型
/exit                     # 退出
```

---

## 📋 所有可用模型

### cursorweb2api (24个)

#### OpenAI 系列
```
gpt-5, gpt-5-codex, gpt-5-mini, gpt-5-nano
gpt-4.1, gpt-4o
```

#### Claude 系列
```
claude-4.5-sonnet ⭐ 推荐
claude-4.1-opus
claude-4-opus
claude-4-sonnet
claude-3.7-sonnet
claude-3.5-sonnet
claude-3.5-haiku
```

#### Gemini 系列
```
gemini-2.5-pro ⭐ 超长上下文
gemini-2.5-flash ⭐ 快速
```

#### 推理模型
```
deepseek-r1 ⭐ 推理之王
o3, o4-mini
grok-3, grok-3-mini, grok-4
```

#### 专用模型
```
code-supernova-1-million ⭐ 编程
kimi-k2-instruct ⭐ 中文
deepseek-v3.1
```

### aardio 公益接口 (5个)

```
gemini-3-flash:online
deepseek
deepseek:thinking
aardio
aardio/gemini-3-flash:free
```

---

## 🎯 按场景选择模型

### 日常对话
```bash
# Claude 4.5 Sonnet（最推荐）
curl ... -d '{"model":"claude-4.5-sonnet","messages":[...]}'

# 或 GPT-4o
curl ... -d '{"model":"gpt-4o","messages":[...]}'
```

### 复杂推理
```bash
# DeepSeek R1
curl ... -d '{"model":"deepseek-r1","messages":[...]}'

# 或 O3
curl ... -d '{"model":"o3","messages":[...]}'
```

### 编程任务
```bash
# Code Supernova
curl ... -d '{"model":"code-supernova-1-million","messages":[...]}'

# 或 GPT-5 Codex
curl ... -d '{"model":"gpt-5-codex","messages":[...]}'
```

### 超长文本
```bash
# Gemini 2.5 Pro (2M tokens)
curl ... -d '{"model":"gemini-2.5-pro","messages":[...]}'
```

### 快速响应
```bash
# Gemini 2.5 Flash
curl ... -d '{"model":"gemini-2.5-flash","messages":[...]}'

# 或 Claude Haiku
curl ... -d '{"model":"claude-3.5-haiku","messages":[...]}'
```

### 中文内容
```bash
# Kimi K2
curl ... -d '{"model":"kimi-k2-instruct","messages":[...]}'

# 或 DeepSeek V3.1
curl ... -d '{"model":"deepseek-v3.1","messages":[...]}'
```

---

## 💡 快速切换技巧

### 创建 Shell 函数（Windows PowerShell）

```powershell
# 添加到 PowerShell Profile
function Ask-AI {
    param(
        [string]$Model = "claude-4.5-sonnet",
        [string]$Message
    )

    $body = @{
        model = $Model
        messages = @(
            @{
                role = "user"
                content = $Message
            }
        )
    } | ConvertTo-Json -Depth 10

    $response = Invoke-RestMethod `
        -Uri "http://localhost:8000/v1/chat/completions" `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer aaa"
        } `
        -Body $body

    return $response.choices[0].message.content
}

# 使用
Ask-AI -Model "claude-4.5-sonnet" -Message "你好"
Ask-AI -Model "gpt-4o" -Message "Hello"
Ask-AI -Model "deepseek-r1" -Message "推理问题"
```

### 创建 Bash 函数（Git Bash）

```bash
# 添加到 ~/.bashrc
ask_ai() {
    local model="${1:-claude-4.5-sonnet}"
    local message="${2:-Hello}"

    curl -s http://localhost:8000/v1/chat/completions \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer aaa" \
        -d "{\"model\":\"$model\",\"messages\":[{\"role\":\"user\",\"content\":\"$message\"}]}" \
        | jq -r '.choices[0].message.content'
}

# 使用
ask_ai claude-4.5-sonnet "你好"
ask_ai gpt-4o "Hello"
ask_ai deepseek-r1"1+1=?"
```

---

## 🔄 自动切换逻辑示例

```python
def smart_chat(message):
    """根据任务类型自动选择最佳模型"""

    # 编程任务
    if any(word in message.lower() for word in ['代码', 'code', '函数', 'bug']):
        model = 'code-supernova-1-million'

    # 推理任务
    elif any(word in message.lower() for word in ['推理', '证明', '分析']):
        model = 'deepseek-r1'

    # 长文本
    elif len(message) > 5000:
        model = 'gemini-2.5-pro'

    # 快速查询
    elif len(message) < 50:
        model = 'gemini-2.5-flash'

    # 默认：日常对话
    else:
        model = 'claude-4.5-sonnet'

    return chat(model, message)
```

---

## ⚙️ 高级：创建模型切换Web界面

可以用 Streamlit 或 Gradio 创建一个简单的 Web UI：

```python
import streamlit as st
import requests

st.title("🤖 AI 模型切换器")

# 模型选择
model = st.selectbox(
    "选择模型",
    ["claude-4.5-sonnet", "gpt-4o", "gemini-2.5-flash", "deepseek-r1", "code-supernova-1-million"]
)

# 输入框
message = st.text_area("输入您的问题")

if st.button("发送"):
    with st.spinner(f"使用 {model} 思考中..."):
        response = requests.post(
            "http://localhost:8000/v1/chat/completions",
            headers={"Content-Type": "application/json", "Authorization": "Bearer aaa"},
            json={"model": model, "messages": [{"role": "user", "content": message}]}
        )
        answer = response.json()["choices"][0]["message"]["content"]
        st.success(answer)
```

运行：`streamlit run app.py`

---

## 📊 总结

### Claude Code 的 `/model`

- ✅ 切换我（助手）的模型
- ✅ 只有 3 个：Opus 4.5, Sonnet 4.5, Haiku 3.5
- ✅ 用法：`/model opus-4.5`

### API 服务的 29 个模型

- ✅ 通过 API 调用使用
- ✅ 编程切换（修改 `model` 参数）
- ✅ 可以在 Python/Node.js 中灵活切换
- ✅ 可以创建自己的切换工具

### 推荐使用方式

1. **和我（Claude）对话** → 使用 `/model` 切换（3个模型）
2. **编程调用 AI** → 使用 API 切换（29个模型）
3. **创建工具** → 用示例脚本作为基础

---

**查看示例代码**：
- `.claude/examples/model_switcher.py` (Python)
- `.claude/examples/model_switcher.js` (Node.js)
