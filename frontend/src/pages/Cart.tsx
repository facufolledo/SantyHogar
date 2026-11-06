import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2, Plus, Minus, ShoppingBag, ChevronRight,
  Package, Clock, Eye, Loader2, RefreshCw, ShoppingCart
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/format';
import { fetchOrdersByEmail, type OrderList } from '../api/ordersApi';
import OrderDetailModal from '../components/OrderDetailModal';

const statusColors: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  paid:      'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};
const statusLabels: Record<string, string> = {
  pending:   'Pendiente',
  paid:      'Pagado',
  cancelled: 'Cancelado',
};

// ─── Sección: mis pedidos ──────────────────────────────────────────────────────

function MyOrdersSection() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderList[]>([]);
  const [loading, setLoading] = useState(false);
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

  // Usuario no logueado
  if (!user) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package size={32} className="text-gray-400" />
        </div>
        <h3 className="font-bold text-gray-800 mb-2">Iniciá sesión para ver tus pedidos</h3>
        <p className="text-sm text-gray-500 mb-6">
          Registrate o iniciá sesión para acceder al historial de compras.
        </p>
        <Link to="/tienda" className="btn-primary inline-block">
          Ir a la tienda
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
        <Loader2 size={32} className="animate-spin" />
        <p className="text-sm">Cargando tus pedidos…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-sm mb-4">{error}</p>
        <button
          onClick={loadOrders}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
        >
          <RefreshCw size={15} />
          Reintentar
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package size={32} className="text-gray-400" />
        </div>
        <h3 className="font-semibold text-gray-700 mb-1">Todavía no tenés pedidos</h3>
        <p className="text-sm text-gray-400 mb-6">
          Cuando realices una compra aparecerá acá.
        </p>
        <Link to="/tienda" className="btn-primary inline-block">
          Ver productos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-gray-500">
          {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'} realizados
        </p>
        <Link to="/cuenta/pedidos" className="text-xs text-primary-600 hover:underline font-medium">
          Ver todos →
        </Link>
      </div>

      {orders.slice(0, 5).map((order, i) => {
        const date = new Date(order.createdAt).toLocaleDateString('es-AR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

        return (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="card overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package size={18} className="text-primary-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 text-sm">#{order.orderNumber}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400">
                      <Clock size={11} />
                      <span>{date}</span>
                      <span>·</span>
                      <span>{order.itemCount} {order.itemCount === 1 ? 'producto' : 'productos'}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary-600">{formatPrice(order.total)}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrderId(order.id)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-primary-50 border border-gray-200 hover:border-primary-200 text-gray-600 hover:text-primary-700 text-xs font-medium rounded-lg transition-all"
              >
                <Eye size={13} />
                Ver detalle
              </button>
            </div>
          </motion.div>
        );
      })}

      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────────

type Tab = 'carrito' | 'pedidos';

const Cart = () => {
  const { items, removeItem, updateQty, total, clearCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // Si se navega desde CheckoutSuccess con state={tab:'pedidos'}, activar esa tab automáticamente
  const initialTab: Tab = (location.state as any)?.tab === 'pedidos' ? 'pedidos' : 'carrito';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  const shipping = 0; // Solo retiro en depósito — envío gratis

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'carrito', label: 'Mi carrito', icon: <ShoppingCart size={16} /> },
    { id: 'pedidos', label: 'Mis pedidos', icon: <Package size={16} /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {activeTab === 'carrito'
          ? `Mi carrito${items.length > 0 ? ` (${items.length} ${items.length === 1 ? 'producto' : 'productos'})` : ''}`
          : 'Mis pedidos'}
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── Tab: carrito ── */}
        {activeTab === 'carrito' && (
          <motion.div
            key="carrito"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            {items.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingBag size={64} className="mx-auto text-gray-200 mb-4" />
                <h2 className="text-xl font-bold text-gray-800 mb-2">Tu carrito está vacío</h2>
                <p className="text-gray-500 mb-6">Agregá productos para continuar</p>
                <Link to="/tienda" className="btn-primary inline-block">Ver productos</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Items */}
                <div className="lg:col-span-2 space-y-3">
                  <AnimatePresence>
                    {items.map(({ product, quantity }) => (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20, height: 0 }}
                        className="card p-4 flex gap-4"
                      >
                        <Link to={`/producto/${product.slug}`} className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        </Link>

                        <div className="flex-1 min-w-0">
                          <Link to={`/producto/${product.slug}`} className="text-sm font-medium text-gray-800 hover:text-primary-600 line-clamp-2 leading-snug">
                            {product.name}
                          </Link>
                          <p className="text-xs text-gray-400 mt-0.5">{product.brand}</p>

                          <div className="flex items-center justify-between mt-3">
                            {/* Qty controls */}
                            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                              <button onClick={() => updateQty(product.id, quantity - 1)} className="px-2.5 py-1.5 hover:bg-gray-50 transition-colors">
                                <Minus size={13} />
                              </button>
                              <span className="px-3 py-1.5 text-sm font-semibold border-x border-gray-200">{quantity}</span>
                              <button onClick={() => updateQty(product.id, quantity + 1)} disabled={quantity >= product.stock} className="px-2.5 py-1.5 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                                <Plus size={13} />
                              </button>
                            </div>

                            <div className="flex items-center gap-3">
                              <p className="font-bold text-gray-900">{formatPrice(product.price * quantity)}</p>
                              <button onClick={() => removeItem(product.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  <button onClick={clearCart} className="text-sm text-gray-400 hover:text-red-500 transition-colors mt-2">
                    Vaciar carrito
                  </button>
                </div>

                {/* Summary */}
                <div className="lg:col-span-1">
                  <div className="card p-6 sticky top-24">
                    <h2 className="font-bold text-gray-900 mb-4">Resumen del pedido</h2>

                    <div className="space-y-3 text-sm mb-4">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>{formatPrice(total)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Envío</span>
                        <span className="text-green-600 font-medium">
                          {shipping === 0 ? 'Retiro gratis' : formatPrice(shipping)}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4 mb-5">
                      <div className="flex justify-between font-bold text-gray-900 text-lg">
                        <span>Total</span>
                        <span>{formatPrice(total + shipping)}</span>
                      </div>
                    </div>

                    <button onClick={() => navigate('/checkout')} className="w-full btn-primary flex items-center justify-center gap-2">
                      Continuar compra <ChevronRight size={16} />
                    </button>

                    <Link to="/tienda" className="block text-center text-sm text-primary-600 hover:text-primary-700 mt-3">
                      Seguir comprando
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Tab: pedidos ── */}
        {activeTab === 'pedidos' && (
          <motion.div
            key="pedidos"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="max-w-2xl"
          >
            <MyOrdersSection />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default Cart;
