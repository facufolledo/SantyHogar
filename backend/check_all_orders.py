import asyncio
from app.database.operations import DatabaseOperations

async def check_all():
    db = DatabaseOperations()
    orders = await db.get_all_orders()
    print(f'Total órdenes: {len(orders)}\n')
    
    # Show all orders
    for i, order in enumerate(orders):
        print(f'Orden {i+1}:')
        print(f'  numero_orden: {order.get("numero_orden")}')
        print(f'  fecha_creacion: {order.get("fecha_creacion")}')
        print()

asyncio.run(check_all())
