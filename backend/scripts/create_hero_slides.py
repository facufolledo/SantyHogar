#!/usr/bin/env python3
"""
Script para crear hero slides automáticamente para las categorías principales.
Crea 3 heroes para: Electrodomésticos, Mueblería y Colchonería
"""
import os
import sys
import requests
from datetime import datetime

# Agregar el directorio del backend al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

API_URL = "http://localhost:8000"

# Datos de los heroes a crear
HEROES_DATA = [
    {
        "titulo": "Electrodomésticos Inteligentes",
        "subtitulo": "Equipos de última tecnología para tu hogar",
        "textoCta": "Ver Electrodomésticos",
        "imagenUrl": "https://images.unsplash.com/photo-1584622674905-ad4ce319b835?w=1200&h=600&fit=crop",
        "enlace": "/tienda?category=electrodomesticos",
        "orden": 1,
        "activo": True
    },
    {
        "titulo": "Muebles de Calidad Premium",
        "subtitulo": "Diseño y confort para todos tus ambientes",
        "textoCta": "Explorar Mueblería",
        "imagenUrl": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&h=600&fit=crop",
        "enlace": "/tienda?category=muebleria",
        "orden": 2,
        "activo": True
    },
    {
        "titulo": "Descanso Garantizado",
        "subtitulo": "Colchones y sommiers para dormir mejor",
        "textoCta": "Ver Colchonería",
        "imagenUrl": "https://images.unsplash.com/photo-1540932239986-310128078cac?w=1200&h=600&fit=crop",
        "enlace": "/tienda?category=colchoneria",
        "orden": 3,
        "activo": True
    }
]

def get_csrf_token(session):
    """Obtiene el token CSRF de la API."""
    try:
        response = session.get(f"{API_URL}/api/health", timeout=10)
        csrf_token = response.headers.get("X-CSRF-Token") or "dummy-token-for-script"
        return csrf_token
    except Exception as e:
        print(f"⚠️ No se pudo obtener token CSRF automáticamente: {str(e)}")
        return "dummy-token-for-script"

def create_hero(session, hero_data, csrf_token):
    """Crea un hero slide en la API."""
    try:
        headers = {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrf_token
        }
        
        response = session.post(
            f"{API_URL}/api/hero-slides",
            json=hero_data,
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 201:
            data = response.json()
            print(f"✅ Hero creado: {hero_data['titulo']}")
            print(f"   ID: {data.get('id')}")
            return True
        else:
            print(f"❌ Error creando hero '{hero_data['titulo']}':")
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Exception creando hero '{hero_data['titulo']}': {str(e)}")
        return False

def main():
    print("=" * 60)
    print("🚀 Creando Hero Slides")
    print("=" * 60)
    
    session = requests.Session()
    csrf_token = get_csrf_token(session)
    
    created = 0
    total = len(HEROES_DATA)
    
    for hero in HEROES_DATA:
        if create_hero(session, hero, csrf_token):
            created += 1
    
    print()
    print("=" * 60)
    print(f"✅ Resumen: {created}/{total} heroes creados exitosamente")
    print("=" * 60)

if __name__ == "__main__":
    main()
