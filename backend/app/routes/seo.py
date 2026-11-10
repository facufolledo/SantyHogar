"""Rutas SEO: sitemap dinámico de productos."""
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from datetime import datetime
from app.database.connection import get_supabase_client
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["seo"])


@router.get("/sitemap-products.xml", tags=["seo"])
async def get_products_sitemap():
    """
    Genera un sitemap XML dinámico con todos los productos visibles.
    
    Sirve en: https://santyhogar.com.ar/api/sitemap-products.xml
    o directamente en /sitemap-products.xml si se configura en frontend
    """
    try:
        client = get_supabase_client()
        
        # Obtener todos los productos visibles
        response = client.table("productos").select(
            "id_producto,nombre,slug,fecha_actualizacion"
        ).eq("visible", True).execute()
        
        products = response.data or []
        
        # Construir XML del sitemap
        xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
        xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        
        for product in products:
            product_slug = product.get("slug") or product.get("id_producto", "")
            last_mod = product.get("fecha_actualizacion", datetime.utcnow().isoformat())[:10]
            
            xml_content += f"""  <url>
    <loc>https://santyhogar.com.ar/producto/{product_slug}</loc>
    <lastmod>{last_mod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
"""
        
        xml_content += '</urlset>'
        
        return Response(
            content=xml_content,
            media_type="application/xml",
            headers={"Cache-Control": "public, max-age=604800"}  # Cache 7 días
        )
        
    except Exception as e:
        logger.error(f"Error generando sitemap de productos: {e}")
        raise HTTPException(status_code=500, detail="Error generando sitemap")


@router.get("/robots.txt", tags=["seo"])
async def get_robots():
    """
    Sirve robots.txt dinámicamente (como respaldo si no está en static).
    """
    content = """# Robots.txt para SantyHogar
User-agent: *
Allow: /

Disallow: /admin/
Disallow: /account/
Disallow: /checkout/
Disallow: /orders/

Sitemap: https://santyhogar.com.ar/sitemap.xml
Sitemap: https://santyhogar.com.ar/api/sitemap-products.xml
"""
    
    return Response(
        content=content,
        media_type="text/plain",
        headers={"Cache-Control": "public, max-age=86400"}  # Cache 1 día
    )
