/**
 * Hook para gestionar categorías en el panel de admin
 * Obtiene categorías desde /api/categories
 */
import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";

export interface CategoryAdmin {
  id: string;
  id_categoria?: string;
  name: string;
  nombre?: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  icono?: string;
  imageUrl?: string;
  order?: number;
  orden?: number;
  active: boolean;
  activo?: boolean;
  productCount?: number;
}

interface UseCategoriesAdminReturn {
  categories: CategoryAdmin[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useCategoriesAdmin = (): UseCategoriesAdminReturn => {
  const [categories, setCategories] = useState<CategoryAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiFetch<any[]>("/api/categories");
      
      // Mapear respuesta del backend al formato esperado
      const mapped = Array.isArray(data) 
        ? data.map(cat => ({
            id: cat.id || cat.id_categoria || '',
            id_categoria: cat.id_categoria,
            name: cat.name || cat.nombre || '',
            nombre: cat.nombre,
            slug: cat.slug || '',
            description: cat.description || cat.descripcion,
            color: cat.color,
            icon: cat.icon || cat.icono,
            icono: cat.icono,
            imageUrl: cat.imageUrl,
            order: cat.order || cat.orden || 0,
            orden: cat.orden,
            active: cat.active !== false && cat.activo !== false,
            activo: cat.activo,
            productCount: 0, // El backend no lo devuelve por ahora
          }))
        : [];
      
      setCategories(mapped);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
      console.error("Error fetching admin categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  };
};

export default useCategoriesAdmin;
