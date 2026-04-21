import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { useProducts } from '../context/ProductsContext';
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

  const catLabels: Record<string, string> = {
    electrodomesticos: 'Electrodomésticos',
    muebleria: 'Mueblería',
    colchoneria: 'Colchonería',
  };

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">Categoría</h3>
        <div className="space-y-1">
          <button onClick={() => setCategory('')} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!activeCat ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
            Todas las categorías
          </button>
          {Object.entries(catLabels).map(([id, label]) => (
            <button key={id} onClick={() => setCategory(id)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeCat === id ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">Precio</h3>
        <div className="space-y-1">
          <button onClick={() => setPriceRange(null)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${priceRange === null ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
            Cualquier precio
          </button>
          {PRICE_RANGES.map((r, i) => (
            <button key={i} onClick={() => setPriceRange(i)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${priceRange === i ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <ProductsErrorBanner />
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {activeCat ? catLabels[activeCat] : query ? `Resultados para "${query}"` : 'Todos los productos'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} productos encontrados</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sort */}
          <div className="relative hidden sm:block">
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Mobile filter toggle */}
          <button onClick={() => setFiltersOpen(!filtersOpen)} className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white">
            <SlidersHorizontal size={16} />
            Filtros
          </button>
        </div>
      </div>

      {/* Active filters */}
      {(activeCat || priceRange !== null || query) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeCat && (
            <span className="flex items-center gap-1 bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1.5 rounded-full">
              {catLabels[activeCat]}
              <button onClick={() => setCategory('')}><X size={12} /></button>
            </span>
          )}
          {priceRange !== null && (
            <span className="flex items-center gap-1 bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1.5 rounded-full">
              {PRICE_RANGES[priceRange].label}
              <button onClick={() => setPriceRange(null)}><X size={12} /></button>
            </span>
          )}
          {query && (
            <span className="flex items-center gap-1 bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1.5 rounded-full">
              "{query}"
              <button onClick={() => { const p = new URLSearchParams(params); p.delete('q'); setParams(p); }}><X size={12} /></button>
            </span>
          )}
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar - desktop */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="card p-5 sticky top-24">
            <FilterPanel />
          </div>
        </aside>

        {/* Mobile filters drawer */}
        {filtersOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              className="relative bg-white w-72 h-full overflow-y-auto p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-gray-900">Filtros</h2>
                <button onClick={() => setFiltersOpen(false)}><X size={20} /></button>
              </div>
              <FilterPanel />
            </motion.div>
          </div>
        )}

        {/* Grid */}
        <div className="flex-1">
          {loading && products.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-lg">Cargando productos…</p>
            </div>
          ) : error && products.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-sm px-4">
              No se pudo cargar el catálogo. Revisá el mensaje de error arriba.
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-lg font-medium">No encontramos productos</p>
              <p className="text-sm">Probá con otros filtros</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shop;
