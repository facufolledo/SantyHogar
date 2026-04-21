import type { Product } from '../data/products';
import { apiFetch } from './client';

type ProductDto = Product;

function normalizeProduct(p: ProductDto): Product {
  return {
    ...p,
    id: String(p.id),
    price: Number(p.price),
    originalPrice: p.originalPrice != null ? Number(p.originalPrice) : undefined,
    rating: Number(p.rating),
    reviews: Number(p.reviews),
    stock: Number(p.stock),
  };
}

export async function fetchProductsFromApi(): Promise<Product[]> {
  const raw = await apiFetch<ProductDto[]>('/products', { method: 'GET' });
  return raw.map(normalizeProduct);
}
