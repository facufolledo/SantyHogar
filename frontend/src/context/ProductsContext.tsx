import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import type { Product } from '../data/products';
import { isApiConfigured } from '../api/config';
import { fetchProductsFromApi } from '../api/productsApi';

interface ProductsContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const ProductsContext = createContext<ProductsContextType | null>(null);

export const ProductsProvider = ({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isApiConfigured()) {
      console.warn('⚠️  [Context] API no configurada');
      setProducts([]);
      setError(
        'No hay API configurada. Agregá VITE_API_URL en frontend/.env (ej. http://localhost:8000) y reiniciá el servidor de Vite.'
      );
      setLoading(false);
      return;
    }
    console.log('🔄 [Context] Iniciando carga de productos...');
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProductsFromApi();
      console.log('📥 [Context] Datos recibidos:', data);
      console.log('📥 [Context] ¿Es array?:', Array.isArray(data));
      console.log('📥 [Context] Cantidad:', data.length);
      setProducts(data);
      console.log('✅ [Context] Productos seteados en state');
    } catch (e) {
      console.error('❌ [Context] Error:', e);
      setProducts([]);
      setError(
        e instanceof Error ? e.message : 'No se pudieron cargar los productos. ¿Está el backend en marcha?'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ProductsContext.Provider value={{ products, loading, error, refetch: load }}>
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error('useProducts must be used within ProductsProvider');
  return ctx;
};
