#!/bin/bash
# Claude Code 启动时自动启动 AI API 服务

API_URL="http://localhost:8000/v1/models"
API_DIR="/c/D/cursorweb2api"
LOG_FILE="/c/Users/13632/.claude/ai-api.log"

echo "[$(date)] Checking AI API service..." >> "$LOG_FILE"

# 检查服务是否已运行
if curl -s --max-time 2 "$API_URL" -H "Authorization: Bearer aaa" > /dev/null 2>&1; then
    echo "[$(date)] ✅ AI API service is already running" >> "$LOG_FILE"
    exit 0
fi

echo "[$(date)] 🚀 Starting AI API service..." >> "$LOG_FILE"

# 启动服务（后台运行）
cd "$API_DIR" && nohup python main.py >> "$LOG_FILE" 2>&1 &

# 等待服务启动
sleep 3

# 验证启动
if curl -s --max-time 2 "$API_URL" -H "Authorization: Bearer aaa" > /dev/null 2>&1; then
    echo "[$(date)] ✅ AI API service started successfully" >> "$LOG_FILE"
else
    echo "[$(date)] ❌ Failed to start AI API service" >> "$LOG_FILE"
    exit 1
fi
