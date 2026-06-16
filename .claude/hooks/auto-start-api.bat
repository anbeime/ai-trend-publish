@echo off
REM Claude Code 启动时自动启动 AI API 服务

set API_URL=http://localhost:8000/v1/models
set API_DIR=C:\D\cursorweb2api
set LOG_FILE=C:\Users\13632\.claude\ai-api.log

echo [%date% %time%] Checking AI API service... >> "%LOG_FILE%"

REM 检查服务是否已运行
curl -s --max-time 2 "%API_URL%" -H "Authorization: Bearer aaa" >nul 2>&1
if %errorlevel% equ 0 (
    echo [%date% %time%] AI API service is already running >> "%LOG_FILE%"
    exit /b 0
)

echo [%date% %time%] Starting AI API service... >> "%LOG_FILE%"

REM 启动服务（后台运行）
start /B cmd /c "cd /d %API_DIR% && python main.py >> %LOG_FILE% 2>&1"

REM 等待服务启动
timeout /t 3 /nobreak >nul

REM 验证启动
curl -s --max-time 2 "%API_URL%" -H "Authorization: Bearer aaa" >nul 2>&1
if %errorlevel% equ 0 (
    echo [%date% %time%] AI API service started successfully >> "%LOG_FILE%"
) else (
    echo [%date% %time%] Failed to start AI API service >> "%LOG_FILE%"
    exit /b 1
)
