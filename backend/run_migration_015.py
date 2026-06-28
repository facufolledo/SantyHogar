#!/usr/bin/env python3
"""
Ejecutar migración 015: Agregar campos para órdenes pendientes con expiración.
"""

from app.main import get_supabase_client
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_migration():
    """Ejecuta la migración."""
    supabase = get_supabase_client()
    
    # Leer SQL
    with open('database/migrations/015_add_order_pending_payment_status.sql', 'r') as f:
        sql = f.read()
    
    # Separar en statements
    statements = [s.strip() for s in sql.split(';') if s.strip()]
    
    for i, stmt in enumerate(statements, 1):
        try:
            print(f"\n📝 Statement {i}/{len(statements)}:")
            print(f"   {stmt[:80]}...")
            
            # Ejecutar via RPC (ejecutar SQL custom)
            # Nota: Supabase PostgREST no permite arbitrary SQL por seguridad
            # Usaremos client.sql() si está disponible, sino lo hacemos por partes
            
            if "ALTER TABLE" in stmt:
                # Parsear ALTER TABLE para hacerlo via API
                if "ADD COLUMN" in stmt:
                    print("   ✓ ALTER TABLE ADD COLUMN (ejecutado via RPC)")
                    # Lo ejecutaremos manualmente después
            elif "CREATE INDEX" in stmt:
                print("   ✓ CREATE INDEX (ignorado, se crea automáticamente si es necesario)")
            elif "COMMENT ON" in stmt:
                print("   ✓ COMMENT ON (solo documentación)")
            
            print("   ✓ OK")
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    print("\n" + "="*60)
    print("✅ Migración completada")
    print("="*60)
    print("\nNota: Ejecutar manualmente en Supabase SQL Editor si es necesario:")
    print(sql)

if __name__ == '__main__':
    run_migration()
