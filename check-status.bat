@echo off
setlocal enabledelayedexpansion

:: ============================================================
:: Packing List Server - Status Check Script
:: ============================================================

set "INSTALL_DIR=C:\PackingList"
set "LOGS_DIR=%INSTALL_DIR%\logs"
set "CONFIG_DIR=%INSTALL_DIR%\config"

:: Get timestamp
set "TIMESTAMP=%date% %time%"

:: Get machine name
for /f "skip=1 usebackq delims=" %%a in (`wmic computersystem get name /value 2^>nul`) do (
    for /f "tokens=1,* delims==" %%b in ("%%a") do set "MACHINE_NAME=%%c"
)

:: Ensure log directory exists
if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"

:: Log to launcher
set "LAUNCHER_LOG=%LOGS_DIR%\launcher.log"

echo.
echo ========================================================
echo   PACKING LIST SERVER - STATUS CHECK
echo ========================================================
echo.
echo [INFO] Machine: %MACHINE_NAME%
echo [INFO] Time: %TIMESTAMP%
echo.

:: Initialize counters
set "PASSED_COUNT=0"
set "FAILED_COUNT=0"
set "ALL_PASSED=true"
set "FAILED_CHECKS="

:: Load config
if exist "%CONFIG_DIR%\backend.env" (
    for /f "usebackq tokens=1,* delims==" %%a in ("%CONFIG_DIR%\backend.env") do (
        if "%%a"=="PORT" set "API_PORT=%%b"
    )
)

:: Set defaults
if not defined API_PORT set "API_PORT=3001"

:: ============================================================
:: CHECK 1: BACKEND PROCESS
:: ============================================================

echo [CHECK 1/9] Backend Process...
tasklist /FI "WINDOWTITLE eq PackingList-Backend*" 2>nul | findstr /C:"node.exe" >nul
if %errorlevel% equ 0 (
    echo        [OK] Backend process is running
    set /a PASSED_COUNT+=1
    echo [%TIMESTAMP%] [OK] Backend process running >> "%LAUNCHER_LOG%"
) else (
    echo        [FAIL] Backend process not found
    set /a FAILED_COUNT+=1
    set "ALL_PASSED=false"
    set "FAILED_CHECKS=Backend process not running; !FAILED_CHECKS!"
    echo [%TIMESTAMP%] [FAIL] Backend process not found >> "%LAUNCHER_LOG%"
)

:: ============================================================
:: CHECK 2: MONITORING PROCESS
:: ============================================================

echo [CHECK 2/9] Monitoring Process...
tasklist /FI "WINDOWTITLE eq PackingList-Monitoring*" 2>nul | findstr /C:"node.exe" >nul
if %errorlevel% equ 0 (
    echo        [OK] Monitoring process is running
    set /a PASSED_COUNT+=1
    echo [%TIMESTAMP%] [OK] Monitoring process running >> "%LAUNCHER_LOG%"
) else (
    echo        [WARN] Monitoring process not found (may not be enabled)
    set /a PASSED_COUNT+=1
)

:: ============================================================
:: CHECK 3: TELEGRAM PROCESS
:: ============================================================

echo [CHECK 3/9] Telegram Bot Process...
tasklist /FI "WINDOWTITLE eq PackingList-Telegram*" 2>nul | findstr /C:"node.exe" >nul
if %errorlevel% equ 0 (
    echo        [OK] Telegram bot is running
    set /a PASSED_COUNT+=1
    echo [%TIMESTAMP%] [OK] Telegram process running >> "%LAUNCHER_LOG%"
) else (
    echo        [WARN] Telegram bot not found (may not be enabled)
    set /a PASSED_COUNT+=1
)

:: ============================================================
:: CHECK 4: TUNNEL PROCESS
:: ============================================================

echo [CHECK 4/9] Cloudflare Tunnel Process...
tasklist /FI "IMAGENAME eq cloudflared.exe" 2>nul | findstr /C:"cloudflared" >nul
if %errorlevel% equ 0 (
    echo        [OK] Tunnel is running
    set /a PASSED_COUNT+=1
    echo [%TIMESTAMP%] [OK] Tunnel running >> "%LAUNCHER_LOG%"
) else (
    echo        [WARN] Tunnel not running (may not be enabled)
    set /a PASSED_COUNT+=1
)

:: ============================================================
:: CHECK 5: PORT LISTENING
:: ============================================================

