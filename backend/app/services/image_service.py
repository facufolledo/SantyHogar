"""Servicio de upload de imágenes a Supabase Storage."""
import uuid
from typing import Tuple

from fastapi import UploadFile

from app.config import get_config
from app.database.connection import get_supabase_client


class ImageValidationError(Exception):
    """Error de validación de imagen (tipo o tamaño)."""

    pass


class ImageService:
    """Sube imágenes a Supabase Storage bucket `product-images`."""

    BUCKET = "product-images"
    MAX_SIZE = 5 * 1024 * 1024  # 5 MB
    ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}

    # Mapeo de content-type a extensión
    EXTENSION_MAP = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }

    def validate_file(self, content_type: str, size: int) -> None:
        """Valida tipo y tamaño del archivo.

        Raises:
            ImageValidationError: si el tipo no es permitido o el tamaño excede 5 MB.
        """
        if content_type not in self.ALLOWED_TYPES:
            raise ImageValidationError(
                "El archivo debe ser una imagen (JPEG, PNG o WebP)"
            )
        if size > self.MAX_SIZE:
            raise ImageValidationError("La imagen no debe exceder 5 MB")

    def generate_unique_filename(self, content_type: str) -> str:
        """Genera un nombre de archivo único usando UUID."""
        ext = self.EXTENSION_MAP.get(content_type, ".jpg")
        return f"{uuid.uuid4().hex}{ext}"

    async def upload_image(self, file: UploadFile) -> Tuple[str, str]:
        """Sube imagen a Supabase Storage y retorna (url_pública, filename).

        Args:
            file: Archivo subido vía FastAPI UploadFile.

        Returns:
            Tupla (public_url, filename).

        Raises:
            ImageValidationError: si el archivo no pasa validación.
        """
        content = await file.read()
        content_type = file.content_type or ""
        size = len(content)

        self.validate_file(content_type, size)

        filename = self.generate_unique_filename(content_type)

        client = get_supabase_client()
        client.storage.from_(self.BUCKET).upload(
            path=filename,
            file=content,
            file_options={"content-type": content_type},
        )

        cfg = get_config()
        public_url = (
            f"{cfg.supabase_url.rstrip('/')}/storage/v1/object/public/"
            f"{self.BUCKET}/{filename}"
        )

        return public_url, filename
