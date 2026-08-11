"""
Script para ejecutar las migraciones 006 y 007 en Supabase.
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database.connection import get_supabase_client
import time

def run_migration(client, migration_file: str, migration_name: str):
    """Ejecuta una migración SQL."""
    print(f"\n{'='*60}")
    print(f"📝 Ejecutando {migration_name}...")
    print(f"{'='*60}\n")
    
    # Leer el archivo SQL
    migration_path = os.path.join(
        os.path.dirname(__file__), 
        '..', 
        'database', 
        'migrations', 
        migration_file
    )
    
    with open(migration_path, 'r', encoding='utf-8') as f:
        sql = f.read()
    
    try:
        # Ejecutar el SQL usando la API de Supabase
        # Nota: Supabase no tiene un método directo para ejecutar SQL arbitrario
        # desde el cliente Python, así que usaremos el método rpc si existe
        # o mostraremos el SQL para ejecutarlo manualmente
        
        print(f"⚠️  Supabase Python client no soporta ejecución directa de SQL.")
        print(f"   Por favor, ejecuta este SQL manualmente en el SQL Editor de Supabase:\n")
        print(f"   https://supabase.com/dashboard/project/gsvtcrscojbfhgixxquw/sql/new\n")
        print("-" * 60)
        print(sql)
        print("-" * 60)
        
        return False
        
    except Exception as e:
        print(f"❌ Error ejecutando {migration_name}: {e}")
        return False

def main():
    """Ejecuta las migraciones 006 y 007."""
    print("🚀 Iniciando ejecución de migraciones 006 y 007...\n")
    
    try:
        client = get_supabase_client()
        print("✅ Conexión a Supabase establecida\n")
    except Exception as e:
        print(f"❌ Error conectando a Supabase: {e}")
        print("\n💡 Verifica que:")
        print("   1. El archivo backend/.env tenga SUPABASE_URL y SUPABASE_KEY correctos")
        print("   2. Tengas conexión a internet")
        print("   3. La URL de Supabase sea válida")
        return
    
    # Ejecutar migración 006
    run_migration(client, "006_fix_rls_clientes.sql", "Migración 006: Fix RLS clientes")
    
    # Ejecutar migración 007
    run_migration(client, "007_create_direcciones_favoritos.sql", "Migración 007: Crear direcciones y favoritos")
    
    print(f"\n{'='*60}")
    print("✅ Proceso completado")
    print(f"{'='*60}\n")
    print("📋 Próximos pasos:")
    print("   1. Ejecuta el SQL mostrado arriba en el SQL Editor de Supabase")
    print("   2. Verifica que las tablas se crearon correctamente")
    print("   3. Ejecuta: python backend/scripts/check_migrations.py")

if __name__ == "__main__":
    main()
