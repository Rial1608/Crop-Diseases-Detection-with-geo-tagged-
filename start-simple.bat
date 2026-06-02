@echo off
REM Simple startup script for testing without full dependencies

echo ====================================================
echo   Smart Crop Disease Detection System 
echo   Fast Startup (without ML dependencies)
echo ====================================================
echo.

echo [1] Checking Python...
python --version

echo [2] Installing minimal backend dependencies...
cd backend
pip install fastapi uvicorn python-multipart pydantic requests --quiet
cd ..

echo [3] Starting backend server (port 8000)...
start cmd /k "cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 3

echo [4] Checking Node.js...
node --version

echo [5] Installing frontend dependencies...
cd frontend
if not exist node_modules (echo Installing npm packages ^(first time^)... && npm install)
cd ..

echo [6] Starting frontend development server (port 5173)...
start cmd /k "cd frontend && npm run dev"

timeout /t 3

echo.
echo ====================================================
echo   Services Starting!
echo ====================================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
echo.
echo Press Ctrl+C in either window to stop services
echo.
pause
