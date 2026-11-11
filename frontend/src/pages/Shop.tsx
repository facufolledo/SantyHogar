import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { useProducts } from '../context/ProductsContext';
import { useCategoriesNav } from '../hooks/useCategoriesNav';
import ProductsErrorBanner from '../components/ProductsErrorBanner';
import ProductCard from '../components/ProductCard';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'price-asc', label: 'Menor precio' },
  { value: 'price-desc', label: 'Mayor precio' },
  { value: 'rating', label: 'Mejor calificados' },
];

const PRICE_RANGES = [
  { label: 'Hasta $100.000', min: 0, max: 100000 },
  { label: '$100.000 – $300.000', min: 100000, max: 300000 },
  { label: '$300.000 – $500.000', min: 300000, max: 500000 },
  { label: 'Más de $500.000', min: 500000, max: Infinity },
];

const Shop = () => {
  const { products, loading, error } = useProducts();
  const { categories: apiCategories } = useCategoriesNav();
  const [params, setParams] = useSearchParams();
  const [sort, setSort] = useState('relevance');
  const [priceRange, setPriceRange] = useState<number | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeCat = params.get('cat') || '';
  const query = params.get('q') || '';

  const filtered = useMemo(() => {
    let list = [...products];
    if (activeCat) list = list.filter(p => p.category === activeCat);
    if (query) list = list.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.brand.toLowerCase().includes(query.toLowerCase()));
    if (priceRange !== null) {
      const range = PRICE_RANGES[priceRange];
      list = list.filter(p => p.price >= range.min && p.price <= range.max);
    }
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [activeCat, query, priceRange, sort, products]);

  const setCategory = (cat: string) => {
    const p = new URLSearchParams(params);
    if (cat) p.set('cat', cat); else p.delete('cat');
    setParams(p);
  };

  // Construir catLabels dinámicamente de la API
  const catLabels: Record<string, string> = useMemo(() => {
    const labels: Record<string, string> = {};
    if (Array.isArray(apiCategories)) {
      apiCategories.forEach(cat => {
        labels[cat.slug] = cat.nombre;
      });
    }
    return labels;
  }, [apiCategories]);

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <h3 className="font-black text-gray-900 mb-4 text-xs uppercase tracking-widest">Categoría</h3>
        <div className="space-y-2">
          <button onClick={() => setCategory('')} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${!activeCat ? 'backdrop-blur-md bg-gradient-to-r from-primary-500/30 to-primary-600/20 text-primary-900 border border-primary-200/60 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'}`}>
            Todas las categorías
          </button>
          {Array.isArray(apiCategories) && apiCategories.map((cat) => (
            <button key={cat.id_categoria} onClick={() => setCategory(cat.slug)} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeCat === cat.slug ? 'backdrop-blur-md bg-gradient-to-r from-primary-500/30 to-primary-600/20 text-primary-900 border border-primary-200/60 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'}`}>
              {cat.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div className="pt-4 border-t border-gray-200/60">
        <h3 className="font-black text-gray-900 mb-4 text-xs uppercase tracking-widest">Precio</h3>
        <div className="space-y-2">
          <button onClick={() => setPriceRange(null)} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${priceRange === null ? 'backdrop-blur-md bg-gradient-to-r from-emerald-500/30 to-emerald-600/20 text-emerald-900 border border-emerald-200/60 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'}`}>
            Cualquier precio
          </button>
          {PRICE_RANGES.map((r, i) => (
            <button key={i} onClick={() => setPriceRange(i)} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${priceRange === i ? 'backdrop-blur-md bg-gradient-to-r from-emerald-500/30 to-emerald-600/20 text-emerald-900 border border-emerald-200/60 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <ProductsErrorBanner />
        
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-2">
                {activeCat ? catLabels[activeCat] : query ? `Resultados para "${query}"` : 'Nuestro catálogo'}
              </h1>
              <p className="text-gray-600">{filtered.length} productos disponibles</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Sort */}
              <div className="relative hidden sm:block">
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-3 backdrop-blur-xl bg-white/60 border border-gray-200/80 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer transition-all hover:bg-white/80 shadow-sm"
                >
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
              </div>

              {/* Mobile filter toggle */}
              <button onClick={() => setFiltersOpen(!filtersOpen)} className="lg:hidden flex items-center gap-2 px-4 py-3 backdrop-blur-xl bg-gradient-to-r from-slate-600/40 to-slate-700/40 border border-gray-300/50 rounded-xl text-sm font-semibold text-gray-900 hover:from-slate-600/60 hover:to-slate-700/60 transition-all shadow-sm">
                <SlidersHorizontal size={16} />
                Filtros
              </button>
            </div>
          </div>

          {/* Active filters */}
          {(activeCat || priceRange !== null || query) && (
            <div className="flex flex-wrap gap-2">
              {activeCat && (
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-2 backdrop-blur-md bg-gradient-to-r from-blue-500/30 to-blue-600/20 text-blue-900 text-xs font-semibold px-4 py-2 rounded-full border border-blue-200/60 shadow-sm"
                >
                  {catLabels[activeCat]}
                  <button onClick={() => setCategory('')} className="hover:text-blue-700 transition"><X size={14} /></button>
                </motion.span>
              )}
              {priceRange !== null && (
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-2 backdrop-blur-md bg-gradient-to-r from-emerald-500/30 to-emerald-600/20 text-emerald-900 text-xs font-semibold px-4 py-2 rounded-full border border-emerald-200/60 shadow-sm"
                >
                  {PRICE_RANGES[priceRange].label}
                  <button onClick={() => setPriceRange(null)} className="hover:text-emerald-700 transition"><X size={14} /></button>
                </motion.span>
              )}
              {query && (
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-2 backdrop-blur-md bg-gradient-to-r from-purple-500/30 to-purple-600/20 text-purple-900 text-xs font-semibold px-4 py-2 rounded-full border border-purple-200/60 shadow-sm"
                >
                  "{query}"
                  <button onClick={() => { const p = new URLSearchParams(params); p.delete('q'); setParams(p); }} className="hover:text-purple-700 transition"><X size={14} /></button>
                </motion.span>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-8">
          {/* Sidebar - desktop */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="backdrop-blur-xl bg-white/70 border border-gray-200/80 rounded-2xl p-6 sticky top-24 shadow-lg transition-all duration-200 hover:shadow-xl">
              <FilterPanel />
            </div>
          </aside>

          {/* Mobile filters drawer */}
          {filtersOpen && (
            <div className="lg:hidden fixed inset-0 z-40 flex">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setFiltersOpen(false)}
              />
              <motion.div
                initial={{ x: -320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -320, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="relative bg-gradient-to-b from-white to-slate-50 w-80 h-full overflow-y-auto p-6 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-black text-gray-900 text-lg">Filtros</h2>
                  <button onClick={() => setFiltersOpen(false)} className="hover:bg-gray-100 p-2 rounded-lg transition duration-200"><X size={22} className="text-gray-700" /></button>
                </div>
                <FilterPanel />
              </motion.div>
            </div>
          )}

          {/* Grid */}
          <div className="flex-1">
            {loading && products.length === 0 ? (
              <div className="text-center py-32">
                <motion.div
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-block backdrop-blur-xl bg-white/70 border border-gray-200/80 rounded-2xl p-12"
                >
                  <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-primary-600 animate-spin mx-auto mb-4" />
                  <p className="text-lg font-semibold text-gray-800">Cargando productos…</p>
                </motion.div>
              </div>
            ) : error && products.length === 0 ? (
              <div className="text-center py-24 px-4">
                <div className="inline-block backdrop-blur-xl bg-red-50/80 border border-red-200/60 rounded-2xl p-8">
                  <p className="text-gray-700 font-medium">No se pudo cargar el catálogo. Revisá el mensaje de error arriba.</p>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-32">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-block"
                >
                  <div className="backdrop-blur-xl bg-white/70 border border-gray-200/80 rounded-2xl p-12">
                    <p className="text-6xl mb-4">🔍</p>
                    <p className="text-2xl font-black text-gray-900 mb-2">No encontramos productos</p>
                    <p className="text-gray-600">Probá con otros filtros o palabras clave</p>
                  </div>
                </motion.div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {filtered.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                  >
                    <ProductCard product={p} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
