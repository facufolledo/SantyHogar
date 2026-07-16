#!/usr/bin/env python3
"""
Crea una cuenta admin en SantyHogar.
Uso: python create_admin.py <email> <password> <nombre> <master_password>
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(__file__))

from app.database.connection import get_supabase_client
from app.config import get_config

def create_admin(email=None, password=None, name=None, master_password=None):
    """Crea una cuenta admin."""
    
    print("\n" + "="*80)
    print("  CREAR CUENTA ADMIN")
    print("="*80 + "\n")
    
    # Obtener email y contraseña
    if not email:
        email = input("📧 Email del admin: ").strip().lower()
    if not email:
        print("❌ Email requerido")
        return False
    
    if not password:
        password = input("🔐 Contraseña: ").strip()
    if not password or len(password) < 6:
        print("❌ Contraseña debe tener al menos 6 caracteres")
        return False
    
    if not name:
        name = input("👤 Nombre completo (Enter para 'Admin'): ").strip()
    if not name:
        name = "Admin"
    
    if not master_password:
        master_password = input("🔑 Contraseña maestra (ADMIN_MASTER_PASSWORD): ").strip()
    if not master_password:
        print("❌ Contraseña maestra requerida")
        return False
    
    print()
    
    # Verificar contraseña maestra
    config = get_config()
    if master_password != config.admin_master_password:
        print("❌ Contraseña maestra incorrecta")
        return False
    
    print("✅ Contraseña maestra verificada\n")
    
    # Crear usuario
    print("⏳ Creando usuario admin...")
    
    client = get_supabase_client()
    
    try:
        # Crear en Supabase Auth
        user = client.auth.admin.create_user({
            'email': email,
            'password': password,
            'email_confirm': True,
            'user_metadata': {
                'name': name,
                'role': 'admin'
            }
        })
        
        print("="*80)
        print("✅ CUENTA ADMIN CREADA EXITOSAMENTE")
        print("="*80)
        print(f"\n📧 Email: {email}")
        print(f"👤 Nombre: {name}")
        print(f"🔐 Contraseña: {password}")
        print(f"👑 Rol: admin")
        print(f"\n🔗 URL Admin: https://santyhogar.com.ar/admin")
        print("\n" + "="*80 + "\n")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error al crear usuario: {e}\n")
        return False


if __name__ == "__main__":
    try:
        if len(sys.argv) == 5:
            # python create_admin.py email password nombre master_password
            success = create_admin(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])
        else:
            success = create_admin()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
