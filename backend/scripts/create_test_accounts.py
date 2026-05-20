"""Script para crear cuentas de prueba en Supabase."""
import asyncio
import sys
from pathlib import Path

# Agregar el directorio raíz al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database.connection import get_supabase_client
from app.config import get_config


async def create_test_accounts():
    """Crea las cuentas de prueba en Supabase Auth."""
    
    print("=" * 60)
    print("CREANDO CUENTAS DE PRUEBA")
    print("=" * 60)
    print()
    
    config = get_config()
    supabase = get_supabase_client()
    
    # Cuentas de prueba
    test_accounts = [
        {
            "email": "admin@santyhogar.com",
            "password": "admin123",
            "name": "Admin SantyHogar",
            "role": "admin"
        },
        {
            "email": "maria@email.com",
            "password": "123456",
            "name": "María González",
            "role": "customer"
        }
    ]
    
    for account in test_accounts:
        print(f"Creando cuenta: {account['email']}")
        print(f"  Nombre: {account['name']}")
        print(f"  Rol: {account['role']}")
        
        try:
            # Crear usuario en Supabase Auth
            response = supabase.auth.admin.create_user({
                "email": account["email"],
                "password": account["password"],
                "email_confirm": True,
                "user_metadata": {
                    "name": account["name"],
                    "role": account["role"]
                }
            })
            
            if response.user:
                user_id = response.user.id
                print(f"  ✓ Usuario creado en Auth (ID: {user_id})")
                
                # Si es customer, crear registro en tabla clientes
                if account["role"] == "customer":
                    cliente_data = {
                        "auth_user_id": user_id,
                        "nombre": account["name"],
                        "email": account["email"],
                        "telefono": "",
                        "direccion": ""
                    }
                    
                    result = supabase.table("clientes").insert(cliente_data).execute()
                    
                    if result.data:
                        print(f"  ✓ Cliente creado en BD (ID: {result.data[0]['id']})")
                    else:
                        print(f"  ✗ Error al crear cliente en BD")
                
                print(f"  ✓ Cuenta creada exitosamente")
                print()
            else:
                print(f"  ✗ Error: No se pudo crear el usuario")
                print()
                
        except Exception as e:
            error_msg = str(e)
            if "already registered" in error_msg.lower() or "already exists" in error_msg.lower():
                print(f"  ⚠ La cuenta ya existe")
                print()
            else:
                print(f"  ✗ Error: {error_msg}")
                print()
    
    print("=" * 60)
    print("RESUMEN DE CUENTAS DE PRUEBA")
    print("=" * 60)
    print()
    print("ADMIN:")
    print("  Email: admin@santyhogar.com")
    print("  Contraseña: admin123")
    print()
    print("CLIENTE:")
    print("  Email: maria@email.com")
    print("  Contraseña: 123456")
    print()
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(create_test_accounts())
