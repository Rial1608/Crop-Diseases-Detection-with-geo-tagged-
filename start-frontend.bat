@echo off
REM Start frontend dev server only
cd frontend
npm install --prefer-offline --no-audit
npm run dev
