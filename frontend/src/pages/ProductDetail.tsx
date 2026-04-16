import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, ChevronRight, Star, Truck, Shield, RefreshCw, Minus, Plus, Lock } from 'lucide-react';
import { products } from '../data/products';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/format';
import ProductCard from '../components/ProductCard';
import AuthModal from '../components/AuthModal';

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const product = products.find(p => p.slug === slug);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [showAuth, setShowAuth] = useState(false);
  const { addItem } = useCart();
  const { isLogged } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-primary-600">Inicio</Link>
        <ChevronRight size={14} />
        <Link to="/tienda" className="hover:text-primary-600">Tienda</Link>
        <ChevronRight size={14} />
        <Link to={`/tienda?cat=${product.category}`} className="hover:text-primary-600 capitalize">{product.category}</Link>
        <ChevronRight size={14} />
        <span className="text-gray-800 font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
        {/* Gallery */}
        <div>
          <motion.div
            key={activeImg}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="aspect-square rounded-2xl overflow-hidden bg-gray-50 mb-3"
          >
            <img src={product.images[activeImg]} alt={product.name} className="w-full h-full object-cover" />
          </motion.div>
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === activeImg ? 'border-primary-600' : 'border-transparent'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-sm text-gray-400 mb-1">{product.brand} · {product.subcategory}</p>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={16} className={s <= Math.round(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
              ))}
            </div>
            <span className="text-sm text-gray-500">{product.rating} ({product.reviews} reseñas)</span>
          </div>

          {/* Price */}
          <div className="bg-gray-50 rounded-xl p-4 mb-5">
            {product.originalPrice && (
              <p className="text-sm text-gray-400 line-through">{formatPrice(product.originalPrice)}</p>
            )}
            <p className="text-3xl font-black text-gray-900">{formatPrice(product.price)}</p>
            <p className="text-sm text-green-600 font-medium mt-1">
              12 cuotas de {formatPrice(Math.round(product.price / 12))} sin interés
            </p>
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2 mb-5">
            <div className={`w-2 h-2 rounded-full ${product.stock > 3 ? 'bg-green-500' : product.stock > 0 ? 'bg-orange-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {product.stock > 3 ? 'En stock' : product.stock > 0 ? `Solo ${product.stock} disponibles` : 'Sin stock'}
            </span>
          </div>

          {/* Qty */}
          {product.stock > 0 && (
            <div className="flex items-center gap-3 mb-5">
              <span className="text-sm text-gray-600 font-medium">Cantidad:</span>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-gray-50 transition-colors">
                  <Minus size={14} />
                </button>
                <span className="px-4 py-2 text-sm font-semibold border-x border-gray-200">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="px-3 py-2 hover:bg-gray-50 transition-colors">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button onClick={handleAdd} disabled={product.stock === 0} className="flex-1 flex items-center justify-center gap-2 border-2 border-primary-600 text-primary-600 hover:bg-primary-50 disabled:opacity-40 font-semibold py-3 rounded-xl transition-all">
              {!isLogged ? <Lock size={18} /> : <ShoppingCart size={18} />}
              {!isLogged ? 'Iniciá sesión para comprar' : 'Agregar al carrito'}
            </button>
            <button onClick={handleBuyNow} disabled={product.stock === 0} className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-all active:scale-95">
              {!isLogged ? 'Registrate' : 'Comprar ahora'}
            </button>
          </div>

          {/* Trust */}
          <div className="space-y-2 border-t border-gray-100 pt-4">
            {[
              { icon: Truck, text: 'Envío gratis en compras mayores a $200.000' },
              { icon: Shield, text: 'Garantía oficial del fabricante' },
              { icon: RefreshCw, text: 'Devolución sin cargo en 30 días' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm text-gray-600">
                <Icon size={15} className="text-primary-600 flex-shrink-0" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Description + Specs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-3">Descripción</h2>
          <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
        </div>
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-3">Especificaciones</h2>
          <dl className="space-y-2">
            {Object.entries(product.specs).map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm border-b border-gray-50 pb-2">
                <dt className="text-gray-500">{k}</dt>
                <dd className="font-medium text-gray-800">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-5">Productos relacionados</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {/* Auth modal */}
      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />
      )}
    </div>
  );
};

export default ProductDetail;
