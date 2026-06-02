@echo off
REM Start backend server only
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
