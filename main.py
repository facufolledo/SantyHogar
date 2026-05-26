"""
Archivo de entrada para Railway.
Redirige al backend FastAPI.
"""
import sys
import os

# Agregar el directorio backend al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Importar la app de FastAPI
from app.main import app

# Railway ejecutará: uvicorn main:app
__all__ = ['app']
