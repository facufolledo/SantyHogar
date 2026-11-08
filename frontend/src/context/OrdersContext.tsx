import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CartItem } from './CartContext';
import { useAuth } from './AuthContext';

export type OrderStatus = 'pending_pago' | 'pagada' | 'cancelada';

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
  loading: boolean;
  createOrder: (data: Omit<Order, 'id' | 'createdAt' | 'orderNumber' | 'status'>) => Order;
  /** Orden ya creada en el servidor (p. ej. checkout con Mercado Pago). */
  pushOrder: (order: Order) => void;
  updateStatus: (id: string, status: OrderStatus) => void;
  getUserOrders: (userId: string) => Order[];
  refreshOrders: () => Promise<void>;
}

const OrdersContext = createContext<OrdersContextType | null>(null);
const STORAGE_KEY = 'santyhogar_orders_local';  // Solo para cache local, no global

export const OrdersProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar pedidos del usuario desde la API cuando cambia el usuario
  useEffect(() => {
    const loadUserOrders = async () => {
      if (!user?.id) {
        setOrders([]);
        return;
      }

      setLoading(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/customers/${user.id}/orders`, {
          headers: {
            'Authorization': `Bearer ${user.token || ''}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const userOrders = Array.isArray(data) ? data : data.orders || [];
          setOrders(userOrders);
          // Guardar en localStorage solo para cache
          localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(userOrders));
        } else {
          // Fallback: cargar del localStorage local del usuario
          try {
            const cached = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
            setOrders(cached ? JSON.parse(cached) : []);
          } catch {
            setOrders([]);
          }
        }
      } catch (error) {
        console.error('Error cargando pedidos:', error);
        // Fallback: cargar del localStorage local del usuario
        try {
          const cached = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
          setOrders(cached ? JSON.parse(cached) : []);
        } catch {
          setOrders([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserOrders();
  }, [user?.id, user?.token]);

  const createOrder = (data: Omit<Order, 'id' | 'createdAt' | 'orderNumber' | 'status'>) => {
    const newOrder: Order = {
      ...data,
      id: Date.now().toString(),
      orderNumber: `SH${Math.floor(10000 + Math.random() * 90000)}`,
      status: 'pending_pago',
      createdAt: new Date().toISOString(),
    };
    setOrders(prev => [newOrder, ...prev]);
    return newOrder;
  };

  const pushOrder = (order: Order) => {
    setOrders(prev => [order, ...prev]);
  };

  const updateStatus = (id: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const getUserOrders = (userId: string) =>
    orders.filter(o => o.userId === userId);

  const refreshOrders = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/customers/${user.id}/orders`, {
        headers: {
          'Authorization': `Bearer ${user.token || ''}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const userOrders = Array.isArray(data) ? data : data.orders || [];
        setOrders(userOrders);
        localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(userOrders));
      }
    } catch (error) {
      console.error('Error refrescando pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <OrdersContext.Provider value={{ orders, loading, createOrder, pushOrder, updateStatus, getUserOrders, refreshOrders }}>
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider');
  return ctx;
};
