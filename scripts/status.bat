@echo off
title Finance App - Status
cd /d "%~dp0.."
pm2 list
echo.
pause
