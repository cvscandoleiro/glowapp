@echo off
setlocal

set "SCRIPT_PATH=%~dp0start-portal.ps1"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_PATH%"

endlocal