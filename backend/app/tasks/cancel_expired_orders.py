"""Task para cancelar órdenes pendientes que expiraron (después de 2 horas)."""

import logging
from datetime import datetime, timezone
from app.main import get_supabase_client

logger = logging.getLogger(__name__)


def cancel_expired_orders():
    """
    Cancela órdenes pendientes_pago que expiraron (después de 2 horas).
    - Devuelve el stock
    - Borra la orden completamente (incluyendo items)
    """
    supabase = get_supabase_client()
    now = datetime.now(timezone.utc)
    
    logger.info("🔍 Verificando órdenes expiradas...")
    
    try:
        # Buscar órdenes pendientes
        response = supabase.table("ordenes").select("*").eq(
            "estado", "pendiente_pago"
        ).execute()
        
        if not response.data:
            logger.info("✓ No hay órdenes pendientes")
            return
        
        logger.info(f"✓ Órdenes pendientes encontradas: {len(response.data)}")
        
        expired_count = 0
        
        for orden in response.data:
            # Verificar si expiró
            if not orden.get("fecha_expiracion_pago"):
                logger.warning(f"⚠️ Orden {orden['id_orden']} sin fecha_expiracion_pago")
                continue
            
            try:
                # Parsear fecha
                fecha_exp = orden["fecha_expiracion_pago"]
                if isinstance(fecha_exp, str):
                    fecha_exp = datetime.fromisoformat(
                        fecha_exp.replace('Z', '+00:00')
                    )
                
                # Si expiró
                if fecha_exp < now:
                    logger.info(f"\n⏰ Orden {orden['id_orden']} EXPIRADA")
                    logger.info(f"   Creada: {orden.get('fecha_creacion')}")
                    logger.info(f"   Expiró: {fecha_exp}")
                    logger.info(f"   Ahora: {now}")
                    
                    # 1. Obtener items
                    items_resp = supabase.table("items_orden").select("*").eq(
                        "id_orden", orden["id_orden"]
                    ).execute()
                    
                    logger.info(f"   Items a devolver: {len(items_resp.data)}")
                    
                    # 2. Devolver stock por cada item
                    for item in items_resp.data:
                        try:
                            prod_id = item["id_producto"]
                            cantidad = item["cantidad"]
                            
                            # Obtener producto actual
                            prod_resp = supabase.table("productos").select(
                                "id_producto,stock"
                            ).eq("id_producto", prod_id).execute()
                            
                            if prod_resp.data:
                                stock_actual = prod_resp.data[0].get("stock", 0)
                                nuevo_stock = stock_actual + cantidad
                                
                                # Actualizar stock
                                supabase.table("productos").update({
                                    "stock": nuevo_stock
                                }).eq("id_producto", prod_id).execute()
                                
                                logger.info(
                                    f"   ✓ Stock devuelto: {prod_id} "
                                    f"({stock_actual} → {nuevo_stock})"
                                )
                        except Exception as e:
                            logger.error(
                                f"   ❌ Error devolviendo stock: {e}"
                            )
                    
                    # 3. Eliminar items
                    try:
                        supabase.table("items_orden").delete().eq(
                            "id_orden", orden["id_orden"]
                        ).execute()
                        logger.info(f"   ✓ Items eliminados")
                    except Exception as e:
                        logger.error(f"   ❌ Error eliminando items: {e}")
                    
                    # 4. Eliminar orden
                    try:
                        supabase.table("ordenes").delete().eq(
                            "id_orden", orden["id_orden"]
                        ).execute()
                        logger.info(f"   ✅ ORDEN ELIMINADA")
                        expired_count += 1
                    except Exception as e:
                        logger.error(f"   ❌ Error eliminando orden: {e}")
                        
            except Exception as e:
                logger.error(f"❌ Error procesando orden {orden['id_orden']}: {e}")
        
        logger.info(f"\n✅ Canceladas {expired_count} órdenes expiradas")
        
    except Exception as e:
        logger.error(f"❌ Error en cancel_expired_orders: {e}")


if __name__ == "__main__":
    # Para testing
    cancel_expired_orders()
