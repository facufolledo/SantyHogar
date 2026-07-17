# Agregar parseo de especificaciones en _parse_standard_format
with open('backend/app/services/bulk_import_service.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Buscar la línea donde se extrae "descripcion"
for i, line in enumerate(lines):
    if 'descripcion = _get_cell_value(row_data, column_mapping.get("descripcion"))' in line:
        # Insertar la línea de especificaciones después
        insert_line = i + 1
        spec_line = '        especificaciones_raw = _get_cell_value(row_data, column_mapping.get("especificaciones"))\n'
        lines.insert(insert_line, spec_line)
        
        # Ahora buscar la llamada a _validate_xlsx_row y agregar especificaciones_raw
        for j in range(insert_line, min(insert_line + 20, len(lines))):
            if 'validation = _validate_xlsx_row(' in lines[j]:
                # Encontrar el cierre de la llamada
                for k in range(j, min(j + 20, len(lines))):
                    if 'descripcion=descripcion,' in lines[k]:
                        # Agregar la línea de especificaciones_raw después
                        lines[k] = lines[k].rstrip() + '\n            especificaciones_raw=especificaciones_raw,\n'
                        break
                break
        break

with open('backend/app/services/bulk_import_service.py', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('Agregado parseo de especificaciones')
