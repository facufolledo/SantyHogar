"""Servicio para importación masiva de productos desde documentos."""
import re
import logging
from io import BytesIO
from typing import List, Tuple
from uuid import UUID

from docx import Document
import zipfile

from app.models.bulk_import import (
    BulkImportResponse,
    ProductImportRow,
    ProductImportValidation,
)

logger = logging.getLogger(__name__)


def _collect_docx_lines(doc: Document) -> list[str]:
    """Párrafos + celdas de tablas (muchas planillas Word van en tablas, no en párrafos)."""
    lines: list[str] = []
    for p in doc.paragraphs:
        t = " ".join((p.text or "").split())
        if t:
            lines.append(t)
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                t = " ".join((cell.text or "").split())
                if t:
                    lines.append(t)
    return lines


def generate_slug(nombre: str) -> str:
    """Genera un slug a partir del nombre del producto."""
    slug = nombre.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'\s+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    return slug.strip('-')


def map_categoria(categoria_texto: str) -> Tuple[str, str]:
    """
    Mapea la categoría del documento a nuestras categorías de BD.
    
    Args:
        categoria_texto: Texto como "SMART TV - 18"
    
    Returns:
        Tupla (categoria, subcategoria)
    """
    # TODO: Implementar lógica de mapeo según tus reglas de negocio
    # Por ahora, asumimos que todo es electrodomésticos
    categoria_lower = categoria_texto.lower()
    
    if 'tv' in categoria_lower or 'smart' in categoria_lower:
        return ('electrodomesticos', 'Televisores')
    elif 'heladera' in categoria_lower or 'freezer' in categoria_lower:
        return ('electrodomesticos', 'Heladeras')
    elif 'lavarropas' in categoria_lower:
        return ('electrodomesticos', 'Lavarropas')
    elif 'colchon' in categoria_lower or 'sommier' in categoria_lower:
        return ('colchoneria', 'Colchones')
    elif 'mueble' in categoria_lower or 'mesa' in categoria_lower or 'silla' in categoria_lower:
        return ('muebleria', 'Muebles')
    else:
        # Por defecto
        return ('electrodomesticos', 'General')


