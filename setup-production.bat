@echo off
setlocal enabledelayedexpansion

:: ============================================================
:: Packing List Server - Production Setup
:: ============================================================

echo.
echo ========================================================
echo   PACKING LIST SERVER - PRODUCTION SETUP
echo ========================================================
echo.

:: Configuration
set "INSTALL_DIR=C:\PackingList"
set "LOGS_DIR=%INSTALL_DIR%\logs"
set "CONFIG_DIR=%INSTALL_DIR%\config"
set "APP_DIR=%INSTALL_DIR%\app"
set "DESKTOP=%USERPROFILE%\Desktop"

:: Detect machine name
for /f "skip=1 usebackq delims=" %%a in (`wmic computersystem get name /value 2^>nul`) do (
    for /f "tokens=1,* delims==" %%b in ("%%a") do set "MACHINE_NAME=%%c"
)

echo [INFO] Machine: %MACHINE_NAME%
echo [INFO] Install Directory: %INSTALL_DIR%
echo.

:: ============================================================
:: CHECK PREREQUISITES
:: ============================================================

echo [1/7] Checking prerequisites...

:: Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js 20+ from https://nodejs.org
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do set "NODE_VERSION=%%v"
echo        Node.js: %NODE_VERSION% [OK]

:: Check npm
where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm not found.
    exit /b 1
)
for /f "tokens=*" %%v in ('npm -v') do set "NPM_VERSION=%%v"
echo        npm: %NPM_VERSION% [OK]

:: Check MySQL (optional - may be remote)
where mysql >nul 2>&1
if %ERRORLEVEL% equ 0 (
    for /f "tokens=*" %%v in ('mysql --version') do echo        MySQL: %%v [FOUND]
) else (
    echo        MySQL: [NOT LOCALLY INSTALLED - assuming remote]
)

:: Check PM2
npm list -g pm2 >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [INFO] Installing PM2 globally...
    npm install -g pm2
    if %ERRORLEVEL% neq 0 (
        echo [WARNING] PM2 installation failed. Will use direct node start.
    ) else (
        echo        PM2 installed [OK]
    )
) else (
    echo        PM2: [OK]
)

echo.

:: ============================================================
:: CREATE DIRECTORIES
:: ============================================================

echo [2/7] Creating directories...

if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"
if not exist "%CONFIG_DIR%" mkdir "%CONFIG_DIR%"
if not exist "%APP_DIR%" mkdir "%APP_DIR%"

echo        Created: %INSTALL_DIR%
echo        Created: %LOGS_DIR%
echo        Created: %CONFIG_DIR%
echo        Created: %APP_DIR%

echo.

:: ============================================================
:: COPY APPLICATION FILES
:: ============================================================

echo [3/7] Copying application files...

:: Copy server
if exist "%~dp0v2-react\server" (
    xcopy /E /Y /Q "%~dp0v2-react\server\*" "%APP_DIR%\server\" >nul 2>&1
    echo        Copied: Server
)

:: Copy functions (Cloudflare)
if exist "%~dp0functions" (
    xcopy /E /Y /Q "%~dp0functions\*" "%APP_DIR%\functions\" >nul 2>&1
    echo        Copied: Functions
)

:: Copy monitoring
if exist "%~dp0monitoring" (
    xcopy /E /Y /Q "%~dp0monitoring\*" "%APP_DIR%\monitoring\" >nul 2>&1
    echo        Copied: Monitoring
)

:: Copy telegram bot
if exist "%~dp0telegram" (
    xcopy /E /Y /Q "%~dp0telegram\*" "%APP_DIR%\telegram\" >nul 2>&1
    echo        Copied: Telegram Bot
)

echo.

:: ============================================================
:: CREATE CONFIG FILES
:: ============================================================

echo [4/7] Creating configuration files...

:: Backend env template
if not exist "%CONFIG_DIR%\backend.env" (
    (
        echo # Packing List Backend Configuration
        echo NODE_ENV=production
        echo PORT=3001
        echo.
        echo # Database - UPDATE THESE VALUES
        echo DB_HOST=127.0.0.1
        echo DB_PORT=3306
        echo DB_NAME=packing_list
        echo DB_USER=root
        echo DB_PASS=your_password_here
        echo.
        echo # Security
        echo JWT_SECRET=change_this_to_a_secure_random_string
        echo.
        echo # CORS
        echo CORS_ORIGIN=https://packinglist.yourdomain.com
        echo CLIENT_URL=https://packinglist.yourdomain.com
        echo.
        echo # Cloudflare Tunnel
        echo TUNNEL_URL=
        echo.
    ) > "%CONFIG_DIR%\backend.env"
    echo        Created: %CONFIG_DIR%\backend.env
)

