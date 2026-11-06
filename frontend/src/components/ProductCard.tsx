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
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="card group flex flex-col overflow-hidden h-full"
      >
        <Link to={`/producto/${product.slug}`} className="flex flex-col flex-1">
          {/* Image */}
          <div className="relative overflow-hidden bg-gray-50 aspect-square">
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            {discount && (
              <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-red-500 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md">
                -{discount}%
              </span>
            )}
            {product.stock <= 3 && product.stock > 0 && (
              <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-orange-100 text-orange-700 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md">
                ¡Últimas!
              </span>
            )}
            {product.stock === 0 && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <span className="text-gray-500 font-medium text-xs sm:text-sm">Sin stock</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-2.5 sm:p-4 flex flex-col flex-1">
            <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">{product.brand}</p>
            <h3 className="text-xs sm:text-sm font-medium text-gray-800 leading-snug mb-1.5 sm:mb-2 line-clamp-2 flex-1">
              {product.name}
            </h3>

            {/* Rating */}
            <div className="flex items-center gap-1 mb-2 sm:mb-3">
              <div className="flex">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={10} className={s <= Math.round(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
                ))}
              </div>
              <span className="text-[10px] sm:text-xs text-gray-400">({product.reviews})</span>
            </div>

            {/* Price */}
            <div className="mb-2 sm:mb-3">
              {product.originalPrice && (
                <p className="text-[10px] sm:text-xs text-gray-400 line-through">{formatPrice(product.originalPrice)}</p>
              )}
              <p className="text-base sm:text-lg font-bold text-gray-900">{formatPrice(product.price)}</p>
              <p className="text-[10px] sm:text-xs text-green-600 font-medium">12 cuotas sin interés</p>
            </div>
          </div>
        </Link>

        {/* Add to cart */}
        <div className="px-2.5 pb-2.5 sm:px-4 sm:pb-4">
          <button
            onClick={handleAdd}
            disabled={product.stock === 0}
            className="w-full flex items-center justify-center gap-1.5 sm:gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs sm:text-sm font-semibold py-2 sm:py-2.5 rounded-lg transition-all duration-200 active:scale-95"
          >
            {!isLogged ? <Lock size={14} /> : <ShoppingCart size={14} />}
            <span className="sm:inline">
              {product.stock === 0 ? 'Sin stock' : !isLogged ? 'Iniciá sesión' : 'Agregar'}
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
