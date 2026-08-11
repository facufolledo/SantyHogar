#!/usr/bin/env python
"""Script para ejecutar el backend en desarrollo con SSL fix aplicado globalmente."""
import os
import sys
import ssl
import warnings

# Deshabilitar SSL verification en desarrollo
os.environ['PYTHONHTTPSVERIFY'] = '0'
os.environ['CURL_CA_BUNDLE'] = ''
os.environ['REQUESTS_CA_BUNDLE'] = ''

ssl._create_default_https_context = ssl._create_unverified_context

warnings.filterwarnings('ignore')

# Ahora sí importar uvicorn
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=False,
        log_level="info",
    )
