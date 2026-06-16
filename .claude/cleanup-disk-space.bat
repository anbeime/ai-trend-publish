@echo off
echo ================================================
echo   Windows 磁盘空间紧急清理脚本
echo ================================================
echo.
echo 当前将执行以下清理：
echo.
echo 1. 卸载 Ubuntu WSL (释放约 9.7GB)
echo 2. 清理 Docker 缓存
echo 3. 清理 npm 缓存
echo 4. 清理 Windows 临时文件
echo 5. 清理系统更新缓存
echo.
echo ================================================
echo.

echo [1/5] 检查 Ubuntu WSL 状态...
wsl -l -v
echo.

echo 是否卸载 Ubuntu WSL？这将释放 9.7GB 空间。
echo 警告：Ubuntu 中的所有数据将被删除！
echo.
choice /C YN /M "确认卸载 Ubuntu WSL"
if errorlevel 2 goto skip_wsl
if errorlevel 1 goto remove_wsl

:remove_wsl
echo.
echo 正在卸载 Ubuntu WSL...
wsl --terminate Ubuntu
wsl --unregister Ubuntu
echo ✅ Ubuntu WSL 已卸载！释放约 9.7GB
goto check_docker

:skip_wsl
echo ⏭️ 跳过 Ubuntu WSL 卸载
goto check_docker

:check_docker
echo.
echo [2/5] 清理 Docker 缓存...
docker system prune -a -f --volumes 2>nul
if errorlevel 1 (
    echo ⚠️ Docker 未运行或未安装，跳过
) else (
    echo ✅ Docker 缓存已清理
)

echo.
echo [3/5] 清理 npm 缓存...
npm cache clean --force 2>nul
if errorlevel 1 (
    echo ⚠️ npm 未找到，跳过
) else (
    echo ✅ npm 缓存已清理
)

echo.
echo [4/5] 清理 Windows 临时文件...
del /q /f /s "%TEMP%\*" 2>nul
echo ✅ 临时文件已清理

echo.
echo [5/5] 清理系统更新缓存...
echo 运行磁盘清理工具...
cleanmgr /sageset:1
cleanmgr /sagerun:1

echo.
echo ================================================
echo   清理完成！
echo ================================================
echo.
echo 建议继续手动清理：
echo.
echo 1. 打开"存储感知"：
echo    设置 ^> 系统 ^> 存储 ^> 临时文件
echo.
echo 2. 卸载不需要的应用程序
echo.
echo 3. 清理大文件：
echo    使用 WinDirStat 或 TreeSize 分析磁盘
echo.
pause
