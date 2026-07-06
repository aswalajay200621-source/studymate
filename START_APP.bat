@echo off
title StudyMate - Starting Servers...
echo.
echo  ========================================
echo   StudyMate - Starting Development Servers
echo  ========================================
echo.
echo  Starting API Server on port 5000...
start "StudyMate API Server" cmd /k "cd /d C:\Users\aswal\.gemini\antigravity\scratch\studymate && pnpm --filter @workspace/api-server run dev"

timeout /t 5 /nobreak >nul

echo  Starting Web App on port 8081...
start "StudyMate Web App" cmd /k "cd /d C:\Users\aswal\.gemini\antigravity\scratch\studymate\artifacts\mobile && npx expo start --web --port 8081"

echo.
echo  ========================================
echo   Both servers are starting!
echo   Open your browser in ~30 seconds at:
echo   http://localhost:8081
echo  ========================================
echo.
timeout /t 8 /nobreak >nul
start http://localhost:8081
