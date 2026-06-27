"""Property-based tests para validación de imágenes.

Feature: sprint-2-completar-ecommerce, Property 5: Validación de archivos de imagen

**Validates: Requirements 4.3, 4.4**

Para cualquier archivo subido al endpoint de upload de imágenes:
- Si el content-type no es JPEG, PNG o WebP, o si el tamaño excede 5 MB → debe lanzar error de validación.
- Si el archivo es una imagen válida de tipo permitido y tamaño ≤ 5 MB → debe pasar validación.
"""
from hypothesis import given, settings, strategies as st

from app.services.image_service import ImageService, ImageValidationError


# --- Strategies ---

VALID_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"]
MAX_SIZE = 5 * 1024 * 1024  # 5 MB

# Tipos inválidos: cualquier string que no sea uno de los tipos permitidos
invalid_content_types = st.text(min_size=1, max_size=50).filter(
    lambda t: t not in VALID_CONTENT_TYPES
)

# Tamaños válidos: 1 byte hasta 5 MB
valid_sizes = st.integers(min_value=1, max_value=MAX_SIZE)

# Tamaños inválidos: más de 5 MB (hasta 20 MB para no generar datos enormes)
invalid_sizes = st.integers(min_value=MAX_SIZE + 1, max_value=20 * 1024 * 1024)

# Tipos válidos
valid_content_types = st.sampled_from(VALID_CONTENT_TYPES)


# --- Tests ---

service = ImageService()


class TestImageValidationProperty:
    """Property 5: Validación de archivos de imagen."""

    @settings(max_examples=100)
    @given(content_type=invalid_content_types, size=valid_sizes)
    def test_invalid_content_type_raises_error(self, content_type: str, size: int):
        """Para cualquier content-type no permitido, validate_file debe lanzar error."""
        try:
            service.validate_file(content_type, size)
            assert False, (
                f"Se esperaba ImageValidationError para content_type={content_type!r}"
            )
        except ImageValidationError as e:
            assert "imagen" in str(e).lower() or "JPEG" in str(e)

    @settings(max_examples=100)
    @given(content_type=valid_content_types, size=invalid_sizes)
    def test_oversized_file_raises_error(self, content_type: str, size: int):
        """Para cualquier archivo que exceda 5 MB, validate_file debe lanzar error."""
        try:
            service.validate_file(content_type, size)
            assert False, f"Se esperaba ImageValidationError para size={size}"
        except ImageValidationError as e:
            assert "5 MB" in str(e)

    @settings(max_examples=100)
    @given(content_type=invalid_content_types, size=invalid_sizes)
    def test_invalid_type_and_oversized_raises_error(
        self, content_type: str, size: int
    ):
        """Para cualquier archivo con tipo inválido Y tamaño excedido, debe lanzar error."""
        try:
            service.validate_file(content_type, size)
            assert False, "Se esperaba ImageValidationError"
        except ImageValidationError:
            pass  # Cualquiera de los dos mensajes es aceptable

    @settings(max_examples=100)
    @given(content_type=valid_content_types, size=valid_sizes)
    def test_valid_file_passes_validation(self, content_type: str, size: int):
        """Para cualquier archivo con tipo válido y tamaño ≤ 5 MB, validate_file no debe lanzar error."""
        # No debe lanzar excepción
        service.validate_file(content_type, size)


class TestImageFilenameGeneration:
    """Propiedades adicionales del generador de nombres."""

    @settings(max_examples=100)
    @given(content_type=valid_content_types)
    def test_generated_filename_has_correct_extension(self, content_type: str):
        """El nombre generado debe tener la extensión correcta según el content-type."""
        filename = service.generate_unique_filename(content_type)

        expected_extensions = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
        }
        expected_ext = expected_extensions[content_type]
        assert filename.endswith(expected_ext), (
            f"Filename {filename!r} no termina en {expected_ext!r}"
        )

    @settings(max_examples=100)
    @given(content_type=valid_content_types)
    def test_generated_filenames_are_unique(self, content_type: str):
        """Dos llamadas consecutivas deben generar nombres diferentes (UUID)."""
        name1 = service.generate_unique_filename(content_type)
        name2 = service.generate_unique_filename(content_type)
        assert name1 != name2, "Los nombres generados deben ser únicos"
