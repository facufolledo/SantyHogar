with open('backend/app/services/bulk_import_service.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Insertar el codigo de validacion después de la línea 574  
new_code = """        
        # Validar que la categoria sea valida
        valid_categories = ("electrodomesticos", "muebleria", "colchoneria")
        if categoria not in valid_categories:
            errors.append(f"Categoria invalida: '{categoria_raw}'. Usa: electrodomesticos, muebleria, colchoneria")
    else:
        errors.append("El campo categoria es obligatorio")
    
"""

new_lines = lines[:574] + [new_code] + lines[574:]

with open('backend/app/services/bulk_import_service.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('Actualizado exitosamente')
