@echo off
echo ========================================
echo Dev-Linker 环境清理脚本
echo ========================================
echo.

echo 正在清理可能占用的端口...
echo.

echo 检查并清理端口 18080 (WebSocket)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :18080') do (
    echo 找到占用进程 PID: %%a
    taskkill /PID %%a /F >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo 已成功终止进程 %%a
    ) else (
        echo 尝试使用管理员权限终止进程...
        powershell -Command "Stop-Process -Id %%a -Force" >nul 2>&1
        if !ERRORLEVEL! EQU 0 (
            echo 已成功终止进程 %%a
        ) else (
            echo 进程 %%a 可能需要手动清理
        )
    )
)

echo.
echo 检查并清理端口 18888 (TCP)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :18888') do (
    echo 找到占用进程 PID: %%a
    taskkill /PID %%a /F >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo 已成功终止进程 %%a
    ) else (
        echo 尝试使用管理员权限终止进程...
        powershell -Command "Stop-Process -Id %%a -Force" >nul 2>&1
        if !ERRORLEVEL! EQU 0 (
            echo 已成功终止进程 %%a
        ) else (
            echo 进程 %%a 可能需要手动清理
        )
    )
)

echo.
echo 检查并清理 Node.js 进程...
for /f "tokens=2" %%a in ('tasklist ^| findstr node') do (
    echo 终止 Node.js 进程 PID: %%a
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo 检查并清理 Electron 进程...
for /f "tokens=2" %%a in ('tasklist ^| findstr electron') do (
    echo 终止 Electron 进程 PID: %%a
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo ========================================
echo 清理完成！
echo ========================================
echo.
echo 如果问题仍然存在，请：
echo 1. 重启计算机
echo 2. 或者手动关闭所有 PowerShell 窗口
echo 3. 重新打开 PowerShell 执行启动命令
echo.
pause
