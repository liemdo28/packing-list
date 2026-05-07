@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0check-status.ps1"
exit /b %ERRORLEVEL%
