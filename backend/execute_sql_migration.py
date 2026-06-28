#!/usr/bin/env python3
"""
Ejecutar SQL migrations directamente en Supabase via POST request.
"""

import os
import requests
from app.main import get_supabase_client

def execute_sql_migration():
    """Ejecuta migración vía SQL directo."""
    supabase = get_supabase_client()
    
    sql = """
    -- Agregar columnas para órdenes pendientes
    ALTER TABLE ordenes 
    ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'pendiente_pago',
    ADD COLUMN IF NOT EXISTS fecha_expiracion_pago TIMESTAMP,
    ADD COLUMN IF NOT EXISTS id_preferencia_mp TEXT;
    
    -- Index para el job
    CREATE INDEX IF NOT EXISTS idx_ordenes_estado_expiracion 
    ON ordenes(estado, fecha_expiracion_pago) 
    WHERE estado = 'pendiente_pago';
    """
    
    try:
        # Obtener la URL y token
        url = supabase.table("ordenes").select("*").limit(1).execute()
        print("✅ Conexión a Supabase OK")
        
        # En Supabase, ejecutar SQL via UI o usar PostgREST para operaciones específicas
        # Por ahora, mostramos instrucciones
        print("\n" + "="*60)
        print("📝 INSTRUCCIONES MANUALES:")
        print("="*60)
        print("\n1. Abre Supabase Dashboard → SQL Editor")
        print("2. Pega este SQL y ejecuta:\n")
        print(sql)
        print("\n" + "="*60)
        
        # Verificar si las columnas ya existen
        print("\n🔍 Verificando si las columnas ya existen...")
        try:
            # Intentar seleccionar las columnas
            test = supabase.table("ordenes").select(
                "id_orden, estado, fecha_expiracion_pago, id_preferencia_mp"
            ).limit(1).execute()
            
            print("✅ Columnas YA EXISTEN en la BD")
            print(f"   Datos: {test.data}")
            
        except Exception as e:
            if "column" in str(e).lower():
                print("❌ Columnas AÚN NO EXISTEN")
                print(f"   Error: {e}")
                print("\n   IMPORTANTE: Debes ejecutar el SQL manualmente en Supabase")
            else:
                print(f"⚠️  Error desconocido: {e}")

if __name__ == '__main__':
    execute_sql_migration()
