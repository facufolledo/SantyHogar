"""
Script para crear y configurar el bucket de Supabase Storage para imágenes de productos.
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database.connection import get_supabase_client

BUCKET_NAME = "product-images"

def setup_bucket():
    """Crea y configura el bucket product-images con acceso público."""
    print(f"🚀 Configurando bucket '{BUCKET_NAME}' en Supabase Storage...\n")
    
    try:
        client = get_supabase_client()
        
        # Verificar si el bucket ya existe
        print("📋 Verificando buckets existentes...")
        buckets = client.storage.list_buckets()
        
        bucket_exists = any(b.name == BUCKET_NAME for b in buckets)
        
        if bucket_exists:
            print(f"✅ El bucket '{BUCKET_NAME}' ya existe\n")
        else:
            print(f"📦 Creando bucket '{BUCKET_NAME}'...")
            
            # Crear bucket con acceso público
            client.storage.create_bucket(
                BUCKET_NAME,
                options={"public": True}
            )
            
            print(f"✅ Bucket '{BUCKET_NAME}' creado exitosamente\n")
        
        # Verificar configuración
        print("🔍 Verificando configuración del bucket...")
        bucket = client.storage.get_bucket(BUCKET_NAME)
        
        print(f"   Nombre: {bucket.name}")
        print(f"   Público: {bucket.public}")
        print(f"   ID: {bucket.id}")
        
        print("\n" + "="*70)
        print("✅ CONFIGURACIÓN COMPLETADA")
        print("="*70)
        print(f"\n📸 Ahora podés subir imágenes a través del endpoint:")
        print(f"   POST http://localhost:8000/products/upload-image")
        print(f"\n🌐 Las imágenes estarán disponibles públicamente en:")
        print(f"   https://[PROJECT].supabase.co/storage/v1/object/public/{BUCKET_NAME}/[filename]")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        print("\n💡 Posibles soluciones:")
        print("   1. Verificá que el archivo backend/.env tenga SUPABASE_URL y SUPABASE_KEY correctos")
        print("   2. Verificá que la SUPABASE_KEY sea la 'service_role' key (no la 'anon' key)")
        print("   3. Verificá que Supabase esté activo (no pausado)")
        print("\n📖 Documentación: https://supabase.com/docs/guides/storage")

if __name__ == "__main__":
    setup_bucket()
