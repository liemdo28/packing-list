@echo off
:: ============================================================
:: stress\scripts\run-all.bat
::
:: Full validation suite for Windows CMD.
:: Run from repo root: stress\scripts\run-all.bat
::
:: Requirements: k6 must be installed (run install-k6-windows.bat first)
::
:: Env overrides (optional):
::   set BASE_URL=http://localhost:3001/api
::   set ADMIN_USER=admin
::   set ADMIN_PASSWORD=password
:: ============================================================

setlocal enabledelayedexpansion

:: ─── Config (override via environment) ──────────────────────
if not defined BASE_URL       set BASE_URL=http://localhost:3001/api
if not defined ADMIN_USER     set ADMIN_USER=admin
if not defined ADMIN_PASSWORD set ADMIN_PASSWORD=password
if not defined B1_USER        set B1_USER=user_b1
if not defined B2_USER        set B2_USER=user_b2
if not defined B3_USER        set B3_USER=user_b3
if not defined B1_PASSWORD    set B1_PASSWORD=password
if not defined B2_PASSWORD    set B2_PASSWORD=password
if not defined B3_PASSWORD    set B3_PASSWORD=password

:: ─── Setup ──────────────────────────────────────────────────
set SCRIPT_DIR=%~dp0
set K6_DIR=%SCRIPT_DIR%..\k6
set REPORT_DIR=%SCRIPT_DIR%..\reports

if not exist "%REPORT_DIR%" mkdir "%REPORT_DIR%"

for /f "tokens=2 delims= " %%a in ('date /t') do set TODAY=%%a
for /f "tokens=1 delims=:" %%a in ('time /t') do set HOUR=%%a
set TIMESTAMP=%TODAY:/=-%_%HOUR%
set PASS_COUNT=0
set FAIL_COUNT=0

echo.
echo ========================================================
echo   Restaurant Operation System — Stress Validation Suite
echo ========================================================
echo   BASE_URL:   %BASE_URL%
echo   ADMIN:      %ADMIN_USER%
echo   Timestamp:  %TIMESTAMP%
echo ========================================================
echo.

:: ─── Pre-flight: API health check ────────────────────────────
echo [1/5] Pre-flight health check...
curl -sf --max-time 5 %BASE_URL:~0,-4%/health >nul 2>&1
if %errorlevel% neq 0 (
    echo FAIL: API not reachable at %BASE_URL%
    echo       Make sure the server is running: npm start
    exit /b 1
)
echo PASS: API is reachable.
echo.

:: ─── Helper: run one k6 test ─────────────────────────────────
:: Usage: call :RunTest "label" "script.js" [extra k6 args]

:: ─── Test 1: Smoke ───────────────────────────────────────────
echo [2/5] Smoke test (1 VU, 1 iteration)...
set OUT=%REPORT_DIR%\%TIMESTAMP%-smoke.json
k6 run --out json="%OUT%" ^
  --env BASE_URL=%BASE_URL% ^
  --env ADMIN_USER=%ADMIN_USER% ^
  --env ADMIN_PASSWORD=%ADMIN_PASSWORD% ^
  "%K6_DIR%\smoke.js"
if %errorlevel% == 0 (
    echo PASS: Smoke test
    set /a PASS_COUNT+=1
) else (
    echo FAIL: Smoke test [exit %errorlevel%]
    set /a FAIL_COUNT+=1
)
echo.

:: ─── Test 2: Auth load ───────────────────────────────────────
echo [3/5] Auth load test...
set OUT=%REPORT_DIR%\%TIMESTAMP%-auth.json
k6 run --out json="%OUT%" ^
  --env BASE_URL=%BASE_URL% ^
  --env ADMIN_USER=%ADMIN_USER% ^
  --env ADMIN_PASSWORD=%ADMIN_PASSWORD% ^
  --env B1_USER=%B1_USER% --env B1_PASSWORD=%B1_PASSWORD% ^
  --env B2_USER=%B2_USER% --env B2_PASSWORD=%B2_PASSWORD% ^
  --env B3_USER=%B3_USER% --env B3_PASSWORD=%B3_PASSWORD% ^
  "%K6_DIR%\auth-load.js"
if %errorlevel% == 0 (
    echo PASS: Auth load test
    set /a PASS_COUNT+=1
) else (
    echo FAIL: Auth load test [exit %errorlevel%]
    set /a FAIL_COUNT+=1
)
echo.

:: ─── Test 3: Same-order concurrency ──────────────────────────
echo [4/5] Same-order concurrency test (race condition check)...
set OUT=%REPORT_DIR%\%TIMESTAMP%-concurrency.json
k6 run --out json="%OUT%" ^
  --env BASE_URL=%BASE_URL% ^
  --env ADMIN_USER=%ADMIN_USER% ^
  --env ADMIN_PASSWORD=%ADMIN_PASSWORD% ^
  --env B1_USER=%B1_USER% --env B1_PASSWORD=%B1_PASSWORD% ^
  --env B3_USER=%B3_USER% --env B3_PASSWORD=%B3_PASSWORD% ^
  "%K6_DIR%\same-order-concurrency.js"
if %errorlevel% == 0 (
    echo PASS: Concurrency test
    set /a PASS_COUNT+=1
) else (
    echo FAIL: Concurrency test [exit %errorlevel%]
    set /a FAIL_COUNT+=1
)
echo.

:: ─── Test 4: Order flow load ─────────────────────────────────
echo [5/5] Order flow load test...
set OUT=%REPORT_DIR%\%TIMESTAMP%-order-flow.json
k6 run --out json="%OUT%" ^
  --env BASE_URL=%BASE_URL% ^
  --env ADMIN_USER=%ADMIN_USER% ^
  --env ADMIN_PASSWORD=%ADMIN_PASSWORD% ^
  --env B1_USER=%B1_USER% --env B1_PASSWORD=%B1_PASSWORD% ^
  --env B3_USER=%B3_USER% --env B3_PASSWORD=%B3_PASSWORD% ^
  "%K6_DIR%\order-flow.js"
if %errorlevel% == 0 (
    echo PASS: Order flow test
    set /a PASS_COUNT+=1
) else (
    echo FAIL: Order flow test [exit %errorlevel%]
    set /a FAIL_COUNT+=1
)
echo.

:: ─── Summary ─────────────────────────────────────────────────
echo ========================================================
echo   RESULTS: %PASS_COUNT% passed, %FAIL_COUNT% failed
echo   Reports: %REPORT_DIR%
echo ========================================================

if %FAIL_COUNT% gtr 0 (
    echo STATUS: NOT READY FOR LIVE ROLLOUT
    exit /b 1
) else (
    echo STATUS: ALL CHECKS PASSED - READY FOR LIVE ROLLOUT
    exit /b 0
)
