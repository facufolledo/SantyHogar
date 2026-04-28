import type { Product } from '../data/products';
import { apiFetch } from './client';
import { getApiBase } from './config';

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

export interface BulkImportResponse {
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  imported_count: number;
  validations: Array<{
    row_number: number;
    valid: boolean;
    data?: {
      nombre: string;
      precio: number;
      stock: number;
      categoria: string;
      subcategoria: string;
      marca: string;
    };
    errors: string[];
  }>;
  message: string;
}

export async function bulkImportProducts(file: File): Promise<BulkImportResponse> {
  const base = getApiBase();
  if (!base) {
    throw new Error('VITE_API_URL no está configurada');
  }
  const formData = new FormData();
  formData.append('file', file);

  const root = base.replace(/\/$/, '');
  const url = `${root}/products/bulk-import`;

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Error desconocido' }));
    throw new Error(error.detail || 'Error al importar productos');
  }

  return response.json();
}

export interface UpdatePriceRequest {
  price: number;
  original_price?: number;
}

export interface UpdatePriceResponse {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  message: string;
}

export async function updateProductPrice(
  productId: string,
  priceData: UpdatePriceRequest
): Promise<UpdatePriceResponse> {
  // Ruta estable: el id va en el JSON (evita 404 si algo en :8000 no enruta bien `/products/{uuid}/price`).
  return apiFetch<UpdatePriceResponse>('/catalog/update-price', {
    method: 'POST',
    body: JSON.stringify({
      product_id: productId,
      price: priceData.price,
      ...(priceData.original_price != null && priceData.original_price !== undefined
        ? { original_price: priceData.original_price }
        : {}),
    }),
  });
}

export interface CreateProductRequest {
  name: string;
  category: 'electrodomesticos' | 'muebleria' | 'colchoneria';
  subcategory: string;
  price: number;
  originalPrice?: number;
  stock: number;
  brand: string;
  description?: string;
  images?: string[];
  specs?: Record<string, string>;
  featured?: boolean;
}

export interface UpdateProductRequest {
  name?: string;
  category?: 'electrodomesticos' | 'muebleria' | 'colchoneria';
  subcategory?: string;
  price?: number;
  originalPrice?: number;
  stock?: number;
  brand?: string;
  description?: string;
  images?: string[];
  specs?: Record<string, string>;
  featured?: boolean;
}

export async function createProduct(
  productData: CreateProductRequest
): Promise<Product> {
  const response = await apiFetch<ProductDto>('/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  });
  return normalizeProduct(response);
}

export async function updateProduct(
  productId: string,
  productData: UpdateProductRequest
): Promise<Product> {
  const response = await apiFetch<ProductDto>(`/products/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify(productData),
  });
  return normalizeProduct(response);
}

export async function deleteProduct(productId: string): Promise<void> {
  await apiFetch(`/products/${productId}`, {
    method: 'DELETE',
  });
}