:: Monitoring env template
if not exist "%CONFIG_DIR%\monitoring.env" (
    (
        echo # Monitoring Configuration
        echo CHECK_INTERVAL_MS=300000
        echo ALERT_THRESHOLD=3
        echo.
        echo # Telegram Alert Channel
        echo TELEGRAM_BOT_TOKEN=your_bot_token
        echo TELEGRAM_CHAT_ID=your_chat_id
        echo.
        echo # API Endpoint
        echo API_URL=http://localhost:3001/health
        echo.
    ) > "%CONFIG_DIR%\monitoring.env"
    echo        Created: %CONFIG_DIR%\monitoring.env
)

:: Telegram env template
if not exist "%CONFIG_DIR%\telegram.env" (
    (
        echo # Telegram Bot Configuration
        echo BOT_TOKEN=your_telegram_bot_token
        echo.
        echo # Admin users (comma separated telegram IDs)
        echo ADMIN_IDS=123456789
        echo.
        echo # API URL
        echo API_URL=http://localhost:3001/api
        echo.
    ) > "%CONFIG_DIR%\telegram.env"
    echo        Created: %CONFIG_DIR%\telegram.env
)

:: App settings
if not exist "%CONFIG_DIR%\app-settings.json" (
    (
        echo {
        echo   "appName": "Packing List Server",
        echo   "version": "2.0",
        echo   "machineName": "%MACHINE_NAME%",
        echo   "installDate": "%date% %time%",
        echo   "services": {
        echo     "backend": { "port": 3001, "enabled": true },
        echo     "monitoring": { "enabled": true },
        echo     "telegram": { "enabled": true },
        echo     "tunnel": { "enabled": false }
        echo   },
        echo   "autoStart": false,
        echo   "startMinimized": false
        echo }
    ) > "%CONFIG_DIR%\app-settings.json"
    echo        Created: %CONFIG_DIR%\app-settings.json
)

echo.

:: ============================================================
:: INSTALL DEPENDENCIES
:: ============================================================

echo [5/7] Installing dependencies...

if exist "%APP_DIR%\server\package.json" (
    echo        Installing server dependencies...
    cd /d "%APP_DIR%\server"
    call npm install --production 2>nul
    echo        Server dependencies installed
)

if exist "%APP_DIR%\monitoring\package.json" (
    echo        Installing monitoring dependencies...
    cd /d "%APP_DIR%\monitoring"
    call npm install --production 2>nul
    echo        Monitoring dependencies installed
)

if exist "%APP_DIR%\telegram\package.json" (
    echo        Installing telegram dependencies...
    cd /d "%APP_DIR%\telegram"
    call npm install --production 2>nul
    echo        Telegram dependencies installed
)

echo.

:: ============================================================
:: CREATE SHORTCUTS
:: ============================================================

echo [6/7] Creating desktop shortcuts...

set "SCRIPTS_DIR=%INSTALL_DIR%\scripts"

:: Create scripts directory
if not exist "%SCRIPTS_DIR%" mkdir "%SCRIPTS_DIR%"

:: Start shortcut
powershell -Command "$s=(New-Object -COM WScript.Shell).CreateShortcut('%DESKTOP%\Start Packing List Server.lnk'); $s.TargetPath='%SCRIPTS_DIR%\Start-PackingList.bat'; $s.WorkingDirectory='%SCRIPTS_DIR%'; $s.Description='Start Packing List Server'; $s.Save()"
echo        Created: Start Packing List Server.lnk

:: Stop shortcut
powershell -Command "$s=(New-Object -COM WScript.Shell).CreateShortcut('%DESKTOP%\Stop Packing List Server.lnk'); $s.TargetPath='%SCRIPTS_DIR%\Stop-PackingList.bat'; $s.WorkingDirectory='%SCRIPTS_DIR%'; $s.Description='Stop Packing List Server'; $s.Save()"
echo        Created: Stop Packing List Server.lnk

:: Status shortcut
powershell -Command "$s=(New-Object -COM WScript.Shell).CreateShortcut('%DESKTOP%\Check Packing List Status.lnk'); $s.TargetPath='%SCRIPTS_DIR%\Check-Status.bat'; $s.WorkingDirectory='%SCRIPTS_DIR%'; $s.Description='Check Packing List Server Status'; $s.Save()"
echo        Created: Check Packing List Status.lnk

