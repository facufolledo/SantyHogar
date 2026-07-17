#!/usr/bin/env python3
import re

# Leer el archivo
with open('backend/app/services/bulk_import_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Buscar la sección de "Parsear categoría" y reemplazar
pattern = r'(    # Parsear categor.*?\n    categoria = "electrodomesticos"\n    sub = subcategoria\.strip\(\) if subcategoria\.strip\(\) else "General"\n    if categoria_raw\.strip\(\):\n        categoria, default_sub = _parse_category\(categoria_raw\)\n        if not subcategoria\.strip\(\):\n            sub = default_sub)'

replacement = '''    # Parsear categoria
    categoria = "electrodomesticos"
    sub = subcategoria.strip() if subcategoria.strip() else "General"
    if categoria_raw.strip():
        categoria, default_sub = _parse_category(categoria_raw)
        if not subcategoria.strip():
            sub = default_sub
        
        # Validar que la categoria sea valida
        valid_categories = ("electrodomesticos", "muebleria", "colchoneria")
        if categoria not in valid_categories:
            errors.append(f"Categoria invalida: '{categoria_raw}'. Usa: electrodomesticos, muebleria, colchoneria")
    else:
        errors.append("El campo 'categoria' es obligatorio")'''

# Reemplazar
if pattern in content:
    print("Patron encontrado, pero necesita regex")
else:
    # Intenta un reemplazo simple
    if 'if not subcategoria.strip():\n            sub = default_sub' in content:
        # Encontrar la posición
        idx = content.find('if not subcategoria.strip():\n            sub = default_sub')
        if idx != -1:
            # Buscar el final de este bloque
            end_idx = idx + len('if not subcategoria.strip():\n            sub = default_sub')
            # Insertar validación antes de la linea de "Si hay errores"
            before_errors = content.find('    # Si hay errores de validacion', end_idx)
            if before_errors != -1:
                # Insertar el codigo de validacion
                validation_code = '''
        
        # Validar que la categoria sea valida
        valid_categories = ("electrodomesticos", "muebleria", "colchoneria")
        if categoria not in valid_categories:
            errors.append(f"Categoria invalida: '{categoria_raw}'. Usa: electrodomesticos, muebleria, colchoneria")
    else:
        errors.append("El campo 'categoria' es obligatorio")
    
'''
                new_content = content[:before_errors] + validation_code + content[before_errors:]
                
                with open('backend/app/services/bulk_import_service.py', 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print("Actualizado exitosamente")
            else:
                print("No se encontro punto de insercion")
        else:
            print("No se encontro la linea de subcategoria")
    else:
        print("No se encontro el codigo")
