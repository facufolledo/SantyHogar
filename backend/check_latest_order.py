import asyncio
from app.database.operations import DatabaseOperations

async def check_order():
    db = DatabaseOperations()
    orders = await db.get_all_orders()
    if orders:
        # Get the latest order (first one, should be sorted by fecha_creacion DESC)
        order = orders[0]
        print(f'Última orden:')
        print(f'  numero_orden: {order.get("numero_orden")}')
        print(f'  fecha_creacion (raw): {order.get("fecha_creacion")}')
        print(f'  Type: {type(order.get("fecha_creacion"))}')
        print(f'  total: {order.get("total")}')
    else:
        print('No hay órdenes')

asyncio.run(check_order())
