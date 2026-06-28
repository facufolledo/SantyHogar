import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Calendar, CreditCard, User, Mail, Phone, MapPin } from 'lucide-react';
import { fetchOrderDetail, OrderDetail } from '../api/ordersApi';
import { formatPrice } from '../utils/format';
import { formatDateArg } from '../utils/dateUtils';

interface OrderDetailModalProps {
  orderId: string;
  onClose: () => void;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  paid: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

const statusLabels = {
  pending: 'Pendiente',
  paid: 'Pagado',
  cancelled: 'Cancelado',
};

export default function OrderDetailModal({ orderId, onClose }: OrderDetailModalProps) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrderDetail();
  }, [orderId]);

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchOrderDetail(orderId);
      setOrder(data);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar el detalle del pedido');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => formatDateArg(dateString, 'datetime');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Detalle del Pedido</h2>
              {order && (
                <p className="text-sm text-gray-500 mt-1">#{order.orderNumber}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                  onClick={loadOrderDetail}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Reintentar
                </button>
              </div>
            ) : order ? (
              <div className="space-y-6">
                {/* Status y Fecha */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                </div>

                {/* Información del Cliente */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900 mb-3">Información del Cliente</h3>
                  
                  <div className="flex items-center gap-3">
                    <User size={18} className="text-gray-400" />
                    <span className="text-sm text-gray-700">{order.customerName}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-gray-400" />
                    <span className="text-sm text-gray-700">{order.customerEmail}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-gray-400" />
                    <span className="text-sm text-gray-700">{order.customerPhone}</span>
                  </div>
                </div>

                {/* Método de Pago */}
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
                  <CreditCard size={18} className="text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Método de Pago</p>
                    <p className="text-sm text-gray-600">
                      {order.paymentMethod === 'mp' ? 'Mercado Pago' : 'Fiserv'}
                    </p>
                  </div>
                </div>

                {/* Items del Pedido */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Package size={18} />
                    Productos ({order.items.length})
                  </h3>
                  
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
                      >
                        {/* Imagen */}
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={24} className="text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm truncate">
                            {item.productName}
                          </h4>
                          <p className="text-xs text-gray-500">{item.productBrand}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-600">
                              {formatPrice(item.unitPrice)} × {item.quantity}
                            </span>
                          </div>
                        </div>

                        {/* Subtotal */}
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatPrice(item.subtotal)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between text-lg">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-bold text-primary-600 text-2xl">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6">
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
