@echo off
setlocal enabledelayedexpansion

:: ============================================================
:: Packing List Server - Backup & Restore
:: ============================================================

set "INSTALL_DIR=C:\PackingList"
set "BACKUP_DIR=%INSTALL_DIR%\backups"
set "CONFIG_DIR=%INSTALL_DIR%\config"
set "LOGS_DIR=%INSTALL_DIR%\logs"

:: Get timestamp
for /f "tokens=2 delims==" %%a in ('wmic os get localdatetime /value') do set "DT=%%a"
set "TIMESTAMP=%DT:~0,4%-%DT:~4,2%-%DT:~6,2%_%DT:~8,2%-%DT:~10,2%"

:: Get timestamp for filename
set "BACKUP_FILE=%BACKUP_DIR%\packing-backup-%TIMESTAMP%.zip"

echo.
echo ========================================================
echo   PACKING LIST SERVER - BACKUP & RESTORE
echo ========================================================
echo.

:: Parse arguments
if "%~1"=="" goto :menu
if /i "%~1"=="backup" goto :do_backup
if /i "%~1"=="restore" goto :do_restore
if /i "%~1"=="list" goto :list_backups
goto :menu

:menu
echo Usage:
echo   backup-restore.bat backup    - Create a backup
echo   backup-restore.bat restore   - Restore from backup
echo   backup-restore.bat list      - List available backups
echo.
echo Or run this script interactively.
echo.
goto :interactive

:interactive
echo What would you like to do?
echo   [1] Create Backup
echo   [2] Restore from Backup
echo   [3] List Backups
echo   [4] Exit
echo.
set /p choice="Enter choice (1-4): "

if "%choice%"=="1" goto :do_backup
if "%choice%"=="2" goto :do_restore
if "%choice%"=="3" goto :list_backups
if "%choice%"=="4" exit /b 0
goto :interactive

:do_backup
echo.
echo ========================================================
echo   CREATING BACKUP
echo ========================================================
echo.

:: Create backup directory
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

:: Load database config
for /f "usebackq tokens=1,* delims==" %%a in ("%CONFIG_DIR%\backend.env") do (
    if "%%a"=="DB_HOST" set "DB_HOST=%%b"
    if "%%a"=="DB_PORT" set "DB_PORT=%%b"
    if "%%a"=="DB_NAME" set "DB_NAME=%%b"
    if "%%a"=="DB_USER" set "DB_USER=%%b"
    if "%%a"=="DB_PASS" set "DB_PASS=%%b"
)

:: Set defaults
if not defined DB_HOST set "DB_HOST=127.0.0.1"
if not defined DB_PORT set "DB_PORT=3306"
if not defined DB_NAME set "DB_NAME=packing_list"
if not defined DB_USER set "DB_USER=root"
if not defined DB_PASS set "DB_PASS=password"

echo [1/4] Backing up database...
mysqldump -h%DB_HOST% -P%DB_PORT% -u%DB_USER% -p%DB_PASS% %DB_NAME% > "%BACKUP_DIR%\db-backup-%TIMESTAMP%.sql"
if %errorlevel% equ 0 (
    echo        Database backed up successfully
) else (
    echo [WARNING] Database backup failed, continuing with file backup...
)

echo [2/4] Backing up configuration files...
if exist "%CONFIG_DIR%" (
    powershell -Command "Compress-Archive -Path '%CONFIG_DIR%\*' -DestinationPath '%BACKUP_DIR%\config-backup-%TIMESTAMP%.zip' -Force"
    echo        Configuration backed up
)

echo [3/4] Backing up logs...
if exist "%LOGS_DIR%" (
    powershell -Command "Compress-Archive -Path '%LOGS_DIR%\*' -DestinationPath '%BACKUP_DIR%\logs-backup-%TIMESTAMP%.zip' -Force"
    echo        Logs backed up
)

echo [4/4] Creating full backup archive...
powershell -Command "Compress-Archive -Path '%BACKUP_DIR%\db-backup-%TIMESTAMP%.sql','%BACKUP_DIR%\config-backup-%TIMESTAMP%.zip' -DestinationPath '%BACKUP_FILE%' -Force"
echo        Full backup created: %BACKUP_FILE%

:: Cleanup individual files
if exist "%BACKUP_DIR%\db-backup-%TIMESTAMP%.sql" del "%BACKUP_DIR%\db-backup-%TIMESTAMP%.sql" /q
if exist "%BACKUP_DIR%\config-backup-%TIMESTAMP%.zip" del "%BACKUP_DIR%\config-backup-%TIMESTAMP%.zip" /q
if exist "%BACKUP_DIR%\logs-backup-%TIMESTAMP%.zip" del "%BACKUP_DIR%\logs-backup-%TIMESTAMP%.zip" /q

echo.
echo ========================================================
echo   BACKUP COMPLETE
echo ========================================================
echo.
echo Backup file: %BACKUP_FILE%
echo.
pause
exit /b 0

:do_restore
echo.
echo ========================================================
echo   RESTORE FROM BACKUP
echo ========================================================
echo.

:list_backups
echo.
echo ========================================================
echo   AVAILABLE BACKUPS
echo ========================================================
echo.

if not exist "%BACKUP_DIR%" (
    echo No backups found. Backup directory does not exist.
    goto :end
)

echo Directory: %BACKUP_DIR%
echo.
dir /b "%BACKUP_DIR%\*.zip" 2>nul
if %errorlevel% neq 0 (
    echo No backup files found.
)

:end
echo.
pause
