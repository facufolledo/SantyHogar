/**
 * API client for MercadoPago Checkout
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface CheckoutItem {
  product_id: string;
  quantity: number;
}

export interface CheckoutRequest {
  items: CheckoutItem[];
  customer_email: string;
  customer_name: string;
  customer_phone: string;
}

export interface CheckoutResponse {
  preference_id: string;
  init_point: string;
  sandbox_init_point: string;
  external_reference: string;
  order_id: string;
  order_number: string;
}

export async function createCheckoutPreference(
  data: CheckoutRequest
): Promise<CheckoutResponse> {
  const response = await fetch(`${API_URL}/api/checkout/create-preference`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Error desconocido' }));
    throw new Error(error.detail || 'Error al crear preferencia de pago');
  }

  return response.json();
}
