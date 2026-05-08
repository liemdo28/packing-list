@echo off
:: ============================================================
:: install-k6-windows.bat
:: Downloads and installs k6 load testing tool on Windows.
:: Run this once as Administrator, then restart your terminal.
:: ============================================================

echo === Installing k6 on Windows ===
echo.

:: Try winget first (available on Windows 10 1709+ / 11)
where winget >nul 2>&1
if %errorlevel% == 0 (
    echo Using winget...
    winget install k6 --source winget --silent
    goto :verify
)

:: Try chocolatey
where choco >nul 2>&1
if %errorlevel% == 0 (
    echo Using Chocolatey...
    choco install k6 -y
    goto :verify
)

:: Manual download fallback
echo winget and choco not found. Downloading MSI manually...
echo.
set MSI_URL=https://dl.k6.io/msi/k6-latest-amd64.msi
set MSI_FILE=%TEMP%\k6-latest.msi

curl -L -o "%MSI_FILE%" "%MSI_URL%"
if %errorlevel% neq 0 (
    echo ERROR: Download failed. Download manually from:
    echo   https://k6.io/docs/get-started/installation/
    exit /b 1
)

echo Installing k6 from MSI...
msiexec /i "%MSI_FILE%" /quiet /norestart
if %errorlevel% neq 0 (
    echo ERROR: MSI install failed. Try running as Administrator.
    exit /b 1
)
del "%MSI_FILE%"

:verify
echo.
echo === Verifying k6 installation ===
:: Refresh PATH
set PATH=%PATH%;%ProgramFiles%\k6
k6 version
if %errorlevel% == 0 (
    echo.
    echo SUCCESS: k6 installed. Close and reopen your terminal, then run:
    echo   stress\scripts\run-all.bat
) else (
    echo.
    echo NOTE: k6 installed but not yet on PATH.
    echo Close and reopen your terminal window, then try: k6 version
)
