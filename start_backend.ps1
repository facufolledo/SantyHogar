# Script para iniciar el backend de SantyHogar
# Activa el entorno virtual desde la raíz y ejecuta el servidor

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  SantyHogar Backend - Inicio" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que el entorno virtual existe
if (-not (Test-Path ".venv")) {
    Write-Host "ERROR: No se encontró el entorno virtual (.venv)" -ForegroundColor Red
    Write-Host "Ejecuta primero: python -m venv .venv" -ForegroundColor Yellow
    exit 1
}

# Activar entorno virtual
Write-Host "Activando entorno virtual..." -ForegroundColor Green
& .\.venv\Scripts\Activate.ps1

# Verificar que las dependencias están instaladas
Write-Host "Verificando dependencias..." -ForegroundColor Green
$pipList = pip list 2>&1
if ($pipList -notmatch "fastapi") {
    Write-Host "ADVERTENCIA: Dependencias no instaladas" -ForegroundColor Yellow
    Write-Host "Instalando dependencias..." -ForegroundColor Green
    pip install -r backend\requirements.txt
}

Write-Host ""
Write-Host "Iniciando backend en puerto 8000..." -ForegroundColor Green
Write-Host "URL: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona CTRL+C para detener el servidor" -ForegroundColor Yellow
Write-Host ""

# Cambiar al directorio backend e iniciar servidor
Set-Location backend
python -m uvicorn app.main:app --reload --port 8000
