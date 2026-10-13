#!/usr/bin/env python3
"""Test script para verificar que el endpoint /admin/users funciona correctamente."""

import asyncio
import httpx
import json
from pathlib import Path
import sys

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from app.config import get_config
from app.routes.admin_users import list_admin_users


async def test_admin_endpoint():
    """Test the admin users endpoint."""
    print("=" * 60)
    print("Testing /admin/users endpoint")
    print("=" * 60)
    
    try:
        config = get_config()
        print(f"\n✓ Configuration loaded")
        print(f"  Supabase URL: {config.supabase_url}")
        print(f"  SUPABASE_KEY: {config.supabase_key[:20]}...")
        
        # Test the endpoint function directly
        print(f"\n🔍 Calling list_admin_users()...")
        admins = await list_admin_users()
        
        print(f"\n✅ Success! Found {len(admins)} admin users:")
        print()
        
        for admin in admins:
            print(f"  👤 {admin.email}")
            print(f"     Name: {admin.name}")
            print(f"     ID: {admin.id}")
            print(f"     Created: {admin.created_at}")
            print()
        
        if not admins:
            print("  ⚠️  No admin users found!")
            print("     Go to Supabase Dashboard > Authentication > Users")
            print("     and set role: 'admin' in user_metadata for desired admins")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(test_admin_endpoint())
    sys.exit(0 if success else 1)
