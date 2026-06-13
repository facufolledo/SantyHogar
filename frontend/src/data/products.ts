export interface Product {
  id: string;
  name: string;
  slug: string;
  category: 'electrodomesticos' | 'muebleria' | 'colchoneria';
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

/** Metadatos de categorías (imagen / nombre); el conteo se calcula con la lista cargada desde la API. */
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

export function buildCategoryCards(list: Product[]) {
  return categoryDefinitions.map(cat => ({
    ...cat,
    count: list.filter(p => p.category === cat.id).length,
  }));
}
