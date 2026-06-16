@echo off
echo 正在部署到 Cloudflare Pages...
echo.

echo 1. 检查登录状态...
npx wrangler whoami
if %errorlevel% neq 0 (
    echo 登录失败，请先运行: npx wrangler auth
    pause
    exit /b 1
)

echo.
echo 2. 开始部署...
npx wrangler pages deploy public --project-name ai-trend-publish

if %errorlevel% equ 0 (
    echo.
    echo ✅ 部署成功！
    echo 🌐 访问: https://ai-trend-publish.pages.dev
    echo 📱 API地址: https://ai-trend-publish.pages.dev/api
) else (
    echo.
    echo ❌ 部署失败，请检查错误信息
)

pause