@echo off
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is needed: install the LTS version from nodejs.org & pause & exit /b 1)
if not exist tripo_key.txt if "%TRIPO_API_KEY%"=="" (echo Put your Tripo API key in a file called tripo_key.txt in this folder, then run this again. & pause & exit /b 1)
echo Making the Titanic Scion with Tripo. This takes a few minutes and uses your Tripo credits.
node tools\tripo_make.cjs --name scion --prompt-file tools\tripo\scion.txt
pause
