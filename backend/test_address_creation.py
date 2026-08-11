#!/usr/bin/env python3
"""
Test script to verify address creation during checkout.
Run this to test if addresses are being saved correctly.
"""

import requests
import json
from uuid import uuid4

BASE_URL = "http://localhost:8000"

# Test customer ID (use an existing customer or create a new one)
customer_id = "3098dbd9-ea55-4d22-87f5-531a5c6da4cc"

# Test address data - simulating checkout form submission
test_address = {
    "label": "Mi Dirección de Prueba",
    "street": "Calle Principal 123",
    "city": "Buenos Aires",
    "province": "Buenos Aires",
    "zip": "1425",
    "isPrimary": False,
    "customer_name": "Facundo Folledo",
    "customer_phone": "+54 9 11 1234-5678",
    "customer_email": "facufolledo7@gmail.com"  # Include email
}

print("=" * 60)
print("Testing Address Creation")
print("=" * 60)
print(f"\nCustomer ID: {customer_id}")
print(f"Test Address: {json.dumps(test_address, indent=2)}")

try:
    # Make request to create address
    response = requests.post(
        f"{BASE_URL}/api/customers/{customer_id}/addresses",
        json=test_address,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"\n✓ Response Status: {response.status_code}")
    print(f"✓ Response Body:")
    print(json.dumps(response.json(), indent=2))
    
    if response.status_code == 201:
        print("\n✅ SUCCESS: Address created successfully!")
    else:
        print(f"\n❌ FAILED: Expected 201, got {response.status_code}")
        
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    print(f"Make sure backend is running on {BASE_URL}")

print("\n" + "=" * 60)
print("Test complete.")
print("=" * 60)
