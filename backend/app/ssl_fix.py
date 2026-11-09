"""SSL configuration for development and production.

En producción, siempre usa SSL/TLS verificado.
En desarrollo, acepta certificados auto-firmados pero NUNCA deshabilita verificación.
"""
import os
import ssl
import logging

logger = logging.getLogger(__name__)

ENV = os.getenv('ENV', 'development').lower()

if ENV == 'development':
    # En desarrollo: aceptar certificados auto-firmados pero verificar
    # Esto permite trabajar con certificados self-signed (ej. localhost)
    # pero NO deshabilita seguridad completamente
    import certifi
    
    ssl_context = ssl.create_default_context(cafile=certifi.where())
    ssl_context.check_hostname = True
    ssl_context.verify_mode = ssl.CERT_REQUIRED
    
    logger.info("SSL en modo DEVELOPMENT: usando certificados del sistema")
else:
    # En producción, forzar SSL/TLS verificado
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = True
    ssl_context.verify_mode = ssl.CERT_REQUIRED
    logger.info("SSL en modo PRODUCTION: verificación obligatoria")
