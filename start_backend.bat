@echo off
REM ─────────────────────────────────────────────────────────
REM  SmartCrop  —  Backend Startup Script
REM  Uses the project venv (Python 3.10 + TensorFlow)
REM ─────────────────────────────────────────────────────────
title SmartCrop Backend

cd /d "%~dp0backend"

echo.
echo  SmartCrop AI Backend
echo  Starting on http://localhost:8000
echo  Docs: http://localhost:8000/docs
echo.

venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
