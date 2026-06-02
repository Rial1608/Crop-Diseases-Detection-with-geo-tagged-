@echo off
REM Smart Crop Disease Detection - Complete Startup Script
REM This script starts both backend and frontend servers

echo.
echo ========================================
echo    Smart Crop Disease Detection System
echo    Complete Startup Script
echo ========================================
echo.

REM Colors and setup
set "BACKEND_DIR=%cd%\backend"
set "FRONTEND_DIR=%cd%\frontend"

REM Check if directories exist
if not exist "%BACKEND_DIR%" (
    echo ❌ Backend directory not found!
    pause
    exit /b 1
)

if not exist "%FRONTEND_DIR%" (
    echo ❌ Frontend directory not found!
    pause
    exit /b 1
)

echo Creating/Activating Python virtual environment...

REM Create venv if it doesn't exist
if not exist "%BACKEND_DIR%\venv" (
    echo 📦 Creating Python virtual environment...
    cd /d "%BACKEND_DIR%"
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Failed to create virtual environment
        pause
        exit /b 1
    )
    echo ✓ Virtual environment created
)

REM Activate venv and install backend dependencies
echo.
echo 📥 Installing/Verifying backend dependencies...
cd /d "%BACKEND_DIR%"
call venv\Scripts\activate.bat

REM Check if requirements are installed
pip show fastapi > nul 2>&1
if errorlevel 1 (
    echo Installing dependencies from requirements.txt...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ❌ Failed to install backend dependencies
        pause
        exit /b 1
    )
    echo ✓ Backend dependencies installed
) else (
    echo ✓ Backend dependencies already installed
)

REM Check for .env file
if not exist "%BACKEND_DIR%\.env" (
    echo.
    echo ⚠️  .env file not found in backend directory
    echo    Creating from .env.example...
    copy "%BACKEND_DIR%\.env.example" "%BACKEND_DIR%\.env" > nul
    echo ⚠️  Please edit backend\.env and add your OPENWEATHER_API_KEY
)

REM Setup frontend
echo.
echo 📥 Installing/Verifying frontend dependencies...
cd /d "%FRONTEND_DIR%"

REM Check if node_modules exists
if not exist "%FRONTEND_DIR%\node_modules" (
    echo Installing npm dependencies...
    call npm install
    if errorlevel 1 (
        echo ❌ Failed to install frontend dependencies
        pause
        exit /b 1
    )
    echo ✓ Frontend dependencies installed
) else (
    echo ✓ Frontend dependencies already installed
)

REM Check for frontend .env file
if not exist "%FRONTEND_DIR%\.env" (
    echo.
    echo 📝 Creating frontend .env...
    echo REACT_APP_API_URL=http://localhost:8000 > "%FRONTEND_DIR%\.env"
)

REM Ready to start
echo.
echo ========================================
echo    ✓ Setup Complete!
echo ========================================
echo.
echo 📍 Starting servers in 3 seconds...
echo    Backend:  http://localhost:8000
echo    Frontend: http://localhost:5173
echo.
echo 📚 API Docs:  http://localhost:8000/docs
echo.
echo Press Ctrl+C in any terminal to stop
echo.
timeout /t 3

REM Start backend
echo.
echo 🚀 Starting Backend Server...
start cmd /k "cd /d %BACKEND_DIR% && venv\Scripts\activate.bat && python main.py"

REM Wait a few seconds for backend to start
timeout /t 3

REM Start frontend
echo 🚀 Starting Frontend Server...
start cmd /k "cd /d %FRONTEND_DIR% && npm run dev"

echo.
echo ✅ Both servers started!
echo.
echo 🌾 Smart Crop Disease Detection System is ready
echo 📱 Open browser to: http://localhost:5173
echo.
pause