def parse_doc_file(file_content: bytes) -> List[ProductImportValidation]:
    """
    Parsea un archivo .doc/.docx y extrae los productos.
    
    Formato esperado:
    - Línea: "CODIGO - NOMBRE DEL PRODUCTO"
    - Siguiente línea: "CATEGORIA - XX"
    - Stock: número en la columna derecha
    
    Args:
        file_content: Contenido del archivo .doc en bytes
    
    Returns:
        Lista de validaciones de productos
    """
    validations: List[ProductImportValidation] = []
    
    try:
        # Intentar primero como .docx (formato ZIP)
        try:
            doc = Document(BytesIO(file_content))
            paragraphs = _collect_docx_lines(doc)
        except zipfile.BadZipFile:
            # Si falla, es un .doc antiguo - extraer texto plano
            text_content = file_content.decode('latin-1', errors='ignore')
            text_content = re.sub(r'[\x00-\x08\x0b-\x0c\x0e-\x1f]', '', text_content)
            paragraphs = [line.strip() for line in text_content.split('\n') if line.strip()]
        
        # DEBUG: Imprimir las primeras 30 líneas para ver qué estamos leyendo
        logger.info("=== DEBUG: Primeras 30 líneas del documento ===")
        for idx, para in enumerate(paragraphs[:30]):
            logger.info(f"Línea {idx}: '{para}'")
        logger.info("=== FIN DEBUG ===")
        logger.info(f"Total de líneas en el documento: {len(paragraphs)}")
        
        row_number = 0
        i = 0
        
        while i < len(paragraphs):
            text = paragraphs[i].strip()
            
            # Ignorar encabezados y líneas vacías
            if (not text or 
                'Alejandro Accietto' in text or
                'Listados de Existencias' in text or
                'Rubro' in text or
                'Artículo' in text or
                'Existencia' in text or
                'Unidad Venta' in text or
                'CBA - SANTY HOGAR' in text or
                'Pág.' in text or
                'Puesto:' in text or
                'Usuario:' in text or
                'Fecha' in text or
                'Hora' in text or
                re.match(r'^\d{2}/\d{2}/\d{4}$', text) or  # Fechas
                re.match(r'^\d{2}:\d{2}$', text)):  # Horas
                i += 1
                continue

            # Formato: solo código (sin " - "), nombre en la línea siguiente
            solo_codigo = re.match(r'^([A-Za-z0-9][A-Za-z0-9._-]{2,})\s*$', text)
            if solo_codigo and i + 1 < len(paragraphs):
                nombre_cand = paragraphs[i + 1].strip()
                looks_cat = bool(re.match(r'^.+\s*-\s*\d+$', nombre_cand))
                looks_stock = bool(re.match(r'^(\d+)[,.](\d+)$', nombre_cand))
                if nombre_cand and not looks_cat and not looks_stock:
                    row_number += 1
                    codigo = solo_codigo.group(1).strip()
                    nombre = nombre_cand
                    categoria_texto = ""
                    stock = 0
                    j = i + 2
                    if j < len(paragraphs):
                        nl = paragraphs[j].strip()
                        if re.match(r'^.+\s*-\s*\d+$', nl):
                            categoria_texto = re.sub(
                                r"\s*-\s*\d+$", "", nl
                            ).strip()
                            j += 1
                    if j < len(paragraphs):
                        sl = paragraphs[j].strip()
                        sm = re.match(r"^(\d+)[,.](\d+)$", sl)
                        if sm:
                            stock = int(sm.group(1))
                            j += 1
                    validations.append(
                        _validate_product(
                            row_number,
                            {
                                "codigo": codigo,
                                "nombre": nombre,
                                "categoria": categoria_texto,
                                "stock": stock,
                            },
                        )
                    )
                    i = j
                    continue
            
            # Detectar línea de producto:
            # - Formato A: "CODIGO - NOMBRE"
            # - Formato B: "CODIGO -" (o solo CODIGO) y el nombre viene en la línea siguiente
            producto_match = re.match(r'^([A-Z0-9]+)\s*-\s*(.*)$', text)
            
            if producto_match:
                row_number += 1
                codigo = producto_match.group(1).strip()
                nombre = (producto_match.group(2) or "").strip()
                
                logger.info(f"DEBUG: Producto encontrado - Código: {codigo}, Nombre inicial: {nombre}")

                # Si no vino nombre en la misma línea, tomar la siguiente como nombre/descripcion.
                if not nombre and i + 1 < len(paragraphs):
                    candidate = paragraphs[i + 1].strip()
                    # Evitar tomar encabezados u otras líneas típicas.
                    if candidate and not re.match(r'^.+\s*-\s*\d+$', candidate):
                        nombre = candidate
                        logger.info(f"DEBUG: Nombre tomado de línea siguiente: {nombre}")
                        i += 1  # Consumimos la línea del nombre
                
                # Buscar stock en la misma línea (números al final)
                stock = 0
                stock_match = re.search(r'(\d+)[,.](\d+)\s*$', text)
                if stock_match:
                    # Remover el stock del nombre
                    nombre = re.sub(r'\s*\d+[,.]\d+\s*$', '', nombre).strip()
                    stock = int(stock_match.group(1))
                    logger.info(f"DEBUG: Stock encontrado en misma línea: {stock}")
                
                # La siguiente línea debería ser la categoría
                categoria_texto = ''
                if i + 1 < len(paragraphs):
                    next_line = paragraphs[i + 1].strip()
                    logger.info(f"DEBUG: Siguiente línea: '{next_line}'")
                    # Verificar si es una categoría (formato: "TEXTO - XX")
                    if re.match(r'^.+\s*-\s*\d+$', next_line):
                        categoria_texto = re.sub(r'\s*-\s*\d+$', '', next_line).strip()
                        logger.info(f"DEBUG: Categoría encontrada: {categoria_texto}")
                        i += 1  # Saltar la línea de categoría
                
                # Si no encontramos stock en la línea del producto, buscar en la siguiente
                if stock == 0 and i + 1 < len(paragraphs):
                    next_line = paragraphs[i + 1].strip()
                    stock_match = re.match(r'^(\d+)[,.](\d+)$', next_line)
                    if stock_match:
                        stock = int(stock_match.group(1))
                        logger.info(f"DEBUG: Stock encontrado en línea siguiente: {stock}")
                        i += 1  # Saltar la línea de stock
                
                # Crear el producto
                product_data = {
                    'codigo': codigo,
                    'nombre': nombre,
                    'categoria': categoria_texto,
                    'stock': stock
                }
                
                logger.info(f"DEBUG: Producto completo: {product_data}")
                validations.append(_validate_product(row_number, product_data))
            
            i += 1
        
    except Exception as e:
        import traceback
        logger.error(f"ERROR: {str(e)}")
        logger.error(traceback.format_exc())
        validations.append(
            ProductImportValidation(
                row_number=0,
                valid=False,
                errors=[f"Error al leer el archivo: {str(e)}"]
            )
        )
    
    return validations


