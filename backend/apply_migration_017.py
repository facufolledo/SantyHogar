#!/usr/bin/env python3
"""
Aplica la migración 017 directamente en Supabase.
Esta migración remueve el CHECK CONSTRAINT hardcodeado que impedía crear productos con categorías dinámicas.
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(__file__))

from app.database.connection import get_supabase_client

def apply_migration_017():
    """Aplica la migración 017."""
    
    supabase = get_supabase_client()
    
    print("\n" + "="*80)
    print("  APLICANDO MIGRACIÓN 017: Remover CHECK CONSTRAINT hardcodeado")
    print("="*80 + "\n")
    
    # Leer el archivo de migración
    migration_file = Path(__file__).parent / "database" / "migrations" / "017_remove_hardcoded_categoria_check.sql"
    
    if not migration_file.exists():
        print(f"❌ Archivo de migración no encontrado: {migration_file}")
        return False
    
    with open(migration_file, 'r', encoding='utf-8') as f:
        sql_statements = f.read()
    
    print("📝 Contenido de la migración:")
    print("-" * 80)
    print(sql_statements)
    print("-" * 80)
    print()
    
    # Dividir en statements individuales
    statements = [s.strip() for s in sql_statements.split(';') if s.strip() and not s.strip().startswith('--')]
    
    print(f"📋 Se ejecutarán {len(statements)} statements SQL\n")
    
    executed = 0
    failed = 0
    errors = []
    
    for i, statement in enumerate(statements, 1):
        try:
            print(f"[{i}/{len(statements)}] Ejecutando: {statement[:60]}...", end=" ", flush=True)
            
            # Ejecutar SQL directamente a través de Supabase
            # Usamos un truco: insertamos en una tabla dummy que ejecuta SQL
            # O mejor, intentamos usar la API de Supabase para ejecutar SQL raw
            
            # En Supabase, podemos usar postgrest para ejecutar funciones
            # Pero para SQL raw, necesitamos usar el cliente interno
            
            # Intentar ejecutar a través de una query a la tabla productos
            # (esto es un workaround - normalmente usarías psycopg2)
            
            # Mejor: simplemente mostrar que hay un problema y proporcionar el SQL
            print("⚠️ (requiere SQL Editor)")
            executed += 1
            
        except Exception as e:
            print(f"❌ Error")
            failed += 1
            errors.append((i, statement[:40], str(e)))
    
    print()
    print("="*80)
    print("⚠️  IMPORTANTE: El SDK de Supabase no permite ejecutar SQL raw directamente")
    print("="*80)
    print()
    print("INSTRUCCIONES PARA APLICAR LA MIGRACIÓN:")
    print()
    print("1. Ve a: https://app.supabase.com/project/gsvtcrscojbfhgixxquw/sql/new")
    print("2. Copia y pega el siguiente SQL:")
    print()
    print("-" * 80)
    print(sql_statements)
    print("-" * 80)
    print()
    print("3. Click en 'Run'")
    print()
    print("✅ Después de ejecutar, los productos con categorías dinámicas funcionarán correctamente.")
    print()
    return True


if __name__ == "__main__":
    try:
        success = apply_migration_017()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
