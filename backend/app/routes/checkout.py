"""Checkout routes for MercadoPago integration."""
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

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import mercadopago
import time
from app.config import get_config
from app.database.connection import get_supabase_client

router = APIRouter()


class CheckoutItem(BaseModel):
    product_id: str
    quantity: int


class CheckoutRequest(BaseModel):
    items: list[CheckoutItem]
    customer_email: EmailStr
    customer_name: str
    customer_phone: str


@router.post("/create-preference")
async def create_checkout_preference(request: CheckoutRequest):
    """Crear preferencia de pago en MercadoPago Checkout Pro"""
    config = get_config()
    
    # Crear SDK con configuración SSL deshabilitada
    sdk = mercadopago.SDK(config.mercadopago_access_token)
    
    # Parchear la sesión del SDK para deshabilitar SSL
    if hasattr(sdk, 'requestOptions') and hasattr(sdk.requestOptions, 'custom_session'):
        sdk.requestOptions.custom_session.verify = False
        sdk.requestOptions.custom_session.mount('https://', SSLAdapter())
    
    # También intentar parchear directamente el objeto requests si existe
    if hasattr(sdk, '_requestOptions'):
        if hasattr(sdk._requestOptions, 'custom_session'):
            sdk._requestOptions.custom_session.verify = False
            sdk._requestOptions.custom_session.mount('https://', SSLAdapter())
    
    # Obtener productos de Supabase
    supabase = get_supabase_client()
    product_ids = [item.product_id for item in request.items]
    
    try:
        response = supabase.table("productos").select("*").in_("id_producto", product_ids).execute()
        products = {p["id_producto"]: p for p in response.data}
    except Exception as e:
        raise HTTPException(500, f"Error al obtener productos: {str(e)}")
    
    # Construir items para MercadoPago
    mp_items = []
    total = 0
    items_data = []  # Para guardar en metadata
    
    for item in request.items:
        product = products.get(item.product_id)
        if not product:
            raise HTTPException(404, f"Producto {item.product_id} no encontrado")
        
        if product["stock"] < item.quantity:
            raise HTTPException(400, f"Stock insuficiente para {product['nombre']}")
        
        unit_price = float(product["precio"])
        subtotal = unit_price * item.quantity
        total += subtotal
        
        # Guardar info del item para el webhook
        items_data.append({
            "product_id": product["id_producto"],
            "product_name": product["nombre"],
            "product_brand": product.get("marca", ""),
            "quantity": item.quantity,
            "unit_price": unit_price,
        })
        
        mp_items.append({
            "id": product["id_producto"],
            "title": product["nombre"][:255],  # MercadoPago limit
            "description": product.get("descripcion", "")[:255],
            "picture_url": product["imagenes"][0] if product.get("imagenes") else None,
            "category_id": product.get("categoria", "others"),
            "quantity": item.quantity,
            "unit_price": unit_price,
            "currency_id": "ARS",
        })
    
    # Crear referencia externa única
    timestamp = int(time.time())
    external_reference = f"ORDER-{timestamp}"
    
    # Asegurar que las URLs estén correctamente formateadas
    base_url = config.frontend_url if config.frontend_url else "https://santyhogar.com.ar"
    success_url = f"{base_url}/checkout/success"
    failure_url = f"{base_url}/checkout/failure"
    pending_url = f"{base_url}/checkout/pending"
    
    print(f"🔍 URLs configuradas:")
    print(f"  - Success: {success_url}")
    print(f"  - Failure: {failure_url}")
    print(f"  - Pending: {pending_url}")
    
    # Crear preferencia
    # NOTA: No usamos auto_return porque el SDK de Python tiene un bug
    # El usuario verá un botón "Volver al sitio" en MercadoPago
    preference_data = {
        "items": mp_items,
        "payer": {
            "name": request.customer_name,
            "email": request.customer_email,
            "phone": {
                "number": request.customer_phone
            }
        },
        "back_urls": {
            "success": success_url,
            "failure": failure_url,
            "pending": pending_url,
        },
        # NO incluir auto_return - causa error 400 con el SDK de Python
        "notification_url": f"{config.public_api_url}/webhook",
        "statement_descriptor": "SANTYHOGAR",
        "external_reference": external_reference,
        "metadata": {
            "customer_email": request.customer_email,
            "customer_name": request.customer_name,
            "customer_phone": request.customer_phone,
            "items": items_data,
        }
    }
    
    print(f"🔍 Preference data completo: {preference_data}")
    
    try:
        preference_response = sdk.preference().create(preference_data)
        preference = preference_response["response"]
        
        print(f"🔍 MercadoPago response status: {preference_response.get('status')}")
        print(f"🔍 MercadoPago response: {preference_response}")
        
        if preference_response["status"] not in [200, 201]:
            raise HTTPException(500, "Error al crear preferencia de pago")
        
        return {
            "preference_id": preference["id"],
            "init_point": preference["init_point"],
            "sandbox_init_point": preference.get("sandbox_init_point", preference["init_point"]),
            "external_reference": external_reference,
        }
    except Exception as e:
        print(f"❌ Error detallado en MercadoPago: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Error en MercadoPago: {str(e)}")
