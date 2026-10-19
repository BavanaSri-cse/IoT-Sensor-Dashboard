@echo off
title Push IoT Sensor Dashboard to GitHub
cd /d "%~dp0"
echo =====================================================
echo   Pushing IoT Sensor Dashboard to GitHub
echo =====================================================
echo.
"C:\Users\25UCS050\AppData\Local\Programs\Git\cmd\git.exe" push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo =====================================================
    echo   SUCCESS! All files have been pushed to GitHub!
    echo =====================================================
) else (
    echo.
    echo If prompted to sign in, please complete the browser authentication.
)
echo.
pause
