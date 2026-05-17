@echo off
title Drizzt CRM - Mockup Watcher
cd /d "%~dp0\.."
echo Iniciando watcher de mockups...
echo.
node scripts/mockup-watcher.mjs
echo.
echo Watcher detenido. Pulsa una tecla para cerrar.
pause >nul
