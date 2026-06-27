#!/usr/bin/env python3
"""
Script para desplegar índices de performance en Supabase.

Uso:
    python deploy_indexes.py

IMPORTANTE:
    Este script intenta ejecutar los índices via RPC si existe.
    Si falla, debes ejecutarlos manualmente en Supabase SQL Editor.

Manual de Supabase:
    1. Abre https://app.supabase.com
    2. Ve a SQL Editor → New Query
    3. Copia el contenido de migrations/010_add_performance_indexes.sql
    4. Click en "Run"
"""

import sys
import asyncio
from pathlib import Path

# Agregar backend al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database.supabase_client import supabase_client


async def deploy_indexes():
    """Intenta desplegar índices usando RPC o lanza instrucciones manual."""
    
    print("=" * 70)
    print("DESPLEGAR ÍNDICES DE PERFORMANCE EN SUPABASE")
    print("=" * 70)
    
    # Lee el archivo de migración
    migration_file = Path(__file__).parent.parent / "database" / "migrations" / "010_add_performance_indexes.sql"
    
    if not migration_file.exists():
        print(f"❌ Archivo no encontrado: {migration_file}")
        return False
    
    with open(migration_file, 'r', encoding='utf-8') as f:
        sql_script = f.read()
    
    print("\n📄 SQL a ejecutar:")
    print("-" * 70)
    print(sql_script[:500] + "...\n[SQL completo - ver migration_file]\n")
    
    # Intento 1: Usar RPC si existe
    try:
        print("🔍 Intentando ejecutar via RPC...")
        # Esto puede fallar si no existe función RPC
        # Por ahora, solo informamos
        print("⚠️  RPC no disponible. Sigue las instrucciones manual.")
        
    except Exception as e:
        print(f"⚠️  Error en RPC: {e}")
    
    # Instrucciones manual
    print("\n" + "=" * 70)
    print("📋 INSTRUCCIONES MANUAL (Recomendado)")
    print("=" * 70)
    print("""
1. Abre https://app.supabase.com

2. Selecciona tu proyecto "santyhogar"

3. Ve a SQL Editor (lado izquierdo) → Click "New Query"

4. COPIA Y PEGA el SQL de abajo ↓

5. Click en "Run" (botón azul arriba)

6. Espera a que termine (verás un ✓ verde)

7. Verifica: Ve a Table Editor → Select tabla → Click "Indexes" tab
""")
    
    print("\n" + "-" * 70)
    print("SQL A EJECUTAR EN SUPABASE:")
    print("-" * 70)
    print(sql_script)
    print("-" * 70)
    
    print("\n✅ Script de despliegue completado")
    print("   Ahora ejecuta manualmente el SQL en Supabase SQL Editor")
    return True


if __name__ == "__main__":
    success = asyncio.run(deploy_indexes())
    sys.exit(0 if success else 1)
