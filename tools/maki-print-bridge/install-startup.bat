@echo off
title Install Maki Desu Print Bridge to Windows Startup
color 0B
echo ========================================================================
echo    MAKI DESU POS — INSTALL PRINT BRIDGE TO WINDOWS STARTUP
echo ========================================================================
echo.

set SCRIPT_DIR=%~dp0
set VBS_TARGET=%SCRIPT_DIR%run-hidden.vbs
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SHORTCUT_NAME=MakiDesuPrintBridge.lnk

echo Current Bridge Directory: %SCRIPT_DIR%
echo Windows Startup Folder:   %STARTUP_DIR%
echo.

powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%STARTUP_DIR%\%SHORTCUT_NAME%'); $s.TargetPath = 'wscript.exe'; $s.Arguments = '\"%VBS_TARGET%\"'; $s.WorkingDirectory = '%SCRIPT_DIR%'; $s.Save()"

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Maki Desu Print Bridge installed to Windows Startup!
    echo It will now start automatically whenever this POS terminal boots up.
    echo.
    echo Starting the bridge service now...
    wscript.exe "%VBS_TARGET%"
    echo [OK] Bridge service started in background!
) else (
    echo [ERROR] Failed to create startup shortcut. Please run as Administrator.
)

echo.
pause
