#!/usr/bin/env python3
"""
Inspecciona los constraints en la tabla productos en Supabase.
Conecta directamente a PostgreSQL usando psycopg para ejecutar SQL raw.
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(__file__))

from app.database.connection import get_supabase_client

def inspect_constraints():
    """Inspecciona los constraints de la tabla productos."""
    
    supabase = get_supabase_client()
    
    print("\n" + "="*80)
    print("  INSPECCIONANDO CONSTRAINTS DE PRODUCTOS")
    print("="*80 + "\n")
    
    # Query 3: Ver todas las categorías disponibles
    print("📋 Categorías disponibles en la BD")
    print("-" * 80)
    try:
        result3 = supabase.table('categorias').select('id_categoria, nombre, slug').execute()
        if result3.data:
            print(f"Total: {len(result3.data)} categorías\n")
            for cat in result3.data:
                print(f"  ✓ {cat['nombre']:20} | slug: {cat['slug']:20} | id: {cat['id_categoria']}")
        else:
            print("  ⚠️ No hay categorías")
        print()
    except Exception as e:
        print(f"Error: {e}\n")
    
    # Query 4: Verificar estructura de productos
    print("📋 Estructura de tabla productos")
    print("-" * 80)
    try:
        # Insertar un producto temporal para ver la estructura
        result4 = supabase.table('productos').select('*').limit(1).execute()
        if result4.data and len(result4.data) > 0:
            product = result4.data[0]
            print("Columnas encontradas en un producto existente:")
            for key, value in product.items():
                print(f"  - {key}: {type(value).__name__}")
        else:
            print("  ℹ️ No hay productos para inspeccionar estructura")
        print()
    except Exception as e:
        print(f"Error: {e}\n")
    
    # Información importante
    print("📋 Información de Supabase")
    print("-" * 80)
    print(f"URL: {supabase.url if hasattr(supabase, 'url') else 'N/A'}")
    print(f"Client version: {supabase.__class__.__name__}")
    print()
    print("⚠️ IMPORTANTE:")
    print("  Para ver los constraints SQL exactos, necesitarás:")
    print("  1. Ir a Supabase Console → SQL Editor")
    print("  2. Ejecutar estas queries:")
    print()
    print("  SELECT conname, pg_get_constraintdef(oid)")
    print("  FROM pg_constraint")
    print("  WHERE conrelid = 'productos'::regclass;")
    print()
    print("  SELECT column_name, data_type")
    print("  FROM information_schema.columns")
    print("  WHERE table_name = 'productos'")
    print("  ORDER BY ordinal_position;")
    print()
    print("="*80 + "\n")


if __name__ == "__main__":
    try:
        inspect_constraints()
    except Exception as e:
        print(f"\n❌ Error crítico: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
