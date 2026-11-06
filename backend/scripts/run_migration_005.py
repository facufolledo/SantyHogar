"""Script para ejecutar la migración 005 - Crear tabla clientes."""
import os
import sys
from pathlib import Path

# Agregar el directorio raíz al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from supabase import create_client, Client
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: SUPABASE_URL y SUPABASE_KEY deben estar configurados en .env")
    sys.exit(1)

# Leer el archivo de migración
migration_file = Path(__file__).parent.parent / "database" / "migrations" / "005_create_clientes_table.sql"

if not migration_file.exists():
    print(f"❌ Error: No se encontró el archivo de migración: {migration_file}")
    sys.exit(1)

with open(migration_file, "r", encoding="utf-8") as f:
    sql_content = f.read()

print("📋 Migración 005: Crear tabla clientes")
print("=" * 60)
print(f"Archivo: {migration_file}")
print(f"Supabase URL: {SUPABASE_URL}")
print("=" * 60)

# Crear cliente de Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

try:
    print("\n🚀 Ejecutando migración...")
    
    # Ejecutar el SQL usando la API REST de PostgREST
    # Nota: Supabase Python client no tiene método directo para ejecutar SQL arbitrario
    # Necesitamos usar el endpoint RPC o ejecutar manualmente en el dashboard
    
    print("\n⚠️  IMPORTANTE:")
    print("El cliente Python de Supabase no soporta ejecución directa de SQL DDL.")
    print("Por favor, ejecutá la migración manualmente siguiendo estos pasos:")
    print("\n1. Abrí el dashboard de Supabase:")
    print(f"   {SUPABASE_URL.replace('https://', 'https://supabase.com/dashboard/project/')}/editor")
    print("\n2. Andá a 'SQL Editor'")
    print("\n3. Copiá y pegá el siguiente SQL:\n")
    print("-" * 60)
    print(sql_content)
    print("-" * 60)
    print("\n4. Hacé click en 'Run' para ejecutar la migración")
    print("\n✅ Una vez ejecutado, la tabla 'clientes' estará lista para usar")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    sys.exit(1)
