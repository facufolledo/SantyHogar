#!/usr/bin/env python3
"""
Script para ejecutar la migración 008: Trigger para crear cliente automáticamente.
"""
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

def run_migration():
    """Ejecuta la migración 008."""
    print("🚀 Ejecutando migración 008: Trigger para crear cliente automáticamente")
    print(f"📍 Supabase URL: {SUPABASE_URL}")
    
    # Leer el archivo SQL
    migration_file = Path(__file__).parent.parent / "database" / "migrations" / "008_create_cliente_on_signup.sql"
    
    if not migration_file.exists():
        print(f"❌ Error: No se encontró el archivo {migration_file}")
        sys.exit(1)
    
    with open(migration_file, "r", encoding="utf-8") as f:
        sql = f.read()
    
    print(f"📄 Leyendo SQL desde: {migration_file}")
    
    # Crear cliente de Supabase
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    try:
        # Ejecutar el SQL usando RPC
        # Nota: Supabase no permite ejecutar SQL directamente desde el cliente Python
        # Necesitamos usar el SQL Editor en el dashboard o la API REST
        print("\n⚠️  IMPORTANTE:")
        print("Esta migración debe ejecutarse manualmente en el SQL Editor de Supabase.")
        print("\nPasos:")
        print("1. Ve a: https://supabase.com/dashboard/project/gsvtcrscojbfhgixxquw/sql/new")
        print("2. Copia y pega el siguiente SQL:")
        print("\n" + "="*80)
        print(sql)
        print("="*80)
        print("\n3. Haz clic en 'Run' para ejecutar")
        print("\n✅ Después de ejecutar, el trigger creará automáticamente un cliente")
        print("   cuando un usuario se registre con Google o email.")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migration()
