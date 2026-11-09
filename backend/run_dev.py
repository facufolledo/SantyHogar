#!/usr/bin/env python
"""Script para ejecutar el backend en desarrollo."""
import os
import sys

# Asegurar que estamos en modo desarrollo
os.environ['ENV'] = os.getenv('ENV', 'development')

# Importar uvicorn
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=False,
        log_level="info",
    )
