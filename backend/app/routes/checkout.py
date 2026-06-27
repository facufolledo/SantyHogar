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
async def create_checkout_preference_deprecated(request: CheckoutRequest):
    """DEPRECATED: This endpoint is no longer used. Use POST /api/checkout/create-preference instead."""
    raise HTTPException(
        status_code=410,
        detail="Este endpoint está deprecado. Usa POST /api/checkout/create-preference"
    )
