import asyncio
from app.database.operations import DatabaseOperations

async def check_trigger():
    db = DatabaseOperations()
    orders = await db.get_all_orders()
    if orders:
        # Get the latest 2 orders
        for i, order in enumerate(orders[:2]):
            print(f'\nOrden {i+1}:')
            print(f'  numero_orden: {order.get("numero_orden")}')
            print(f'  fecha_creacion: {order.get("fecha_creacion")}')
    else:
        print('No hay órdenes')

asyncio.run(check_trigger())
