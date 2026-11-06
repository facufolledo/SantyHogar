"""
Script para mostrar las migraciones 006 y 007 que deben ejecutarse manualmente.
"""
import os

def show_migration(migration_file: str, migration_name: str):
    """Muestra el contenido de una migración."""
    print(f"\n{'='*70}")
    print(f"📝 {migration_name}")
    print(f"{'='*70}\n")
    
    migration_path = os.path.join(
        os.path.dirname(__file__), 
        '..', 
        'database', 
        'migrations', 
        migration_file
    )
    
    with open(migration_path, 'r', encoding='utf-8') as f:
        sql = f.read()
    
    print(sql)
    print()

def main():
    """Muestra las migraciones que deben ejecutarse."""
    print("\n" + "="*70)
    print("🚀 MIGRACIONES PENDIENTES - SantyHogar")
    print("="*70)
    print("\n📍 Ejecuta estos SQL en el SQL Editor de Supabase:")
    print("   https://supabase.com/dashboard/project/gsvtcrscojbfhgixxquw/sql/new")
    
    show_migration("006_fix_rls_clientes.sql", "MIGRACIÓN 006: Fix RLS en tabla clientes")
    show_migration("007_create_direcciones_favoritos.sql", "MIGRACIÓN 007: Crear tablas direcciones y favoritos")
    
    print("="*70)
    print("✅ Después de ejecutar ambos SQL, verifica con:")
    print("   python backend/scripts/check_migrations.py")
    print("="*70 + "\n")

if __name__ == "__main__":
    main()
