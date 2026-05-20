"""Script para poblar la base de datos con productos desde el frontend."""
import asyncio
import json
import sys
from pathlib import Path
from uuid import uuid4

# Agregar el directorio backend al path para importar módulos
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.database.connection import get_supabase_client


# Productos del frontend (copiados de frontend/src/data/products.ts)
PRODUCTOS = [
    {
        "id": "1",
        "name": "Lavarropas Automático 8kg",
        "slug": "lavarropas-automatico-8kg",
        "category": "electrodomesticos",
        "subcategory": "Lavarropas",
        "price": 289999,
        "originalPrice": 349999,
        "images": [
            "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&q=80",
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
        ],
        "description": "Lavarropas automático de carga frontal con 8kg de capacidad, múltiples programas de lavado y tecnología de ahorro de energía.",
        "specs": {
            "Capacidad": "8 kg",
            "Velocidad centrifugado": "1200 RPM",
            "Programas": "15",
            "Consumo": "A+++",
            "Color": "Blanco"
        },
        "stock": 12,
        "featured": True,
        "brand": "Drean",
        "rating": 4.5,
        "reviews": 128,
    },
    {
        "id": "2",
        "name": "Heladera No Frost 400L",
        "slug": "heladera-no-frost-400l",
        "category": "electrodomesticos",
        "subcategory": "Heladeras",
        "price": 459999,
        "originalPrice": 520000,
        "images": [
            "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600&q=80",
            "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600&q=80",
        ],
        "description": "Heladera con freezer No Frost de 400 litros. Tecnología inverter para mayor eficiencia energética y menor ruido.",
        "specs": {
            "Capacidad": "400 L",
            "Tipo": "No Frost",
            "Freezer": "120 L",
            "Consumo": "A+",
            "Color": "Acero inoxidable"
        },
        "stock": 8,
        "featured": True,
        "brand": "Whirlpool",
        "rating": 4.7,
        "reviews": 95,
    },
    {
        "id": "3",
        "name": "Microondas Digital 28L",
        "slug": "microondas-digital-28l",
        "category": "electrodomesticos",
        "subcategory": "Microondas",
        "price": 89999,
        "originalPrice": None,
        "images": [
            "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80",
        ],
        "description": "Microondas digital con grill, 28 litros de capacidad y panel táctil. Ideal para el hogar moderno.",
        "specs": {
            "Capacidad": "28 L",
            "Potencia": "900 W",
            "Funciones": "Microondas + Grill",
            "Panel": "Táctil",
            "Color": "Negro"
        },
        "stock": 20,
        "featured": False,
        "brand": "Samsung",
        "rating": 4.3,
        "reviews": 67,
    },
    {
        "id": "4",
        "name": "Aire Acondicionado Split 3000 FC",
        "slug": "aire-acondicionado-split-3000",
        "category": "electrodomesticos",
        "subcategory": "Climatización",
        "price": 379999,
        "originalPrice": 420000,
        "images": [
            "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80",
        ],
        "description": "Aire acondicionado split frío/calor 3000 frigorías con tecnología inverter y control WiFi.",
        "specs": {
            "Capacidad": "3000 FC",
            "Tipo": "Split Inverter",
            "WiFi": "Sí",
            "Consumo": "A++",
            "Color": "Blanco"
        },
        "stock": 5,
        "featured": True,
        "brand": "Carrier",
        "rating": 4.6,
        "reviews": 210,
    },
    {
        "id": "5",
        "name": "Cocina 4 Hornallas con Horno",
        "slug": "cocina-4-hornallas-horno",
        "category": "electrodomesticos",
        "subcategory": "Cocinas",
        "price": 199999,
        "originalPrice": None,
        "images": [
            "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80",
        ],
        "description": "Cocina a gas con 4 hornallas y horno con grill. Encendido eléctrico y parrilla desmontable.",
        "specs": {
            "Hornallas": "4",
            "Horno": "Con grill",
            "Encendido": "Eléctrico",
            "Material": "Acero esmaltado",
            "Color": "Blanco"
        },
        "stock": 15,
        "featured": False,
        "brand": "Longvie",
        "rating": 4.4,
        "reviews": 88,
    },
    {
        "id": "6",
        "name": "Smart TV 55\" 4K UHD",
        "slug": "smart-tv-55-4k",
        "category": "electrodomesticos",
        "subcategory": "Televisores",
        "price": 549999,
        "originalPrice": 649999,
        "images": [
            "https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=600&q=80",
        ],
        "description": "Smart TV 55 pulgadas con resolución 4K UHD, HDR10 y sistema operativo Android TV. Incluye control de voz.",
        "specs": {
            "Pantalla": "55\"",
            "Resolución": "4K UHD",
            "Sistema": "Android TV",
            "HDR": "HDR10",
            "Conectividad": "WiFi + Bluetooth"
        },
        "stock": 7,
        "featured": True,
        "brand": "LG",
        "rating": 4.8,
        "reviews": 312,
    },
    {
        "id": "7",
        "name": "Sillón 3 Cuerpos Premium",
        "slug": "sillon-3-cuerpos-premium",
        "category": "muebleria",
        "subcategory": "Sillones",
        "price": 329999,
        "originalPrice": 389999,
        "images": [
            "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80",
            "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&q=80",
        ],
        "description": "Sillón de 3 cuerpos tapizado en tela premium con estructura de madera maciza. Cómodo y duradero.",
        "specs": {
            "Cuerpos": "3",
            "Material": "Tela premium",
            "Estructura": "Madera maciza",
            "Medidas": "220x90x85 cm",
            "Color": "Gris"
        },
        "stock": 6,
        "featured": True,
        "brand": "Rosen",
        "rating": 4.6,
        "reviews": 54,
    },
    {
        "id": "8",
        "name": "Mesa de Comedor 6 Personas",
        "slug": "mesa-comedor-6-personas",
        "category": "muebleria",
        "subcategory": "Mesas",
        "price": 189999,
        "originalPrice": None,
        "images": [
            "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&q=80",
        ],
        "description": "Mesa de comedor rectangular para 6 personas en madera de roble con acabado natural.",
        "specs": {
            "Material": "Roble",
            "Medidas": "160x90 cm",
            "Capacidad": "6 personas",
            "Acabado": "Natural",
            "Patas": "Metal negro"
        },
        "stock": 4,
        "featured": False,
        "brand": "Piero",
        "rating": 4.5,
        "reviews": 32,
    },
    {
        "id": "9",
        "name": "Rack TV con Estantes",
        "slug": "rack-tv-estantes",
        "category": "muebleria",
        "subcategory": "Racks",
        "price": 129999,
        "originalPrice": None,
        "images": [
            "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80",
        ],
        "description": "Rack para TV con estantes flotantes y cajones. Diseño moderno en melamina blanca con detalles en madera.",
        "specs": {
            "Material": "Melamina",
            "Medidas": "180x45x50 cm",
            "Cajones": "2",
            "Estantes": "3",
            "Color": "Blanco/Madera"
        },
        "stock": 10,
        "featured": False,
        "brand": "Piero",
        "rating": 4.2,
        "reviews": 41,
    },
    {
        "id": "10",
        "name": "Placard 3 Puertas Corredizas",
        "slug": "placard-3-puertas-corredizas",
        "category": "muebleria",
        "subcategory": "Placards",
        "price": 279999,
        "originalPrice": 320000,
        "images": [
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
        ],
        "description": "Placard de 3 puertas corredizas con espejo central. Interior con cajones y barral para ropa.",
        "specs": {
            "Puertas": "3 corredizas",
            "Espejo": "Central",
            "Medidas": "180x60x200 cm",
            "Interior": "Cajones + barral",
            "Color": "Blanco"
        },
        "stock": 3,
        "featured": True,
        "brand": "Rosen",
        "rating": 4.7,
        "reviews": 28,
    },
    {
        "id": "11",
        "name": "Colchón Resortes 2 Plazas Premium",
        "slug": "colchon-resortes-2-plazas",
        "category": "colchoneria",
        "subcategory": "Colchones",
        "price": 249999,
        "originalPrice": 299999,
        "images": [
            "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80",
            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80",
        ],
        "description": "Colchón de resortes ensacados 2 plazas con espuma viscoelástica y tela pillow top. Máximo confort.",
        "specs": {
            "Medidas": "140x190 cm",
            "Tipo": "Resortes ensacados",
            "Altura": "28 cm",
            "Tela": "Pillow top",
            "Garantía": "5 años"
        },
        "stock": 9,
        "featured": True,
        "brand": "Piero",
        "rating": 4.8,
        "reviews": 176,
    },
    {
        "id": "12",
        "name": "Sommier + Colchón 2.5 Plazas",
        "slug": "sommier-colchon-2-5-plazas",
        "category": "colchoneria",
        "subcategory": "Sommiers",
        "price": 389999,
        "originalPrice": None,
        "images": [
            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80",
        ],
        "description": "Conjunto sommier y colchón 2.5 plazas con base tapizada y patas de madera. Incluye almohadas de regalo.",
        "specs": {
            "Medidas": "160x200 cm",
            "Base": "Tapizada",
            "Patas": "Madera",
            "Incluye": "2 almohadas",
            "Garantía": "3 años"
        },
        "stock": 5,
        "featured": True,
        "brand": "Cannon",
        "rating": 4.6,
        "reviews": 89,
    },
    {
        "id": "13",
        "name": "Almohada Viscoelástica",
        "slug": "almohada-viscoelastica",
        "category": "colchoneria",
        "subcategory": "Almohadas",
        "price": 29999,
        "originalPrice": None,
        "images": [
            "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80",
        ],
        "description": "Almohada de espuma viscoelástica con funda de algodón. Se adapta a la forma del cuello para mayor descanso.",
        "specs": {
            "Material": "Viscoelástica",
            "Medidas": "70x40 cm",
            "Funda": "Algodón 100%",
            "Lavable": "Sí",
            "Altura": "12 cm"
        },
        "stock": 30,
        "featured": False,
        "brand": "Cannon",
        "rating": 4.4,
        "reviews": 203,
    },
]


