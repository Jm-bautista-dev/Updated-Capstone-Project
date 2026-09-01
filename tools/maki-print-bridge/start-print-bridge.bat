@echo off
title MAKI DESU POS Thermal Print Bridge Agent
color 0A
echo ========================================================
echo   MAKI DESU POS - Automatic Thermal Print Bridge
echo ========================================================
echo Starting local print bridge on http://127.0.0.1:18181...
echo Press Ctrl+C to stop.
echo.

node "%~dp0server.js"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Node.js is required to run the Print Bridge.
    echo Please install Node.js from https://nodejs.org/
    pause
)
