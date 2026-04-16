import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronDown, ChevronUp, Package } from 'lucide-react';
import { useOrders, type OrderStatus } from '../../context/OrdersContext';
import { formatPrice } from '../../utils/format';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  processing: 'bg-blue-500/20 text-blue-400',
  ready: 'bg-purple-500/20 text-purple-400',
  delivered: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
};
const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  processing: 'En preparación',
  ready: 'Listo para retirar',
  delivered: 'Retirado',
  cancelled: 'Cancelado',
};
const ALL_STATUSES: OrderStatus[] = ['pending', 'processing', 'ready', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const { orders, updateStatus } = useOrders();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = orders.filter(o => {
    const matchSearch = o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.orderNumber.includes(search) || o.customerEmail.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-bold text-white">Pedidos</h2>
        <p className="text-sm text-gray-500">{orders.length} pedidos en total</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" placeholder="Buscar pedido, cliente o email..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700/60 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 bg-gray-800 border border-gray-700/60 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer">
            <option value="all">Todos los estados</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <Package size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">No hay pedidos todavía</p>
          <p className="text-xs text-gray-700 mt-1">Los pedidos aparecerán aquí cuando los clientes compren</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((order, i) => {
            const isOpen = expanded === order.id;
            const date = new Date(order.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

            return (
              <motion.div key={order.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-gray-800 border border-gray-700/60 rounded-xl overflow-hidden">

                {/* Row */}
                <button onClick={() => setExpanded(isOpen ? null : order.id)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-gray-700/40 transition-colors text-left">
                  <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-2 items-center">
                    <div>
                      <p className="font-semibold text-gray-200 text-sm">#{order.orderNumber}</p>
                      <p className="text-xs text-gray-500">{date}</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm text-gray-300">{order.customerName}</p>
                      <p className="text-xs text-gray-500 truncate">{order.customerEmail}</p>
                    </div>
                    <div>
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white text-sm">{formatPrice(order.total)}</p>
                      <p className="text-xs text-gray-500">{order.items.length} productos</p>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp size={15} className="text-gray-500 flex-shrink-0" /> : <ChevronDown size={15} className="text-gray-500 flex-shrink-0" />}
                </button>

                {/* Detail */}
                {isOpen && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="border-t border-gray-700/60 px-4 py-4 space-y-4">

                    {/* Products */}
                    <div className="space-y-2">
                      {order.items.map(({ product, quantity }) => (
                        <div key={product.id} className="flex items-center gap-3 bg-gray-700/30 rounded-lg p-2">
                          <img src={product.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-200 line-clamp-1">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.brand}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-gray-500">x{quantity}</p>
                            <p className="text-sm font-semibold text-white">{formatPrice(product.price * quantity)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Info + change status */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-gray-700/60">
                      <div className="text-sm text-gray-400 space-y-0.5">
                        <p><span className="text-gray-500">Cliente:</span> {order.customerName} · {order.customerPhone}</p>
                        <p><span className="text-gray-500">Pago:</span> {order.paymentMethod === 'mp' ? 'Mercado Pago' : 'Fiserv'}</p>
                        <p><span className="text-gray-500">Retiro:</span> Depósito Santy Hogar</p>
                      </div>

                      {/* Change status */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-500">Cambiar estado:</span>
                        <select
                          value={order.status}
                          onChange={e => updateStatus(order.id, e.target.value as OrderStatus)}
                          className="text-xs bg-gray-700 border border-gray-600 text-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                        >
                          {ALL_STATUSES.map(s => (
                            <option key={s} value={s}>{statusLabels[s]}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
