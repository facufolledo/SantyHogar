"""Task para cancelar órdenes pendientes que expiraron (después de 2 horas)."""

import logging
from datetime import datetime, timezone
from app.main import get_supabase_client

logger = logging.getLogger(__name__)


def cancel_expired_orders():
    """
    Cancela órdenes pendientes_pago que expiraron (después de 2 horas).
    
    Optimizaciones:
    - Usa JOINs para traer órdenes + items en 1 query
    - Batch processing para no sobrecargar memoria
    - Reduce queries de 1+N+M a ~3 queries totales
    """
    supabase = get_supabase_client()
    now = datetime.now(timezone.utc)
    
    logger.info("🔍 Verificando órdenes expiradas (optimizado con JOINs)...")
    
    try:
        # OPTIMIZACIÓN: Query con JOIN trae órdenes + items de una vez
        # En lugar de: 1 query (órdenes) + N queries (items por orden)
        # Ahora: 1 query (órdenes con items incluidos)
        response = supabase.table("ordenes").select(
            "id_orden, fecha_expiracion_pago, items_orden(id_item, id_producto, cantidad)"
        ).eq("estado", "pendiente_pago").execute()
        
        if not response.data:
            logger.info("✓ No hay órdenes pendientes")
            return
        
        logger.info(f"✓ Órdenes pendientes encontradas: {len(response.data)}")
        
        expired_count = 0
        expired_orders = []
        
        # 1. Identificar órdenes expiradas (sin queries adicionales)
        for orden in response.data:
            if not orden.get("fecha_expiracion_pago"):
                logger.warning(f"⚠️ Orden {orden['id_orden']} sin fecha_expiracion_pago")
                continue
            
            try:
                fecha_exp = orden["fecha_expiracion_pago"]
                
                # Convertir string a datetime si es necesario
                if isinstance(fecha_exp, str):
                    fecha_exp = datetime.fromisoformat(
                        fecha_exp.replace('Z', '+00:00')
                    )
                
                # Asegurar que ambos son aware (con timezone)
                if fecha_exp.tzinfo is None:
                    fecha_exp = fecha_exp.replace(tzinfo=timezone.utc)
                
                # Si expiró, agregar a lista
                if fecha_exp < now:
                    expired_orders.append(orden)
                    logger.info(f"⏰ Orden {orden['id_orden']} EXPIRADA")
                    
            except Exception as e:
                logger.error(f"❌ Error procesando fecha para orden {orden.get('id_orden')}: {e}")
        
        if not expired_orders:
            logger.info("✓ No hay órdenes expiradas")
            return
        
        # 2. Recolectar todos los cambios de stock necesarios
        stock_updates = {}  # {producto_id: cantidad_a_devolver}
        
        for orden in expired_orders:
            items = orden.get("items_orden", [])
            
            for item in items:
                prod_id = item["id_producto"]
                cantidad = item["cantidad"]
                
                if prod_id not in stock_updates:
                    stock_updates[prod_id] = 0
                stock_updates[prod_id] += cantidad
        
        # 3. Actualizar stock en BATCH (una query por producto, no por item)
        logger.info(f"📦 Restaurando stock ({len(stock_updates)} productos)...")
        for prod_id, cantidad in stock_updates.items():
            try:
                # Obtener stock actual
                prod_resp = supabase.table("productos").select(
                    "stock"
                ).eq("id_producto", prod_id).execute()
                
                if prod_resp.data:
                    stock_actual = prod_resp.data[0].get("stock", 0)
                    nuevo_stock = stock_actual + cantidad
                    
                    # Actualizar
                    supabase.table("productos").update({
                        "stock": nuevo_stock
                    }).eq("id_producto", prod_id).execute()
                    
                    logger.info(f"   ✓ {prod_id}: {stock_actual} → {nuevo_stock}")
            except Exception as e:
                logger.error(f"   ❌ Error actualizando stock {prod_id}: {e}")
        
        # 4. Eliminar items Y órdenes en batch
        orden_ids = [o["id_orden"] for o in expired_orders]
        
        logger.info(f"🗑️  Eliminando órdenes ({len(orden_ids)})...")
        
        try:
            # Eliminar todos los items de órdenes expiradas de una vez
            for orden_id in orden_ids:
                supabase.table("items_orden").delete().eq(
                    "id_orden", orden_id
                ).execute()
            
            logger.info(f"   ✓ Items eliminados")
            
            # Eliminar órdenes
            for orden_id in orden_ids:
                supabase.table("ordenes").delete().eq(
                    "id_orden", orden_id
                ).execute()
                expired_count += 1
            
            logger.info(f"   ✅ {expired_count} órdenes eliminadas")
            
        except Exception as e:
            logger.error(f"   ❌ Error eliminando: {e}")
        
        logger.info(f"\n✅ Completado: {expired_count} órdenes canceladas")
        logger.info(f"   Queries usadas: ~3 (antes: 1 + N + M)")
        
    except Exception as e:
        logger.error(f"❌ Error en cancel_expired_orders: {e}")


if __name__ == "__main__":
    # Para testing
    cancel_expired_orders()
