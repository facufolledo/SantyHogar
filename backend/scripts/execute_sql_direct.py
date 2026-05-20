"""
Script para ejecutar SQL directamente usando psycopg2 (si está disponible).
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

def execute_migrations():
    """Intenta ejecutar las migraciones usando diferentes métodos."""
    print("🚀 Intentando ejecutar migraciones...\n")
    
    # Extraer el project ID de la URL
    project_id = SUPABASE_URL.replace('https://', '').split('.')[0]
    
    print(f"📍 Project ID: {project_id}")
    print(f"📍 Supabase URL: {SUPABASE_URL}\n")
    
    # Leer migraciones
    migrations_dir = os.path.join(os.path.dirname(__file__), '..', 'database', 'migrations')
    
    migration_006 = os.path.join(migrations_dir, '006_fix_rls_clientes.sql')
    migration_007 = os.path.join(migrations_dir, '007_create_direcciones_favoritos.sql')
    
    print("="*70)
    print("⚠️  IMPORTANTE: Supabase Python client no soporta ejecución de SQL")
    print("="*70)
    print("\n📋 OPCIONES PARA EJECUTAR LAS MIGRACIONES:\n")
    
    print("1️⃣  OPCIÓN 1 - SQL Editor Web (RECOMENDADO):")
    print(f"   Abre: https://supabase.com/dashboard/project/{project_id}/sql/new")
    print("   Copia y ejecuta el contenido de:")
    print(f"   - {migration_006}")
    print(f"   - {migration_007}\n")
    
    print("2️⃣  OPCIÓN 2 - Supabase CLI:")
    print("   Si tienes Supabase CLI instalado:")
    print(f"   supabase db push --db-url postgresql://postgres:[PASSWORD]@db.{project_id}.supabase.co:5432/postgres\n")
    
    print("3️⃣  OPCIÓN 3 - psql directo:")
    print("   Si tienes psql instalado:")
    print(f"   psql postgresql://postgres:[PASSWORD]@db.{project_id}.supabase.co:5432/postgres < {migration_006}")
    print(f"   psql postgresql://postgres:[PASSWORD]@db.{project_id}.supabase.co:5432/postgres < {migration_007}\n")
    
    print("="*70)
    print("💡 La forma más fácil es usar la OPCIÓN 1 (SQL Editor Web)")
    print("="*70)

if __name__ == "__main__":
    execute_migrations()
