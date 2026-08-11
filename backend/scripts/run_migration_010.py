#!/usr/bin/env python3
"""Ejecutar migración 010: Agregar índices de performance en Supabase."""
import os
import sys
from pathlib import Path

# Agregar app al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database.connection import get_supabase_client


def main():
    """Ejecutar migración 010."""
    # Leer archivo de migración
    migration_file = Path(__file__).parent.parent / "database" / "migrations" / "010_add_performance_indexes.sql"
    
    if not migration_file.exists():
        print(f"❌ Archivo no encontrado: {migration_file}")
        return 1
    
    with open(migration_file, 'r') as f:
        sql = f.read()
    
    try:
        # Ejecutar migración
        supabase = get_supabase_client()
        result = supabase.rpc('exec_sql', {'sql': sql}).execute()
        
        print("✅ Migración 010 ejecutada exitosamente")
        print(f"Resultado: {result}")
        return 0
    
    except Exception as e:
        # Si no existe rpc, necesitamos usar SQL directamente
        # Supabase no expone exec_sql por defecto, hay que hacerlo manualmente
        print("⚠️  RPC no disponible. Necesitas ejecutar el SQL manualmente en Supabase SQL Editor:")
        print("\n" + "="*80)
        print(sql)
        print("="*80)
        print("\nPasos:")
        print("1. Ve a https://app.supabase.com/project/[tu-proyecto]/sql/new")
        print("2. Copia el SQL anterior")
        print("3. Ejecuta")
        print("4. Verifica que los índices se crearon en Table Editor")
        return 1


if __name__ == "__main__":
    sys.exit(main())
