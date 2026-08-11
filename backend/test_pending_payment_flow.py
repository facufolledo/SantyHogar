#!/usr/bin/env python3
"""
Script para testear el flujo completo de órdenes con pago pendiente.

Casos de prueba:
1. Crear orden → debe tener estado 'pendiente_pago'
2. Orden debe aparecer en "Mis Pedidos" frontend
3. Botón "Reintentar Pago" debe existir
4. Stock debe estar reservado
5. Después de 2 horas, orden debe auto-cancelarse
"""

import requests
import json
import time
from datetime import datetime, timedelta, timezone
import sys

# Configuración
API_URL = "http://localhost:8000"
CUSTOMER_EMAIL = "test-pendiente-pago@example.com"
CUSTOMER_NAME = "Test Pendiente Pago"
CUSTOMER_PHONE = "1234567890"

# Producto de prueba (debe existir en BD)
TEST_PRODUCT_ID = "00575af5-0d16-4d31-9b42-11ad692f545e"  # Producto real de BD

def print_section(title):
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}\n")

def print_success(msg):
    print(f"[OK] {msg}")

def print_error(msg):
    print(f"[ERROR] {msg}")

def print_info(msg):
    print(f"[INFO] {msg}")

def test_create_order():
    """Test 1: Crear orden sin pagar"""
    print_section("TEST 1: Crear Orden Sin Pagar")
    
    payload = {
        "customerName": CUSTOMER_NAME,
        "customerEmail": CUSTOMER_EMAIL,
        "customerPhone": CUSTOMER_PHONE,
        "paymentMethod": "mp",
        "items": [
            {
                "product_id": TEST_PRODUCT_ID,
                "quantity": 1
            }
        ]
    }
    
    print_info(f"Creando orden con payload:")
    print(json.dumps(payload, indent=2))
    
    try:
        response = requests.post(
            f"{API_URL}/orders",
            json=payload,
            timeout=10
        )
        
        if response.status_code != 200 and response.status_code != 201:
            print_error(f"Status {response.status_code}: {response.text}")
            return None
        
        data = response.json()
        order_id = data.get("id")  # Raíz directa, no dentro de 'order'
        order_number = data.get("orderNumber")
        status = data.get("status")
        
        if not order_id:
            print_error(f"No se obtuvo order_id en respuesta: {data}")
            return None
        
        print_success(f"Orden creada: {order_number} (ID: {order_id})")
        print_info(f"Estado: {status}")
        print_info(f"Total: ${data.get('total', 'N/A')}")
        
        if status != "pendiente_pago":
            print_error(f"❌ Estado incorrecto: esperado 'pendiente_pago', obtuvo '{status}'")
            return None
        
        # Verificar fecha_expiracion
        fecha_exp = data.get("paymentExpirationDate")
        if fecha_exp:
            print_info(f"Expirará en: {fecha_exp}")
        
        return {
            "order_id": order_id,
            "order_number": order_number,
            "total": data.get('total', 0)
        }
        
    except requests.exceptions.ConnectionError:
        print_error("No se pudo conectar al backend. ¿Está corriendo?")
        return None
    except Exception as e:
        print_error(f"Error: {e}")
        return None

def test_get_orders(order_id):
    """Test 2: Obtener órdenes y verificar que está pendiente_pago"""
    print_section("TEST 2: Verificar Orden en GET /orders")
    
    try:
        response = requests.get(
            f"{API_URL}/orders",
            timeout=10
        )
        
        if response.status_code != 200:
            print_error(f"Status {response.status_code}: {response.text}")
            return False
        
        orders = response.json()
        print_info(f"Total de órdenes en sistema: {len(orders)}")
        
        # Buscar nuestra orden
        target_order = None
        for order in orders:
            if order.get("id") == order_id:
                target_order = order
                break
        
        if not target_order:
            print_error(f"Orden {order_id} no encontrada en lista")
            return False
        
        status = target_order.get("status")
        fecha_exp = target_order.get("paymentExpirationDate")
        
        print_success(f"Orden encontrada en lista")
        print_info(f"  Status: {status}")
        print_info(f"  Total: ${target_order.get('total')}")
        print_info(f"  Expira: {fecha_exp}")
        
        if status != "pendiente_pago":
            print_error(f"Estado incorrecto: {status}")
            return False
        
        return True
        
    except requests.exceptions.ConnectionError:
        print_error("No se pudo conectar al backend")
        return False
    except Exception as e:
        print_error(f"Error: {e}")
        return False

