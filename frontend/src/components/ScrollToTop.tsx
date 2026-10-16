import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Componente que hace scroll al top de la página cuando cambia la ruta.
 * Debe estar dentro del Router para tener acceso a useLocation.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll suave al top
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Cambiar a 'smooth' si querés animación
    });
  }, [pathname]);

  return null;
}
