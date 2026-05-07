@echo off
:: Packing List System — Windows Installer
:: Double-click this file. It will request Administrator if needed.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"
pause
