@echo off
echo ========================================
echo    微信文章发布工具 - 启动脚本
echo ========================================
echo.

echo 正在检查 Node.js 环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo [✓] Node.js 环境正常

echo.
echo 正在检查依赖包...
if not exist "node_modules" (
    echo 正在安装依赖包...
    npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖包安装失败
        pause
        exit /b 1
    )
)
echo [✓] 依赖包检查完成

echo.
echo 正在启动服务...
echo 服务启动后，请在浏览器中访问: http://localhost:3000/wechat-publisher.html
echo.

REM 尝试不同的启动方式
if exist "package.json" (
    findstr "scripts" package.json >nul
    if %errorlevel% equ 0 (
        findstr "dev" package.json >nul
        if %errorlevel% equ 0 (
            echo 使用 npm run dev 启动...
            npm run dev
        ) else (
            findstr "start" package.json >nul
            if %errorlevel% equ 0 (
                echo 使用 npm start 启动...
                npm start
            ) else (
                echo 使用默认方式启动...
                node src/server.ts
            )
        )
    ) else (
        echo 使用默认方式启动...
        node src/server.ts
    )
) else (
    echo 使用简单HTTP服务器启动...
    echo 正在寻找 index.html 或 wechat-publisher.html...
    if exist "wechat-publisher.html" (
        echo 启动简单HTTP服务器...
        npx http-server -p 3000 -o wechat-publisher.html
    ) else if exist "index.html" (
        echo 启动简单HTTP服务器...
        npx http-server -p 3000 -o index.html
    ) else (
        echo [错误] 未找到启动文件
        pause
        exit /b 1
    )
)

echo.
echo 服务已停止
pause