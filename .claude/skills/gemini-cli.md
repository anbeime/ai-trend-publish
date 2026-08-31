---
name: gemini-cli
description: 当用户提到"用Gemini分析"、"看图"、"听录音"时触发。
---

# Gemini CLI 助手

## 触发场景
- "用 Gemini 扫描这个项目"
- "Gemini 帮我总结这段视频"
- "用 Gemini 看看这张图"
- "Gemini 听一下这个录音"

## 工作流程
1. 识别意图和文件
2. 甩给 gemini-executor 子代理
3. 拿回结果复述给用户
