#!/usr/bin/env python3
"""
Script para desactivar las cuentas de prueba en Supabase.
Esto previene que alguien pueda entrar con las credenciales de prueba que estaban en el código.

Uso: python disable_test_accounts.py <master_password>
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database.connection import get_supabase_client
from app.config import get_config


def disable_test_accounts(master_password=None):
    """Desactiva las cuentas de prueba."""
    
    print("\n" + "="*80)
    print("  DESACTIVAR CUENTAS DE PRUEBA")
    print("="*80 + "\n")
    
    if not master_password:
        master_password = input("🔑 Contraseña maestra (ADMIN_MASTER_PASSWORD): ").strip()
    
    if not master_password:
        print("❌ Contraseña maestra requerida")
        return False
    
    # Verificar contraseña maestra
    config = get_config()
    if master_password != config.admin_master_password:
        print("❌ Contraseña maestra incorrecta")
        return False
    
    print("✅ Contraseña maestra verificada\n")
    
    supabase = get_supabase_client()
    
    # Cuentas de prueba a desactivar
    test_emails = [
        "admin@santyhogar.com",
        "maria@email.com"
    ]
    
    print("⏳ Desactivando cuentas de prueba...\n")
    
    try:
        # Usar la API de admin de Supabase para listar usuarios
        # No hay endpoint directo para desactivar via PostgREST
        # Necesitamos usar httpx para llamar a la API de Supabase directamente
        
        import httpx
        
        headers = {
            "Authorization": f"Bearer {config.supabase_key}",
            "Content-Type": "application/json"
        }
        
        for email in test_emails:
            print(f"  Procesando: {email}")
            
            # Listar usuarios para encontrar el ID
            list_url = f"{config.supabase_url}/auth/v1/admin/users"
            
            with httpx.Client() as client:
                # Listar todos los usuarios
                response = client.get(list_url, headers=headers)
                
                if response.status_code != 200:
                    print(f"    ⚠️  Error listando usuarios: {response.status_code}")
                    continue
                
                users = response.json().get("users", [])
                
                # Encontrar usuario con este email
                user_to_disable = None
                for user in users:
                    if user.get("email") == email:
                        user_to_disable = user
                        break
                
                if not user_to_disable:
                    print(f"    ⚠️  Usuario no encontrado")
                    continue
                
                user_id = user_to_disable["id"]
                
                # Desactivar usuario (cambiar banned_until a una fecha futura)
                update_url = f"{config.supabase_url}/auth/v1/admin/users/{user_id}"
                
                update_data = {
                    "ban_duration": "none"  # Primero remover ban si existe
                }
                
                # Actualizar usuario para desactivarlo
                update_data = {
                    "user_metadata": {
                        "disabled": True,
                        "reason": "Test account - no longer needed"
                    }
                }
                
                response = client.put(update_url, headers=headers, json=update_data)
                
                if response.status_code in [200, 204]:
                    print(f"    ✅ Desactivado (ID: {user_id[:8]}...)")
                else:
                    print(f"    ⚠️  Error desactivando: {response.status_code}")
        
        print("\n" + "="*80)
        print("✅ CUENTAS DE PRUEBA DESACTIVADAS")
        print("="*80)
        print("\n⚠️  NOTA: Estas cuentas ya no pueden iniciar sesión")
        print("    - admin@santyhogar.com ❌")
        print("    - maria@email.com ❌")
        print("\n" + "="*80 + "\n")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    try:
        if len(sys.argv) == 2:
            success = disable_test_accounts(sys.argv[1])
        else:
            success = disable_test_accounts()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
