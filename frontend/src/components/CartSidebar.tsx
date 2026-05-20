import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { items, removeItem, updateQty, total, count } = useCart();
  const navigate = useNavigate();

  const handleGoToCart = () => {
    navigate('/carrito');
    onClose();
  };

  const handleCheckout = () => {
    navigate('/checkout');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[450px] bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <ShoppingBag size={20} className="text-primary-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Mi Carrito</h2>
                  <p className="text-xs text-gray-500">
                    {count} {count === 1 ? 'producto' : 'productos'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={22} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag size={32} className="text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium mb-1">Tu carrito está vacío</p>
                  <p className="text-sm text-gray-400">Agregá productos para comenzar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <motion.div
                      key={item.product.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex gap-3">
                        {/* Image */}
                        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-gray-900 mb-0.5 line-clamp-2">
                            {item.product.name}
                          </h3>
                          <p className="text-xs text-gray-500 mb-2">{item.product.brand}</p>
                          
                          {/* Price and Quantity */}
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-primary-600">
                              {formatPrice(item.product.price * item.quantity)}
                            </p>
                            
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQty(item.product.id, item.quantity - 1)}
                                className="w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                                disabled={item.quantity <= 1}
                              >
                                <Minus size={14} />
                              </button>
                              <span className="text-sm font-semibold text-gray-900 w-6 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQty(item.product.id, item.quantity + 1)}
                                className="w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                                disabled={item.quantity >= item.product.stock}
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Unit price and delete */}
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-500">
                              {formatPrice(item.product.price)} c/u
                            </p>
                            <button
                              onClick={() => removeItem(item.product.id)}
                              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
                            >
                              <Trash2 size={12} />
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-200 p-5 bg-gray-50 space-y-4">
                {/* Subtotal */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold text-gray-900">{formatPrice(total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Envío</span>
                    <span className="text-green-600 font-medium">Gratis</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-primary-600">{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Comprar ahora
                    <ArrowRight size={18} />
                  </button>
                  <button
                    onClick={handleGoToCart}
                    className="w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 rounded-xl transition-all"
                  >
                    Ir al carrito
                  </button>
                </div>

                {/* Trust badges */}
                <div className="flex items-center justify-center gap-4 text-xs text-gray-500 pt-2">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Compra segura</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                    </svg>
                    <span>Envío gratis</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
