@echo off
echo Starting HeartConnect Development Servers...
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd Backend && npm start"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd client && npm run dev"

echo.
echo Servers starting in separate command windows...
echo Frontend will be available at: http://localhost:5173
echo Backend API will be available at: http://localhost:4001
echo.
echo Press any key to close this window...
pause >nul