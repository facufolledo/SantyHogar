"""Script para crear un cliente de prueba."""
import requests
import json

API_URL = "http://localhost:8000"

# Datos del cliente de prueba
customer_data = {
    "name": "Juan Pérez",
    "email": "juan.perez@example.com",
    "phone": "+54 11 1234-5678",
    "address": "Av. Corrientes 1234",
    "city": "Buenos Aires",
    "province": "Buenos Aires",
    "postalCode": "C1043",
    "notes": "Cliente de prueba - Primera compra"
}

print("🧪 Creando cliente de prueba...")
print("=" * 60)
print(json.dumps(customer_data, indent=2, ensure_ascii=False))
print("=" * 60)

try:
    response = requests.post(
        f"{API_URL}/customers",
        json=customer_data,
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code == 201:
        customer = response.json()
        print("\n✅ Cliente creado exitosamente!")
        print("=" * 60)
        print(json.dumps(customer, indent=2, ensure_ascii=False))
        print("=" * 60)
        print(f"\n📋 ID: {customer['id']}")
        print(f"👤 Nombre: {customer['name']}")
        print(f"📧 Email: {customer['email']}")
        print(f"📞 Teléfono: {customer['phone']}")
        print(f"💰 Total gastado: ${customer['totalSpent']}")
        print(f"📦 Órdenes: {customer['orderCount']}")
    else:
        print(f"\n❌ Error {response.status_code}: {response.text}")
        
except Exception as e:
    print(f"\n❌ Error: {e}")
