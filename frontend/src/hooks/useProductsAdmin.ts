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
      console.warn('⚠️  [AdminProducts] API no configurada');
      setProducts([]);
      setError(
        'No hay API configurada. Agregá VITE_API_URL en frontend/.env'
      );
      setLoading(false);
      return;
    }

    console.log('🔄 [AdminProducts] Cargando todos los productos (sin filtros)...');
    setLoading(true);
    setError(null);

    try {
      const data = await fetchAllProductsForAdmin();
      console.log('📥 [AdminProducts] Productos cargados:', data.length);
      console.log('   - Con precio=0:', data.filter(p => p.price === 0).length);
      console.log('   - Con stock=0:', data.filter(p => p.stock === 0).length);
      setProducts(data);
    } catch (e) {
      console.error('❌ [AdminProducts] Error:', e);
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
