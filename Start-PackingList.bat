@echo off
setlocal enabledelayedexpansion

:: ============================================================
:: Packing List Server - Start Script
:: ============================================================

set "INSTALL_DIR=C:\PackingList"
set "LOGS_DIR=%INSTALL_DIR%\logs"
set "CONFIG_DIR=%INSTALL_DIR%\config"
set "SCRIPTS_DIR=%INSTALL_DIR%\scripts"

:: Get machine name for alerts
for /f "skip=1 usebackq delims=" %%a in (`wmic computersystem get name /value 2^>nul`) do (
    for /f "tokens=1,* delims==" %%b in ("%%a") do set "MACHINE_NAME=%%c"
)

:: Get timestamp
set "TIMESTAMP=%date% %time%"

:: ============================================================
:: STARTUP LOGGING
:: ============================================================

:: Ensure log directory exists
if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"

:: Create launcher log
set "LAUNCHER_LOG=%LOGS_DIR%\launcher.log"
echo [%TIMESTAMP%] Starting Packing List Server >> "%LAUNCHER_LOG%"

:: ============================================================
:: LOAD CONFIGURATION
:: ============================================================

echo.
echo ========================================================
echo   PACKING LIST SERVER - STARTING
echo ========================================================
echo.

:: Check if config exists
if not exist "%CONFIG_DIR%\backend.env" (
    echo [ERROR] Configuration not found!
    echo Please run setup-production.bat first.
    echo [%TIMESTAMP%] [ERROR] Config not found >> "%LAUNCHER_LOG%"
    exit /b 1
)

:: Load backend config
for /f "usebackq tokens=1,* delims==" %%a in ("%CONFIG_DIR%\backend.env") do (
    if "%%a"=="DB_HOST" set "DB_HOST=%%b"
    if "%%a"=="DB_PORT" set "DB_PORT=%%b"
    if "%%a"=="PORT" set "API_PORT=%%b"
    if "%%a"=="TELEGRAM_BOT_TOKEN" set "TELEGRAM_TOKEN=%%b"
)

:: Load app settings
if exist "%CONFIG_DIR%\app-settings.json" (
    findstr /C:"\"telegram\"" "%CONFIG_DIR%\app-settings.json" | findstr /C:"\"enabled\":" | findstr /C:"true" >nul
    if !errorlevel! equ 0 set "TELEGRAM_ENABLED=true"
    
    findstr /C:"\"tunnel\"" "%CONFIG_DIR%\app-settings.json" | findstr /C:"\"enabled\":" | findstr /C:"true" >nul
    if !errorlevel! equ 0 set "TUNNEL_ENABLED=true"
)

:: Set defaults
if not defined API_PORT set "API_PORT=3001"
if not defined DB_PORT set "DB_PORT=3306"

echo [INFO] Machine: %MACHINE_NAME%
echo [INFO] Logs: %LOGS_DIR%
echo.

:: ============================================================
:: STOP EXISTING SERVICES
:: ============================================================

echo [1/5] Stopping existing services...

:: Kill existing node processes for our services
taskkill /F /IM node.exe /FI "WINDOWTITLE eq PackingList*" 2>nul
taskkill /F /FI "IMAGENAME eq node.exe" /FI "WINDOWTITLE eq PackingList*" 2>nul

echo        Stopped existing services
echo [%TIMESTAMP%] Stopped existing services >> "%LAUNCHER_LOG%"

:: ============================================================
:: START BACKEND
:: ============================================================

echo [2/5] Starting Backend API...

set "SERVER_DIR=%INSTALL_DIR%\app\server"

if not exist "%SERVER_DIR%\package.json" (
    echo [ERROR] Server directory not found: %SERVER_DIR%
    echo [%TIMESTAMP%] [ERROR] Server not found >> "%LAUNCHER_LOG%"
    goto :failed
)

:: Copy config to server
copy /Y "%CONFIG_DIR%\backend.env" "%SERVER_DIR%\.env" >nul

:: Start backend
cd /d "%SERVER_DIR%"
start "PackingList-Backend" cmd /c "title PackingList-Backend && node src/index.js >> ..\..\..\logs\backend.log 2>&1"

echo        Backend starting on port %API_PORT%...
timeout /t 3 /nobreak >nul

:: ============================================================
:: START MONITORING
:: ============================================================

echo [3/5] Starting Monitoring Service...

set "MONITOR_DIR=%INSTALL_DIR%\app\monitoring"

