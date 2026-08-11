export interface Order {
  id: string;
  customer: string;
  email: string;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  items: number;
  paymentMethod: string;
}
