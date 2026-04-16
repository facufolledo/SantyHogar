import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, TrendingUp, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { products as initialProducts } from '../../data/products';
import type { Product } from '../../data/products';
import { formatPrice } from '../../utils/format';
import { useToast } from '../../context/ToastContext';
import ProductFormModal from './ProductFormModal';

const PAGE_SIZE = 20;

const catColors: Record<string, string> = {
  electrodomesticos: 'bg-blue-500/20 text-blue-400',
  muebleria: 'bg-purple-500/20 text-purple-400',
  colchoneria: 'bg-green-500/20 text-green-400',
};

export default function AdminProducts() {
  const [list, setList] = useState(initialProducts);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const { toast } = useToast();

  const filtered = useMemo(() =>
    list.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase())
    ), [list, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 when search changes
  const handleSearch = (val: string) => { setSearch(val); setPage(1); };

  const handleDelete = (id: string) => {
    setList(prev => prev.filter(p => p.id !== id));
    toast('Producto eliminado', 'error');
  };

  const handleSave = (data: Partial<Product>) => {
    if (editing) {
      setList(prev => prev.map(p => p.id === editing.id ? { ...p, ...data } : p));
      toast('Producto actualizado');
    } else {
      const newProduct = {
        ...initialProducts[0], ...data,
        id: Date.now().toString(),
        slug: (data.name || '').toLowerCase().replace(/\s+/g, '-'),
        images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80'],
        rating: 0, reviews: 0, featured: false,
      } as Product;
      setList(prev => [...prev, newProduct]);
      toast('Producto creado');
    }
    setModalOpen(false);
    setEditing(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-white">Productos</h2>
          <p className="text-sm text-gray-500">{list.length} productos · {list.filter(p => p.stock <= 3).length} con stock bajo</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true); }}
          className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Nuevo producto
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input type="text" placeholder="Buscar productos..." value={search} onChange={e => handleSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700/60 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>

      <div className="bg-gray-800 border border-gray-700/60 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-700/60">
              <tr>
                {['Producto', 'Categoría', 'Precio', 'Margen', 'Stock', 'Estado', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/40">
              {paginated.map((p, i) => {
                const cost = Math.round(p.price * 0.6);
                const margin = Math.round(((p.price - cost) / cost) * 100);
                return (
                  <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-200 line-clamp-1 max-w-[180px]">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.brand} · SKU-{p.id.padStart(4, '0')}</p>
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
                      {p.originalPrice && <p className="text-xs text-gray-500 line-through">{formatPrice(p.originalPrice)}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <TrendingUp size={13} className="text-green-400" />
                        <span className="text-sm font-semibold text-green-400">{margin}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium text-sm ${p.stock === 0 ? 'text-red-400' : p.stock <= 3 ? 'text-orange-400' : 'text-gray-300'}`}>
                        {p.stock} {p.stock <= 3 && p.stock > 0 && '⚠️'}{p.stock === 0 && '❌'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${p.stock > 0 ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-500'}`}>
                        {p.stock > 0 ? 'Activo' : 'Sin stock'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditing(p); setModalOpen(true); }}
                          className="p-1.5 text-gray-500 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-600">
              <Package size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No se encontraron productos</p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500">
            Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length} productos
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPage(n)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  n === page ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <ProductFormModal product={editing} onSave={handleSave} onClose={() => { setModalOpen(false); setEditing(null); }} />
        )}
      </AnimatePresence>
    </div>
  );
}
