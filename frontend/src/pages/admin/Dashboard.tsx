import { motion } from 'framer-motion';
import { TrendingUp, ShoppingBag, Package, ArrowUpRight, DollarSign } from 'lucide-react';
import { mockOrders } from '../../data/orders';
import { formatPrice } from '../../utils/format';

const stats = [
  { label: 'Ventas del día', value: formatPrice(189999), change: '+18%', icon: DollarSign, color: 'bg-blue-500/10 text-blue-400', bar: 'bg-blue-500' },
  { label: 'Ventas del mes', value: formatPrice(1489995), change: '+12.5%', icon: TrendingUp, color: 'bg-green-500/10 text-green-400', bar: 'bg-green-500' },
  { label: 'Pedidos', value: '48', change: '+8.2%', icon: ShoppingBag, color: 'bg-purple-500/10 text-purple-400', bar: 'bg-purple-500' },
  { label: 'Ticket promedio', value: formatPrice(31041), change: '+3.1%', icon: Package, color: 'bg-orange-500/10 text-orange-400', bar: 'bg-orange-500' },
];

const chartData = [
  { day: 'L', value: 85 }, { day: 'M', value: 120 }, { day: 'X', value: 95 },
  { day: 'J', value: 160 }, { day: 'V', value: 190 }, { day: 'S', value: 140 }, { day: 'D', value: 60 },
];
const maxVal = Math.max(...chartData.map(d => d.value));

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  processing: 'bg-blue-500/20 text-blue-400',
  shipped: 'bg-indigo-500/20 text-indigo-400',
  delivered: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
};
const statusLabels: Record<string, string> = {
  pending: 'Pendiente', processing: 'En proceso', shipped: 'Enviado',
  delivered: 'Entregado', cancelled: 'Cancelado',
};

export default function Dashboard() {
  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-gray-800 border border-gray-700/60 rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon size={19} />
              </div>
              <span className="flex items-center gap-0.5 text-xs font-semibold text-green-400">
                <ArrowUpRight size={13} />{s.change}
              </span>
            </div>
            <p className="text-xl font-black text-white leading-tight">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-gray-800 border border-gray-700/60 rounded-xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-white">Ventas esta semana</h2>
              <p className="text-xs text-gray-500 mt-0.5">Comparado con la semana anterior</p>
            </div>
            <span className="text-xs bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full font-medium">+12.5%</span>
          </div>
          <div className="flex items-end gap-2 h-36">
            {chartData.map((d, i) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.value / maxVal) * 100}%` }}
                  transition={{ delay: 0.4 + i * 0.06, duration: 0.5, ease: 'easeOut' }}
                  className="w-full bg-primary-600 hover:bg-primary-500 rounded-t-md transition-colors cursor-pointer relative group"
                  style={{ minHeight: 4 }}
                >
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ${d.value}k
                  </div>
                </motion.div>
                <span className="text-xs text-gray-500">{d.day}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick stats */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-gray-800 border border-gray-700/60 rounded-xl p-6">
          <h2 className="font-bold text-white mb-4">Resumen</h2>
          <div className="space-y-4">
            {[
              { label: 'Productos activos', value: '13', pct: 80 },
              { label: 'Stock bajo', value: '3', pct: 25, warn: true },
              { label: 'Clientes nuevos', value: '12', pct: 60 },
              { label: 'Tasa conversión', value: '3.2%', pct: 32 },
            ].map(item => (
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
                    className={`h-full rounded-full ${item.warn ? 'bg-orange-500' : 'bg-primary-500'}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent orders */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-gray-800 border border-gray-700/60 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white">Pedidos recientes</h2>
          <a href="/admin/pedidos" className="text-xs text-primary-400 hover:text-primary-300 font-medium">Ver todos →</a>
        </div>
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
              {mockOrders.slice(0, 5).map((order, i) => (
                <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.05 }}
                  className="hover:bg-gray-700/30 transition-colors">
                  <td className="py-3 pr-4 font-medium text-gray-200">{order.id}</td>
                  <td className="py-3 pr-4 text-gray-400">{order.customer}</td>
                  <td className="py-3 pr-4 text-gray-500 text-xs">{order.date}</td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                      {statusLabels[order.status]}
                    </span>
                  </td>
                  <td className="py-3 font-semibold text-white">{formatPrice(order.total)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
