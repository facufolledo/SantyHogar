import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Package, RefreshCw, Loader2, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchOrdersByEmail, type OrderList } from '../../api/ordersApi';
import { formatPrice } from '../../utils/format';
import { OrderCardSkeleton } from '../../components/SkeletonLoader';
import OrderDetailModal from '../../components/OrderDetailModal';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};
const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  cancelled: 'Cancelado',
};

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrdersByEmail(user.email);
      setOrders(data);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-gray-900">Mis pedidos</h2>
        </div>
        {[1, 2, 3, 4].map(i => (
          <OrderCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={loadOrders}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <RefreshCw size={16} />
          Reintentar
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Package size={48} className="mx-auto mb-3 opacity-20" />
        <p className="font-medium text-gray-600">Todavía no tenés pedidos</p>
        <p className="text-sm mt-1">Cuando realices una compra aparecerá acá</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-gray-900">Mis pedidos</h2>
        <span className="text-sm text-gray-400">{orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}</span>
      </div>

      {orders.map((order, i) => {
        const date = new Date(order.createdAt).toLocaleDateString('es-AR', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        return (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900">#{order.orderNumber}</span>
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Total</p>
                  <p className="font-bold text-primary-600 text-lg">{formatPrice(order.total)}</p>
                </div>
              </div>

              {/* Info adicional */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Package size={14} className="text-gray-400" />
                    <span>{order.itemCount} {order.itemCount === 1 ? 'producto' : 'productos'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400">•</span>
                    <span>{order.customerName}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrderId(order.id)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                  title="Ver detalle completo"
                >
                  <Eye size={16} />
                  Ver detalle
                </button>
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* Modal de detalle */}
      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
}