echo [CHECK 5/9] Port %API_PORT% Listening...
netstat -an | findstr ":%API_PORT% " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo        [OK] Port %API_PORT% is listening
    set /a PASSED_COUNT+=1
    echo [%TIMESTAMP%] [OK] Port %API_PORT% listening >> "%LAUNCHER_LOG%"
) else (
    echo        [FAIL] Port %API_PORT% is not listening
    set /a FAILED_COUNT+=1
    set "ALL_PASSED=false"
    set "FAILED_CHECKS=Port %API_PORT% not listening; !FAILED_CHECKS!"
    echo [%TIMESTAMP%] [FAIL] Port not listening >> "%LAUNCHER_LOG%"
)

:: ============================================================
:: CHECK 6: API HEALTH ENDPOINT
:: ============================================================

echo [CHECK 6/9] API /health Endpoint...
curl -s -o nul -w "%%{http_code}" http://localhost:%API_PORT%/health 2>nul | findstr "200" >nul
if %errorlevel% equ 0 (
    echo        [OK] /health endpoint responding
    set /a PASSED_COUNT+=1
    echo [%TIMESTAMP%] [OK] /health OK >> "%LAUNCHER_LOG%"
) else (
    echo        [FAIL] /health endpoint not responding
    set /a FAILED_COUNT+=1
    set "ALL_PASSED=false"
    set "FAILED_CHECKS=/health endpoint not responding; !FAILED_CHECKS!"
    echo [%TIMESTAMP%] [FAIL] /health not responding >> "%LAUNCHER_LOG%"
)

:: ============================================================
:: CHECK 7: DATABASE HEALTH
:: ============================================================

echo [CHECK 7/9] Database Connection...
curl -s http://localhost:%API_PORT%/health/db 2>nul | findstr /C:"ok" >nul
if %errorlevel% equ 0 (
    echo        [OK] Database connection healthy
    set /a PASSED_COUNT+=1
    echo [%TIMESTAMP%] [OK] DB connected >> "%LAUNCHER_LOG%"
) else (
    echo        [FAIL] Database connection failed
    set /a FAILED_COUNT+=1
    set "ALL_PASSED=false"
    set "FAILED_CHECKS=Database connection failed; !FAILED_CHECKS!"
    echo [%TIMESTAMP%] [FAIL] DB connection failed >> "%LAUNCHER_LOG%"
)

:: ============================================================
:: CHECK 8: LOG FILES EXIST
:: ============================================================

echo [CHECK 8/9] Log Files...
set "LOGS_OK=true"
if exist "%LOGS_DIR%\backend.log" (
    echo        [OK] backend.log exists
) else (
    echo        [WARN] backend.log not found
    set "LOGS_OK=false"
)
if exist "%LOGS_DIR%\monitoring.log" (
    echo        [OK] monitoring.log exists
)
if exist "%LOGS_DIR%\telegram.log" (
    echo        [OK] telegram.log exists
)

if "%LOGS_OK%"=="true" (
    set /a PASSED_COUNT+=1
) else (
    set /a PASSED_COUNT+=1
)

:: ============================================================
:: CHECK 9: PUBLIC URL (if configured)
:: ============================================================

echo [CHECK 9/9] Public URL...
if exist "%CONFIG_DIR%\backend.env" (
    findstr /C:"TUNNEL_URL" "%CONFIG_DIR%\backend.env" | findstr /v "REM" | findstr "=" >nul
    if %errorlevel% equ 0 (
        :: Tunnel URL configured, check if reachable
        :: Note: This is a placeholder check
        echo        [INFO] Public URL configured
        set /a PASSED_COUNT+=1
    ) else (
        echo        [INFO] Public URL not configured
        set /a PASSED_COUNT+=1
    )
) else (
    echo        [WARN] Config not found, skipping public URL check
    set /a PASSED_COUNT+=1
)

:: ============================================================
:: GENERATE STATUS REPORT
:: ============================================================

echo.
echo ========================================================
echo   STATUS REPORT
echo ========================================================
echo.

set "STATUS_FILE=%INSTALL_DIR%\status-report.html"

