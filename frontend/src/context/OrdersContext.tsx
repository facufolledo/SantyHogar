import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CartItem } from './CartContext';

export type OrderStatus = 'pending' | 'processing' | 'ready' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: CartItem[];
  total: number;
  paymentMethod: 'mp' | 'fiserv';
  status: OrderStatus;
  createdAt: string;
  orderNumber: string;
}

interface OrdersContextType {
  orders: Order[];
  createOrder: (data: Omit<Order, 'id' | 'createdAt' | 'orderNumber' | 'status'>) => Order;
  updateStatus: (id: string, status: OrderStatus) => void;
  getUserOrders: (userId: string) => Order[];
}

const OrdersContext = createContext<OrdersContextType | null>(null);
const STORAGE_KEY = 'santyhogar_orders';

export const OrdersProvider = ({ children }: { children: React.ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  const createOrder = (data: Omit<Order, 'id' | 'createdAt' | 'orderNumber' | 'status'>) => {
    const newOrder: Order = {
      ...data,
      id: Date.now().toString(),
      orderNumber: `SH${Math.floor(10000 + Math.random() * 90000)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setOrders(prev => [newOrder, ...prev]);
    return newOrder;
  };

  const updateStatus = (id: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const getUserOrders = (userId: string) =>
    orders.filter(o => o.userId === userId);

  return (
    <OrdersContext.Provider value={{ orders, createOrder, updateStatus, getUserOrders }}>
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider');
  return ctx;
};
