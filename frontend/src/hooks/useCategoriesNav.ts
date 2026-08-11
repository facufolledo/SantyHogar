import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export interface Category {
  id_categoria: string;
  nombre: string;
  slug: string;
  color?: string;
  icono?: string;
}

/**
 * Hook para obtener las categorías dinámicas desde el backend.
 * Usable en navbar, filtros, y en toda la app.
 */
export function useCategoriesNav() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isLogged } = useAuth();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        
        const response = await fetch(`${apiUrl}/api/categories`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Si es paginado, obtener los datos del array
        const categoriesData = Array.isArray(data) ? data : data.results || data.data || [];
        
        // Mapear datos del backend al formato del frontend
        const mappedCategories: Category[] = categoriesData.map((cat: any) => ({
          id_categoria: cat.id || cat.id_categoria || '',
          nombre: cat.name || cat.nombre || '',
          slug: cat.slug || '',
          color: cat.color,
          icono: cat.icon || cat.icono,
        }));
        
        setCategories(mappedCategories);
        setError(null);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar categorías');
        // Fallback a categorías vacías, no hardcodeadas
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [isLogged]);

  return { categories, loading, error };
}
