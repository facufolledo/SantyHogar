import { apiFetch } from './client';

export interface CustomerList {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  totalSpent: number;
  orderCount: number;
  registeredAt: string;
  active: boolean;
}

export interface CustomerDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  registeredAt: string;
  updatedAt: string;
  totalSpent: number;
  orderCount: number;
  notes: string | null;
  active: boolean;
}

export interface CreateCustomerRequest {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  notes?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  notes?: string;
  active?: boolean;
}

export async function fetchCustomers(): Promise<CustomerList[]> {
  return apiFetch<CustomerList[]>('/customers', { method: 'GET' });
}

export async function fetchCustomerDetail(customerId: string): Promise<CustomerDetail> {
  return apiFetch<CustomerDetail>(`/customers/${customerId}`, { method: 'GET' });
}

export async function createCustomer(customerData: CreateCustomerRequest): Promise<CustomerDetail> {
  return apiFetch<CustomerDetail>('/customers', {
    method: 'POST',
    body: JSON.stringify(customerData),
  });
}

export async function updateCustomer(
  customerId: string,
  customerData: UpdateCustomerRequest
): Promise<CustomerDetail> {
  return apiFetch<CustomerDetail>(`/customers/${customerId}`, {
    method: 'PATCH',
    body: JSON.stringify(customerData),
  });
}

export async function deleteCustomer(customerId: string): Promise<void> {
  await apiFetch(`/customers/${customerId}`, {
    method: 'DELETE',
  });
}

export async function fetchCustomerOrders(customerId: string): Promise<any[]> {
  return apiFetch<any[]>(`/customers/${customerId}/orders`, { method: 'GET' });
}

export async function updateCustomerStats(customerId: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/customers/${customerId}/update-stats`, {
    method: 'POST',
  });
}
