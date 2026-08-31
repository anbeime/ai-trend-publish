@echo off
title 微信发布工具 - 简单启动

echo ========================================
echo     微信发布工具启动器
echo ========================================
echo.

REM 切换到脚本所在目录
cd /d "%~dp0"

echo 当前目录: %CD%
echo.

echo 检查 Node.js...
node --version
if %errorlevel% neq 0 (
    echo.
    echo [错误] Node.js 未安装！
    echo.
    echo 请下载安装 Node.js:
    echo https://nodejs.org/
    echo.
    echo 安装完成后重新运行此脚本
    pause
    exit
)

echo.
echo 检查依赖包...
if not exist "node_modules" (
    echo 正在安装依赖包，请稍候...
    npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖包安装失败！
        pause
        exit
    )
)

echo.
echo 启动服务...
echo 服务地址: http://localhost:3000
echo 测试工具: http://localhost:3000/simple-test.html
echo 发布工具: http://localhost:3000/wechat-publisher.html
echo.
echo 按 Ctrl+C 停止服务
echo.

REM 尝试最简单的启动方式
npx http-server -p 3000 -o wechat-publisher.html

if %errorlevel% neq 0 (
    echo.
    echo [备选方案] 尝试其他启动方式...
    npm start
)

echo.
echo 服务已停止
pause