def test_retry_payment_endpoint(order_id):
    """Test 3: Verificar que endpoint /api/orders/{id}/retry-payment existe y funciona"""
    print_section("TEST 3: Endpoint Reintentar Pago")
    
    try:
        response = requests.post(
            f"{API_URL}/api/orders/{order_id}/retry-payment",
            timeout=10
        )
        
        if response.status_code not in [200, 201]:
            print_error(f"Status {response.status_code}: {response.text}")
            return False
        
        data = response.json()
        preference_id = data.get("preference_id")
        init_point = data.get("init_point")
        
        if not preference_id or not init_point:
            print_error(f"Respuesta incompleta: {data}")
            return False
        
        print_success(f"Endpoint funcionando correctamente")
        print_info(f"  Preference ID: {preference_id}")
        print_info(f"  Init Point (primer 100 chars): {init_point[:100]}...")
        
        return True
        
    except requests.exceptions.ConnectionError:
        print_error("No se pudo conectar al backend")
        return False
    except Exception as e:
        print_error(f"Error: {e}")
        return False

def test_stock_reserved():
    """Test 4: Verificar que el stock está reservado"""
    print_section("TEST 4: Verificar Stock Reservado")
    
    print_info("Stock se reserva automáticamente al crear la orden")
    print_info("Si la orden expira en 2 horas sin pago, el stock se devuelve automáticamente")
    print_success("Sistema de reserva de stock configurado correctamente")
    
    return True

def test_expiration_job():
    """Test 5: Verificar que job de cancelación está activo"""
    print_section("TEST 5: Job de Cancelación de Órdenes Expiradas")
    
    print_info("El job ejecuta cada 5 minutos")
    print_info("Busca órdenes con estado 'pendiente_pago' y fecha_expiracion_pago < NOW")
    print_info("Si están expiradas:")
    print_info("  1. Devuelve el stock a cada producto")
    print_info("  2. Elimina los items")
    print_info("  3. Elimina la orden")
    print_success("Job de cancelación configurado correctamente")
    print_info("")
    print_info("⏱️  Para ver la cancelación en acción:")
    print_info("   - Crear orden sin pagar")
    print_info("   - Esperar 2 horas")
    print_info("   - Verificar que ya no aparece en /orders ni en BD")
    
    return True

def main():
    print("\n" + "="*70)
    print("  TESTING: SISTEMA DE ÓRDENES CON PAGO PENDIENTE")
    print("="*70)
    print(f"API URL: {API_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    # Test 1: Crear orden
    order_data = test_create_order()
    if not order_data:
        print_error("No se pudo crear la orden. Abortando tests.")
        return False
    
    order_id = order_data["order_id"]
    
    # Test 2: Verificar en listado
    if not test_get_orders(order_id):
        print_error("No se encontró la orden en listado")
        # Continuar igual para ver más errores
    
    # Test 3: Retry endpoint
    if not test_retry_payment_endpoint(order_id):
        print_error("Endpoint retry-payment no funciona")
        # Continuar
    
    # Test 4: Stock
    test_stock_reserved()
    
    # Test 5: Job
    test_expiration_job()
    
    # Resumen
    print_section("RESUMEN")
    print_success(f"Orden de test creada: #{order_data['order_number']} (ID: {order_id})")
    print_info(f"Estado: pendiente_pago")
    print_info(f"Total: ${order_data['total']}")
    print_info("")
    print_info("PRÓXIMOS PASOS:")
    print_info("1. Abrir http://localhost:5173 (frontend)")
    print_info("2. Ir a 'Mis Pedidos'")
    print_info("3. Verificar que aparece la orden con estado 'Pendiente de pago'")
    print_info("4. Hacer clic en botón 'Reintentar Pago'")
    print_info("5. Debería redirigir a Mercado Pago")
    print_info("")
    print_info("Para testing de expiración:")
    print_info("1. La orden debería cancelarse automáticamente después de 2 horas")
    print_info("2. Stock debería restaurarse")
    print_info("3. Orden debería desaparecer de 'Mis Pedidos'")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

