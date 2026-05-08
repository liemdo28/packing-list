@echo off
setlocal enabledelayedexpansion

:: ============================================================
:: Packing List Server - Stop Script
:: ============================================================

set "INSTALL_DIR=C:\PackingList"
set "LOGS_DIR=%INSTALL_DIR%\logs"
set "CONFIG_DIR=%INSTALL_DIR%\config"

:: Get timestamp
set "TIMESTAMP=%date% %time%"

:: Ensure log directory exists
if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"

:: Log to launcher
set "LAUNCHER_LOG=%LOGS_DIR%\launcher.log"
echo [%TIMESTAMP%] Stopping Packing List Server >> "%LAUNCHER_LOG%"

echo.
echo ========================================================
echo   PACKING LIST SERVER - STOPPING
echo ========================================================
echo.

:: Load config for Telegram alert
if exist "%CONFIG_DIR%\backend.env" (
    for /f "usebackq tokens=1,* delims==" %%a in ("%CONFIG_DIR%\backend.env") do (
        if "%%a"=="TELEGRAM_BOT_TOKEN" set "TELEGRAM_TOKEN=%%b"
    )
)

:: Get machine name
for /f "skip=1 usebackq delims=" %%a in (`wmic computersystem get name /value 2^>nul`) do (
    for /f "tokens=1,* delims==" %%b in ("%%a") do set "MACHINE_NAME=%%c"
)

:: ============================================================
:: STOP SERVICES
:: ============================================================

echo [1/4] Stopping Backend API...
taskkill /F /FI "WINDOWTITLE eq PackingList-Backend*" 2>nul
if %errorlevel% equ 0 (
    echo        Backend stopped
    echo [%TIMESTAMP%] [OK] Backend stopped >> "%LAUNCHER_LOG%"
) else (
    echo        Backend not running
)

echo [2/4] Stopping Monitoring Service...
taskkill /F /FI "WINDOWTITLE eq PackingList-Monitoring*" 2>nul
if %errorlevel% equ 0 (
    echo        Monitoring stopped
    echo [%TIMESTAMP%] [OK] Monitoring stopped >> "%LAUNCHER_LOG%"
) else (
    echo        Monitoring not running
)

echo [3/4] Stopping Telegram Bot...
taskkill /F /FI "WINDOWTITLE eq PackingList-Telegram*" 2>nul
if %errorlevel% equ 0 (
    echo        Telegram bot stopped
    echo [%TIMESTAMP%] [OK] Telegram stopped >> "%LAUNCHER_LOG%"
) else (
    echo        Telegram bot not running
)

echo [4/4] Stopping Cloudflare Tunnel...
taskkill /F /IM cloudflared.exe 2>nul
if %errorlevel% equ 0 (
    echo        Tunnel stopped
    echo [%TIMESTAMP%] [OK] Tunnel stopped >> "%LAUNCHER_LOG%"
) else (
    echo        Tunnel not running
)

:: ============================================================
:: SEND TELEGRAM ALERT
:: ============================================================

if defined TELEGRAM_TOKEN (
    echo.
    echo Sending shutdown notification...
    
    curl -s "https://api.telegram.org/bot!TELEGRAM_TOKEN!/sendMessage" ^
        -d "chat_id=!ADMIN_CHAT_ID!&text=Packing List server stopped on %MACHINE_NAME%." >nul 2>&1
    
    echo [%TIMESTAMP%] [INFO] Telegram shutdown notification sent >> "%LAUNCHER_LOG%"
)

:: ============================================================
:: FINAL RESULT
:: ============================================================

echo.
echo ========================================================
echo   PACKING LIST SERVER - STOPPED
echo ========================================================
echo.
echo All services have been stopped.
echo.
echo Logs available in: %LOGS_DIR%
echo.
echo [%TIMESTAMP%] [SUCCESS] Server stopped >> "%LAUNCHER_LOG%"

pause
exit /b 0
