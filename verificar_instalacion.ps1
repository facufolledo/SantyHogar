# Script para verificar la instalacion de SantyHogar

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Verificacion de Instalacion" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Python
Write-Host "[1/6] Verificando Python..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Python instalado: $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Python NO instalado" -ForegroundColor Red
    exit 1
}

# 2. Verificar Node.js
Write-Host "[2/6] Verificando Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Node.js instalado: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Node.js NO instalado" -ForegroundColor Red
}

# 3. Verificar entorno virtual
Write-Host "[3/6] Verificando entorno virtual..." -ForegroundColor Yellow
if (Test-Path ".venv") {
    Write-Host "  [OK] Entorno virtual existe en .venv" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Entorno virtual NO existe" -ForegroundColor Red
    Write-Host "    Ejecuta: python -m venv .venv" -ForegroundColor Yellow
}

# 4. Verificar dependencias de backend
Write-Host "[4/6] Verificando dependencias de backend..." -ForegroundColor Yellow
if (Test-Path ".venv") {
    & .\.venv\Scripts\Activate.ps1
    $pipList = pip list 2>&1
    if ($pipList -match "fastapi") {
        Write-Host "  [OK] Dependencias de backend instaladas" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] Dependencias de backend NO instaladas" -ForegroundColor Red
        Write-Host "    Ejecuta: pip install -r backend\requirements.txt" -ForegroundColor Yellow
    }
}

# 5. Verificar dependencias de frontend
Write-Host "[5/6] Verificando dependencias de frontend..." -ForegroundColor Yellow
if (Test-Path "frontend\node_modules") {
    Write-Host "  [OK] Dependencias de frontend instaladas" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Dependencias de frontend NO instaladas" -ForegroundColor Red
    Write-Host "    Ejecuta: cd frontend; npm install" -ForegroundColor Yellow
}

# 6. Verificar archivos .env
Write-Host "[6/6] Verificando archivos de configuracion..." -ForegroundColor Yellow
$backendEnvOk = Test-Path "backend\.env"
$frontendEnvOk = Test-Path "frontend\.env"

if ($backendEnvOk) {
    Write-Host "  [OK] backend/.env existe" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] backend/.env NO existe" -ForegroundColor Red
    Write-Host "    Copia backend/.env.example a backend/.env" -ForegroundColor Yellow
}

if ($frontendEnvOk) {
    Write-Host "  [OK] frontend/.env existe" -ForegroundColor Green
} else {
    Write-Host "  [AVISO] frontend/.env NO existe (opcional)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Resumen" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

if ($pythonVersion -and (Test-Path ".venv") -and $pipList -match "fastapi" -and $backendEnvOk) {
    Write-Host "[OK] Backend listo para iniciar" -ForegroundColor Green
    Write-Host "  Ejecuta: .\start_backend.ps1" -ForegroundColor Cyan
} else {
    Write-Host "[ERROR] Backend necesita configuracion" -ForegroundColor Red
}

if ($nodeVersion -and (Test-Path "frontend\node_modules")) {
    Write-Host "[OK] Frontend listo para iniciar" -ForegroundColor Green
    Write-Host "  Ejecuta: cd frontend; npm run dev" -ForegroundColor Cyan
} else {
    Write-Host "[ERROR] Frontend necesita configuracion" -ForegroundColor Red
}

Write-Host ""
