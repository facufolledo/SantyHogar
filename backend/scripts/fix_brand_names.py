"""
Script para corregir nombres de marcas en productos existentes.
Normaliza variaciones como "Brket" → "Briket"
"""
import os
import sys
from pathlib import Path

# Agregar el directorio raíz al path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from supabase import create_client
from app.config import get_config
from app.services.bulk_import_service import _extract_brand_from_name

def main():
    """Corrige las marcas de todos los productos en la base de datos."""
    config = get_config()
    
    # Crear cliente de Supabase
    supabase = create_client(config.supabase_url, config.supabase_key)
    
    print("🔍 Obteniendo productos de la base de datos...")
    
    # Obtener todos los productos
    response = supabase.table('productos').select('id_producto, nombre, marca').execute()
    productos = response.data
    
    print(f"📦 Encontrados {len(productos)} productos")
    
    updated_count = 0
    corrections = {}
    
    for producto in productos:
        nombre = producto['nombre']
        marca_actual = producto['marca']
        
        # Extraer la marca correcta del nombre
        marca_correcta = _extract_brand_from_name(nombre)
        
        # Si la marca cambió, actualizar
        if marca_actual != marca_correcta:
            print(f"  ✏️  '{nombre}'")
            print(f"      {marca_actual} → {marca_correcta}")
            
            # Actualizar en la base de datos
            supabase.table('productos').update({
                'marca': marca_correcta
            }).eq('id_producto', producto['id_producto']).execute()
            
            updated_count += 1
            
            # Registrar la corrección
            if marca_actual not in corrections:
                corrections[marca_actual] = []
            if marca_correcta not in corrections[marca_actual]:
                corrections[marca_actual].append(marca_correcta)
    
    print(f"\n✅ Actualización completada!")
    print(f"   {updated_count} productos actualizados")
    
    if corrections:
        print(f"\n📊 Correcciones realizadas:")
        for old_brand, new_brands in corrections.items():
            for new_brand in new_brands:
                print(f"   {old_brand} → {new_brand}")

if __name__ == '__main__':
    main()
