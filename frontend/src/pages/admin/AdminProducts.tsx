import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Edit2, TrendingUp, Package, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import type { Product } from '../../data/products';
import { formatPrice } from '../../utils/format';
import { useProducts } from '../../context/ProductsContext';
import ProductsErrorBanner from '../../components/ProductsErrorBanner';
import ProductFormModal from './ProductFormModal';

const PAGE_SIZE = 20;

const catColors: Record<string, string> = {
  electrodomesticos: 'bg-blue-500/20 text-blue-400',
  muebleria: 'bg-purple-500/20 text-purple-400',
  colchoneria: 'bg-green-500/20 text-green-400',
};

function shortId(id: string) {
  return id.length > 14 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
}

export default function AdminProducts() {
  const { products, loading, error } = useProducts();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewing, setViewing] = useState<Product | null>(null);

  const filtered = useMemo(
    () =>
      products.filter(
        p =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.brand.toLowerCase().includes(search.toLowerCase())
      ),
    [products, search]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-white">Productos</h2>
          <p className="text-sm text-gray-500">
            Catálogo desde la base de datos (solo lectura).{' '}
            {loading ? 'Cargando…' : `${products.length} productos · ${products.filter(p => p.stock <= 3).length} con stock bajo`}
          </p>
        </div>
      </div>

      <ProductsErrorBanner />

      {!loading && !error && (
        <p className="text-xs text-gray-600 rounded-lg border border-gray-700/60 bg-gray-800/50 px-3 py-2">
          Para crear o editar productos usá la base de datos o Supabase; cuando existan endpoints de administración se podrá hacer desde acá.
        </p>
      )}

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar productos..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
          disabled={loading || Boolean(error)}
          className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700/60 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
        />
      </div>

      <div className="bg-gray-800 border border-gray-700/60 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading && (
            <div className="text-center py-16 text-gray-500">
              <p>Cargando productos desde la API…</p>
            </div>
          )}
          {!loading && (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700/60">
                <tr>
                  {['Producto', 'Categoría', 'Precio', 'Margen', 'Stock', 'Estado', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/40">
                {paginated.map((p, i) => {
                  const cost = Math.round(p.price * 0.6);
                  const margin = cost > 0 ? Math.round(((p.price - cost) / cost) * 100) : 0;
                  const img = p.images[0];
                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {img ? (
                            <img src={img} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-700 flex-shrink-0" />
                          )}
                          <div>
                            <p className="font-medium text-gray-200 line-clamp-1 max-w-[180px]">{p.name}</p>
                            <p className="text-xs text-gray-500">
                              {p.brand} · {shortId(p.id)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${catColors[p.category]}`}>
                          {p.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-white">{formatPrice(p.price)}</p>
                        {p.originalPrice != null && p.originalPrice > 0 && (
                          <p className="text-xs text-gray-500 line-through">{formatPrice(p.originalPrice)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <TrendingUp size={13} className="text-green-400" />
                          <span className="text-sm font-semibold text-green-400">{margin}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-medium text-sm ${
                            p.stock === 0 ? 'text-red-400' : p.stock <= 3 ? 'text-orange-400' : 'text-gray-300'
                          }`}
                        >
                          {p.stock} {p.stock <= 3 && p.stock > 0 && '⚠️'}
                          {p.stock === 0 && '❌'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            p.stock > 0 ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-500'
                          }`}
                        >
                          {p.stock > 0 ? 'Activo' : 'Sin stock'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => {
                            setViewing(p);
                            setModalOpen(true);
                          }}
                          className="p-1.5 text-gray-500 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
                          title="Ver detalle"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {!loading && filtered.length === 0 && !error && (
            <div className="text-center py-12 text-gray-600">
              <Package size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay productos en la base o no coinciden con la búsqueda.</p>
            </div>
          )}
        </div>
      </div>

      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500">
            Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}{' '}
            productos
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  n === page ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {modalOpen && viewing && (
          <ProductFormModal
            product={viewing}
            readOnly
            onSave={() => {}}
            onClose={() => {
              setModalOpen(false);
              setViewing(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