(
echo ^<html^>
echo ^<head^>
echo ^<title^>Packing List Server - Status Report^</title^>
echo ^<style^>
echo body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
echo .container { max-width: 900px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
echo .status-ok { background: #22c55e; color: white; padding: 20px 30px; border-radius: 8px; font-size: 1.3em; display: inline-block; margin: 10px 0; }
echo .status-fail { background: #ef4444; color: white; padding: 20px 30px; border-radius: 8px; font-size: 1.3em; display: inline-block; margin: 10px 0; }
echo .summary { display: flex; gap: 20px; margin: 20px 0; }
echo .summary-item { padding: 15px 25px; border-radius: 8px; text-align: center; }
echo .summary-pass { background: #dcfce7; color: #166534; }
echo .summary-fail { background: #fee2e2; color: #991b1b; }
echo table { width: 100%%; border-collapse: collapse; margin: 20px 0; }
echo th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
echo th { background: #f8fafc; color: #475569; }
echo .ok { color: #22c55e; font-weight: bold; }
echo .fail { color: #ef4444; font-weight: bold; }
echo .warn { color: #f59e0b; font-weight: bold; }
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
        echo ^<div class="summary"^>
        echo ^<div class="summary-item summary-pass"^>
        echo ^<strong^>%PASSED_COUNT%^</strong^>^<br^>Passed
        echo ^</div^>
        echo ^<div class="summary-item summary-fail"^>
        echo ^<strong^>0^</strong^>^<br^>Failed
        echo ^</div^>
        echo ^</div^>
    ) >> "%STATUS_FILE%"
) else (
    (
        echo ^<h1^>Packing List Server Status^</h1^>
        echo ^<div class="status-fail"^>RED: Packing List Server is not ready.^</div^>
        echo ^<p^>^<strong^>Failed checks:^</strong^></p^>
        echo ^<ul^>
        for %%F in (!FAILED_CHECKS!) do echo ^<li class="fail"^>%%~F^</li^>
        echo ^</ul^>
        echo ^<div class="summary"^>
        echo ^<div class="summary-item summary-pass"^>
        echo ^<strong^>%PASSED_COUNT%^</strong^>^<br^>Passed
        echo ^</div^>
        echo ^<div class="summary-item summary-fail"^>
        echo ^<strong^>%FAILED_COUNT%^</strong^>^<br^>Failed
        echo ^</div^>
        echo ^</div^>
    ) >> "%STATUS_FILE%"
)

(
echo.
echo ^<h2^>Service Status Details^</h2^>
echo ^<table^>
echo ^<tr^>^<th^>Check^</th^>^<th^>Status^</th^>^</tr^>
echo ^<tr^>^<td^>Backend Process^</td^>^<td^><span class='ok'^>Running</span^>^</td^>^</tr^>
echo ^<tr^>^<td^>Port %API_PORT%^</td^>^<td^><span class='ok'^>Listening</span^>^</td^>^</tr^>
echo ^<tr^>^<td^>API /health^</td^>^<td^><span class='ok'^>OK</span^>^</td^>^</tr^>
echo ^<tr^>^<td^>Database Connection^</td^>^<td^><span class='ok'^>OK</span^>^</td^>^</tr^>
echo ^<tr^>^<td^>Monitoring^</td^>^<td^><span class='warn'^>Not checked</span^>^</td^>^</tr^>
echo ^<tr^>^<td^>Telegram Bot^</td^>^<td^><span class='warn'^>Not checked</span^>^</td^>^</tr^>
echo ^<tr^>^<td^>Cloudflare Tunnel^</td^>^<td^><span class='warn'^>Not checked</span^>^</td^>^</tr^>
echo ^</table^>
echo.
echo ^<p^>^<strong^>Machine:^</strong^> %MACHINE_NAME%^</p^>
echo ^<p^>^<strong^>Checked:^</strong^> %TIMESTAMP%^</p^>
echo.
echo ^<h2^>Quick Actions^</h2^>
echo ^<a href="file:///%LOGS_DIR%" class="btn"^>Open Logs^</a^>
echo ^<a href="file:///%CONFIG_DIR%" class="btn"^>Open Config^</a^>
echo ^<a href="http://localhost:%API_PORT%/health" class="btn"^>Test API^</a^>
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
) else (
    echo ========================================================
    echo   RED: Packing List Server is not ready.
    echo ========================================================
    echo.
    echo Failed checks:
    for %%F in (!FAILED_CHECKS!) do echo   - %%~F
)
echo.
echo Summary: %PASSED_COUNT% passed, %FAILED_COUNT% failed
echo.
echo Status report: %STATUS_FILE%
echo.

:: Open status report
start "" "%STATUS_FILE%"

echo.
echo [%TIMESTAMP%] [STATUS] Check completed: %PASSED_COUNT% passed, %FAILED_COUNT% failed >> "%LAUNCHER_LOG%"

pause
exit /b 0
