import { apiFetch } from './client';

export type OrderStatus = 'pending' | 'paid' | 'cancelled';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  productBrand: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderList {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: OrderStatus;
  itemCount: number;
  createdAt: string;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  userId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  total: number;
  paymentMethod: 'mp' | 'fiserv';
  status: OrderStatus;
  preferenceId: string | null;
  paymentId: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface CreateOrderRequest {
  userId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Array<{
    product_id: string;
    quantity: number;
  }>;
  paymentMethod: 'mp' | 'fiserv';
}

export interface CreateOrderResponse {
  id: string;
  orderNumber: string;
  init_point: string;
  status: OrderStatus;
  createdAt: string;
}

export async function fetchOrders(): Promise<OrderList[]> {
  return apiFetch<OrderList[]>('/orders', { method: 'GET' });
}

export async function fetchOrderDetail(orderId: string): Promise<OrderDetail> {
  return apiFetch<OrderDetail>(`/orders/${orderId}`, { method: 'GET' });
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<{ message: string; status: OrderStatus }> {
  return apiFetch(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function createOrderApi(orderData: CreateOrderRequest): Promise<CreateOrderResponse> {
  return apiFetch<CreateOrderResponse>('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
}
