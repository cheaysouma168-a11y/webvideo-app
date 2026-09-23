@echo off
setlocal
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
    echo Python was not found in PATH.
    echo Please install Python 3 from https://www.python.org/downloads/
    pause
    exit /b 1
)

if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo Failed to create virtual environment.
        pause
        exit /b 1
    )
)

echo Installing dependencies...
call venv\Scripts\python.exe -m pip install -q --upgrade pip
call venv\Scripts\python.exe -m pip install -q -r requirements.txt
if errorlevel 1 (
    echo Failed to install dependencies.
    pause
    exit /b 1
)

echo Starting server...
start "Web Video Downloader Server" venv\Scripts\python.exe server.py

timeout /t 2 /nobreak >nul

echo Opening app in your browser...
start "" "%~dp0index.html"

echo.
echo Server is running at http://localhost:5000
echo Close the "Web Video Downloader Server" window to stop the server.
pause
