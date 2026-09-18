@echo off
title Uninstall Maki Desu Print Bridge from Windows Startup
color 0C
echo ========================================================================
echo    MAKI DESU POS — UNINSTALL PRINT BRIDGE FROM WINDOWS STARTUP
echo ========================================================================
echo.

set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SHORTCUT_PATH=%STARTUP_DIR%\MakiDesuPrintBridge.lnk

if exist "%SHORTCUT_PATH%" (
    del /f /q "%SHORTCUT_PATH%"
    echo [SUCCESS] Removed Maki Desu Print Bridge from Windows Startup.
) else (
    echo [INFO] Print bridge startup shortcut was not found in Startup folder.
)

echo.
pause
