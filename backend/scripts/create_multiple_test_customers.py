"""Script para crear múltiples clientes de prueba."""
import requests
import json

API_URL = "http://localhost:8000"

# Datos de clientes de prueba
customers_data = [
    {
        "name": "María González",
        "email": "maria.gonzalez@example.com",
        "phone": "+54 11 2345-6789",
        "address": "Av. Santa Fe 2500",
        "city": "Buenos Aires",
        "province": "Buenos Aires",
        "postalCode": "C1123",
        "notes": "Cliente frecuente - Prefiere electrodomésticos"
    },
    {
        "name": "Carlos Rodríguez",
        "email": "carlos.rodriguez@example.com",
        "phone": "+54 11 3456-7890",
        "address": "Calle Falsa 123",
        "city": "Rosario",
        "province": "Santa Fe",
        "postalCode": "S2000",
        "notes": "Compró colchón el mes pasado"
    },
    {
        "name": "Ana Martínez",
        "email": "ana.martinez@example.com",
        "phone": "+54 351 456-7890",
        "address": "Av. Colón 456",
        "city": "Córdoba",
        "province": "Córdoba",
        "postalCode": "X5000",
        "notes": None
    },
    {
        "name": "Luis Fernández",
        "email": "luis.fernandez@example.com",
        "phone": "+54 261 567-8901",
        "address": "San Martín 789",
        "city": "Mendoza",
        "province": "Mendoza",
        "postalCode": "M5500",
        "notes": "Interesado en muebles de living"
    }
]

print("🧪 Creando clientes de prueba...")
print("=" * 60)

created_count = 0
for customer_data in customers_data:
    try:
        response = requests.post(
            f"{API_URL}/customers",
            json=customer_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 201:
            customer = response.json()
            created_count += 1
            print(f"✅ {created_count}. {customer['name']} - {customer['email']}")
        else:
            print(f"❌ Error al crear {customer_data['name']}: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error al crear {customer_data['name']}: {e}")

print("=" * 60)
print(f"\n✅ Total creados: {created_count}/{len(customers_data)} clientes")
