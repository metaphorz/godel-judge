@echo off
REM Stop the Gödel Judge application
REM Windows batch file equivalent of stop script
REM Note: This script is optional - you can just run start.bat and it will handle cleanup automatically

echo Stopping Gödel Judge...
echo.

REM Kill all node.exe processes (this will stop vite/npm)
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo √ Server stopped
) else (
    echo √ Server stopped (no running processes found)
)

REM Clear port 5173 to ensure it's fully released
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo √ Port 5173 cleared

echo √ Gödel Judge has been shut down
echo.
echo i  Tip: You can run 'start.bat' directly next time - it handles cleanup automatically
