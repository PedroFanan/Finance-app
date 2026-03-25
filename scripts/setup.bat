@echo off
title Finance App - Setup
color 0B
echo.
echo ============================================
echo    Finance App - Configuracao Inicial
echo ============================================
echo.

cd /d "%~dp0.."

:: Verificar Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado. Instale em https://nodejs.org
    pause
    exit /b 1
)

:: Verificar pnpm
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Instalando pnpm...
    npm install -g pnpm
)

:: Instalar dependências
echo [1/5] Instalando dependencias...
pnpm install

:: Verificar .env da API
if not exist "apps\api\.env" (
    echo.
    echo [AVISO] Arquivo apps\api\.env nao encontrado!
    echo Copiando .env.example como base...
    copy "apps\api\.env.example" "apps\api\.env"
    echo.
    echo >> IMPORTANTE: Edite o arquivo apps\api\.env com suas configuracoes:
    echo    - DATABASE_URL: string de conexao do Supabase ou Neon
    echo    - JWT_ACCESS_SECRET: chave secreta (qualquer texto longo)
    echo    - JWT_REFRESH_SECRET: outra chave secreta
    echo.
    notepad "apps\api\.env"
    echo.
    echo Pressione qualquer tecla apos configurar o .env...
    pause >nul
)

:: Verificar .env.local do web
if not exist "apps\web\.env.local" (
    echo Criando apps\web\.env.local...
    (
        echo NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
        echo NEXT_PUBLIC_APP_NAME=Finance App
    ) > "apps\web\.env.local"
)

:: Gerar Prisma client
echo [2/5] Gerando cliente Prisma...
cd apps\api
pnpm prisma generate --schema src/prisma/schema.prisma
cd ..\..

:: Rodar migration
echo [3/5] Criando tabelas no banco de dados...
cd apps\api
pnpm prisma migrate deploy --schema src/prisma/schema.prisma
if %errorlevel% neq 0 (
    echo Tentando migration dev...
    pnpm prisma migrate dev --name init --schema src/prisma/schema.prisma
)
cd ..\..

:: Build web
echo [4/5] Compilando aplicacao web...
cd apps\web
pnpm build
cd ..\..

:: Instalar PM2 e configurar auto-start
echo [5/5] Configurando inicio automatico com Windows...
pm2 --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Instalando PM2...
    npm install -g pm2
    npm install -g pm2-windows-startup
)

:: Criar pasta de logs
mkdir logs 2>nul

:: Iniciar com PM2
pm2 start ecosystem.config.cjs
pm2 save

:: Configurar startup do Windows
pm2-startup install 2>nul
pm2 startup 2>nul

echo.
echo ============================================
echo    Configuracao concluida com sucesso!
echo ============================================
echo.
echo O Finance App esta rodando em:
echo    http://localhost:3000
echo.
echo O app inicia automaticamente com o Windows.
echo.

:: Criar atalho na area de trabalho
powershell -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([System.IO.Path]::Combine([Environment]::GetFolderPath('Desktop'), 'Finance App.lnk')); $s.TargetPath = 'http://localhost:3000'; $s.Description = 'Finance App - Gestao Financeira'; $s.Save()"
echo Atalho criado na area de trabalho!
echo.

:: Abrir no navegador
start http://localhost:3000
echo.
echo Pressione qualquer tecla para fechar...
pause >nul
