@echo off
REM Start the Gödel Judge application
REM Windows batch file equivalent of start script

echo Starting Gödel Judge...
echo.

REM Check if port 5173 is in use
netstat -ano | findstr :5173 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo WARNING: Port 5173 is already in use
    echo -^> Cleaning up existing server...
    echo.

    REM Kill processes using port 5173
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
        taskkill /F /PID %%a >nul 2>&1
    )

    REM Also kill any node/vite processes
    taskkill /F /IM node.exe >nul 2>&1

    echo √ Port cleared
    echo.
    timeout /t 1 /nobreak >nul
)

REM Start the dev server in the background
echo Starting dev server...
start /B npm run dev

REM Wait for server to start
echo Waiting for server to start...
timeout /t 3 /nobreak >nul

REM Open the browser
echo Opening browser...
start http://localhost:5173/

echo.
echo √ Gödel Judge is running at http://localhost:5173/
echo.
echo To stop: 'stop.bat' (or just run 'start.bat' again - it handles cleanup automatically)
