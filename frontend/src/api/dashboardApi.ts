import { apiFetch } from './client';

export interface DashboardStats {
  sales_day: number;
  sales_week: number;
  sales_month: number;
  order_count: number;
  order_count_paid: number;
  order_count_pending: number;
  avg_ticket: number;
  active_products: number;
  low_stock_products: number;
  new_customers_month: number;
}

export interface SalesChartPoint {
  date: string;
  total: number;
}

export interface TopProduct {
  name: string;
  quantity_sold: number;
  total_revenue: number;
}

export interface TopCustomer {
  name: string;
  email: string;
  total_spent: number;
  order_count: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>('/dashboard/stats', { method: 'GET' });
}

export async function fetchSalesChart(): Promise<SalesChartPoint[]> {
  return apiFetch<SalesChartPoint[]>('/dashboard/sales-chart', { method: 'GET' });
}

export async function fetchTopProducts(): Promise<TopProduct[]> {
  return apiFetch<TopProduct[]>('/dashboard/top-products', { method: 'GET' });
}

export async function fetchTopCustomers(): Promise<TopCustomer[]> {
  return apiFetch<TopCustomer[]>('/dashboard/top-customers', { method: 'GET' });
}
