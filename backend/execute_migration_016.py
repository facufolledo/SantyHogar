#!/usr/bin/env python3
"""
Ejecutar migración 016: Actualizar CHECK constraint para estados de orden.
"""

print("=" * 70)
print("📝 MIGRACIÓN 016: Actualizar CHECK constraint de ordenes")
print("=" * 70)

sql = """
-- Fix: Actualizar CHECK constraint de la tabla ordenes para permitir nuevos estados
ALTER TABLE ordenes 
DROP CONSTRAINT IF EXISTS ordenes_estado_check;

ALTER TABLE ordenes 
ADD CONSTRAINT ordenes_estado_check 
CHECK (estado IN ('pending', 'pendiente_pago', 'pagada', 'processing', 'ready', 'delivered', 'cancelled'));
"""

print("\n📋 SQL a ejecutar:\n")
print(sql)

print("\n" + "=" * 70)
print("⚠️  INSTRUCCIONES:")
print("=" * 70)
print("""
1. Abre Supabase Dashboard → SQL Editor
2. Copia y pega el SQL arriba
3. Ejecuta (Ctrl+Enter)
4. Listo

Si ves error "constraint does not exist", es normal (significa que ya fue eliminado antes).
El importante es que el nuevo constraint quede creado.
""")
print("=" * 70)
