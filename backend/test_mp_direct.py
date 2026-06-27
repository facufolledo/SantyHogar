#!/usr/bin/env python3
"""Test directo de Mercado Pago SDK"""

# Deshabilitar verificación SSL ANTES de importar requests
import os
os.environ['PYTHONHTTPSVERIFY'] = '0'

import ssl
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
ssl._create_default_https_context = ssl._create_unverified_context

import mercadopago
from app.config import get_config

config = get_config()
print(f"Token: {config.mercadopago_access_token[:20]}...")

sdk = mercadopago.SDK(config.mercadopago_access_token)

# Patch del SDK
if hasattr(sdk, 'requestOptions') and hasattr(sdk.requestOptions, 'custom_session'):
    sdk.requestOptions.custom_session.verify = False

# Crear preferencia minimalista
pref_data = {
    "items": [
        {
            "title": "Test Item",
            "quantity": 1,
            "unit_price": 100.00,
            "currency_id": "ARS"
        }
    ],
    "external_reference": "test-001"
}

print(f"\nEnviando a MP: {pref_data}")

try:
    result = sdk.preference().create(pref_data)
    print(f"\nResultado:")
    print(f"  Status: {result.get('status')}")
    print(f"  Response: {result.get('response')}")
    
    if result.get('status') in (200, 201):
        preference = result.get('response', {})
        print(f"\nExito! ID: {preference.get('id')}")
        print(f"Init Point: {preference.get('init_point')}")
    else:
        print(f"\nError: {result}")
except Exception as e:
    print(f"\nExcepcion: {e}")
    import traceback
    traceback.print_exc()
