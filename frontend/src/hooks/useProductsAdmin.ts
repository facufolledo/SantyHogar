/**
 * Hook para cargar TODOS los productos en el panel admin
 * Incluye productos con stock=0 y precio=0 para poder asignarles valores
 */
import { useCallback, useEffect, useState } from 'react';
import type { Product } from '../data/products';
import { isApiConfigured } from '../api/config';
import { fetchAllProductsForAdmin } from '../api/productsApi';

interface UseProductsAdminReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useProductsAdmin = (): UseProductsAdminReturn => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isApiConfigured()) {
      setProducts([]);
      setError(
        'No hay API configurada. Agregá VITE_API_URL en frontend/.env'
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchAllProductsForAdmin();
      setProducts(data);
    } catch (e) {
      setProducts([]);
      setError(
        e instanceof Error ? e.message : 'Error al cargar productos'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    products,
    loading,
    error,
    refetch: load,
  };
};

export default useProductsAdmin;
