"""Webhook handlers for payment notifications."""
import os
import ssl
import warnings

# Deshabilitar verificación SSL para desarrollo (Python 3.14 en Windows)
os.environ['PYTHONHTTPSVERIFY'] = '0'
os.environ['CURL_CA_BUNDLE'] = ''
os.environ['REQUESTS_CA_BUNDLE'] = ''

# Suprimir warnings de SSL
warnings.filterwarnings('ignore', message='Unverified HTTPS request')

# Deshabilitar verificación SSL en urllib3
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Monkey patch para requests (usado por mercadopago SDK)
import requests
from requests.adapters import HTTPAdapter
from urllib3.poolmanager import PoolManager

class SSLAdapter(HTTPAdapter):
    def init_poolmanager(self, *args, **kwargs):
        kwargs['ssl_version'] = ssl.PROTOCOL_TLS
        kwargs['cert_reqs'] = ssl.CERT_NONE
        kwargs['assert_hostname'] = False
        kwargs['check_hostname'] = False
        return super().init_poolmanager(*args, **kwargs)

# Aplicar el adapter a todas las sesiones de requests
original_session_init = requests.Session.__init__

def patched_session_init(self, *args, **kwargs):
    original_session_init(self, *args, **kwargs)
    self.mount('https://', SSLAdapter())
    self.verify = False

requests.Session.__init__ = patched_session_init

from fastapi import APIRouter, Request, HTTPException
import mercadopago
from app.config import get_config
from app.database.connection import get_supabase_client
import uuid

router = APIRouter()


@router.post("/mercadopago")
async def mercadopago_webhook(request: Request):
    """Webhook de MercadoPago para notificaciones de pago (v2)"""
    config = get_config()
    body = await request.json()
    
    print(f"📩 Webhook recibido: {body}")
    
    # MercadoPago envía diferentes tipos de notificaciones
    notification_type = body.get("type")
    
    if notification_type == "payment":
        payment_id = body["data"]["id"]
        
        try:
            # Obtener detalles del pago
            sdk = mercadopago.SDK(config.mercadopago_access_token)
            payment_info = sdk.payment().get(payment_id)
            payment = payment_info["response"]
            
            print(f"💳 Pago {payment_id} - Estado: {payment['status']}")
            
            if payment["status"] == "approved":
                # Extraer información
                external_reference = payment.get("external_reference")
                metadata = payment.get("metadata", {})
                items = metadata.get("items", [])
                
                supabase = get_supabase_client()
                
                # Generar número de orden único
                order_number = f"ORD-{str(uuid.uuid4())[:8].upper()}"
                
                # Crear pedido
                order_data = {
                    "numero_orden": order_number,
                    "email_cliente": metadata.get("customer_email"),
                    "nombre_cliente": metadata.get("customer_name"),
                    "telefono_cliente": metadata.get("customer_phone"),
                    "total": float(payment["transaction_amount"]),
                    "estado": "paid",
                    "metodo_pago": "mp",
                    "payment_id": str(payment_id),
                    "id_preferencia": external_reference,
                }
                
                order_response = supabase.table("ordenes").insert(order_data).execute()
                
                if not order_response.data:
                    raise Exception("Error al crear pedido")
                
                order_id = order_response.data[0]["id_orden"]
                print(f"✅ Pedido {order_number} creado con ID {order_id}")
                
                # Crear items del pedido
                for item in items:
                    item_data = {
                        "id_orden": order_id,
                        "id_producto": item["product_id"],
                        "cantidad": item["quantity"],
                        "precio_unitario": float(item["unit_price"]),
                    }
                    
                    print(f"📝 Insertando item: {item_data}")
                    supabase.table("items_orden").insert(item_data).execute()
                    print(f"✅ Item insertado")
                    
                    # Actualizar stock
                    print(f"📦 Intentando actualizar stock para producto {item['product_id']}")
                    product_response = supabase.table("productos").select("stock").eq("id_producto", item["product_id"]).execute()
                    print(f"📦 Respuesta de productos: {product_response}")
                    
                    if product_response.data:
                        current_stock = product_response.data[0]["stock"]
                        new_stock = max(0, current_stock - item["quantity"])
                        print(f"📦 Stock actual: {current_stock}, nuevo: {new_stock}")
                        supabase.table("productos").update({"stock": new_stock}).eq("id_producto", item["product_id"]).execute()
                        print(f"✅ Stock actualizado para producto {item['product_id']}: {current_stock} → {new_stock}")
                    else:
                        print(f"⚠️ Producto no encontrado: {item['product_id']}")
                
                print(f"✅ Orden {order_id} completada exitosamente")
                
        except Exception as e:
            print(f"❌ Error procesando pago {payment_id}: {str(e)}")
            raise HTTPException(500, f"Error procesando pago: {str(e)}")
    
    return {"status": "ok"}
