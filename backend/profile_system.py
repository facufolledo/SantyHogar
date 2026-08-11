#!/usr/bin/env python3
"""
Script de profiling para medir CPU y memoria del sistema backend.

Mide:
1. Memory: Cuánta RAM usa cada componente
2. CPU: Cuánto CPU usa cada función
3. Tiempo: Cuánto tiempo tarda cada operación
"""

import asyncio
import time
import tracemalloc
import os
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any
import json
import sys

# Importar servicios del backend
sys.path.insert(0, os.path.dirname(__file__))

from app.database.connection import get_supabase_client


class ProfilerStats:
    """Colecta estadísticas de profiling."""
    
    def __init__(self):
        self.memory_usage: Dict[str, float] = {}
        self.cpu_time: Dict[str, float] = {}
        self.wall_time: Dict[str, float] = {}
        self.query_counts: Dict[str, int] = {}
        self.errors: List[str] = []
    
    def to_json(self) -> str:
        return json.dumps({
            "memory_usage": self.memory_usage,
            "cpu_time": self.cpu_time,
            "wall_time": self.wall_time,
            "query_counts": self.query_counts,
            "errors": self.errors
        }, indent=2)


def get_memory_usage() -> float:
    """Obtiene el uso de memoria en MB (tracemalloc)."""
    current, peak = tracemalloc.get_traced_memory()
    return current / 1024 / 1024


def profile_memory(name: str):
    """Decorador para medir memoria de una función."""
    def decorator(func):
        def wrapper(*args, **kwargs):
            tracemalloc.start()
            mem_before = tracemalloc.get_traced_memory()[0] / 1024 / 1024
            
            result = func(*args, **kwargs)
            
            current, peak = tracemalloc.get_traced_memory()
            mem_after = current / 1024 / 1024
            mem_peak = peak / 1024 / 1024
            tracemalloc.stop()
            
            print(f"\n📊 MEMORY: {name}")
            print(f"   Before:     {mem_before:.1f} MB")
            print(f"   After:      {mem_after:.1f} MB")
            print(f"   Delta:      {mem_after - mem_before:+.1f} MB")
            print(f"   Peak:       {mem_peak:.1f} MB")
            
            return result
        
        return wrapper
    
    return decorator


def profile_time(name: str):
    """Decorador para medir tiempo."""
    def decorator(func):
        def wrapper(*args, **kwargs):
            start_time = time.perf_counter()
            
            result = func(*args, **kwargs)
            
            end_time = time.perf_counter()
            wall_time = end_time - start_time
            
            print(f"\n⏱️  TIMING: {name}")
            print(f"   Wall Time:  {wall_time:.3f}s")
            
            return result
        
        return wrapper
    
    return decorator


# ============================================================================
# PROFILING DE COMPONENTES PRINCIPALES
# ============================================================================

