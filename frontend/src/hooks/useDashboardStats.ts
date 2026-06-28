import { useState, useEffect } from 'react';
import { apiFetch } from '../api/client';

export interface DashboardStats {
  salesDay: number;
  salesMonth: number;
  ordersCount: number;
  averageTicket: number;
  activeProducts: number;
  lowStockProducts: number;
  newCustomers: number;
  conversionRate: number;
}

export interface DailyStats {
  day: string;
  value: number;
}

const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [weeklyData, setWeeklyData] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get all orders
        const ordersRes = await apiFetch<any[]>('/orders', { method: 'GET' });
        const orders = Array.isArray(ordersRes) ? ordersRes : [];

        // Calculate stats
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Sales today
        const ordersToday = orders.filter(o => {
          const orderDate = new Date(o.createdAt);
          const orderDay = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
          return orderDay.getTime() === today.getTime() && o.status === 'paid';
        });
        const salesDay = ordersToday.reduce((sum, o) => sum + (o.total || 0), 0);

        // Sales this month
        const ordersMonth = orders.filter(o => {
          const orderDate = new Date(o.createdAt);
          return orderDate >= monthStart && o.status === 'paid';
        });
        const salesMonth = ordersMonth.reduce((sum, o) => sum + (o.total || 0), 0);

        // Average ticket
        const averageTicket = ordersMonth.length > 0 ? salesMonth / ordersMonth.length : 0;

        // Build weekly data
        const weeklyMap: Record<string, number> = {
          L: 0, M: 0, X: 0, J: 0, V: 0, S: 0, D: 0,
        };
        const dayNames = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

        orders.forEach(o => {
          if (o.status !== 'paid') return;
          const orderDate = new Date(o.createdAt);
          const dayOfWeek = orderDate.getDay();
          const dayName = dayNames[dayOfWeek];
          weeklyMap[dayName] = (weeklyMap[dayName] || 0) + (o.total || 0);
        });

        const weekly: DailyStats[] = [
          { day: 'L', value: Math.round(weeklyMap.L / 1000) },
          { day: 'M', value: Math.round(weeklyMap.M / 1000) },
          { day: 'X', value: Math.round(weeklyMap.X / 1000) },
          { day: 'J', value: Math.round(weeklyMap.J / 1000) },
          { day: 'V', value: Math.round(weeklyMap.V / 1000) },
          { day: 'S', value: Math.round(weeklyMap.S / 1000) },
          { day: 'D', value: Math.round(weeklyMap.D / 1000) },
        ];

        setStats({
          salesDay,
          salesMonth,
          ordersCount: orders.length,
          averageTicket,
          activeProducts: 0, // Will fetch from products endpoint
          lowStockProducts: 0, // Will fetch from products endpoint
          newCustomers: 0, // Placeholder
          conversionRate: 3.2, // Placeholder
        });

        setWeeklyData(weekly);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error cargando estadísticas';
        setError(message);
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    void fetchStats();
  }, []);

  return { stats, weeklyData, loading, error };
};

export default useDashboardStats;
