#!/usr/bin/env python3
"""
Script para generar hash bcrypt de la contraseña maestra del admin.

INSTRUCCIONES:
1. Ejecuta este script
2. Ingresa tu contraseña maestra actual (ej: SantyHogar2026!Admin)
3. Copia el hash generado
4. Reemplaza ADMIN_MASTER_PASSWORD en backend/.env con el hash
5. IMPORTANTE: El nuevo valor en .env será el hash, no la contraseña en plaintext

EJEMPLO:
  Input password: SantyHogar2026!Admin
  Output hash: $2b$12$X7y.Z9a8...etc...
  
  Luego en .env:
  ADMIN_MASTER_PASSWORD=$2b$12$X7y.Z9a8...etc...
"""

from passlib.context import CryptContext
import getpass

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

print("=" * 70)
print("🔐 GENERADOR DE HASH BCRYPT PARA CONTRASEÑA MAESTRA")
print("=" * 70)
print()
print("Ingresa tu contraseña maestra actual:")
print("(Se ocultará mientras escribes por seguridad)")
print()

password = getpass.getpass("Contraseña: ")

if not password or len(password) < 8:
    print("❌ Contraseña muy corta (mín. 8 caracteres)")
    exit(1)

# Generar hash
hashed = pwd_context.hash(password)

print()
print("=" * 70)
print("✅ HASH GENERADO:")
print("=" * 70)
print()
print(hashed)
print()
print("=" * 70)
print("📋 INSTRUCCIONES:")
print("=" * 70)
print()
print("1. Copia el hash anterior")
print("2. Abre backend/.env")
print("3. Reemplaza:")
print("   ADMIN_MASTER_PASSWORD=SantyHogar2026!Admin")
print("   con:")
print("   ADMIN_MASTER_PASSWORD=" + hashed)
print()
print("4. Guarda el archivo")
print("5. Redeploy en Railway")
print()
print("⚠️  IMPORTANTE:")
print("   - El nuevo valor será UN HASH, no la contraseña")
print("   - Solo el hash se guardará en Railway")
print("   - La contraseña original nunca se transmite")
print()
