#!/usr/bin/env python3
"""
Script para arreglar el timezone de direcciones.
Busca direcciones con timestamp UTC y las convierte a Argentina timezone.
"""

from datetime import datetime, timedelta, timezone
from app.main import get_supabase_client

def fix_addresses_timezone():
    """Arregla el timezone de direcciones guardadas."""
    supabase = get_supabase_client()
    
    # Obtener todas las direcciones
    response = supabase.table("direcciones").select("*").execute()
    addresses = response.data
    
    print(f"Total de direcciones: {len(addresses)}")
    print()
    
    fixed_count = 0
    for addr in addresses:
        fecha_str = addr.get('fecha_creacion')
        if not fecha_str:
            continue
        
        # Parsear fecha
        try:
            # Supabase devuelve timestamps ISO como "2026-06-28T17:12:05.762993+00:00"
            fecha = datetime.fromisoformat(fecha_str.replace('Z', '+00:00'))
            
            # Si tiene UTC+00:00, necesita restar 3 horas
            if fecha.tzinfo and fecha.tzinfo.utcoffset(None) == timedelta(0):
                # Convertir a Argentina timezone
                argentina_tz = timezone(timedelta(hours=-3))
                fecha_argentina = fecha.replace(tzinfo=timezone.utc).astimezone(argentina_tz)
                
                # Actualizar en BD
                supabase.table("direcciones").update({
                    "fecha_creacion": fecha_argentina.isoformat()
                }).eq("id_direccion", addr['id_direccion']).execute()
                
                fixed_count += 1
                print(f"✓ Dirección {addr['id_direccion']}")
                print(f"  Antes: {fecha}")
                print(f"  Después: {fecha_argentina}")
                print()
        except Exception as e:
            print(f"❌ Error procesando dirección {addr['id_direccion']}: {e}")
            print()
    
    print(f"\n✅ Total corregidas: {fixed_count}")

if __name__ == '__main__':
    print("Arreglando timezone de direcciones...")
    print("=" * 60)
    fix_addresses_timezone()
