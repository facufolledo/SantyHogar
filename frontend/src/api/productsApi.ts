import type { Product } from '../data/products';
import { apiFetch } from './client';
import { getApiBase } from './config';

type ProductDto = Product;

type PaginatedProductsResponse = {
  data?: ProductDto[];
  results?: ProductDto[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

function extractProductList(response: unknown): ProductDto[] {
  if (Array.isArray(response)) return response;
  if (response && typeof response === 'object') {
    const r = response as PaginatedProductsResponse;
    if (Array.isArray(r.data)) return r.data;
    if (Array.isArray(r.results)) return r.results;
  }
  return [];
}

function normalizeProduct(p: ProductDto): Product {
  const images = Array.isArray(p.images) ? p.images : [];
  const specs =
    p.specs && typeof p.specs === 'object' && !Array.isArray(p.specs)
      ? (p.specs as Record<string, string>)
      : {};

  return {
    ...p,
    id: String(p.id),
    price: Number(p.price),
    originalPrice: p.originalPrice != null ? Number(p.originalPrice) : undefined,
    rating: Number(p.rating),
    reviews: Number(p.reviews),
    stock: Number(p.stock),
    images,
    specs,
  };
}

export async function fetchProductsFromApi(): Promise<Product[]> {
  const all: Product[] = [];
  let page = 1;
  const limit = 100;

  while (true) {
    const response = await apiFetch<PaginatedProductsResponse | ProductDto[]>(
      `/products?page=${page}&limit=${limit}`,
      { method: 'GET' }
    );

    const batch = extractProductList(response);
    if (batch.length === 0 && page === 1) {
      console.error('Unexpected response format from /products:', response);
      break;
    }

    all.push(...batch.map(normalizeProduct));

    if (Array.isArray(response)) break;

    const pagination = (response as PaginatedProductsResponse).pagination;
    if (!pagination?.hasNext || page >= (pagination.pages || 1)) break;
    page += 1;
  }

  return all;
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
      descripcion?: string;
      imagen?: string | null;
    };
    errors: string[];
  }>;
  message: string;
}

export interface BulkImportPreviewResponse {
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
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
      descripcion?: string;
      imagen?: string | null;
    };
    errors: string[];
  }>;
}

export interface BulkImportConfirmRow {
  nombre: string;
  precio: number;
  stock: number;
  categoria: string;
  subcategoria?: string;
  marca?: string;
  descripcion?: string;
  imagen?: string | null;
}

export async function bulkImportPreview(file: File): Promise<BulkImportPreviewResponse> {
  const base = getApiBase();
  if (!base) {
    throw new Error('VITE_API_URL no estâ”œÃ­ configurada');
  }
  const formData = new FormData();
  formData.append('file', file);

  const root = base.replace(/\/$/, '');
  const url = `${root}/products/bulk-import/preview`;

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Error desconocido' }));
    throw new Error(error.detail || 'Error al procesar el archivo');
  }

  return response.json();
}

export async function bulkImportConfirm(rows: BulkImportConfirmRow[]): Promise<BulkImportResponse> {
  const base = getApiBase();
  if (!base) {
    throw new Error('VITE_API_URL no estâ”œÃ­ configurada');
  }

  const root = base.replace(/\/$/, '');
  const url = `${root}/products/bulk-import/confirm`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Error desconocido' }));
    throw new Error(error.detail || 'Error al importar productos');
  }

  return response.json();
}

export async function bulkImportProducts(file: File): Promise<BulkImportResponse> {
  const base = getApiBase();
  if (!base) {
    throw new Error('VITE_API_URL no estâ”œÃ­ configurada');
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

export interface ImageUploadResponse {
  url: string;
  filename: string;
}

export async function uploadProductImage(file: File): Promise<ImageUploadResponse> {
  const base = getApiBase();
  if (!base) {
    throw new Error('VITE_API_URL no estâ”œÃ­ configurada');
  }
  const formData = new FormData();
  formData.append('file', file);

  const root = base.replace(/\/$/, '');
  const url = `${root}/products/upload-image`;

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Error desconocido' }));
    throw new Error(error.detail || 'Error al subir imagen');
  }

  return response.json();
}
