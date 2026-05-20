import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ShoppingBag, Package, ArrowUpRight, DollarSign, Loader2, Trophy, Users } from 'lucide-react';
import { formatPrice } from '../../utils/format';
import {
  fetchDashboardStats,
  fetchSalesChart,
  fetchTopProducts,
  fetchTopCustomers,
  type DashboardStats,
  type SalesChartPoint,
  type TopProduct,
  type TopCustomer,
} from '../../api/dashboardApi';
import { fetchOrders, type OrderList } from '../../api/ordersApi';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  paid: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
};
const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  cancelled: 'Cancelado',
};

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-gray-800 border border-gray-700/60 rounded-xl p-5 animate-pulse">
          <div className="w-10 h-10 rounded-xl bg-gray-700 mb-3" />
          <div className="h-6 bg-gray-700 rounded w-24 mb-1" />
          <div className="h-3 bg-gray-700 rounded w-16" />
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="flex items-end gap-2 h-36">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full bg-gray-700 rounded-t-md animate-pulse" style={{ height: `${20 + i * 10}%` }} />
          <div className="h-3 w-4 bg-gray-700 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<SalesChartPoint[]>([]);
  const [orders, setOrders] = useState<OrderList[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const [statsData, chartRes, ordersRes, topProdsRes, topCustsRes] = await Promise.allSettled([
          fetchDashboardStats(),
          fetchSalesChart(),
          fetchOrders(),
          fetchTopProducts(),
          fetchTopCustomers(),
        ]);

        if (statsData.status === 'fulfilled') setStats(statsData.value);
        if (chartRes.status === 'fulfilled') setChartData(chartRes.value);
        if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.slice(0, 5));
        if (topProdsRes.status === 'fulfilled') setTopProducts(topProdsRes.value);
        if (topCustsRes.status === 'fulfilled') setTopCustomers(topCustsRes.value);
      } catch {
        // Errors are handled gracefully - sections just won't show data
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const statsCards = stats
    ? [
        { label: 'Ventas del día', value: formatPrice(stats.sales_day), icon: DollarSign, color: 'bg-blue-500/10 text-blue-400' },
        { label: 'Ventas del mes', value: formatPrice(stats.sales_month), icon: TrendingUp, color: 'bg-green-500/10 text-green-400' },
        { label: 'Pedidos', value: String(stats.order_count), icon: ShoppingBag, color: 'bg-purple-500/10 text-purple-400', subtitle: `${stats.order_count_paid} confirmados, ${stats.order_count_pending} pendientes` },
        { label: 'Ticket promedio', value: formatPrice(stats.avg_ticket), icon: Package, color: 'bg-orange-500/10 text-orange-400' },
      ]
    : [];

  const maxVal = Math.max(...chartData.map((d) => d.total), 1);

  const summaryItems = stats
    ? [
        { label: 'Productos activos', value: String(stats.active_products), pct: Math.min(100, (stats.active_products / Math.max(stats.active_products + stats.low_stock_products, 1)) * 100) },
        { label: 'Stock bajo', value: String(stats.low_stock_products), pct: Math.min(100, (stats.low_stock_products / Math.max(stats.active_products, 1)) * 100), warn: true },
        { label: 'Pedidos confirmados', value: String(stats.order_count_paid), pct: Math.min(100, (stats.order_count_paid / Math.max(stats.order_count, 1)) * 100), color: 'bg-green-500' },
        { label: 'Pedidos pendientes', value: String(stats.order_count_pending), pct: Math.min(100, (stats.order_count_pending / Math.max(stats.order_count, 1)) * 100), color: 'bg-yellow-500' },
        { label: 'Clientes nuevos', value: String(stats.new_customers_month), pct: Math.min(100, stats.new_customers_month * 10) },
      ]
    : [];

  return (
    <div className="space-y-5">
      {/* Stats */}
      {loading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="bg-gray-800 border border-gray-700/60 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  <s.icon size={19} />
                </div>
                <span className="flex items-center gap-0.5 text-xs font-semibold text-green-400">
                  <ArrowUpRight size={13} />
                </span>
              </div>
              <p className="text-xl font-black text-white leading-tight">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              {s.subtitle && (
                <p className="text-[10px] text-gray-600 mt-1">{s.subtitle}</p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-gray-800 border border-gray-700/60 rounded-xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-white">Ventas esta semana</h2>
              <p className="text-xs text-gray-500 mt-0.5">Últimos 7 días</p>
            </div>
          </div>
          {loading ? (
            <ChartSkeleton />
          ) : (
            <div className="flex items-end gap-2 h-36">
              {chartData.map((d, i) => {
                const dayLabel = new Date(d.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short' }).charAt(0).toUpperCase()
                  + new Date(d.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short' }).slice(1, 2);
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(d.total / maxVal) * 100}%` }}
                      transition={{ delay: 0.4 + i * 0.06, duration: 0.5, ease: 'easeOut' }}
                      className="w-full bg-primary-600 hover:bg-primary-500 rounded-t-md transition-colors cursor-pointer relative group"
                      style={{ minHeight: 4 }}
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {formatPrice(d.total)}
                      </div>
                    </motion.div>
                    <span className="text-xs text-gray-500">{dayLabel}</span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Quick stats / Resumen */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-gray-800 border border-gray-700/60 rounded-xl p-6">
          <h2 className="font-bold text-white mb-4">Resumen</h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex justify-between mb-1.5">
                    <div className="h-4 bg-gray-700 rounded w-24" />
                    <div className="h-4 bg-gray-700 rounded w-8" />
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {summaryItems.map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-400">{item.label}</span>
                    <span className={`font-semibold ${item.warn ? 'text-orange-400' : 'text-white'}`}>{item.value}</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.pct}%` }}
                      transition={{ delay: 0.5, duration: 0.6 }}
                      className={`h-full rounded-full ${item.color || (item.warn ? 'bg-orange-500' : 'bg-primary-500')}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent orders */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-gray-800 border border-gray-700/60 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white">Pedidos recientes</h2>
          <a href="/admin/pedidos" className="text-xs text-primary-400 hover:text-primary-300 font-medium">Ver todos →</a>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-gray-500" size={24} />
          </div>
        ) : orders.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No hay pedidos recientes</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700/60">
                  {['Pedido', 'Cliente', 'Fecha', 'Estado', 'Total'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/40">
                {orders.map((order, i) => (
                  <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.05 }}
                    className="hover:bg-gray-700/30 transition-colors">
                    <td className="py-3 pr-4 font-medium text-gray-200">{order.orderNumber}</td>
                    <td className="py-3 pr-4 text-gray-400">{order.customerName}</td>
                    <td className="py-3 pr-4 text-gray-500 text-xs">{new Date(order.createdAt).toLocaleDateString('es-AR')}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-500/20 text-gray-400'}`}>
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

      {/* Top Products & Top Customers */}
      {(!loading && (topProducts.length > 0 || topCustomers.length > 0)) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Top Products */}
          {topProducts.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="bg-gray-800 border border-gray-700/60 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy size={18} className="text-yellow-400" />
                <h2 className="font-bold text-white">Top Productos</h2>
              </div>
              <div className="space-y-3">
                {topProducts.map((product, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-500 w-5">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-200">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.quantity_sold} vendidos</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-white">{formatPrice(product.total_revenue)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Top Customers */}
          {topCustomers.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
              className="bg-gray-800 border border-gray-700/60 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users size={18} className="text-blue-400" />
                <h2 className="font-bold text-white">Top Clientes</h2>
              </div>
              <div className="space-y-3">
                {topCustomers.map((customer, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-500 w-5">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-200">{customer.name}</p>
                        <p className="text-xs text-gray-500">{customer.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{formatPrice(customer.total_spent)}</p>
                      <p className="text-xs text-gray-500">{customer.order_count} pedidos</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
