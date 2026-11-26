@echo off
setlocal
cd /d "%~dp0"
title NoCharge V2 Quick Start

rem Refresh PATH for the standard Node.js MSI install location in this process.
if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
if defined ProgramFiles(x86) if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"

where node.exe >nul 2>&1
if errorlevel 1 goto node_missing
where npm.cmd >nul 2>&1
if errorlevel 1 goto npm_missing

for /f "delims=" %%V in ('node -p "process.versions.node.split('.')[0]"') do set "NODE_MAJOR=%%V"
if not defined NODE_MAJOR goto node_check_failed
if %NODE_MAJOR% LSS 20 goto node_too_old

rem The dev server uses port 5173. Avoid opening another site if it is already occupied.
powershell.exe -NoProfile -Command "$client = New-Object System.Net.Sockets.TcpClient; try { $client.Connect('127.0.0.1', 5173); exit 1 } catch { exit 0 } finally { $client.Dispose() }" >nul 2>&1
if errorlevel 1 goto port_in_use

if not exist "node_modules\vite\bin\vite.js" (
  echo First-time setup: downloading the project's packages. This may take a minute.
  echo.
  call npm.cmd ci
  if errorlevel 1 goto install_failed
)

echo Starting the NoCharge development server...
start "NoCharge V2 - local server" /D "%~dp0" cmd /k "npm.cmd run dev"
echo Waiting for the site to be ready...
node -e "const deadline=Date.now()+30000;const check=async()=>{try{const response=await fetch('http://127.0.0.1:5173/');const html=await response.text();if(response.ok&&html.includes('NoCharge'))process.exit(0)}catch{}if(Date.now()>=deadline)process.exit(1);setTimeout(check,500)};check();"
if errorlevel 1 goto server_not_ready
start "" "http://localhost:5173/"
echo The site is open in your browser. Leave the NoCharge server window open while you use it.
exit /b 0

:node_missing
echo Node.js was not found. Install Node.js 24 LTS first; the Windows setup guide explains which download to choose.
start "" "https://nodejs.org/en/download/archive/v24"
pause
exit /b 1

:npm_missing
echo npm was not found. Re-run the Node.js 24 LTS Windows Installer and keep its default npm and PATH options enabled.
pause
exit /b 1

:node_check_failed
echo Could not check the Node.js version. Re-open this launcher after installing Node.js 24 LTS.
pause
exit /b 1

:node_too_old
echo This project needs Node.js 20 or newer. Install the recommended Node.js 24 LTS Windows Installer.
start "" "https://nodejs.org/en/download/archive/v24"
pause
exit /b 1

:port_in_use
echo Port 5173 is already in use. Close another local development server, then double-click this file again.
pause
exit /b 1

:install_failed
echo Package installation did not complete. Check your internet connection, then double-click this file again.
pause
exit /b 1

:server_not_ready
echo The server did not respond on port 5173. Check the NoCharge server window for an error or URL.
echo If it printed a different port, open that URL from the server window.
pause
exit /b 1
