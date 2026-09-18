@echo off
title MAKI DESU POS Thermal Print Bridge Agent
color 0A

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ========================================================
    echo   MAKI DESU POS - Automatic Thermal Print Bridge
    echo ========================================================
    echo.
    echo [ERROR] Node.js is not found in system PATH.
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ========================================================
echo   MAKI DESU POS - Automatic Thermal Print Bridge
echo ========================================================
echo Starting local print bridge on http://127.0.0.1:18181...
echo Press Ctrl+C to stop.
echo.

node "%~dp0server.js"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Print Bridge stopped with an unexpected error.
    pause
)
