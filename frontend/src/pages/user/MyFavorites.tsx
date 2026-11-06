import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useProducts } from '../../context/ProductsContext';
import { mockUser } from '../../data/user';
import ProductCard from '../../components/ProductCard';

export default function MyFavorites() {
  const { products } = useProducts();
  const [favIds, setFavIds] = useState<string[]>(mockUser.favorites);
  const favProducts = products.filter(
    p => favIds.includes(p.id) || favIds.includes(p.slug)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-900">Mis favoritos</h2>
        <span className="text-sm text-gray-400">{favProducts.length} productos</span>
      </div>

      {favProducts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Heart size={48} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">No tenés productos favoritos</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <AnimatePresence>
            {favProducts.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
                className="relative"
              >
                <button
                  onClick={() => setFavIds(prev => prev.filter(x => x !== p.id && x !== p.slug))}
                  className="absolute top-2 right-2 z-10 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                  title="Quitar de favoritos"
                >
                  <Heart size={14} className="fill-red-500" />
                </button>
                <ProductCard product={p} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
