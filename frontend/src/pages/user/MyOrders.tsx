import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Package, MapPin, CreditCard, Clock, AlertCircle } from 'lucide-react';
import { useOrders } from '../../context/OrdersContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../utils/format';
import { formatDateArg } from '../../utils/dateUtils';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  pendiente_pago: 'bg-orange-100 text-orange-700',  // New
  processing: 'bg-blue-100 text-blue-700',
  ready: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  pagada: 'bg-green-100 text-green-700',  // New
};
const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  pendiente_pago: 'Pendiente de pago',  // New
  processing: 'En preparación',
  ready: 'Listo para retirar',
  delivered: 'Retirado',
  cancelled: 'Cancelado',
  pagada: 'Pagada',  // New
};

// Tracking steps for pickup flow
const trackingSteps = ['Pedido recibido', 'En preparación', 'Listo para retirar', 'Retirado'];
const statusToStep: Record<string, number> = {
  pending: 0, processing: 1, ready: 2, delivered: 3, cancelled: -1,
};

export default function MyOrders() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const { getUserOrders } = useOrders();
  const { user } = useAuth();
  const { toast } = useToast();

  const orders = user ? getUserOrders(user.id) : [];

  const handleRetryPayment = async (orderId: string) => {
    try {
      setRetrying(orderId);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/orders/${orderId}/retry-payment`,
        { method: 'POST' }
      );

      if (!response.ok) {
        throw new Error('Error al reintentar pago');
      }

      const data = await response.json();
      
      // Redirigir a Mercado Pago
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        toast('Error: No se recibió link de pago', 'error');
      }
    } catch (err) {
      console.error('Error retrying payment:', err);
      toast(err instanceof Error ? err.message : 'Error al reintentar pago', 'error');
      setRetrying(null);
    }
  };

  if (orders.length === 0) return (
    <div className="text-center py-16 text-gray-400">
      <Package size={48} className="mx-auto mb-3 opacity-20" />
      <p className="font-medium text-gray-600">Todavía no tenés pedidos</p>
      <p className="text-sm mt-1">Cuando realices una compra aparecerá acá</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-gray-900">Mis pedidos</h2>
        <span className="text-sm text-gray-400">{orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}</span>
      </div>

      {orders.map((order, i) => {
        const isOpen = expanded === order.id;
        const trackStep = statusToStep[order.status] ?? 0;
        const date = formatDateArg(order.createdAt, 'date');

        return (
          <motion.div key={order.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }} className="card overflow-hidden">

            {/* Row */}
            <button onClick={() => setExpanded(isOpen ? null : order.id)}
              className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Package size={18} className="text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">#{order.orderNumber}</span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {date} · {order.items.length} {order.items.length === 1 ? 'producto' : 'productos'}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-gray-900 text-sm">{formatPrice(order.total)}</p>
                {isOpen ? <ChevronUp size={15} className="ml-auto text-gray-400 mt-1" /> : <ChevronDown size={15} className="ml-auto text-gray-400 mt-1" />}
              </div>
            </button>

            {/* Detail */}
            <AnimatePresence>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                  className="overflow-hidden border-t border-gray-100">
                  <div className="p-4 space-y-4">

                    {/* PENDING PAYMENT BANNER */}
                    {order.status === 'pendiente_pago' && (
                      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle size={18} className="text-orange-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-semibold text-orange-900 text-sm">Pago pendiente</p>
                          <p className="text-xs text-orange-700 mt-0.5">
                            Esta orden está esperando confirmación de pago. Haz clic en "Reintentar Pago" para continuar.
                          </p>
                          <button
                            onClick={() => handleRetryPayment(order.id)}
                            disabled={retrying === order.id}
                            className="mt-2 w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                          >
                            {retrying === order.id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Redirigiendo...
                              </>
                            ) : (
                              <>
                                <CreditCard size={14} />
                                Reintentar Pago
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Tracking */}
                    {order.status !== 'cancelled' && order.status !== 'pendiente_pago' && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Seguimiento</p>
                        <div className="flex items-center">
                          {trackingSteps.map((s, idx) => (
                            <div key={s} className="flex items-center flex-1 last:flex-none">
                              <div className="flex flex-col items-center">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${idx <= trackStep ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                  {idx < trackStep ? '✓' : idx + 1}
                                </div>
                                <p className={`text-[10px] mt-1 text-center w-16 leading-tight ${idx <= trackStep ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>{s}</p>
                              </div>
                              {idx < trackingSteps.length - 1 && (
                                <div className={`flex-1 h-0.5 mb-4 mx-1 ${idx < trackStep ? 'bg-primary-600' : 'bg-gray-200'}`} />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Products */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Productos</p>
                      <div className="space-y-2">
                        {order.items.map(({ product, quantity }) => (
                          <div key={product.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2">
                            <img src={product.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 line-clamp-1">{product.name}</p>
                              <p className="text-xs text-gray-400">{product.brand}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs text-gray-500">x{quantity}</p>
                              <p className="text-sm font-semibold text-gray-800">{formatPrice(product.price * quantity)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin size={13} className="text-primary-600" />
                          <p className="text-xs font-semibold text-gray-600">Retiro en depósito</p>
                        </div>
                        <p className="text-xs text-gray-500">Viamonte 1261, B° Pueyrredón</p>
                        <p className="text-xs text-gray-400">Córdoba, Argentina</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <CreditCard size={13} className="text-primary-600" />
                          <p className="text-xs font-semibold text-gray-600">Pago</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {order.paymentMethod === 'mp' ? 'Mercado Pago' : 'Fiserv'}
                        </p>
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
