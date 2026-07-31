#!/usr/bin/env python3
"""Ejecutar migración 021: agregar image_url a categorias."""

import os
from pathlib import Path
from supabase import create_client

# Leer variables de entorno
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: SUPABASE_URL o SUPABASE_KEY no están configuradas")
    exit(1)

client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Leer el SQL
migration_file = Path(__file__).parent / 'database' / 'migrations' / '021_add_category_image.sql'
with open(migration_file, 'r') as f:
    sql = f.read()

print("🔧 Ejecutando migración 021...")
print(sql)

try:
    result = client.postgrest.session.post(
        f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
        json={"sql": sql},
        headers={
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json"
        }
    )
    print(f"✅ Migración 021 ejecutada exitosamente")
except Exception as e:
    print(f"❌ Error ejecutando migración: {e}")
    exit(1)