if exist "%MONITOR_DIR%\package.json" (
    if exist "%CONFIG_DIR%\monitoring.env" (
        copy /Y "%CONFIG_DIR%\monitoring.env" "%MONITOR_DIR%\.env" >nul
        cd /d "%MONITOR_DIR%"
        start "PackingList-Monitoring" cmd /c "title PackingList-Monitoring && node . >> ..\..\..\logs\monitoring.log 2>&1"
        echo        Monitoring service started
    )
) else (
    echo        Monitoring not configured, skipping...
)

:: ============================================================
:: START TELEGRAM BOT
:: ============================================================

echo [4/5] Starting Telegram Bot...

set "TELEGRAM_DIR=%INSTALL_DIR%\app\telegram"

if exist "%TELEGRAM_DIR%\package.json" (
    if exist "%CONFIG_DIR%\telegram.env" (
        copy /Y "%CONFIG_DIR%\telegram.env" "%TELEGRAM_DIR%\.env" >nul
        cd /d "%TELEGRAM_DIR%"
        start "PackingList-Telegram" cmd /c "title PackingList-Telegram && node . >> ..\..\..\logs\telegram.log 2>&1"
        echo        Telegram bot started
    )
) else (
    echo        Telegram bot not configured, skipping...
)

:: ============================================================
:: WAIT FOR SERVICES
:: ============================================================

echo [5/5] Waiting for services to start...

set "MAX_WAIT=30"
set "WAIT_COUNT=0"

:wait_loop
set /a WAIT_COUNT+=1
timeout /t 2 /nobreak >nul

:: Check if API is responding
curl -s -o nul -w "%%{http_code}" http://localhost:%API_PORT%/health 2>nul | findstr "200" >nul
if %errorlevel% equ 0 (
    goto :health_check_passed
)

if %WAIT_COUNT% lss %MAX_WAIT% (
    goto :wait_loop
)

:health_check_passed

:: ============================================================
:: HEALTH CHECK
:: ============================================================

echo.
echo ========================================================
echo   HEALTH CHECK
echo ========================================================
echo.

set "ALL_PASSED=true"
set "FAILED_CHECKS="

:: Check Backend
echo Checking Backend API...
curl -s -o nul -w "%%{http_code}" http://localhost:%API_PORT%/health 2>nul | findstr "200" >nul
if %errorlevel% equ 0 (
    echo        [OK] Backend API is responding
    echo [%TIMESTAMP%] [OK] Backend started >> "%LAUNCHER_LOG%"
) else (
    echo        [FAIL] Backend API not responding
    set "ALL_PASSED=false"
    set "FAILED_CHECKS=Backend API not responding; !FAILED_CHECKS!"
    echo [%TIMESTAMP%] [FAIL] Backend not responding >> "%LAUNCHER_LOG%"
)

:: Check Database
echo Checking Database Connection...
curl -s http://localhost:%API_PORT%/health/db 2>nul | findstr /C:"ok" >nul
if %errorlevel% equ 0 (
    echo        [OK] Database connection is healthy
    echo [%TIMESTAMP%] [OK] Database connected >> "%LAUNCHER_LOG%"
) else (
    echo        [FAIL] Database connection failed
    set "ALL_PASSED=false"
    set "FAILED_CHECKS=Database connection failed; !FAILED_CHECKS!"
    echo [%TIMESTAMP%] [FAIL] Database not connected >> "%LAUNCHER_LOG%"
)

:: Check Ports
echo Checking Ports...
netstat -an | findstr ":%API_PORT% " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo        [OK] Port %API_PORT% is listening
) else (
    echo        [FAIL] Port %API_PORT% not listening
    set "ALL_PASSED=false"
    set "FAILED_CHECKS=Port %API_PORT% not listening; !FAILED_CHECKS!"
)

:: ============================================================
:: SEND TELEGRAM ALERT
:: ============================================================

if defined TELEGRAM_TOKEN (
    echo.
    echo Sending startup notification...
    
    if "!ALL_PASSED!"=="true" (
        curl -s "https://api.telegram.org/bot!TELEGRAM_TOKEN!/sendMessage" ^
            -d "chat_id=!ADMIN_CHAT_ID!&text=Packing List server started successfully on %MACHINE_NAME%." >nul 2>&1
        echo [%TIMESTAMP%] [INFO] Telegram notification sent >> "%LAUNCHER_LOG%"
    ) else (
        curl -s "https://api.telegram.org/bot!TELEGRAM_TOKEN!/sendMessage" ^
            -d "chat_id=!ADMIN_CHAT_ID!&text=Packing List server failed to start on %MACHINE_NAME%: !FAILED_CHECKS!" >nul 2>&1
        echo [%TIMESTAMP%] [WARN] Telegram failure notification sent >> "%LAUNCHER_LOG%"
    )
)

:: ============================================================
:: GENERATE STATUS REPORT
:: ============================================================

