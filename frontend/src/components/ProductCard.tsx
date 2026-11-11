import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, Lock } from 'lucide-react';
import type { Product } from '../data/products';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice, discountPercent } from '../utils/format';
import AuthModal from './AuthModal';

interface Props {
  product: Product;
}

const ProductCard = ({ product }: Props) => {
  const { addItem } = useCart();
  const { isLogged } = useAuth();
  const { toast } = useToast();
  const [showAuth, setShowAuth] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLogged) {
      setShowAuth(true);
      return;
    }
    addItem(product);
    toast(`${product.name} agregado al carrito`);
  };

  const discount = product.originalPrice ? discountPercent(product.originalPrice, product.price) : null;

  return (
    <>
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ duration: 0.2 }}
        className="group flex flex-col overflow-hidden h-full backdrop-blur-xl bg-white/50 border border-white/60 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300"
      >
        <Link to={`/producto/${product.slug}`} className="flex flex-col flex-1">
          {/* Image */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100/60 aspect-square m-3 rounded-xl backdrop-blur-md border border-blue-200/60 shadow-sm">
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
            />
            {discount && (
              <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg shadow-lg">
                -{discount}%
              </span>
            )}
            {product.stock <= 3 && product.stock > 0 && (
              <span className="absolute top-2 right-2 sm:top-3 sm:right-3 backdrop-blur-md bg-orange-500/90 text-white text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-orange-300/50">
                ¡Últimas!
              </span>
            )}
            {product.stock === 0 && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <span className="text-white font-bold text-xs sm:text-sm">Sin stock</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-3 sm:p-4 flex flex-col flex-1">
            <p className="text-[10px] sm:text-xs text-gray-500 font-medium mb-1 sm:mb-1.5 uppercase tracking-wide">{product.brand}</p>
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 leading-snug mb-2 sm:mb-3 line-clamp-2 flex-1">
              {product.name}
            </h3>

            {/* Rating */}
            <div className="flex items-center gap-1.5 mb-3 sm:mb-4">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={12} className={s <= Math.round(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-300'} />
                ))}
              </div>
              <span className="text-[10px] sm:text-xs text-gray-500">({product.reviews})</span>
            </div>

            {/* Price */}
            <div className="mb-3 sm:mb-4">
              {product.originalPrice && (
                <p className="text-[10px] sm:text-xs text-gray-400 line-through">{formatPrice(product.originalPrice)}</p>
              )}
              <p className="text-base sm:text-lg font-black text-gray-900">{formatPrice(product.price)}</p>
            </div>
          </div>
        </Link>

        {/* Add to cart */}
        <div className="px-3 pb-3 sm:px-4 sm:pb-4">
          <button
            onClick={handleAdd}
            disabled={product.stock === 0}
            className="w-full flex items-center justify-center gap-1.5 sm:gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-gray-300 disabled:to-gray-400 disabled:text-gray-500 text-white text-xs sm:text-sm font-bold py-2.5 sm:py-3 rounded-xl transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg cursor-pointer"
          >
            {!isLogged ? <Lock size={15} /> : <ShoppingCart size={15} />}
            <span>
              {product.stock === 0 ? 'Sin stock' : !isLogged ? 'Inicia sesión' : 'Agregar'}
            </span>
          </button>
        </div>
      </motion.div>

      {/* Auth modal */}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={() => {
            setShowAuth(false);
            addItem(product);
            toast(`${product.name} agregado al carrito`);
          }}
        />
      )}
    </>
  );
};

export default ProductCard;
