@echo off
echo ================================================
echo   清理重复的 AI 工具
echo ================================================
echo.

echo 发现以下 AI 工具：
echo.
echo 1. cursorweb2api    - 24个模型 (正在使用)
echo 2. Antigravity      - Google 免费额度 (~257MB)
echo 3. CatPawAI         - AI助手 (~200MB)
echo 4. Ollama           - 已清理 (7KB)
echo.
echo ================================================
echo.

echo [1/3] Ollama 检查...
if exist "C:\Users\13632\.ollama" (
    echo ✅ Ollama 已经清理完毕 (只有7KB配置文件)
) else (
    echo ✅ Ollama 未安装
)
echo.

echo [2/3] 检查 Antigravity...
if exist "C:\D\Antigravity" (
    echo ⚠️  发现 Antigravity 安装 (~257MB)
    echo.
    choice /C YN /M "是否卸载 Antigravity"
    if errorlevel 2 goto skip_antigravity
    if errorlevel 1 (
        echo 正在卸载 Antigravity...
        if exist "C:\D\Antigravity\unins000.exe" (
            start /wait "C:\D\Antigravity\unins000.exe" /SILENT
            echo ✅ Antigravity 已卸载
        ) else (
            rmdir /s /q "C:\D\Antigravity"
            echo ✅ Antigravity 已删除
        )
    )
) else (
    echo ✅ Antigravity 未安装
)
:skip_antigravity

echo.
echo [3/3] 检查 CatPawAI...
if exist "C:\D\CatPawAI" (
    echo ⚠️  发现 CatPawAI 安装 (~200MB)
    echo.
    choice /C YN /M "是否卸载 CatPawAI"
    if errorlevel 2 goto skip_catpaw
    if errorlevel 1 (
        echo 正在卸载 CatPawAI...
        if exist "C:\D\CatPawAI\unins000.exe" (
            start /wait "C:\D\CatPawAI\unins000.exe" /SILENT
            echo ✅ CatPawAI 已卸载
        ) else (
            rmdir /s /q "C:\D\CatPawAI"
            echo ✅ CatPawAI 已删除
        )
    )
) else (
    echo ✅ CatPawAI 未安装
)
:skip_catpaw

echo.
echo ================================================
echo   清理完成
echo ================================================
echo.
echo 建议：
echo - 保留 cursorweb2api (提供24个模型)
echo - 其他工具功能重复，可以删除
echo.
pause
