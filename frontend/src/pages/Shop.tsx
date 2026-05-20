import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useProducts } from '../context/ProductsContext';
import ProductsErrorBanner from '../components/ProductsErrorBanner';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/SkeletonLoader';
import Breadcrumbs from '../components/Breadcrumbs';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'price-asc', label: 'Menor precio' },
  { value: 'price-desc', label: 'Mayor precio' },
  { value: 'rating', label: 'Mejor calificados' },
  { value: 'name', label: 'Nombre A-Z' },
];

const ITEMS_PER_PAGE = 12;

const Shop = () => {
  const { products, loading, error } = useProducts();
  const [params, setParams] = useSearchParams();
  const [sort, setSort] = useState('relevance');
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(1000000);
  const [showInStock, setShowInStock] = useState(false);
  const [showOutOfStock, setShowOutOfStock] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const activeCat = params.get('cat') || '';
  const query = params.get('q') || '';

  // Obtener todas las marcas únicas
  const allBrands = useMemo(() => {
    const brands = new Set(products.map(p => p.brand));
    return Array.from(brands).sort();
  }, [products]);

  // Obtener rango de precios
  const priceRange = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 1000000 };
    const prices = products.map(p => p.price);
    return {
      min: Math.floor(Math.min(...prices) / 10000) * 10000,
      max: Math.ceil(Math.max(...prices) / 10000) * 10000,
    };
  }, [products]);

  // Inicializar slider de precio
  React.useEffect(() => {
    setPriceMin(priceRange.min);
    setPriceMax(priceRange.max);
  }, [priceRange]);

  const filtered = useMemo(() => {
    let list = [...products];
    
    // Filtro por categoría
    if (activeCat) list = list.filter(p => p.category === activeCat);
    
    // Filtro por búsqueda
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    
    // Filtro por marca
    if (selectedBrands.size > 0) {
      list = list.filter(p => selectedBrands.has(p.brand));
    }
    
    // Filtro por precio
    list = list.filter(p => p.price >= priceMin && p.price <= priceMax);
    
    // Filtro por disponibilidad
    if (showInStock && !showOutOfStock) {
      list = list.filter(p => p.stock > 0);
    } else if (!showInStock && showOutOfStock) {
      list = list.filter(p => p.stock === 0);
    }
    
    // Ordenamiento
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
    else if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    
    return list;
  }, [activeCat, query, selectedBrands, priceMin, priceMax, showInStock, showOutOfStock, sort, products]);

  // Paginación
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  // Reset página cuando cambian los filtros
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeCat, query, selectedBrands, priceMin, priceMax, showInStock, showOutOfStock, sort]);

  const setCategory = (cat: string) => {
    const p = new URLSearchParams(params);
    if (cat) p.set('cat', cat); else p.delete('cat');
    setParams(p);
  };

  const toggleBrand = (brand: string) => {
    const newBrands = new Set(selectedBrands);
    if (newBrands.has(brand)) {
      newBrands.delete(brand);
    } else {
      newBrands.add(brand);
    }
    setSelectedBrands(newBrands);
  };

  const clearAllFilters = () => {
    setCategory('');
    setSelectedBrands(new Set());
    setPriceMin(priceRange.min);
    setPriceMax(priceRange.max);
    setShowInStock(false);
    setShowOutOfStock(false);
    const p = new URLSearchParams(params);
    p.delete('q');
    setParams(p);
  };

  const hasActiveFilters = activeCat || selectedBrands.size > 0 || 
    priceMin !== priceRange.min || priceMax !== priceRange.max || 
    showInStock || showOutOfStock || query;

  const catLabels: Record<string, string> = {
    electrodomesticos: 'Electrodomésticos',
    muebleria: 'Mueblería',
    colchoneria: 'Colchonería',
  };

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Clear all */}
      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center gap-1 py-2 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
        >
          <X size={14} />
          Limpiar filtros
        </button>
      )}

      {/* Category */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">Categoría</h3>
        <div className="space-y-1">
          <button 
            onClick={() => setCategory('')} 
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              !activeCat ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Todas las categorías
          </button>
          {Object.entries(catLabels).map(([id, label]) => (
            <button 
              key={id} 
              onClick={() => setCategory(id)} 
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeCat === id ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">Marca</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {allBrands.map(brand => (
            <label key={brand} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedBrands.has(brand)}
                onChange={() => toggleBrand(brand)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                {brand}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">Precio</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>${priceMin.toLocaleString()}</span>
            <span>${priceMax.toLocaleString()}</span>
          </div>
          
          {/* Min slider */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Mínimo</label>
            <input
              type="range"
              min={priceRange.min}
              max={priceRange.max}
              step={10000}
              value={priceMin}
              onChange={e => setPriceMin(Math.min(Number(e.target.value), priceMax - 10000))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
          </div>
          
          {/* Max slider */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Máximo</label>
            <input
              type="range"
              min={priceRange.min}
              max={priceRange.max}
              step={10000}
              value={priceMax}
              onChange={e => setPriceMax(Math.max(Number(e.target.value), priceMin + 10000))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
          </div>
        </div>
      </div>

      {/* Availability */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">Disponibilidad</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={showInStock}
              onChange={e => setShowInStock(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
              En stock
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={showOutOfStock}
              onChange={e => setShowOutOfStock(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
              Sin stock
            </span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <ProductsErrorBanner />
      
      {/* Breadcrumb */}
      {activeCat && (
        <Breadcrumbs items={[
          { label: 'Tienda', path: '/tienda' },
          { label: catLabels[activeCat] },
        ]} />
      )}
      
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
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeCat && (
            <span className="flex items-center gap-1 bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1.5 rounded-full">
              {catLabels[activeCat]}
              <button onClick={() => setCategory('')}><X size={12} /></button>
            </span>
          )}
          {Array.from(selectedBrands).map(brand => (
            <span key={brand} className="flex items-center gap-1 bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1.5 rounded-full">
              {brand}
              <button onClick={() => toggleBrand(brand)}><X size={12} /></button>
            </span>
          ))}
          {(priceMin !== priceRange.min || priceMax !== priceRange.max) && (
            <span className="flex items-center gap-1 bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1.5 rounded-full">
              ${priceMin.toLocaleString()} - ${priceMax.toLocaleString()}
              <button onClick={() => { setPriceMin(priceRange.min); setPriceMax(priceRange.max); }}>
                <X size={12} />
              </button>
            </span>
          )}
          {showInStock && (
            <span className="flex items-center gap-1 bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1.5 rounded-full">
              En stock
              <button onClick={() => setShowInStock(false)}><X size={12} /></button>
            </span>
          )}
          {showOutOfStock && (
            <span className="flex items-center gap-1 bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1.5 rounded-full">
              Sin stock
              <button onClick={() => setShowOutOfStock(false)}><X size={12} /></button>
            </span>
          )}
          {query && (
            <span className="flex items-center gap-1 bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1.5 rounded-full">
              "{query}"
              <button onClick={() => { const p = new URLSearchParams(params); p.delete('q'); setParams(p); }}>
                <X size={12} />
              </button>
            </span>
          )}
          <button
            onClick={clearAllFilters}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Limpiar todo
          </button>
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
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <ProductCardSkeleton key={i} />
              ))}
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
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedProducts.map((p, i) => (
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

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Anterior
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                      // Mostrar solo algunas páginas alrededor de la actual
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                              page === currentPage
                                ? 'bg-primary-600 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return <span key={page} className="text-gray-400">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shop;