:: Open app shortcut
powershell -Command "$s=(New-Object -COM WScript.Shell).CreateShortcut('%DESKTOP%\Open Packing List App.lnk'); $s.TargetPath='%INSTALL_DIR%\config\app-settings.json'; $s.Description='Open Packing List App'; $s.Save()"
echo        Created: Open Packing List App.lnk

:: Open logs shortcut
powershell -Command "$s=(New-Object -COM WScript.Shell).CreateShortcut('%DESKTOP%\Open Logs Folder.lnk'); $s.TargetPath='explorer.exe'; $s.Arguments='%LOGS_DIR%'; $s.WorkingDirectory='%LOGS_DIR%'; $s.Description='Open Packing List Logs'; $s.Save()"
echo        Created: Open Logs Folder.lnk

echo.

:: ============================================================
:: GENERATE INSTALL REPORT
:: ============================================================

echo [7/7] Generating install report...

set "REPORT_FILE=%INSTALL_DIR%\install-report.html"

(
echo ^<html^>
echo ^<head^>
echo ^<title^>Packing List Server - Installation Report^</title^>
echo ^<style^>
echo body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
echo .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
echo h1 { color: #2563eb; }
echo .success { color: #22c55e; }
echo .info { color: #64748b; }
echo table { width: 100%%; border-collapse: collapse; margin: 20px 0; }
echo th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
echo th { background: #f8fafc; color: #475569; }
echo .btn { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; margin: 10px 5px 10px 0; }
echo .btn:hover { background: #1d4ed8; }
echo ^</style^>
echo ^</head^>
echo ^<body^>
echo ^<div class="container"^>
echo ^<h1^>Packing List Server - Installation Report^</h1^>
echo ^<p class="success"^>Installation completed successfully!^</p^>
echo.
echo ^<h2^>System Information^</h2^>
echo ^<table^>
echo ^<tr^>^<th^>Item^</th^>^<th^>Value^</th^>^</tr^>
echo ^<tr^>^<td^>Machine Name^</td^>^<td^>%MACHINE_NAME%^</td^>^</tr^>
echo ^<tr^>^<td^>Node.js^</td^>^<td^>%NODE_VERSION%^</td^>^</tr^>
echo ^<tr^>^<td^>Install Date^</td^>^<td^>%date% %time%^</td^>^</tr^>
echo ^<tr^>^<td^>Install Directory^</td^>^<td^>%INSTALL_DIR%^</td^>^</tr^>
echo ^</table^>
echo.
echo ^<h2^>Next Steps^</h2^>
echo ^<ol^>
echo ^<li^>Edit configuration files in: %CONFIG_DIR%^</li^>
echo ^<li^>Set your database credentials in backend.env^</li^>
echo ^<li^>Configure Telegram bot token in telegram.env^</li^>
echo ^<li^>Double-click "Start Packing List Server" to start^</li^>
echo ^</ol^>
echo.
echo ^<h2^>Quick Actions^</h2^>
echo ^<a href="file:///%LOGS_DIR%" class="btn"^>Open Logs Folder^</a^>
echo ^<a href="file:///%CONFIG_DIR%" class="btn"^>Open Config Folder^</a^>
echo.
echo ^<p class="info"^>For support, check the documentation or contact your system administrator.^</p^>
echo ^</div^>
echo ^</body^>
echo ^</html^>
) > "%REPORT_FILE%"

echo        Created: %REPORT_FILE%

echo.

:: ============================================================
:: COMPLETION
:: ============================================================

echo ========================================================
echo   SETUP COMPLETE!
echo ========================================================
echo.
echo [SUCCESS] Packing List Server has been installed.
echo.
echo IMPORTANT: Please configure your settings before starting:
echo   1. Edit: %CONFIG_DIR%\backend.env
echo   2. Edit: %CONFIG_DIR%\telegram.env
echo   3. Edit: %CONFIG_DIR%\monitoring.env
echo.
echo Desktop shortcuts created:
echo   - Start Packing List Server
echo   - Stop Packing List Server
echo   - Check Packing List Status
echo   - Open Packing List App
echo   - Open Logs Folder
echo.
echo.

:: Open report
start "" "%REPORT_FILE%"

exit /b 0
