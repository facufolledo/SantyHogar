#!/usr/bin/env python3
"""
Ejecuta todas las migrations en orden.
Reconstruye la BD desde cero.
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(__file__))

from app.database.connection import get_supabase_client

def execute_migrations():
    """Ejecuta todas las migrations en orden."""
    
    supabase = get_supabase_client()
    migrations_dir = Path(__file__).parent / "database" / "migrations"
    
    # Obtener todas las migrations ordenadas
    migrations = sorted(migrations_dir.glob("*.sql"))
    
    print("\n" + "="*80)
    print("  EJECUTANDO MIGRATIONS - RECONSTRUIR BD")
    print("="*80 + "\n")
    
    executed = 0
    failed = 0
    errors = []
    
    for migration_file in migrations:
        migration_name = migration_file.name
        
        try:
            # Leer el archivo
            with open(migration_file, 'r', encoding='utf-8') as f:
                sql = f.read()
            
            if not sql.strip():
                print(f"[{executed + failed + 1}/{len(migrations)}] {migration_name}... (vacío, saltando)")
                continue
            
            print(f"[{executed + failed + 1}/{len(migrations)}] {migration_name}...", end=" ", flush=True)
            
            # Ejecutar SQL directamente
            result = supabase.rpc('execute_sql', {'sql': sql}).execute()
            
            print("✅")
            executed += 1
            
        except Exception as e:
            error_msg = str(e)
            print(f"❌")
            failed += 1
            errors.append((migration_name, error_msg))
            print(f"    Error: {error_msg[:150]}")
    
    print("\n" + "="*80)
    print(f"  RESULTADO: {executed} exitosas, {failed} fallidas de {len(migrations)}")
    print("="*80 + "\n")
    
    if errors:
        print("❌ ERRORES ENCONTRADOS:")
        for name, error in errors:
            print(f"\n  {name}:")
            print(f"    {error[:200]}")
    
    if failed == 0:
        print("✅ Todas las migrations se ejecutaron correctamente\n")
        return True
    else:
        print(f"\n⚠️  {failed} migrations fallaron\n")
        return False


if __name__ == "__main__":
    try:
        success = execute_migrations()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Error crítico: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