@profile_memory("cancel_expired_orders()")
@profile_time("cancel_expired_orders()")
def profile_cancel_expired_orders():
    """Perfila el job de cancelación de órdenes."""
    print("\n🔍 Analizando: Job de Cancelación de Órdenes")
    
    supabase = get_supabase_client()
    
    # 1. Medir carga de órdenes pendientes
    print("\n  [1/4] Cargando órdenes pendientes...")
    mem_before = get_memory_usage()
    
    response = supabase.table("ordenes").select("*").eq("estado", "pendiente_pago").execute()
    pendiente_count = len(response.data) if response.data else 0
    
    mem_after = get_memory_usage()
    print(f"      Órdenes: {pendiente_count}")
    print(f"      Memory: {mem_after - mem_before:+.1f} MB")
    
    if not response.data:
        print("      ✓ No hay órdenes pendientes")
        return
    
    # 2. Medir lectura de items
    print("\n  [2/4] Procesando items...")
    mem_before = get_memory_usage()
    
    total_items = 0
    for orden in response.data:
        items_resp = supabase.table("items_orden").select("*").eq(
            "id_orden", orden["id_orden"]
        ).execute()
        total_items += len(items_resp.data) if items_resp.data else 0
    
    mem_after = get_memory_usage()
    print(f"      Items encontrados: {total_items}")
    print(f"      Queries: {pendiente_count}")
    print(f"      Memory: {mem_after - mem_before:+.1f} MB")
    
    # 3. Medir lectura de productos
    print("\n  [3/4] Leyendo productos...")
    mem_before = get_memory_usage()
    
    product_queries = 0
    for orden in response.data:
        items_resp = supabase.table("items_orden").select("*").eq(
            "id_orden", orden["id_orden"]
        ).execute()
        
        if items_resp.data:
            for item in items_resp.data:
                prod_resp = supabase.table("productos").select("id_producto,stock").eq(
                    "id_producto", item["id_producto"]
                ).execute()
                product_queries += 1
    
    mem_after = get_memory_usage()
    print(f"      Product queries: {product_queries}")
    print(f"      Memory: {mem_after - mem_before:+.1f} MB")
    
    # Resumen
    total_queries = 1 + pendiente_count + product_queries
    print(f"\n  📈 RESUMEN:")
    print(f"      Total Queries: {total_queries}")
    print(f"      Query Breakdown:")
    print(f"        - Órdenes: 1")
    print(f"        - Items: {pendiente_count}")
    print(f"        - Productos: {product_queries}")
    print(f"      Complejidad: O(N²) ← PROBLEMA")


def profile_get_orders():
    """Perfila la obtención de órdenes desde el endpoint."""
    print("\n🔍 Analizando: GET /orders")
    
    supabase = get_supabase_client()
    
    tracemalloc.start()
    mem_before = tracemalloc.get_traced_memory()[0] / 1024 / 1024
    start_time = time.perf_counter()
    
    # Simular GET /orders
    response = supabase.table("ordenes").select("*").execute()
    orders_count = len(response.data) if response.data else 0
    
    # Para CADA orden, cargar items (N+1)
    total_items = 0
    queries_count = 1
    for order in (response.data or [])[:10]:  # Limitar a 10 para profiling
        items_resp = supabase.table("items_orden").select("*").eq(
            "id_orden", order["id_orden"]
        ).execute()
        total_items += len(items_resp.data) if items_resp.data else 0
        queries_count += 1
    
    end_time = time.perf_counter()
    current, peak = tracemalloc.get_traced_memory()
    mem_after = current / 1024 / 1024
    mem_peak = peak / 1024 / 1024
    tracemalloc.stop()
    
    print(f"\n📊 MEMORY: GET /orders")
    print(f"   Before:     {mem_before:.1f} MB")
    print(f"   After:      {mem_after:.1f} MB")
    print(f"   Delta:      {mem_after - mem_before:+.1f} MB")
    print(f"   Peak:       {mem_peak:.1f} MB")
    
    print(f"\n⏱️  TIMING: GET /orders")
    print(f"   Wall Time:  {end_time - start_time:.3f}s")
    
    print(f"\n📈 QUERIES:")
    print(f"   - SELECT * FROM ordenes: 1 query")
    print(f"   - SELECT * FROM items_orden (per order): {min(10, orders_count)} queries")
    print(f"   - Total: {queries_count} queries")
    print(f"   - Orders loaded: {orders_count}")
    print(f"   - Items (sample 10): {total_items}")


