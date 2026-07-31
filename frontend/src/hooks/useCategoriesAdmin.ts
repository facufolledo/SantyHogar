/**
 * Hook para gestionar categorías en el panel de admin
 * Obtiene categorías CON conteo de productos desde /api/categories/admin/list
 */
import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";

export interface CategoryAdmin {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  imageUrl?: string;
  order: number;
  active: boolean;
  productCount: number;
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

      const data = await apiFetch<CategoryAdmin[]>("/api/categories/admin/list");
      setCategories(Array.isArray(data) ? data : []);
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
