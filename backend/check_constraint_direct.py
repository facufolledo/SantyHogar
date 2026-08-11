#!/usr/bin/env python3
"""
Verifica los constraints directamente en Supabase usando psycopg2
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
SUPABASE_DB_PASSWORD = os.getenv("SUPABASE_DB_PASSWORD")

def check_constraints():
    """Conecta a Supabase y verifica constraints."""
    
    print("\n" + "="*80)
    print("  VERIFICANDO CONSTRAINTS DIRECTAMENTE EN SUPABASE")
    print("="*80 + "\n")
    
    if not SUPABASE_URL:
        print("❌ Error: SUPABASE_URL no definida en .env")
        return
    
    # Parsear URL de Supabase
    parsed = urlparse(SUPABASE_URL)
    db_host = parsed.hostname
    db_name = "postgres"
    db_user = "postgres"
    db_port = 5432
    
    print(f"📍 Conectando a:")
    print(f"   Host: {db_host}")
    print(f"   Database: {db_name}")
    print(f"   User: {db_user}")
    print()
    
    try:
        import psycopg2
        
        # Conectar
        conn = psycopg2.connect(
            host=db_host,
            database=db_name,
            user=db_user,
            password=SUPABASE_DB_PASSWORD,
            port=db_port,
            sslmode='require'
        )
        cursor = conn.cursor()
        
        # Query 1: Constraints
        print("📋 QUERY 1: Constraints en tabla productos")
        print("-" * 80)
        cursor.execute("""
            SELECT conname, 
                   pg_get_constraintdef(oid) as constraint_def
            FROM pg_constraint 
            WHERE conrelid = 'productos'::regclass
            ORDER BY conname;
        """)
        
        constraints = cursor.fetchall()
        if constraints:
            for conname, constraint_def in constraints:
                print(f"\n  Constraint: {conname}")
                print(f"  Definición: {constraint_def}")
        else:
            print("  ✅ No hay constraints específicos encontrados")
        print()
        
        # Query 2: Columnas
        print("📋 QUERY 2: Estructura de tabla productos")
        print("-" * 80)
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'productos' 
            ORDER BY ordinal_position;
        """)
        
        columns = cursor.fetchall()
        for col_name, data_type, is_nullable in columns:
            nullable = "NULL" if is_nullable == "YES" else "NOT NULL"
            print(f"  - {col_name:25} {data_type:15} {nullable}")
        print()
        
        # Query 3: Ver el CHECK específico si existe
        print("📋 QUERY 3: Buscando CHECK CONSTRAINT 'productos_categoria_check'")
        print("-" * 80)
        cursor.execute("""
            SELECT pg_get_constraintdef(oid)
            FROM pg_constraint
            WHERE conname = 'productos_categoria_check';
        """)
        
        result = cursor.fetchone()
        if result:
            print(f"  ✓ ENCONTRADO:")
            print(f"    {result[0]}")
        else:
            print(f"  ✗ No existe (¡buen signo!)")
        print()
        
        cursor.close()
        conn.close()
        print("="*80 + "\n")
        
    except ImportError:
        print("❌ psycopg2 no está instalado")
        print("   Instálalo con: pip install psycopg2-binary")
        print()
        print("   ALTERNATIVA: Ejecuta estas queries en Supabase SQL Editor:")
        print()
        print("   SELECT conname, pg_get_constraintdef(oid)")
        print("   FROM pg_constraint")
        print("   WHERE conrelid = 'productos'::regclass;")
        print()
        return
    except Exception as e:
        print(f"❌ Error conectando a Supabase: {e}")
        print()
        print("   ALTERNATIVA: Ejecuta estas queries en Supabase SQL Editor:")
        print()
        print("   SELECT conname, pg_get_constraintdef(oid)")
        print("   FROM pg_constraint")
        print("   WHERE conrelid = 'productos'::regclass;")
        print()


if __name__ == "__main__":
    try:
        check_constraints()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
