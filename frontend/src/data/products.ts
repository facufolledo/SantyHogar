export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;  // Dinámico: se carga desde BD (electrodomesticos, muebleria, colchoneria, etc)
  subcategory: string;
  price: number;
  originalPrice?: number;
  images: string[];
  description: string;
  specs: Record<string, string>;
  stock: number;
  featured: boolean;
  brand: string;
  rating: number;
  reviews: number;
}

/**
 * Metadatos de categorías por defecto (se sobrescriben con datos dinámicos del hook).
 * Mantener solo para fallback si la API falla.
 */
export const categoryDefinitions = [
  {
    id: 'electrodomesticos' as const,
    name: 'Electrodomésticos',
    image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&q=80',
  },
  {
    id: 'muebleria' as const,
    name: 'Mueblería',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80',
  },
  {
    id: 'colchoneria' as const,
    name: 'Colchonería',
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80',
  },
];

/**
 * NOTA: Esta función es legacy. Usar hook `useCategoriesNav()` en componentes
 * para obtener categorías dinámicas en tiempo real.
 */
export function buildCategoryCards(list: Product[]) {
  return categoryDefinitions.map(cat => ({
    ...cat,
    count: list.filter(p => p.category === cat.id).length,
  }));
}
