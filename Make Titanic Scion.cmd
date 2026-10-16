@echo off
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is needed: install the LTS version from nodejs.org & pause & exit /b 1)
if not exist meshy_key.txt if "%MESHY_API_KEY%"=="" (echo Put your Meshy API key in a file called meshy_key.txt in this folder, then run this again. & pause & exit /b 1)
echo Making the Titanic Scion with Meshy AI. This takes several minutes and uses your Meshy credits.
node tools\meshy_make.cjs --name scion --prompt-file tools\meshy\scion.txt
pause
