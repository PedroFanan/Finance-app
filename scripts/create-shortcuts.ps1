# Cria atalhos da área de trabalho para o Finance App
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
$desktop = [Environment]::GetFolderPath('Desktop')
$ws = New-Object -ComObject WScript.Shell

# Atalho principal — abre o app no navegador
$shortcut = $ws.CreateShortcut("$desktop\Finance App.lnk")
$shortcut.TargetPath = "http://localhost:3000"
$shortcut.Description = "Finance App - Gestão Financeira"
$shortcut.Save()

Write-Host "✅ Atalho 'Finance App' criado na área de trabalho"
Write-Host "   Clique para abrir: http://localhost:3000"
