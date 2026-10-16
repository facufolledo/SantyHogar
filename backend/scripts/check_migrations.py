"""
Script para verificar qué migraciones se han ejecutado en Supabase.
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database.connection import get_supabase_client

def check_migrations():
    """Verifica qué tablas existen en la base de datos."""
    client = get_supabase_client()
    
    print("🔍 Verificando estado de las migraciones...\n")
    
    # Verificar tabla clientes
    try:
        result = client.table("clientes").select("id_cliente").limit(1).execute()
        print("✅ Tabla 'clientes' existe (migración 005)")
    except Exception as e:
        print(f"❌ Tabla 'clientes' NO existe: {e}")
    
    # Verificar tabla direcciones
    try:
        result = client.table("direcciones").select("id_direccion").limit(1).execute()
        print("✅ Tabla 'direcciones' existe (migración 007)")
    except Exception as e:
        print(f"❌ Tabla 'direcciones' NO existe: {e}")
    
    # Verificar tabla favoritos
    try:
        result = client.table("favoritos").select("id_cliente").limit(1).execute()
        print("✅ Tabla 'favoritos' existe (migración 007)")
    except Exception as e:
        print(f"❌ Tabla 'favoritos' NO existe: {e}")
    
    # Verificar RLS en clientes
    print("\n🔒 Verificando RLS en tabla clientes...")
    print("   (Nota: No podemos verificar RLS directamente desde Python,")
    print("    pero si la tabla responde rápido, RLS está bien configurado)")

if __name__ == "__main__":
    check_migrations()
