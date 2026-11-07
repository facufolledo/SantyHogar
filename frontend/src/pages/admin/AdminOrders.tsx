import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronDown, ChevronUp, Package } from 'lucide-react';
import { formatPrice } from '../../utils/format';
import { fetchOrders, fetchOrderDetail, updateOrderStatus, type OrderStatus, type OrderList, type OrderDetail } from '../../api/ordersApi';

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
const ALL_STATUSES: OrderStatus[] = ['pending', 'paid', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState<OrderList[]>([]);
  const [orderDetails, setOrderDetails] = useState<Record<string, OrderDetail>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await fetchOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error al cargar órdenes:', error);
      alert('Error al cargar las órdenes');
    } finally {
      setLoading(false);
    }
  };

  const loadOrderDetail = async (orderId: string) => {
    if (orderDetails[orderId]) return; // Ya está cargado
    
    try {
      const detail = await fetchOrderDetail(orderId);
      setOrderDetails(prev => ({ ...prev, [orderId]: detail }));
    } catch (error) {
      console.error('Error al cargar detalle de orden:', error);
      alert('Error al cargar el detalle de la orden');
    }
  };

  const handleExpand = async (orderId: string) => {
    if (expanded === orderId) {
      setExpanded(null);
    } else {
      setExpanded(orderId);
      await loadOrderDetail(orderId);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdating(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      // Actualizar en la lista
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      // Actualizar en el detalle si está cargado
      if (orderDetails[orderId]) {
        setOrderDetails(prev => ({
          ...prev,
          [orderId]: { ...prev[orderId], status: newStatus }
        }));
      }
      alert('✅ Estado actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      alert('❌ Error al actualizar el estado');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = orders.filter(o => {
    const matchSearch = o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.orderNumber.includes(search) || o.customerEmail.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p>Cargando órdenes...</p>
      </div>
    );
  }

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
            const detail = orderDetails[order.id];
            const date = new Date(order.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

            return (
              <motion.div key={order.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-gray-800 border border-gray-700/60 rounded-xl overflow-hidden">

                {/* Row */}
                <button onClick={() => handleExpand(order.id)}
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
                      <p className="text-xs text-gray-500">{order.itemCount} productos</p>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp size={15} className="text-gray-500 flex-shrink-0" /> : <ChevronDown size={15} className="text-gray-500 flex-shrink-0" />}
                </button>

                {/* Detail */}
                {isOpen && detail && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="border-t border-gray-700/60 px-4 py-4 space-y-4">

                    {/* Products */}
                    <div className="space-y-2">
                      {detail.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 bg-gray-700/30 rounded-lg p-2">
                          {item.productImage ? (
                            <img src={item.productImage} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-700 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-200 line-clamp-1">{item.productName}</p>
                            <p className="text-xs text-gray-500">{item.productBrand}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-gray-500">x{item.quantity}</p>
                            <p className="text-sm font-semibold text-white">{formatPrice(item.subtotal)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Info + change status */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-gray-700/60">
                      <div className="text-sm text-gray-400 space-y-0.5">
                        <p><span className="text-gray-500">Cliente:</span> {detail.customerName} · {detail.customerPhone}</p>
                        <p><span className="text-gray-500">Pago:</span> {detail.paymentMethod === 'mp' ? 'Mercado Pago' : 'Fiserv'}</p>
                        <p><span className="text-gray-500">Email:</span> {detail.customerEmail}</p>
                      </div>

                      {/* Change status */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-500">Cambiar estado:</span>
                        <select
                          value={detail.status}
                          onChange={e => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                          disabled={updating === order.id}
                          className="text-xs bg-gray-700 border border-gray-600 text-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
