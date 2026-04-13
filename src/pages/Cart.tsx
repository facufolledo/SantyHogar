import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingBag, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';

const Cart = () => {
  const { items, removeItem, updateQty, total, clearCart } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) return (
    <div className="max-w-7xl mx-auto px-6 py-20 text-center">
      <ShoppingBag size={64} className="mx-auto text-gray-200 mb-4" />
      <h2 className="text-xl font-bold text-gray-800 mb-2">Tu carrito está vacío</h2>
      <p className="text-gray-500 mb-6">Agregá productos para continuar</p>
      <Link to="/tienda" className="btn-primary inline-block">Ver productos</Link>
    </div>
  );

  const shipping = total >= 200000 ? 0 : 9999;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi carrito ({items.length} {items.length === 1 ? 'producto' : 'productos'})</h1>

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
                <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                  {shipping === 0 ? 'Gratis' : formatPrice(shipping)}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-gray-400">Agregá {formatPrice(200000 - total)} más para envío gratis</p>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4 mb-5">
              <div className="flex justify-between font-bold text-gray-900 text-lg">
                <span>Total</span>
                <span>{formatPrice(total + shipping)}</span>
              </div>
              <p className="text-xs text-green-600 mt-1">12 cuotas sin interés disponibles</p>
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
    </div>
  );
};

export default Cart;
