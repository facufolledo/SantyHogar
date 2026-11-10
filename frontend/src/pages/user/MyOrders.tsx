import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Package, MapPin, CreditCard } from 'lucide-react';
import { useOrders } from '../../context/OrdersContext';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../utils/format';

const statusColors: Record<string, string> = {
  pending_pago: 'bg-yellow-100 text-yellow-700',
  pagada: 'bg-green-100 text-green-700',
  cancelada: 'bg-red-100 text-red-700',
};
const statusLabels: Record<string, string> = {
  pending_pago: 'Pendiente de Pago',
  pagada: 'Pagada',
  cancelada: 'Cancelada',
};

// Tracking steps for payment flow
const trackingSteps = ['Pedido recibido', 'Pago procesado', 'Preparación', 'Listo para retirar'];
const statusToStep: Record<string, number> = {
  pending_pago: 0, pagada: 2, cancelada: -1,
};

export default function MyOrders() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { orders, loading } = useOrders();
  const { user } = useAuth();

  // Filtrar solo los pedidos del usuario actual
  const userOrders = user ? orders.filter(o => o.userId === user.id) : [];

  if (loading) return (
    <div className="text-center py-16 text-gray-400">
      <Package size={48} className="mx-auto mb-3 opacity-20 animate-spin" />
      <p className="font-medium text-gray-600">Cargando tus pedidos...</p>
    </div>
  );

  if (userOrders.length === 0) return (
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
        <span className="text-sm text-gray-400">{userOrders.length} {userOrders.length === 1 ? 'pedido' : 'pedidos'}</span>
      </div>

      {userOrders.map((order, i) => {
        const isOpen = expanded === order.id;
        const trackStep = statusToStep[order.status] ?? 0;
        const date = new Date(order.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });

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

                    {/* Tracking */}
                    {order.status !== 'cancelada' && (
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
                        <p className="text-xs text-gray-500">Gral. Juan José Viamonte 1261</p>
                        <p className="text-xs text-gray-400">X5004AVG Córdoba, Argentina</p>
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
