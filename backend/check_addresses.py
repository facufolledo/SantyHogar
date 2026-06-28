#!/usr/bin/env python3
"""
Script rápido para verificar las direcciones guardadas en Supabase.
"""

from app.main import get_supabase_client

supabase = get_supabase_client()

# Buscar todas las direcciones del cliente 3098dbd9-ea55-4d22-87f5-531a5c6da4cc
customer_id = "3098dbd9-ea55-4d22-87f5-531a5c6da4cc"

response = supabase.table("direcciones").select("*").eq("id_cliente", customer_id).execute()

print(f"Total de direcciones para cliente {customer_id}: {len(response.data)}")
print()

if response.data:
    for i, addr in enumerate(response.data, 1):
        print(f"Dirección {i}:")
        print(f"  ID: {addr.get('id_direccion')}")
        print(f"  Etiqueta: {addr.get('etiqueta')}")
        print(f"  Calle: {addr.get('calle')}")
        print(f"  Ciudad: {addr.get('ciudad')}")
        print(f"  Provincia: {addr.get('provincia')}")
        print(f"  CP: {addr.get('codigo_postal')}")
        print(f"  Principal: {addr.get('es_principal')}")
        print(f"  Creada: {addr.get('fecha_creacion')}")
        print()
else:
    print("❌ No hay direcciones guardadas para este cliente")
