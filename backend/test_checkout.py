#!/usr/bin/env python3
"""Script para probar el endpoint de checkout"""
import requests
import json
import sys

# Fix para Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

API_URL = "http://localhost:8000"

# Test 1: Obtener un producto
print("=" * 60)
print("TEST 1: Obtener lista de productos")
print("=" * 60)

response = requests.get(f"{API_URL}/api/products?page=1&limit=5")
print(f"Status: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    print(f"Total productos: {data.get('total')}")
    
    if data.get('results') and len(data['results']) > 0:
        product = data['results'][0]
        product_id = product['id']
        print(f"\nProducto encontrado:")
        print(f"  ID: {product_id}")
        print(f"  Nombre: {product['name']}")
        print(f"  Precio: ${product['price']}")
        
        # Test 2: Crear orden con checkout
        print("\n" + "=" * 60)
        print("TEST 2: Crear orden con checkout")
        print("=" * 60)
        
        checkout_data = {
            "items": [{"product_id": product_id, "quantity": 1}],
            "customer_email": "test_user_1625325474@testuser.com",
            "customer_name": "Test Payer",
            "customer_phone": "01154851851"
        }
        
        print(f"Enviando: {json.dumps(checkout_data, indent=2)}")
        
        response = requests.post(
            f"{API_URL}/api/checkout/create-preference",
            json=checkout_data
        )
        
        print(f"\nStatus: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"\nCheckout exitoso:")
            print(f"  Order ID: {result.get('order_id')}")
            print(f"  Order Number: {result.get('order_number')}")
            print(f"  Preference ID: {result.get('preference_id')}")
            print(f"  Init Point: {result.get('init_point')[:50]}...")
        else:
            print(f"\nError en checkout")
    else:
        print("No hay productos en la BD")
else:
    print(f"Error: {response.text}")
