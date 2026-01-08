---
name: ai-assistant
description: 智能助手 - 当用户想要使用特定AI模型（Claude、GPT、Gemini、DeepSeek等）时触发
---

# AI模型智能助手

## 触发场景

### 明确指定模型
- "用 Claude 分析这段代码"
- "让 GPT-4o 帮我写个函数"
- "用 DeepSeek 推理一下这个问题"
- "Gemini 帮我总结这篇文章"
- "用 Code Supernova 优化这段代码"

### 按任务类型（自动选择模型）
- "帮我推理/思考这个复杂问题" → DeepSeek R1
- "分析这个超长文档" → Gemini 2.5 Pro
- "快速回答一下" → Gemini 2.5 Flash
- "写/优化代码" → Code Supernova
- "中文内容处理" → Kimi K2

## 工作流程

1. **识别用户意图**
   - 明确指定的模型名称
   - 或根据任务类型选择最佳模型

2. **调用 ai-model-executor 子代理**
   - 传递模型选择
   - 传递用户的提示词
   - 传递可选参数（温度、最大token等）

3. **返回结果**
   - 展示模型响应
   - 标注使用的模型

## 模型推荐

### 最常用模型
- **claude-4.5-sonnet** - 日常对话、文本创作
- **deepseek-r1** - 复杂推理、逻辑分析
- **gemini-2.5-flash** - 快速响应
- **code-supernova-1-million** - 编程任务

### 特殊场景
- **超长文本** → gemini-2.5-pro (2M上下文)
- **中文内容** → kimi-k2-instruct
- **科学推理** → o3, deepseek-r1
- **代码审查** → gpt-5-codex, code-supernova-1-million
