"""Script para crear el bucket `product-images` en Supabase Storage con acceso público de lectura.

Uso:
    cd backend
    python -m scripts.create_storage_bucket

Requiere las variables de entorno SUPABASE_URL y SUPABASE_KEY configuradas en backend/.env
"""
import sys
from pathlib import Path

# Agregar el directorio backend al path para importar app
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database.connection import get_supabase_client


BUCKET_NAME = "product-images"


def create_bucket() -> None:
    """Crea el bucket product-images con acceso público de lectura."""
    client = get_supabase_client()

    # Listar buckets existentes para verificar si ya existe
    existing_buckets = client.storage.list_buckets()
    bucket_names = [b.name for b in existing_buckets]

    if BUCKET_NAME in bucket_names:
        print(f"✓ El bucket '{BUCKET_NAME}' ya existe.")
        return

    # Crear bucket con acceso público
    client.storage.create_bucket(
        BUCKET_NAME,
        options={
            "public": True,
            "file_size_limit": 5 * 1024 * 1024,  # 5 MB
            "allowed_mime_types": ["image/jpeg", "image/png", "image/webp"],
        },
    )
    print(f"✓ Bucket '{BUCKET_NAME}' creado exitosamente con acceso público de lectura.")


if __name__ == "__main__":
    try:
        create_bucket()
    except Exception as e:
        print(f"✗ Error al crear el bucket: {e}", file=sys.stderr)
        sys.exit(1)
