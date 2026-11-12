import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ShoppingBag, Package, ArrowUpRight, DollarSign, Calendar, X } from 'lucide-react';
import { formatPrice } from '../../utils/format';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  procesando: 'bg-blue-500/20 text-blue-400',
  enviado: 'bg-indigo-500/20 text-indigo-400',
  entregado: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
};
const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  procesando: 'En proceso',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelled: 'Cancelado',
};

const iconMap: Record<string, any> = {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Package,
};

interface DashboardData {
  stats: any[];
  chart_data: any[];
  orders: any[];
  summary: Record<string, any>;
  date_range: any;
}

export default function DashboardPro() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hasFilters, setHasFilters] = useState(false);

  // Set default dates on mount (current month)
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/stats?${params}`);
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchDashboard();
    }
  }, []);

  const handleFilterChange = () => {
    if (startDate && endDate) {
      setHasFilters(startDate !== '' || endDate !== '');
      fetchDashboard();
    }
  };

  const handleClearFilters = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
    setHasFilters(false);
  };

  if (!data && loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-800 border border-gray-700/60 rounded-xl p-5 animate-pulse">
              <div className="h-20 bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats || [];
  const chartData = data?.chart_data || [];
  const orders = data?.orders || [];
  const summary = data?.summary || {};

  const maxVal = Math.max(...(chartData.map((d: any) => d.value) || [1]), 1);

  return (
    <div className="space-y-5">
      {/* Date Filters */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 border border-gray-700/60 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-end"
      >
        <div className="flex-1">
          <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Desde</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        <div className="flex-1">
          <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Hasta</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex gap-2 sm:w-auto w-full">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleFilterChange}
            className="flex-1 sm:flex-none bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-6 rounded-lg transition-all"
          >
            <Calendar size={16} className="inline mr-2" />
            Filtrar
          </motion.button>

          {hasFilters && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleClearFilters}
              className="flex-1 sm:flex-none bg-gray-700/50 hover:bg-gray-700 text-gray-300 font-semibold py-2 px-4 rounded-lg transition-all"
            >
              <X size={16} />
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s: any, i: number) => {
          const IconComponent = iconMap[s.icon] || Package;
          return (
            <motion.div 
              key={s.label} 
              initial={{ opacity: 0, y: 16 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.08 }}
              className="bg-gray-800 border border-gray-700/60 rounded-xl p-5 hover:border-primary-500/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  <IconComponent size={19} />
                </div>
                <span className="flex items-center gap-0.5 text-xs font-semibold text-green-400">
                  <ArrowUpRight size={13} />{s.change}
                </span>
              </div>
              <p className="text-xl font-black text-white leading-tight">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3 }}
          className="bg-gray-800 border border-gray-700/60 rounded-xl p-6 lg:col-span-2"
        >
          <h2 className="font-bold text-white mb-5">Ventas en el período</h2>
          <div className="flex items-end gap-2 h-48">
            {chartData.length === 0 ? (
              <div className="w-full flex items-center justify-center text-gray-500 text-sm">
                Sin datos para este período
              </div>
            ) : (
              chartData.map((d: any, i: number) => (
                <div key={`${d.day}-${i}`} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: maxVal > 0 ? `${(d.value / maxVal) * 100}%` : 0 }}
                    transition={{ delay: 0.4 + i * 0.06, duration: 0.5, ease: 'easeOut' }}
                    className="w-full bg-gradient-to-t from-primary-600 to-primary-400 hover:from-primary-700 hover:to-primary-500 rounded-t-md transition-all cursor-pointer relative group"
                    style={{ minHeight: 4 }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      ${(d.value).toLocaleString()}
                    </div>
                  </motion.div>
                  <span className="text-xs text-gray-500 font-medium">{d.day}</span>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Summary Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.35 }}
          className="bg-gray-800 border border-gray-700/60 rounded-xl p-6"
        >
          <h2 className="font-bold text-white mb-4">Resumen</h2>
          <div className="space-y-4">
            {[
              { label: 'Productos activos', value: summary.productos_activos || 0, color: 'primary' },
              { label: 'Stock bajo', value: summary.stock_bajo || 0, color: 'warning', warn: true },
              { label: 'Clientes nuevos', value: summary.clientes_nuevos || 0, color: 'success' },
              { label: 'Pedidos entregados', value: summary.pedidos_entregados || 0, color: 'primary' },
              { label: 'Pedidos pendientes', value: summary.pedidos_pendientes || 0, color: 'warning' },
            ].map((item, idx) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.05 }}
              >
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">{item.label}</span>
                  <span className={`font-bold ${item.warn ? 'text-orange-400' : 'text-white'}`}>
                    {typeof item.value === 'number' ? item.value : item.value}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Orders */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.4 }}
        className="bg-gray-800 border border-gray-700/60 rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white">Pedidos recientes</h2>
          <a href="/admin/pedidos" className="text-xs text-primary-400 hover:text-primary-300 font-medium">Ver todos →</a>
        </div>
        {orders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Sin pedidos en este período
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700/60">
                  {['Pedido', 'Cliente', 'Fecha', 'Estado', 'Total'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/40">
                {orders.map((order: any, i: number) => (
                  <motion.tr 
                    key={order.id} 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: 0.5 + i * 0.05 }}
                    className="hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="py-3 pr-4 font-mono text-xs text-gray-300">{order.id}</td>
                    <td className="py-3 pr-4 text-gray-400 text-sm">{order.customer}</td>
                    <td className="py-3 pr-4 text-gray-500 text-xs">{order.date}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || statusColors.pending}`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-white">{formatPrice(order.total)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
