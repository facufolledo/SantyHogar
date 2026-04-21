import { apiFetch } from './client';

export interface CreateOrderPayload {
  userId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: { product_id: string; quantity: number }[];
  paymentMethod: 'mp' | 'fiserv';
}

export interface CreateOrderResponse {
  id: string;
  orderNumber: string;
  init_point: string;
  status: string;
  createdAt: string;
}

export async function createOrderApi(
  payload: CreateOrderPayload
): Promise<CreateOrderResponse> {
  return apiFetch<CreateOrderResponse>('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
