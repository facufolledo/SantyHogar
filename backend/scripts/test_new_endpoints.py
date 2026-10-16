"""
Script para probar todos los nuevos endpoints del Sprint 2.
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_endpoint(method: str, url: str, description: str, data=None):
    """Prueba un endpoint y muestra el resultado."""
    print(f"\n{'='*70}")
    print(f"🧪 {description}")
    print(f"{'='*70}")
    print(f"   {method} {url}")
    
    try:
        if method == "GET":
            response = requests.get(url, timeout=5)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=5)
        elif method == "PATCH":
            response = requests.patch(url, json=data, timeout=5)
        elif method == "DELETE":
            response = requests.delete(url, timeout=5)
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            print(f"   ✅ OK")
            # Mostrar primeros 200 caracteres de la respuesta
            content = response.text[:200]
            if len(response.text) > 200:
                content += "..."
            print(f"   Response: {content}")
        else:
            print(f"   ❌ ERROR")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"   ❌ EXCEPTION: {e}")

def main():
    """Ejecuta todas las pruebas."""
    print("\n" + "="*70)
    print("🚀 PRUEBAS DE ENDPOINTS - Sprint 2")
    print("="*70)
    
    # 1. Dashboard endpoints
    print("\n\n📊 DASHBOARD ENDPOINTS")
    test_endpoint("GET", f"{BASE_URL}/dashboard/stats", "Dashboard Stats")
    test_endpoint("GET", f"{BASE_URL}/dashboard/sales-chart", "Dashboard Sales Chart")
    test_endpoint("GET", f"{BASE_URL}/dashboard/top-products", "Dashboard Top Products")
    test_endpoint("GET", f"{BASE_URL}/dashboard/top-customers", "Dashboard Top Customers")
    
    # 2. Customers endpoints
    print("\n\n👥 CUSTOMERS ENDPOINTS")
    test_endpoint("GET", f"{BASE_URL}/customers", "List All Customers")
    
    # Obtener ID del primer cliente para pruebas
    try:
        response = requests.get(f"{BASE_URL}/customers", timeout=5)
        if response.status_code == 200 and len(response.json()) > 0:
            customer_id = response.json()[0]["id"]
            print(f"\n   📝 Usando customer_id: {customer_id}")
            
            test_endpoint("GET", f"{BASE_URL}/customers/{customer_id}", "Get Customer Detail")
            test_endpoint("GET", f"{BASE_URL}/customers/{customer_id}/orders", "Get Customer Orders")
            test_endpoint("GET", f"{BASE_URL}/customers/{customer_id}/addresses", "Get Customer Addresses")
            test_endpoint("GET", f"{BASE_URL}/customers/{customer_id}/favorites", "Get Customer Favorites")
    except Exception as e:
        print(f"   ⚠️  No se pudo obtener customer_id: {e}")
    
    # 3. Orders endpoints
    print("\n\n📦 ORDERS ENDPOINTS")
    test_endpoint("GET", f"{BASE_URL}/orders", "List All Orders")
    test_endpoint("GET", f"{BASE_URL}/orders?email=admin@santyhogar.com", "List Orders by Email")
    
    # 4. Products endpoints
    print("\n\n🛍️ PRODUCTS ENDPOINTS")
    test_endpoint("GET", f"{BASE_URL}/products", "List All Products")
    
    print("\n\n" + "="*70)
    print("✅ PRUEBAS COMPLETADAS")
    print("="*70)
    print("\n📋 Próximos pasos:")
    print("   1. Verifica que todos los endpoints respondan con 200 OK")
    print("   2. Prueba las funcionalidades en el navegador")
    print("   3. Ejecuta los property-based tests")
    print("   4. Crea datos de prueba si es necesario")

if __name__ == "__main__":
    main()