echo.
echo ========================================================
echo   STARTUP REPORT
echo ========================================================
echo.

set "STATUS_FILE=%INSTALL_DIR%\status-report.html"

(
echo ^<html^>
echo ^<head^>
echo ^<title^>Packing List Server - Status Report^</title^>
echo ^<style^>
echo body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
echo .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
echo .status-ok { background: #22c55e; color: white; padding: 15px 30px; border-radius: 8px; font-size: 1.2em; display: inline-block; }
echo .status-fail { background: #ef4444; color: white; padding: 15px 30px; border-radius: 8px; font-size: 1.2em; display: inline-block; }
echo table { width: 100%%; border-collapse: collapse; margin: 20px 0; }
echo th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
echo th { background: #f8fafc; color: #475569; }
echo .ok { color: #22c55e; font-weight: bold; }
echo .fail { color: #ef4444; font-weight: bold; }
echo .btn { display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 5px; }
echo .btn:hover { background: #1d4ed8; }
echo ^</style^>
echo ^</head^>
echo ^<body^>
echo ^<div class="container"^>
)

if "%ALL_PASSED%"=="true" (
    (
        echo ^<h1^>Packing List Server Status^</h1^>
        echo ^<div class="status-ok"^>GREEN: Packing List Server is running and ready.^</div^>
    ) >> "%STATUS_FILE%"
) else (
    (
        echo ^<h1^>Packing List Server Status^</h1^>
        echo ^<div class="status-fail"^>RED: Packing List Server is not ready.^</div^>
        echo ^<p^>^<strong^>Failed checks:^</strong^></p^>
        echo ^<ul^>
        for %%F in (%FAILED_CHECKS%) do echo ^<li class="fail"^>%%~F^</li^>
        echo ^</ul^>
    ) >> "%STATUS_FILE%"
)

(
echo.
echo ^<h2^>Service Status^</h2^>
echo ^<table^>
echo ^<tr^>^<th^>Service^</th^>^<th^>Status^</th^>^</tr^>
echo ^<tr^>^<td^>Backend API^</td^>^<td^>%ESC%ALL_PASSED%=="true" ? "<span class='ok'>Running</span>" : "<span class='fail'>Failed</span>"%^</td^>^</tr^>
echo ^<tr^>^<td^>Port %API_PORT%^</td^>^<td^>%ESC%ALL_PASSED%=="true" ? "<span class='ok'>Listening</span>" : "<span class='fail'>Failed</span>"%^</td^>^</tr^>
echo ^<tr^>^<td^>Database^</td^>^<td^>%ESC%ALL_PASSED%=="true" ? "<span class='ok'>Connected</span>" : "<span class='fail'>Failed</span>"%^</td^>^</tr^>
echo ^</table^>
echo.
echo ^<p^>Machine: %MACHINE_NAME%^</p^>
echo ^<p^>Started: %TIMESTAMP%^</p^>
echo.
echo ^<h2^>Quick Actions^</h2^>
echo ^<a href="file:///%LOGS_DIR%" class="btn"^>Open Logs^</a^>
echo ^<a href="file:///%CONFIG_DIR%" class="btn"^>Open Config^</a^>
echo ^</div^>
echo ^</body^>
echo ^</html^>
) >> "%STATUS_FILE%"

:: ============================================================
:: FINAL RESULT
:: ============================================================

echo.

if "%ALL_PASSED%"=="true" (
    echo ========================================================
    echo   GREEN: Packing List Server is running and ready.
    echo ========================================================
    echo.
    echo Backend API: http://localhost:%API_PORT%
    echo Health: http://localhost:%API_PORT%/health
    echo.
    echo Desktop shortcuts created.
    echo.
    
    :: Open status report
    start "" "%STATUS_FILE%"
    
    echo [%TIMESTAMP%] [SUCCESS] Server started successfully >> "%LAUNCHER_LOG%"
    
) else (
    echo ========================================================
    echo   RED: Packing List Server is not ready.
    echo ========================================================
    echo.
    echo Failed checks:
    for %%F in (%FAILED_CHECKS%) do echo   - %%~F
    echo.
    echo Check logs in: %LOGS_DIR%
    echo.
    
    :: Open status report
    start "" "%STATUS_FILE%"
    
    echo [%TIMESTAMP%] [FAILED] Server startup failed: %FAILED_CHECKS% >> "%LAUNCHER_LOG%"
)

echo.
pause

exit /b 0

:failed
echo.
echo ========================================================
echo   RED: Packing List Server failed to start.
echo ========================================================
echo.
echo [%TIMESTAMP%] [FAILED] Server startup failed >> "%LAUNCHER_LOG%"
pause
exit /b 1
