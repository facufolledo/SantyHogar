with open('backend/app/services/bulk_import_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Buscar y remover la validación hardcodeada
lines = content.split('\n')
new_lines = []
skip_until_else = False

for i, line in enumerate(lines):
    # Si encontramos la validacion de categoria hardcodeada
    if 'valid_categories = ("electrodomesticos"' in line:
        skip_until_else = True
        continue
    
    # Si estamos saltando y llegamos al else/siguiente, terminar salto
    if skip_until_else and (line.strip().startswith('else:') or (line.strip().startswith('# Si hay') and 'errors' in line)):
        skip_until_else = False
    
    # Si no estamos saltando, agregar la linea
    if not skip_until_else:
        new_lines.append(line)

content = '\n'.join(new_lines)

with open('backend/app/services/bulk_import_service.py', 'w', encoding='utf-8') as f:
    f.write(content)

print('Limpiado')
