@echo off
REM 后台静默启动 AI API 服务

set API_DIR=C:\D\cursorweb2api
set LOG_FILE=C:\Users\13632\.claude\ai-api.log

REM 检查服务是否已运行
curl -s --max-time 2 http://localhost:8000/v1/models -H "Authorization: Bearer aaa" >nul 2>&1
if %errorlevel% equ 0 (
    exit /b 0
)

REM 后台启动服务（无窗口）
start /B "" pythonw "%API_DIR%\main.py" >> "%LOG_FILE%" 2>&1

exit /b 0