def _validate_product(row_number: int, data: dict) -> ProductImportValidation:
    """Valida y crea un ProductImportRow desde los datos parseados."""
    errors = []
    
    # Validar campos requeridos
    if not (data.get('nombre') or '').strip():
        errors.append("Falta el nombre del producto")
    
    # Si hay errores, retornar inválido
    if errors:
        return ProductImportValidation(
            row_number=row_number,
            valid=False,
            errors=errors
        )
    
    try:
        # Mapear categoría
        categoria, subcategoria = map_categoria(data.get('categoria', ''))
        
        # Crear el objeto validado
        codigo = (data.get("codigo") or "").strip()
        marca = (codigo[:100] if codigo else "Sin marca")

        product_row = ProductImportRow(
            nombre=data['nombre'],
            precio=0.0,
            stock=data.get('stock', 0),
            categoria=categoria,
            subcategoria=subcategoria,
            marca=marca,
            slug=generate_slug(data['nombre'])
        )
        
        return ProductImportValidation(
            row_number=row_number,
            valid=True,
            data=product_row
        )
    
    except Exception as e:
        return ProductImportValidation(
            row_number=row_number,
            valid=False,
            errors=[f"Error de validación: {str(e)}"]
        )


async def process_bulk_import(
    file_content: bytes,
    supabase_client,
) -> BulkImportResponse:
    """
    Procesa la importación masiva de productos.
    
    Args:
        file_content: Contenido del archivo .doc
        supabase_client: Cliente de Supabase para insertar en BD
    
    Returns:
        Resultado de la importación
    """
    # Parsear el archivo
    validations = parse_doc_file(file_content)
    
    # Contar válidos e inválidos
    valid_rows = [v for v in validations if v.valid]
    invalid_rows = [v for v in validations if not v.valid]
    
    imported_count = 0
    
    # Insertar productos válidos
    for validation in valid_rows:
        if validation.data:
            try:
                # Preparar datos para inserción
                product_data = {
                    'nombre': validation.data.nombre,
                    'slug': validation.data.slug,
                    'categoria': validation.data.categoria,
                    'subcategoria': validation.data.subcategoria,
                    'precio': validation.data.precio,
                    'precio_original': validation.data.precio_costo,
                    'stock': validation.data.stock,
                    'marca': validation.data.marca,
                    'descripcion': validation.data.descripcion or '',
                    'imagenes': [],  # Sin imágenes por defecto
                    'especificaciones': {},
                    'destacado': False,
                    'calificacion': 0.0,
                    'cantidad_resenas': 0,
                }
                
                # Insertar en Supabase
                result = supabase_client.table('productos').insert(product_data).execute()
                
                if result.data:
                    imported_count += 1
            
            except Exception as e:
                validation.valid = False
                validation.errors.append(f"Error al insertar: {str(e)}")
    
    return BulkImportResponse(
        total_rows=len(validations),
        valid_rows=len(valid_rows),
        invalid_rows=len(invalid_rows),
        imported_count=imported_count,
        validations=validations,
        message=f"Importación completada: {imported_count} productos importados de {len(valid_rows)} válidos"
    )
