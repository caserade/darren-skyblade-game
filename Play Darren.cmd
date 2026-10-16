@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -Command "$gameNode = Get-Command node -ErrorAction SilentlyContinue; if (!$gameNode) { Write-Host 'Node.js is needed. Install the LTS version from nodejs.org, then open Play Darren again. (Or open dist\DarrenSkyblade.html directly.)'; Read-Host 'Press Enter'; exit 1 }; Start-Process -FilePath $gameNode.Source -ArgumentList ('{0}{1}{0} --open' -f [char]34,(Join-Path (Get-Location) 'pc-server.cjs')) -WindowStyle Hidden"
