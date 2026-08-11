"""
Script para ejecutar las migraciones 006 y 007 usando la API REST de Supabase.
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import requests
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

def execute_sql(sql: str, migration_name: str):
    """Ejecuta SQL usando la API REST de Supabase."""
    print(f"\n{'='*60}")
    print(f"📝 Ejecutando {migration_name}...")
    print(f"{'='*60}\n")
    
    # Supabase REST API no soporta ejecución directa de SQL
    # Necesitamos usar el endpoint de RPC o ejecutar manualmente
    
    print("⚠️  Para ejecutar esta migración, copia el siguiente SQL y ejecútalo en:")
    print(f"   {SUPABASE_URL.replace('https://', 'https://supabase.com/dashboard/project/')}/sql/new\n")
    print("-" * 60)
    print(sql)
    print("-" * 60)
    
    input("\n✋ Presiona ENTER después de ejecutar el SQL en Supabase...")
    print("✅ Migración marcada como ejecutada\n")

def main():
    """Ejecuta las migraciones 006 y 007."""
    print("🚀 Iniciando ejecución de migraciones 006 y 007...\n")
    print(f"📍 Supabase URL: {SUPABASE_URL}\n")
    
    # Leer migración 006
    migration_006_path = os.path.join(
        os.path.dirname(__file__), 
        '..', 
        'database', 
        'migrations', 
        '006_fix_rls_clientes.sql'
    )
    
    with open(migration_006_path, 'r', encoding='utf-8') as f:
        sql_006 = f.read()
    
    # Leer migración 007
    migration_007_path = os.path.join(
        os.path.dirname(__file__), 
        '..', 
        'database', 
        'migrations', 
        '007_create_direcciones_favoritos.sql'
    )
    
    with open(migration_007_path, 'r', encoding='utf-8') as f:
        sql_007 = f.read()
    
    # Ejecutar migraciones
    execute_sql(sql_006, "Migración 006: Fix RLS clientes")
    execute_sql(sql_007, "Migración 007: Crear direcciones y favoritos")
    
    print(f"\n{'='*60}")
    print("✅ Proceso completado")
    print(f"{'='*60}\n")
    print("🔍 Verificando migraciones...")
    
    # Verificar
    os.system("python backend/scripts/check_migrations.py")

if __name__ == "__main__":
    main()
