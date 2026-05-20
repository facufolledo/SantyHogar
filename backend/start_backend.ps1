# NOTA: Este script está deprecado
# Usa el script en la raíz del proyecto: ..\start_backend.ps1

Write-Host "NOTA: Usa el script en la raíz del proyecto" -ForegroundColor Yellow
Write-Host "Ejecuta: ..\start_backend.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "Redirigiendo..." -ForegroundColor Green
Start-Sleep -Seconds 2

Set-Location ..
& .\start_backend.ps1
