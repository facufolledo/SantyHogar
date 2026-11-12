import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook que scrollea hacia arriba cuando cambia la ruta
 */
export const useScrollTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
};
