@echo off
REM API 服务健康检查工具

set API_URL=http://localhost:8000/v1/models

echo 🔍 检查 AI API 服务状态...
echo.

REM 检查服务是否运行
curl -s --max-time 2 "%API_URL%" -H "Authorization: Bearer aaa" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 服务状态: 运行中
    echo.
    echo 📋 可用模型:
    curl -s "%API_URL%" -H "Authorization: Bearer aaa" | findstr /C:"\"id\""
    echo.
    echo 🎉 服务运行正常

    echo.
    echo 🧪 测试 Gemini 2.5 Flash...
    curl -s http://localhost:8000/v1/chat/completions -H "Content-Type: application/json" -H "Authorization: Bearer aaa" -d "{\"model\":\"gemini-2.5-flash\",\"messages\":[{\"role\":\"user\",\"content\":\"Hi\"}],\"max_tokens\":10}" | findstr /C:"choices" >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ 模型响应正常
    ) else (
        echo ⚠️  模型响应异常
    )
) else (
    echo ❌ 服务状态: 未运行
    echo.
    echo 💡 启动服务:
    echo    .claude\start-ai-api.bat
    exit /b 1
)
