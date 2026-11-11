import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, ChevronRight, Star, Minus, Plus, Lock, CreditCard } from 'lucide-react';
import { useProducts } from '../context/ProductsContext';
import ProductsErrorBanner from '../components/ProductsErrorBanner';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/format';
import ProductCard from '../components/ProductCard';
import AuthModal from '../components/AuthModal';
import PaymentMethodsModal from '../components/PaymentMethodsModal';

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { products, loading, error } = useProducts();
  const product = products.find(p => p.slug === slug);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [showAuth, setShowAuth] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const { addItem } = useCart();
  const { isLogged } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (loading && !product) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center text-gray-500">
        <p className="text-lg">Cargando producto…</p>
      </div>
    );
  }

  if (error && !loading && products.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <ProductsErrorBanner />
      </div>
    );
  }

  if (!product) return (
    <div className="max-w-7xl mx-auto px-6 py-20 text-center">
      <p className="text-5xl mb-4">😕</p>
      <h2 className="text-xl font-bold mb-2">Producto no encontrado</h2>
      <Link to="/tienda" className="text-primary-600 hover:underline">Volver a la tienda</Link>
    </div>
  );

  const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  const handleAdd = () => {
    if (!isLogged) { setShowAuth(true); return; }
    for (let i = 0; i < qty; i++) addItem(product);
    toast(`${product.name} agregado al carrito`);
  };

  const handleBuyNow = () => {
    if (!isLogged) { setShowAuth(true); return; }
    for (let i = 0; i < qty; i++) addItem(product);
    toast(`${product.name} agregado al carrito`);
    navigate('/carrito');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-8 uppercase tracking-wide">
          <Link to="/" className="hover:text-primary-600 transition">Inicio</Link>
          <ChevronRight size={12} />
          <Link to="/tienda" className="hover:text-primary-600 transition">Tienda</Link>
          <ChevronRight size={12} />
          <Link to={`/tienda?cat=${product.category}`} className="hover:text-primary-600 transition capitalize">{product.category}</Link>
          <ChevronRight size={12} />
          <span className="text-gray-700 font-semibold truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          {/* Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              key={activeImg}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="backdrop-blur-xl bg-white/70 border border-white/80 rounded-2xl overflow-hidden mb-4 shadow-lg p-1 sticky top-24"
            >
              <div className="aspect-square rounded-xl overflow-hidden">
                <img src={product.images[activeImg]} alt={product.name} className="w-full h-full object-cover" />
              </div>
            </motion.div>
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((img, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveImg(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all backdrop-blur-sm ${i === activeImg ? 'border-white/80 shadow-md bg-white/50 ring-2 ring-primary-300' : 'border-gray-200 hover:border-white/60 hover:bg-white/40'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-2">{product.brand}</p>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">{product.name}</h1>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={18} className={s <= Math.round(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-300'} />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-600">{product.rating} ({product.reviews} reseñas)</span>
            </div>

            {/* Price Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="backdrop-blur-xl bg-gradient-to-br from-primary-50/80 to-primary-100/60 border border-primary-200/60 rounded-2xl p-6 mb-6 shadow-lg"
            >
              {product.originalPrice && (
                <p className="text-sm text-gray-500 line-through mb-1">{formatPrice(product.originalPrice)}</p>
              )}
              <p className="text-4xl font-black text-primary-700 mb-2">{formatPrice(product.price)}</p>
              {product.originalPrice && (
                <p className="text-xs font-bold text-red-600">Ahorrás {formatPrice(product.originalPrice - product.price)}</p>
              )}
            </motion.div>

            {/* Stock */}
            <div className="flex items-center gap-3 mb-6 p-4 backdrop-blur-sm bg-white/50 border border-white/60 rounded-xl">
              <div className={`w-3 h-3 rounded-full ${product.stock > 3 ? 'bg-green-500' : product.stock > 0 ? 'bg-orange-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium text-gray-700">
                {product.stock > 3 ? '✓ En stock' : product.stock > 0 ? `⚠ Solo ${product.stock} disponibles` : '✕ Sin stock'}
              </span>
            </div>

            {/* Qty */}
            {product.stock > 0 && (
              <div className="flex items-center gap-4 mb-6 p-4 backdrop-blur-sm bg-white/50 border border-white/60 rounded-xl">
                <span className="text-sm font-semibold text-gray-700">Cantidad:</span>
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    className="px-4 py-2.5 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold text-primary-600"
                  >
                    −
                  </button>
                  <span className="px-6 py-2.5 text-lg font-black text-gray-900 min-w-16 text-center">{qty}</span>
                  <button
                    onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                    disabled={qty >= product.stock}
                    className="px-4 py-2.5 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold text-primary-600"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs font-semibold text-gray-500">
                  {qty} de {product.stock} disponibles
                </span>
              </div>
            )}

            {/* Payment options button */}
            {product.stock > 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowPaymentMethods(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 backdrop-blur-md bg-white/70 border-2 border-primary-300 text-primary-700 hover:bg-white/80 hover:border-primary-400 font-bold rounded-xl transition-all mb-5 shadow-sm"
              >
                <CreditCard size={18} />
                Ver medios de pago y cuotas
              </motion.button>
            )}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAdd}
                disabled={product.stock === 0}
                className="flex-1 flex items-center justify-center gap-2 border-2 border-primary-600 text-primary-600 hover:bg-primary-50 disabled:opacity-30 disabled:cursor-not-allowed font-bold py-3.5 rounded-xl transition-all"
              >
                {!isLogged ? <Lock size={18} /> : <ShoppingCart size={18} />}
                {!isLogged ? 'Iniciá sesión' : 'Agregar al carrito'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                {!isLogged ? 'Registrate' : 'Comprar ahora'}
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Description + Specs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="backdrop-blur-xl bg-white/70 border border-white/80 rounded-2xl p-8 shadow-lg"
          >
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-primary-600 rounded-full" />
              Descripción
            </h2>
            <p className="text-gray-700 leading-relaxed">{product.description}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="backdrop-blur-xl bg-white/70 border border-white/80 rounded-2xl p-8 shadow-lg"
          >
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-primary-600 rounded-full" />
              Especificaciones
            </h2>
            <dl className="space-y-3">
              {Object.entries(product.specs).map(([k, v], idx) => (
                <motion.div
                  key={k}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex justify-between items-start py-2 border-b border-gray-100 hover:bg-gray-50/50 px-2 rounded transition-colors"
                >
                  <dt className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{k}</dt>
                  <dd className="font-bold text-gray-900 text-right">{v}</dd>
                </motion.div>
              ))}
            </dl>
          </motion.div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-black text-gray-900 mb-8">Productos relacionados</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {related.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Auth modal */}
        {showAuth && (
          <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />
        )}

        {/* Payment methods modal */}
        <PaymentMethodsModal
          amount={product.price * qty}
          isOpen={showPaymentMethods}
          onClose={() => setShowPaymentMethods(false)}
        />
      </div>
    </div>
  );
};

export default ProductDetail;
