#!/usr/bin/env python3
"""Script para crear una cuenta admin de prueba en Supabase."""

import asyncio
import httpx
from pathlib import Path
import sys

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from app.config import get_config


async def create_admin():
    """Crea un usuario admin de prueba."""
    config = get_config()
    
    # Datos del admin a crear
    admin_data = {
        "email": "test.admin@santyhogar.com",
        "password": "TestAdmin123",  # Cumple: 8+ chars, mayúscula, minúscula, número
        "name": "Admin Test",
        "master_password": config.admin_master_password
    }
    
    print("=" * 60)
    print("Creando usuario admin de prueba...")
    print("=" * 60)
    print(f"\nDatos del admin:")
    print(f"  Email: {admin_data['email']}")
    print(f"  Nombre: {admin_data['name']}")
    print(f"  Contraseña: {admin_data['password']}")
    print(f"\nUsando contraseña maestra: {config.admin_master_password[:10]}...")
    
    try:
        api_url = "http://localhost:8000"  # Cambiar si es necesario
        
        async with httpx.AsyncClient(verify=False) as client:
            response = await client.post(
                f"{api_url}/admin/users",
                json=admin_data,
                timeout=10,
            )
        
        print(f"\n📤 Respuesta HTTP: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ ¡Admin creado exitosamente!")
            print(f"\n📋 Datos del admin creado:")
            print(f"  ID: {data['id']}")
            print(f"  Email: {data['email']}")
            print(f"  Nombre: {data['name']}")
            print(f"  Creado: {data['created_at']}")
            print(f"\n🔑 Credenciales de acceso:")
            print(f"  Email: test.admin@santyhogar.com")
            print(f"  Contraseña: TestAdmin123")
            return True
        else:
            print(f"\n❌ Error: {response.status_code}")
            error_data = response.json()
            print(f"  Detalle: {error_data.get('detail', 'Sin detalles')}")
            return False
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("Asegúrate de que el backend esté corriendo en http://localhost:8000\n")
    success = asyncio.run(create_admin())
    sys.exit(0 if success else 1)