def map_product_to_db(product: dict) -> dict:
    """Mapea un producto del frontend al formato de la base de datos."""
    # Generar UUID basado en el ID del frontend para mantener consistencia
    # o usar el ID directamente si ya es UUID
    product_id = product["id"]
    
    return {
        "id_producto": product_id,
        "nombre": product["name"],
        "slug": product["slug"],
        "categoria": product["category"],
        "subcategoria": product["subcategory"],
        "precio": product["price"],
        "precio_original": product.get("originalPrice"),
        "imagenes": json.dumps(product["images"]),
        "descripcion": product["description"],
        "especificaciones": json.dumps(product["specs"]),
        "stock": product["stock"],
        "destacado": product["featured"],
        "marca": product["brand"],
        "calificacion": product["rating"],
        "cantidad_resenas": product["reviews"],
    }


async def populate_products():
    """Pobla la base de datos con productos."""
    client = get_supabase_client()
    
    print("🚀 Iniciando población de productos...")
    print(f"📦 Total de productos a insertar: {len(PRODUCTOS)}")
    
    inserted = 0
    updated = 0
    errors = 0
    
    for product in PRODUCTOS:
        try:
            db_product = map_product_to_db(product)
            product_id = db_product["id_producto"]
            
            # Verificar si el producto ya existe
            existing = client.table("productos").select("id_producto").eq("id_producto", product_id).execute()
            
            if existing.data:
                # Actualizar producto existente
                client.table("productos").update(db_product).eq("id_producto", product_id).execute()
                print(f"✏️  Actualizado: {product['name']} (ID: {product_id})")
                updated += 1
            else:
                # Insertar nuevo producto
                client.table("productos").insert(db_product).execute()
                print(f"✅ Insertado: {product['name']} (ID: {product_id})")
                inserted += 1
                
        except Exception as e:
            print(f"❌ Error con {product['name']}: {e}")
            errors += 1
    
    print("\n" + "="*50)
    print(f"✅ Productos insertados: {inserted}")
    print(f"✏️  Productos actualizados: {updated}")
    print(f"❌ Errores: {errors}")
    print(f"📊 Total procesados: {inserted + updated + errors}/{len(PRODUCTOS)}")
    print("="*50)


if __name__ == "__main__":
    asyncio.run(populate_products())