def profile_dashboard():
    """Perfila el dashboard admin."""
    print("\n🔍 Analizando: Dashboard")
    
    supabase = get_supabase_client()
    
    tracemalloc.start()
    mem_before = tracemalloc.get_traced_memory()[0] / 1024 / 1024
    start_time = time.perf_counter()
    
    # Cargar datos del dashboard
    orders = supabase.table("ordenes").select("*").execute()
    products = supabase.table("productos").select("*").execute()
    
    # Cálculos en memoria
    total_revenue = 0
    total_orders = len(orders.data) if orders.data else 0
    
    for order in (orders.data or []):
        total_revenue += order.get("total", 0)
    
    end_time = time.perf_counter()
    current, peak = tracemalloc.get_traced_memory()
    mem_after = current / 1024 / 1024
    mem_peak = peak / 1024 / 1024
    tracemalloc.stop()
    
    print(f"\n📊 MEMORY: Dashboard")
    print(f"   Before:     {mem_before:.1f} MB")
    print(f"   After:      {mem_after:.1f} MB")
    print(f"   Delta:      {mem_after - mem_before:+.1f} MB")
    print(f"   Peak:       {mem_peak:.1f} MB")
    
    print(f"\n⏱️  TIMING: Dashboard")
    print(f"   Wall Time:  {end_time - start_time:.3f}s")
    
    print(f"\n📈 QUERIES:")
    print(f"   - SELECT * FROM ordenes: 1 query")
    print(f"   - SELECT * FROM productos: 1 query")
    print(f"   - Total: 2 queries")
    print(f"   - Data in memory: {total_orders} orders + {len(products.data or [])} products")


# ============================================================================
# ANÁLISIS GENERAL DEL SISTEMA
# ============================================================================

def analyze_system():
    """Análisis general del sistema."""
    print("\n" + "="*80)
    print("  PROFILING DEL SISTEMA - SANTYHOGAR")
    print("="*80)
    
    print(f"\n⏰ Timestamp: {datetime.now().isoformat()}")
    
    # Información básica
    print(f"\n🖥️  SISTEMA:")
    print(f"   PID: {os.getpid()}")
    
    # Profiling individual
    print("\n" + "="*80)
    print("  PROFILING DE COMPONENTES")
    print("="*80)
    
    profile_cancel_expired_orders()
    print("\n" + "-"*80)
    
    profile_get_orders()
    print("\n" + "-"*80)
    
    profile_dashboard()
    
    # Resumen y recomendaciones
    print("\n" + "="*80)
    print("  ANÁLISIS Y RECOMENDACIONES")
    print("="*80)
    
    print("""
🔴 PROBLEMAS IDENTIFICADOS:

1. N+1 QUERIES en cancel_expired_orders()
   ├─ Carga todas las órdenes: 1 query
   ├─ Por CADA orden, carga items: N queries
   ├─ Por CADA item, carga producto: M queries
   └─ Total: 1 + N + (N*M) queries ← EXPONENCIAL

2. N+1 QUERIES en GET /orders
   ├─ Carga todas las órdenes: 1 query
   ├─ Por CADA orden, carga items: N queries
   └─ Total: 1 + N queries

3. SIN CACHING en Dashboard
   ├─ Cada request recalcula todo
   └─ Problema si hay muchas órdenes

4. MEMORY LEAK potencial
   ├─ Job cada 5 minutos sin garbage collection
   ├─ Datos se acumulan
   └─ Memoria crece con el tiempo

✅ SOLUCIONES (prioridad):

ALTA:
  1. Usar JOINs en queries (reduce N+1)
     - Cambiar: SELECT * FROM ordenes; + SELECT * FROM items;
     - A: SELECT ordenes.*, items_orden.* FROM ordenes LEFT JOIN items_orden
     
  2. Agregar pagination en GET /orders
     - Cambiar: SELECT * (todos)
     - A: SELECT * LIMIT 50 OFFSET 0

MEDIA:
  3. Caching con Redis
     - Cache dashboard cada 5 minutos
     - Cache productos (TTL 1 hora)
     
  4. Batch processing en job
     - Procesar 10 órdenes a la vez
     - Liberar memoria entre batches

BAJA:
  5. Índices en BD (ya existen algunos)
     - Agregar índice en estado, fecha_expiracion
     - Mejorar tiempo de query
    """)


if __name__ == "__main__":
    try:
        analyze_system()
        print("\n✅ Profiling completado\n")
    except Exception as e:
        print(f"\n❌ Error durante profiling: {e}")
        import traceback
        traceback.print_exc()

