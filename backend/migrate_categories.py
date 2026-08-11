#!/usr/bin/env python3
"""
Migra productos de categorías hardcodeadas a dinámicas.
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(__file__))

from app.database.connection import get_supabase_client

def migrate():
    """Migra productos a categorías dinámicas."""
    
    client = get_supabase_client()
    
    print("\n" + "="*80)
    print("  MIGRACIÓN: Categorías Hardcodeadas → Dinámicas")
    print("="*80 + "\n")
    
    # Paso 1: Ver categorías actuales
    print("📋 Categorías Disponibles:")
    print("-" * 80)
    cats_result = client.table('categorias').select('id_categoria, nombre, slug').execute()
    category_map = {}
    
    for cat in cats_result.data:
        cat_name = cat['nombre']
        cat_slug = cat['slug']
        cat_id = cat['id_categoria']
        category_map[cat_slug] = cat_id
        print(f"  ✓ {cat_name:25} (slug: {cat_slug:20} id: {cat_id[:8]}...)")
    
    print()
    
    # Paso 2: Ver productos sin id_categoria
    print("📊 Productos que necesitan migración:")
    print("-" * 80)
    products = client.table('productos').select('id_producto, nombre, categoria').execute()
    
    to_migrate = []
    for p in products.data:
        prod_id = p['id_producto']
        prod_name = p['nombre']
        cat_string = p['categoria']
        
        if cat_string and cat_string.lower() in category_map:
            to_migrate.append({
                'id': prod_id,
                'name': prod_name,
                'category': cat_string.lower(),
                'new_id': category_map[cat_string.lower()]
            })
    
    if not to_migrate:
        print("  ✅ Todos los productos ya están migrados")
        return
    
    print(f"  Total: {len(to_migrate)} productos para migrar\n")
    
    for item in to_migrate:
        print(f"  • {item['name']:30} → {item['category']}")
    
    print()
    
    # Paso 3: Migrar
    print("⏳ Migrando...")
    print("-" * 80)
    
    updated = 0
    for item in to_migrate:
        try:
            client.table('productos').update({
                'id_categoria': item['new_id']
            }).eq('id_producto', item['id']).execute()
            updated += 1
            print(f"  ✅ {item['name']}")
        except Exception as e:
            print(f"  ❌ {item['name']}: {e}")
    
    print()
    print("="*80)
    print(f"✅ MIGRACIÓN COMPLETADA: {updated} productos actualizados")
    print("="*80 + "\n")


if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
