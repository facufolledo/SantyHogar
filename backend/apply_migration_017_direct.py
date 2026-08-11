#!/usr/bin/env python3
"""
Aplica la migración 017 DIRECTAMENTE en Supabase usando psycopg2.
Este script conecta a PostgreSQL y ejecuta el SQL para remover el CHECK CONSTRAINT.
"""

import os
import sys
from pathlib import Path
from urllib.parse import urlparse

sys.path.insert(0, os.path.dirname(__file__))

# Cargar variables de entorno
from dotenv import load_dotenv
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

def apply_migration():
    """Aplica la migración 017 directamente."""
    
    print("\n" + "="*80)
    print("  MIGRACIÓN 017: Remover CHECK CONSTRAINT")
    print("="*80 + "\n")
    
    if not SUPABASE_URL:
        print("❌ Error: SUPABASE_URL no definida en .env")
        return False
    
    # Intentar obtener contraseña del usuario
    SUPABASE_DB_PASSWORD = os.getenv("SUPABASE_DB_PASSWORD")
    if not SUPABASE_DB_PASSWORD:
        print("⚠️  SUPABASE_DB_PASSWORD no definida")
        print("   Se necesita la contraseña de la BD para conectar directamente")
        print("   Puedes obtenerla de Supabase → Project Settings → Database")
        print()
        SUPABASE_DB_PASSWORD = input("📝 Ingresa tu contraseña de Supabase: ").strip()
        if not SUPABASE_DB_PASSWORD:
            print("❌ Contraseña requerida")
            return False
    
    # Parsear URL de Supabase
    parsed = urlparse(SUPABASE_URL)
    db_host = parsed.hostname
    db_name = "postgres"
    db_user = "postgres"
    db_port = 5432
    
    print(f"📍 Conectando a: {db_host}")
    
    try:
        import psycopg2
        
        # Conectar a Supabase
        conn = psycopg2.connect(
            host=db_host,
            database=db_name,
            user=db_user,
            password=SUPABASE_DB_PASSWORD,
            port=db_port,
            sslmode='require'
        )
        cursor = conn.cursor()
        
        print("✅ Conectado a Supabase\n")
        
        # SQL a ejecutar
        sql_statements = [
            # Paso 1: Remover el CHECK CONSTRAINT
            """
            ALTER TABLE IF EXISTS public.productos 
            DROP CONSTRAINT IF EXISTS productos_categoria_check;
            """,
            
            # Paso 2: Asegurar que existe la FK
            """
            ALTER TABLE IF EXISTS public.productos
            ADD CONSTRAINT IF NOT EXISTS productos_id_categoria_fk 
              FOREIGN KEY (id_categoria) 
              REFERENCES public.categorias(id_categoria) 
              ON DELETE SET NULL;
            """,
            
            # Paso 3: Crear índice
            """
            CREATE INDEX IF NOT EXISTS idx_productos_id_categoria 
              ON public.productos (id_categoria);
            """
        ]
        
        executed = 0
        failed = 0
        
        for i, sql in enumerate(sql_statements, 1):
            try:
                print(f"[{i}/3] Ejecutando SQL...", end=" ", flush=True)
                cursor.execute(sql)
                conn.commit()
                print("✅")
                executed += 1
            except Exception as e:
                print(f"❌ Error: {e}")
                conn.rollback()
                failed += 1
        
        cursor.close()
        conn.close()
        
        print(f"\n{'='*80}")
        print(f"✅ Migración completada: {executed} statements ejecutados")
        print(f"{'='*80}\n")
        
        if executed == 3:
            print("🎉 ÉXITO! Ahora puedes crear productos con categorías dinámicas.\n")
            print("📝 Próximo paso:")
            print("   1. Redeploy backend en Railway (opcional, ya está funcionando)")
            print("   2. Intenta crear un producto con categoría 'Cocinas' desde el admin")
            print("   3. Debería funcionar sin errores de CHECK CONSTRAINT\n")
            return True
        else:
            print(f"⚠️  Solo se ejecutaron {executed}/3 statements\n")
            return False
        
    except ImportError:
        print("❌ psycopg2 no está instalado\n")
        print("📋 ALTERNATIVA: Ejecuta manualmente en Supabase SQL Editor:")
        print("   1. Ve a: https://app.supabase.com/project/gsvtcrscojbfhgixxquw/sql/new")
        print("   2. Abre: backend/database/migrations/017_remove_hardcoded_categoria_check.sql")
        print("   3. Copia todo el contenido")
        print("   4. Pégalo en el SQL Editor de Supabase")
        print("   5. Click 'Run'\n")
        return False
        
    except Exception as e:
        print(f"❌ Error conectando a Supabase: {e}\n")
        print("📋 Instala psycopg2:")
        print("   pip install psycopg2-binary\n")
        return False


if __name__ == "__main__":
    try:
        success = apply_migration()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Error fatal: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
