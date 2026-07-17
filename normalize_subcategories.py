#!/usr/bin/env python3
"""Script para normalizar categorías a lowercase en la BD."""

import sys
sys.path.insert(0, 'backend')

from app.database.connection import get_supabase_client

client = get_supabase_client()

# Obtener todos los productos que necesitan normalización
try:
    # Primero ver cuál es el estado actual
    result = client.table("productos").select("id_producto, nombre, categoria").order("fecha_creacion", desc=True).limit(100).execute()
    
    print(f"📋 Total productos: {len(result.data)}")
    
    updates_needed = []
    for row in result.data:
        cat = row.get('categoria', '')
        cat_normalized = cat.lower() if cat else cat
        
        if cat and cat != cat_normalized:
            updates_needed.append({
                'id': row['id_producto'],
                'original': cat,
                'normalized': cat_normalized
            })
    
    print(f"\n🔄 Encontrados {len(updates_needed)} productos que necesitan normalización:")
    for item in updates_needed[:5]:
        print(f"  - {item['original']} → {item['normalized']}")
    if len(updates_needed) > 5:
        print(f"  ... y {len(updates_needed) - 5} más")
    
    # Aplicar actualizaciones
    if updates_needed:
        print(f"\n⏳ Normalizando {len(updates_needed)} productos...")
        for item in updates_needed:
            client.table("productos").update({
                "categoria": item['normalized']
            }).eq("id_producto", item['id']).execute()
        
        print(f"✅ {len(updates_needed)} productos actualizados")
    
    # Verificar resultado final
    result = client.table("productos").select("categoria").order("fecha_creacion", desc=True).limit(100).execute()
    cats = {}
    for row in result.data:
        cat = row.get('categoria', '')
        if cat not in cats:
            cats[cat] = 0
        cats[cat] += 1
    
    print("\n📊 Categorías después de normalización:")
    for cat in sorted(cats.keys()):
        count = cats[cat]
        print(f"  - '{cat}': {count} productos")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
