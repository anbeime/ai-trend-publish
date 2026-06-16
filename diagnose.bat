@echo off
echo ========================================
echo    系统环境诊断工具
echo ========================================
echo.

echo 1. 检查 Node.js 安装...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [❌] Node.js 未安装或未找到
    echo.
    echo 请先安装 Node.js:
    echo 下载地址: https://nodejs.org/
    echo 选择 LTS 版本（长期支持版）
    echo.
    echo 安装后重新打开命令行窗口再试
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [✓] Node.js 已安装: %NODE_VERSION%
)

echo.
echo 2. 检查 npm 包管理器...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [❌] npm 未找到
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo [✓] npm 版本: %NPM_VERSION%
)

echo.
echo 3. 检查项目依赖...
if not exist "node_modules" (
    echo [⚠️] 依赖包未安装，正在安装...
    npm install
    if %errorlevel% neq 0 (
        echo [❌] 依赖包安装失败
        echo.
        echo 可能的解决方案:
        echo 1. 检查网络连接
        echo 2. 使用管理员权限运行
        echo 3. 清理缓存: npm cache clean --force
        pause
        exit /b 1
    )
    echo [✓] 依赖包安装完成
) else (
    echo [✓] 依赖包已存在
)

echo.
echo 4. 检查端口占用...
netstat -ano | findstr :3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo [⚠️] 端口 3000 被占用
    echo 占用进程信息:
    netstat -ano | findstr :3000
    echo.
    echo 解决方案:
    echo 1. 关闭占用进程: taskkill /PID 进程号 /F
    echo 2. 使用其他端口: set PORT=8080
    echo.
    set /p CHOICE=是否继续尝试启动? (y/n): 
    if /i not "%CHOICE%"=="y" exit /b 1
) else (
    echo [✓] 端口 3000 可用
)

echo.
echo 5. 检查项目文件...
if not exist "package.json" (
    echo [❌] package.json 文件不存在
    echo 请确保在正确的项目目录中运行
    pause
    exit /b 1
) else (
    echo [✓] package.json 存在
)

echo.
echo 6. 检查微信发布工具文件...
if not exist "wechat-publisher.html" (
    echo [❌] wechat-publisher.html 不存在
    pause
    exit /b 1
) else (
    echo [✓] 微信发布工具存在
)

echo.
echo ========================================
echo    诊断完成，准备启动服务
echo ========================================
echo.

echo 正在启动微信发布工具...
echo 服务将在 http://localhost:3000 运行
echo 按 Ctrl+C 停止服务
echo.

REM 尝试不同的启动方式
if exist "package.json" (
    findstr "scripts" package.json >nul
    if %errorlevel% equ 0 (
        findstr "\"dev\"" package.json >nul
        if %errorlevel% equ 0 (
            echo 使用 npm run dev 启动...
            npm run dev
        ) else (
            findstr "\"start\"" package.json >nul
            if %errorlevel% equ 0 (
                echo 使用 npm start 启动...
                npm start
            ) else (
                echo 使用默认方式启动...
                node src/server.ts
            )
        )
    ) else (
        echo 使用简单HTTP服务器启动...
        if exist "wechat-publisher.html" (
            npx http-server -p 3000 -o wechat-publisher.html
        ) else if exist "index.html" (
            npx http-server -p 3000 -o index.html
        ) else (
            echo [❌] 未找到启动文件
            pause
            exit /b 1
        )
    )
) else (
    echo [❌] 未找到 package.json
    pause
    exit /b 1
)

pause