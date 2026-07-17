#!/usr/bin/env python
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

import asyncio
from app.database.operations import DatabaseOperations

async def main():
    db = DatabaseOperations()
    all_products = await db.get_all_products()
    
    # Buscar Okey Blanca
    okey = [p for p in all_products if 'okey' in p.get('nombre', '').lower()]
    
    if okey:
        p = okey[0]
        print(f"Producto: {p.get('nombre')}")
        print(f"ID: {p.get('id_producto')}")
        print(f"Descripcion guardada: {repr(p.get('descripcion'))}")
        print(f"Descripcion length: {len(p.get('descripcion', ''))}")
    else:
        print("No se encontro Okey")

asyncio.run(main())
