"""SSL fix para desarrollo en Windows.

DEBE importarse ANTES que cualquier otro módulo que use SSL/HTTPS.
"""
import os
import ssl
import warnings

# Solo aplicar en desarrollo
if os.getenv('DEBUG', 'false').lower() == 'true':
    # Deshabilitar verificación SSL completamente
    os.environ['PYTHONHTTPSVERIFY'] = '0'
    os.environ['CURL_CA_BUNDLE'] = ''
    os.environ['REQUESTS_CA_BUNDLE'] = ''
    
    # Patch SSL context
    ssl._create_default_https_context = ssl._create_unverified_context
    
    # Suprimir warnings
    warnings.filterwarnings('ignore')
    
    # Patch requests Session
    try:
        import requests
        from requests.adapters import HTTPAdapter
        import urllib3
        
        urllib3.disable_warnings()
        
        class NoVerifyHTTPAdapter(HTTPAdapter):
            def init_poolmanager(self, *args, **kwargs):
                import ssl
                kwargs['cert_reqs'] = ssl.CERT_NONE
                kwargs['assert_hostname'] = False
                kwargs['check_hostname'] = False
                return super().init_poolmanager(*args, **kwargs)
        
        # Monkey patch Session
        _original_init = requests.Session.__init__
        def _patched_init(self, *args, **kwargs):
            _original_init(self, *args, **kwargs)
            self.verify = False
            self.mount('https://', NoVerifyHTTPAdapter())
        
        requests.Session.__init__ = _patched_init
    except ImportError:
        pass
