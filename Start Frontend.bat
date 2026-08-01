@echo off
cd /d "%~dp0"
echo Starting Media Manager Frontend via Nginx...
echo.

:: Navigate to the Desktop (two folders up from the Frontend folder)
cd ..\..

:: Search for any folder starting with "nginx" on the Desktop
FOR /D %%G IN ("nginx*") DO (
    echo Found Nginx folder: %%G
    cd "%%G"
    
    :: Start nginx in the background
    start nginx.exe
    echo Nginx started successfully!
    goto :started
)

echo ERROR: Could not find an "nginx" folder on your Desktop!
pause
exit

:started
echo ===================================================
echo Frontend is running on this port: 5173
echo ===================================================

:: Automatically open the default browser to the URL
start http://localhost:5173

exit
