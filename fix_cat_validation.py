# Leer el archivo actual
with open('backend/app/services/bulk_import_service.py', 'rb') as f:
    content = f.read()

# Decodificar
text = content.decode('utf-8')

# Buscar y reemplazar
old_code = """    if categoria_raw.strip():
        categoria, default_sub = _parse_category(categoria_raw)
        if not subcategoria.strip():
            sub = default_sub
    
    # Si hay errores de validacion, retornar invalido"""

new_code = """    if categoria_raw.strip():
        categoria, default_sub = _parse_category(categoria_raw)
        if not subcategoria.strip():
            sub = default_sub
        
        # Validar que la categoria sea valida
        valid_categories = ("electrodomesticos", "muebleria", "colchoneria")
        if categoria not in valid_categories:
            errors.append(f"Categoria invalida: '{categoria_raw}'. Usa: electrodomesticos, muebleria, colchoneria")
    else:
        errors.append("El campo 'categoria' es obligatorio")
    
    # Si hay errores de validacion, retornar invalido"""

if old_code in text:
    text = text.replace(old_code, new_code)
    with open('backend/app/services/bulk_import_service.py', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Actualizado exitosamente")
else:
    print("No encontrado - buscando alternativa")
    # Intenta alternativa sin comentario
    alt_code = """    if categoria_raw.strip():
        categoria, default_sub = _parse_category(categoria_raw)
        if not subcategoria.strip():
            sub = default_sub"""
    
    if alt_code in text:
        print("Encontrado codigo alternativo")
        # Buscar el siguiente 'Si hay errores' y insertar antes
        idx = text.find(alt_code)
        if idx > 0:
            idx = text.find('\n', idx) 
            idx = text.find('\n', idx + 1)
            idx = text.find('\n', idx + 1)
            idx = text.find('\n', idx + 1)
            
            insert_text = """        
        # Validar que la categoria sea valida
        valid_categories = ("electrodomesticos", "muebleria", "colchoneria")
        if categoria not in valid_categories:
            errors.append(f"Categoria invalida: '{categoria_raw}'. Usa: electrodomesticos, muebleria, colchoneria")
    else:
        errors.append("El campo 'categoria' es obligatorio")
    
"""
            text = text[:idx] + insert_text + text[idx:]
            with open('backend/app/services/bulk_import_service.py', 'w', encoding='utf-8') as f:
                f.write(text)
            print("Actualizado con metodo alternativo")
