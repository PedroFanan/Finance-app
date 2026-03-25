@echo off
title Finance App - Parando...
cd /d "%~dp0.."
pm2 stop all
echo Finance App parado.
timeout /t 2 >nul
