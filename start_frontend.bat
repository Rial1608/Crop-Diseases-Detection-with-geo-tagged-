@echo off
REM ─────────────────────────────────────────────────────────
REM  SmartCrop  —  Frontend Startup Script
REM ─────────────────────────────────────────────────────────
title SmartCrop Frontend

cd /d "%~dp0frontend"

echo.
echo  SmartCrop AI Frontend
echo  Starting Vite dev server...
echo  Opens at http://localhost:5173
echo.

npm run dev
