#!/usr/bin/env python3
"""
Script para ejecutar la migración 020: Normalizar categorías en productos.

Uso:
  python run_migration_020.py
"""
import sys
import os
from pathlib import Path

# Agregar backend al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from supabase import create_client
from dotenv import load_dotenv
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Cargar variables de entorno
load_dotenv(Path(__file__).parent.parent / '.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error('❌ Falta SUPABASE_URL o SUPABASE_KEY en .env')
    sys.exit(1)

# Conectar a Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def normalize_categories():
    """Normaliza las categorías mal asignadas en productos."""
    logger.info('=' * 80)
    logger.info('MIGRACIÓN 020: Normalizar categorías en productos')
    logger.info('=' * 80)
    
    try:
        # PASO 1: Obtener las categorías válidas
        logger.info('\n🏷️  PASO 1: Obtener categorías válidas')
        
        result_cats = supabase.table('categorias').select('id_categoria, slug, nombre').execute()
        categories = {cat['slug']: cat['id_categoria'] for cat in (result_cats.data or [])}
        
        logger.info(f'  • Categorías en BD: {len(categories)}')
        for slug, cat_id in categories.items():
            logger.info(f'    - {slug}: {cat_id}')
        
        # PASO 2: Obtener categoría por defecto
        electrodomesticos_id = categories.get('electrodomesticos')
        if not electrodomesticos_id:
            logger.error('  ❌ Categoría "electrodomesticos" no existe!')
            return False
        
        logger.info(f'  ✓ Categoría por defecto: electrodomesticos ({electrodomesticos_id})')
        
        # PASO 3: Obtener todos los productos
        logger.info('\n🔍 PASO 2: Obtener todos los productos')
        
        result_products = supabase.table('productos').select(
            'id_producto, nombre, categoria, id_categoria'
        ).execute()
        
        products = result_products.data or []
        logger.info(f'  • Total de productos: {len(products)}')
        
        # PASO 4: Identificar y corregir categorías inválidas
        logger.info('\n🔧 PASO 3: Corregir categorías inválidas')
        
        valid_ids = set(categories.values())
        updated_count = 0
        
        for product in products:
            product_id = product['id_producto']
            nombre = product['nombre']
            cat_id = product.get('id_categoria')
            categoria_slug = product.get('categoria', '').strip()
            
            # Determinar si necesita corrección
            needs_update = False
            correct_id = None
            
            if not cat_id:
                # Sin categoría: usar electrodomesticos
                needs_update = True
                correct_id = electrodomesticos_id
                logger.info(f'  • {nombre}: NULL → electrodomesticos')
            elif cat_id not in valid_ids:
                # ID inválido: intentar mapear desde categoria (string)
                if categoria_slug in categories:
                    needs_update = True
                    correct_id = categories[categoria_slug]
                    logger.info(f'  • {nombre}: {categoria_slug} → {correct_id}')
                else:
                    # Si no se puede mapear, usar por defecto
                    needs_update = True
                    correct_id = electrodomesticos_id
                    logger.info(f'  • {nombre}: INVÁLIDO → electrodomesticos')
            
            # Actualizar si es necesario
            if needs_update and correct_id:
                supabase.table('productos').update(
                    {'id_categoria': correct_id}
                ).eq('id_producto', product_id).execute()
                updated_count += 1
        
        logger.info(f'  ✓ Productos actualizados: {updated_count}')
        
        # PASO 5: Mostrar resumen final
        logger.info('\n📊 PASO 4: Resumen final por categoría')
        
        result_final = supabase.table('productos').select(
            'id_categoria'
        ).execute()
        
        final_products = result_final.data or []
        summary = {}
        for product in final_products:
            cat_id = product.get('id_categoria')
            if cat_id:
                summary[cat_id] = summary.get(cat_id, 0) + 1
        
        for slug, cat_id in categories.items():
            count = summary.get(cat_id, 0)
            logger.info(f'  • {slug}: {count} productos')
        
        logger.info('\n✅ ¡Normalización completada!')
        logger.info('=' * 80)
        return True
        
    except Exception as e:
        logger.error(f'\n❌ Error durante la normalización: {str(e)}', exc_info=True)
        return False


if __name__ == '__main__':
    success = normalize_categories()
    sys.exit(0 if success else 1)
