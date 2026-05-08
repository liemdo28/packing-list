@echo off
setlocal enabledelayedexpansion

:: ============================================================
:: Packing List Server - Auto-Start Configuration
:: ============================================================

set "INSTALL_DIR=C:\PackingList"
set "APP_DIR=%INSTALL_DIR%\app"

echo.
echo ========================================================
echo   PACKING LIST SERVER - AUTO-START SETUP
echo ========================================================
echo.

:: Check if running as Administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Not running as Administrator.
    echo Some features may require elevation.
    echo.
)

:: ============================================================
:: PM2 AUTO-START
:: ============================================================

echo [1/3] Setting up PM2 startup...

cd /d "%APP_DIR%\server"

:: Install PM2 startup
call npm install -g pm2 >nul 2>&1

:: Generate startup script
pm2 startup windows >nul 2>&1
if %errorlevel% equ 0 (
    echo        PM2 startup configured
) else (
    echo [INFO] PM2 startup needs manual configuration
    echo Run as Administrator: pm2 startup windows
)

:: Start services with PM2
echo.
echo [2/3] Starting services with PM2...

:: Stop existing
pm2 stop all >nul 2>&1

:: Start backend
set "BACKEND_CMD=%~dp0app\server\node_modules\.bin\node.exe %~dp0app\server\src\index.js"
pm2 start "%APP_DIR%\server\src\index.js" --name "packing-backend"
if %errorlevel% equ 0 (
    echo        Backend started with PM2
)

:: Start monitoring if exists
if exist "%APP_DIR%\monitoring\package.json" (
    pm2 start "%APP_DIR%\monitoring\index.js" --name "packing-monitoring" 2>nul
    echo        Monitoring started with PM2
)

:: Start telegram if exists
if exist "%APP_DIR%\telegram\package.json" (
    pm2 start "%APP_DIR%\telegram\index.js" --name "packing-telegram" 2>nul
    echo        Telegram started with PM2
)

:: Save PM2 process list
pm2 save >nul 2>&1

echo.
echo [3/3] Configuring Windows startup...

:: Create Windows Task Scheduler task for auto-start
schtasks /create /tn "PackingList Auto Start" /tr "\"%INSTALL_DIR%\scripts\Start-PackingList.bat\"" /sc onlogon /rl highest /f >nul 2>&1
if %errorlevel% equ 0 (
    echo        Windows auto-start task created
) else (
    echo [WARNING] Could not create auto-start task
    echo Try running as Administrator
)

:: PM2 Status
echo.
echo ========================================================
echo   PM2 STATUS
echo ========================================================
echo.

pm2 list

echo.
echo ========================================================
echo   AUTO-START CONFIGURATION COMPLETE
echo ========================================================
echo.

echo PM2 will automatically restart services after:
echo   - System reboot
echo   - Process crash
echo   - Power outage
echo.
echo To view PM2 dashboard: pm2 monit
echo To check logs: pm2 logs
echo To restart all: pm2 restart all
echo.

pause
