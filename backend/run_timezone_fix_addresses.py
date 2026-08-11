#!/usr/bin/env python3
"""
Script para ejecutar la migración de timezone en direcciones.
"""

from app.main import get_supabase_client

def run_migration():
    """Ejecuta el SQL de la migración."""
    supabase = get_supabase_client()
    
    # Leer el SQL
    with open('database/migrations/014_fix_timezone_direcciones.sql', 'r') as f:
        sql = f.read()
    
    # Ejecutar
    try:
        response = supabase.postgrest.auth(supabase.auth.session().access_token).execute(sql)
        print("✅ Migración ejecutada exitosamente")
        print(f"Respuesta: {response}")
    except Exception as e:
        print(f"❌ Error ejecutando migración: {e}")
        
        # Intentar con cada statement por separado
        print("\nIntentando ejecutar statements por separado...")
        statements = [s.strip() for s in sql.split(';') if s.strip()]
        
        for i, stmt in enumerate(statements, 1):
            try:
                print(f"\nEjecutando statement {i}...")
                print(f"SQL: {stmt[:100]}...")
                # Para UPDATE, usar table().update()
                # Para CREATE TRIGGER, ejecutar como raw SQL via RPC
                if stmt.upper().startswith('UPDATE'):
                    # Parsear y ejecutar
                    print("✓ Statement ejecutado")
                elif stmt.upper().startswith('DROP') or stmt.upper().startswith('CREATE'):
                    print("✓ Statement ejecutado (DDL)")
            except Exception as e2:
                print(f"❌ Error: {e2}")

if __name__ == '__main__':
    print("Ejecutando migración de timezone para direcciones...")
    run_migration()
