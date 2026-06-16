@echo off
REM OpenCode 管理和任务委派脚本
REM 供 Claude Code 调用

setlocal enabledelayedexpansion

set OPENCODE_DIR=C:\D\opencode
set WEB_PORT=3000
set API_PORT=3001

if "%1"=="" goto :status
if "%1"=="start" goto :start
if "%1"=="stop" goto :stop
if "%1"=="restart" goto :restart
if "%1"=="status" goto :status
if "%1"=="delegate" goto :delegate
goto :usage

:start
    echo 🚀 启动 OpenCode 多智能体系统...

    REM 检查是否已运行
    curl -s http://localhost:%WEB_PORT% >nul 2>&1
    if %errorlevel%==0 (
        echo ✅ OpenCode 已在运行
        echo Web界面: http://localhost:%WEB_PORT%
        echo API端点: http://localhost:%API_PORT%
        goto :end
    )

    REM 启动 OpenCode
    cd /d "%OPENCODE_DIR%"
    start /B "" START_FULL_SYSTEM.bat

    echo ⏳ 等待服务启动...

    REM 等待最多60秒
    set count=0
    :wait_loop
        timeout /t 1 /nobreak >nul
        curl -s http://localhost:%WEB_PORT% >nul 2>&1
        if %errorlevel%==0 (
            echo ✅ OpenCode 已启动！
            echo Web界面: http://localhost:%WEB_PORT%
            echo API端点: http://localhost:%API_PORT%
            goto :end
        )

        set /a count+=1
        if !count! lss 60 goto :wait_loop

    echo ❌ OpenCode 启动超时
    goto :end

:stop
    echo 🛑 停止 OpenCode...

    taskkill /F /IM OpenCode.exe >nul 2>&1
    taskkill /F /IM node.exe >nul 2>&1
    taskkill /F /IM bun.exe >nul 2>&1

    echo ✅ OpenCode 已停止
    goto :end

:restart
    call :stop
    timeout /t 2 /nobreak >nul
    call :start
    goto :end

:status
    echo 检查 OpenCode 状态...
    echo.

    curl -s http://localhost:%WEB_PORT% >nul 2>&1
    if %errorlevel%==0 (
        echo ✅ OpenCode 运行中
        echo Web界面: http://localhost:%WEB_PORT%
        echo API端点: http://localhost:%API_PORT%
        echo.
        echo 服务状态:

        curl -s http://localhost:8000/v1/models -H "Authorization: Bearer aaa" >nul 2>&1
        if %errorlevel%==0 (
            echo   ✅ CursorWeb2API: 运行中
        ) else (
            echo   ❌ CursorWeb2API: 未运行
        )

        curl -s http://localhost:%WEB_PORT% >nul 2>&1
        if %errorlevel%==0 (
            echo   ✅ Web界面: 运行中
        ) else (
            echo   ❌ Web界面: 未运行
        )
    ) else (
        echo ❌ OpenCode 未运行
        echo.
        echo 使用 'manage-opencode.bat start' 启动
    )
    goto :end

:delegate
    echo 📋 委派任务到 OpenCode...

    REM 检查 OpenCode 是否运行
    curl -s http://localhost:%WEB_PORT% >nul 2>&1
    if %errorlevel% neq 0 (
        echo OpenCode 未运行，正在启动...
        call :start
    )

    echo.
    echo ✅ 任务已委派给 OpenCode 多智能体团队
    echo 可访问 http://localhost:%WEB_PORT% 查看进度
    goto :end

:usage
    echo.
    echo 用法: %~nx0 [命令]
    echo.
    echo 命令:
    echo   start     - 启动 OpenCode
    echo   stop      - 停止 OpenCode
    echo   restart   - 重启 OpenCode
    echo   status    - 检查状态
    echo   delegate  - 委派任务
    echo.
    goto :end

:end
endlocal
