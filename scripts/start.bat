@echo off
title Finance App - Iniciando...
cd /d "%~dp0.."
pm2 start ecosystem.config.cjs
pm2 save
timeout /t 3 >nul
start http://localhost:3000
