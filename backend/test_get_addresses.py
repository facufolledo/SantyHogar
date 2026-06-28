#!/usr/bin/env python3
"""
Test para verificar que el endpoint GET /customers/{id}/addresses devuelve las direcciones.
"""

import requests
import json

BASE_URL = "http://localhost:8000"
customer_id = "3098dbd9-ea55-4d22-87f5-531a5c6da4cc"

print("=" * 60)
print("Testing GET addresses endpoint")
print("=" * 60)

try:
    response = requests.get(
        f"{BASE_URL}/api/customers/{customer_id}/addresses",
        headers={"Content-Type": "application/json"}
    )
    
    print(f"\n✓ Response Status: {response.status_code}")
    print(f"✓ Response Body:")
    data = response.json()
    print(json.dumps(data, indent=2))
    
    if response.status_code == 200:
        print(f"\n✅ SUCCESS: Got {len(data)} addresses")
        for addr in data:
            print(f"  - {addr.get('label')}: {addr.get('street')}")
    else:
        print(f"\n❌ FAILED: Expected 200, got {response.status_code}")
        
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    print(f"Make sure backend is running on {BASE_URL}")

print("\n" + "=" * 60)
