# Script para configurar el backend de SantyHogar desde cero
# Este script crea el entorno virtual e instala todas las dependencias

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURACIÓN BACKEND SANTYHOGAR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Python
Write-Host "[1/4] Verificando Python..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
Write-Host "      $pythonVersion" -ForegroundColor Green
Write-Host ""

# Crear entorno virtual
Write-Host "[2/4] Creando entorno virtual..." -ForegroundColor Yellow
if (Test-Path .venv) {
    Write-Host "      Entorno virtual ya existe. Eliminando..." -ForegroundColor Gray
    Remove-Item -Recurse -Force .venv
}
python -m venv .venv
Write-Host "      ✓ Entorno virtual creado" -ForegroundColor Green
Write-Host ""

# Activar entorno virtual e instalar dependencias
Write-Host "[3/4] Instalando dependencias..." -ForegroundColor Yellow
Write-Host "      Esto puede tomar unos minutos..." -ForegroundColor Gray
& .\.venv\Scripts\python.exe -m pip install --upgrade pip --quiet
& .\.venv\Scripts\python.exe -m pip install -r requirements.txt --quiet
Write-Host "      ✓ Dependencias instaladas" -ForegroundColor Green
Write-Host ""

# Verificar instalación
Write-Host "[4/4] Verificando instalación..." -ForegroundColor Yellow
$packages = & .\.venv\Scripts\pip.exe list
$fastapi = $packages | Select-String "fastapi"
$supabase = $packages | Select-String "supabase"
if ($fastapi -and $supabase) {
    Write-Host "      ✓ FastAPI: Instalado" -ForegroundColor Green
    Write-Host "      ✓ Supabase: Instalado" -ForegroundColor Green
} else {
    Write-Host "      ✗ Error en la instalación" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✓ CONFIGURACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para iniciar el backend, ejecuta:" -ForegroundColor Yellow
Write-Host "  .\start_backend.ps1" -ForegroundColor White
Write-Host ""
