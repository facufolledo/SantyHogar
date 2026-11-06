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

export const mockOrders: Order[] = [
  { id: '#001234', customer: 'María González', email: 'maria@email.com', date: '2024-01-15', status: 'delivered', total: 289999, items: 1, paymentMethod: 'Mercado Pago' },
  { id: '#001235', customer: 'Carlos Rodríguez', email: 'carlos@email.com', date: '2024-01-16', status: 'shipped', total: 459999, items: 2, paymentMethod: 'Fiserv' },
  { id: '#001236', customer: 'Ana Martínez', email: 'ana@email.com', date: '2024-01-17', status: 'processing', total: 89999, items: 1, paymentMethod: 'Mercado Pago' },
  { id: '#001237', customer: 'Luis Fernández', email: 'luis@email.com', date: '2024-01-18', status: 'pending', total: 329999, items: 1, paymentMethod: 'Fiserv' },
  { id: '#001238', customer: 'Sofía López', email: 'sofia@email.com', date: '2024-01-19', status: 'delivered', total: 249999, items: 3, paymentMethod: 'Mercado Pago' },
  { id: '#001239', customer: 'Diego Pérez', email: 'diego@email.com', date: '2024-01-20', status: 'cancelled', total: 189999, items: 1, paymentMethod: 'Fiserv' },
];

export const mockCustomers = [
  { id: '1', name: 'María González', email: 'maria@email.com', orders: 3, totalSpent: 789997, joined: '2023-06-10' },
  { id: '2', name: 'Carlos Rodríguez', email: 'carlos@email.com', orders: 5, totalSpent: 1459995, joined: '2023-04-22' },
  { id: '3', name: 'Ana Martínez', email: 'ana@email.com', orders: 1, totalSpent: 89999, joined: '2024-01-17' },
  { id: '4', name: 'Luis Fernández', email: 'luis@email.com', orders: 2, totalSpent: 619998, joined: '2023-09-05' },
  { id: '5', name: 'Sofía López', email: 'sofia@email.com', orders: 4, totalSpent: 999996, joined: '2023-07-14' },
];
