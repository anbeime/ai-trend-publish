#!/bin/bash

echo "========================================"
echo "  启动 AI 模型本地 API 服务"
echo "========================================"
echo ""
echo "服务地址: http://localhost:8000"
echo "API Key: aaa"
echo ""
echo "支持的模型 (24个):"
echo "  - Claude 系列 (claude-4.5-sonnet 等)"
echo "  - GPT 系列 (gpt-4o, gpt-5 等)"
echo "  - Gemini 系列 (gemini-2.5-pro/flash)"
echo "  - DeepSeek (deepseek-r1, deepseek-v3.1)"
echo "  - 推理模型 (o3, o4-mini, grok-3/4)"
echo "  - 专用模型 (code-supernova, kimi-k2)"
echo ""
echo "按 Ctrl+C 停止服务"
echo "========================================"
echo ""

cd /c/D/cursorweb2api

python main.py
