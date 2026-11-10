import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useProducts } from '../context/ProductsContext';
import { useCategoriesNav } from '../hooks/useCategoriesNav';
import ProductsErrorBanner from '../components/ProductsErrorBanner';
import ProductCard from '../components/ProductCard';

// Metadata por slug de categoría (icon + description)
const CATEGORY_METADATA: Record<string, { description: string; icon: JSX.Element }> = {
  'electrodomesticos': {
    description: 'Heladeras, cocinas y lavarropas',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/><path d="M9 6h6M9 10h6"/>
      </svg>
    ),
  },
  'muebleria': {
    description: 'Muebles modernos y funcionales',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0Z"/><path d="M4 18v2M20 18v2M12 4v9"/>
      </svg>
    ),
  },
  'colchones': {
    description: 'Colchones y sommiers de calidad',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>
      </svg>
    ),
  },
};

const Home = () => {
  const { products, loading } = useProducts();
  const { categories: apiCategories, loading: categoriesLoading } = useCategoriesNav();
  
  const [slide, setSlide] = useState(0);
  const [slides, setSlides] = useState<any[]>([]);
  const [heroLoading, setHeroLoading] = useState(true);
  const [carouselScroll, setCarouselScroll] = useState(0);
  const [displayedProducts, setDisplayedProducts] = useState<any[]>([]);

  // Cargar heroes desde la API
  useEffect(() => {
    const fetchHeroes = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/hero-slides`);
        if (response.ok) {
          const data = await response.json();
          setSlides(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error fetching hero slides:', error);
        setSlides([]);
      } finally {
        setHeroLoading(false);
      }
    };

    fetchHeroes();
  }, []);
  
  const categories = useMemo(() => {
    // Usar categorías dinámicas de la API
    if (Array.isArray(apiCategories) && apiCategories.length > 0) {
      return apiCategories.map(cat => {
        // Mapear estructura del hook al formato esperado
        const categorySlug = cat.slug || cat.id_categoria || '';
        const productCount = Array.isArray(products) 
          ? products.filter(p => {
              const productCat = p.category?.toLowerCase() || '';
              return productCat === categorySlug.toLowerCase();
            }).length
          : 0;
        
        // Obtener metadata (icon + description) o usar defaults
        const metadata = CATEGORY_METADATA[categorySlug.toLowerCase()] || {
          description: 'Ver productos de esta categoría',
          icon: null,
        };
        
        return {
          id: cat.id_categoria,
          slug: categorySlug,
          name: cat.nombre,
          image: cat.image || `https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&q=80`, // Fallback
          count: productCount,
          description: metadata.description,
          icon: metadata.icon,
        };
      });
    }
    
    return [];
  }, [apiCategories, products]);
  
  const featured = useMemo(() => {
    try {
      const result = (Array.isArray(products) ? products : []).filter(p => p.featured).slice(0, 8);
      return result;
    } catch (e) {
      return [];
    }
  }, [products]);

  useEffect(() => {
    if (slides.length > 0) {
      const t = setInterval(() => setSlide(s => (s + 1) % slides.length), 5000);
      return () => clearInterval(t);
    }
  }, [slides.length]);

  // Fijar los productos al cargar para que no cambien
  useEffect(() => {
    if (products.length > 0 && displayedProducts.length === 0) {
      const randomized = [...products]
        .sort(() => Math.random() - 0.5)
        .slice(0, 8);
      setDisplayedProducts(randomized);
    }
  }, [products]);

  const prev = () => {
    if (slides.length > 0) {
      setSlide(s => (s - 1 + slides.length) % slides.length);
    }
  };
  
  const next = () => {
    if (slides.length > 0) {
      setSlide(s => (s + 1) % slides.length);
    }
  };

  return (
    <div>
      {/* Hero con transición suave */}
      {!heroLoading && slides.length > 0 ? (
        <>
          <section className="relative overflow-hidden bg-gray-900 h-[420px] md:h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0"
            >
              <img
                src={slides[slide].imagenUrl || slides[slide].imagen_url}
                alt={slides[slide].titulo}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Gradiente suave */}
              <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 via-gray-900/50 to-gray-900/20" />
              <div className="absolute inset-0 bg-gradient-to-r from-gray-900/60 via-transparent to-transparent" />
            </motion.div>
          </AnimatePresence>

          <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide}
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.5 }}
                className="max-w-xl"
              >
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-3 drop-shadow-lg">
                  {slides[slide].titulo}
                </h1>
                <p className="text-white/90 text-lg mb-6 drop-shadow-md">{slides[slide].subtitulo}</p>
                {slides[slide].enlace && (
                  <Link
                    to={slides[slide].enlace}
                    className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-orange-500/30 cursor-pointer"
                  >
                    {slides[slide].textoCta || 'Ver más'} <ChevronRight size={18} />
                  </Link>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Arrows */}
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full p-2.5 transition-all cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full p-2.5 transition-all cursor-pointer"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className={`transition-all duration-200 cursor-pointer ${
                  i === slide ? 'bg-orange-500 w-8 h-2.5 rounded-full' : 'bg-white/40 hover:bg-white/60 w-2.5 h-2.5 rounded-full'
                }`}
              />
            ))}
          </div>
        </section>
        </>
      ) : null}

      {/* Categories - horizontal carousel */}
      <section className="relative bg-gradient-to-b from-slate-700 via-slate-600/40 to-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">Comprá por categoría</h2>
          </div>
          
          {/* Carrusel con flechas */}
          <div className="relative group">
            <div className="overflow-hidden rounded-xl">
              <div 
                className="flex gap-4 pb-4 transition-transform duration-500 ease-out"
                style={{
                  transform: `translateX(calc(-${carouselScroll}px))`
                }}
              >
                {(categoriesLoading || loading) && apiCategories.length === 0 ? (
                  <p className="text-center text-gray-500 w-full">Cargando…</p>
                ) : Array.isArray(categories) && categories.length > 0 ? (
                  categories.map((cat) => (
                    <Link 
                      key={cat.id}
                      to={`/tienda?cat=${cat.slug}`}
                      className="flex-shrink-0 w-44 h-40 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-br from-white to-blue-50/60 border border-blue-100/50 cursor-pointer group/card"
                    >
                      <div className="w-full h-full flex flex-col items-center justify-center p-3 relative">
                        {/* Imagen grande */}
                        <div className="flex-1 flex items-center justify-center w-full mb-2">
                          {cat.image ? (
                            <img src={cat.image} alt={cat.name} className="h-24 w-auto object-contain group-hover/card:scale-110 transition-transform duration-300" />
                          ) : (
                            <div className="text-5xl">{cat.icon || '📦'}</div>
                          )}
                        </div>
                        {/* Nombre */}
                        <p className="text-sm font-semibold text-gray-800 text-center line-clamp-2 w-full">{cat.name}</p>
                      </div>
                    </Link>
                  ))
                ) : null}
              </div>
            </div>
            
            {/* Flecha izquierda */}
            <button 
              onClick={() => {
                setCarouselScroll(Math.max(0, carouselScroll - 200));
              }}
              disabled={carouselScroll === 0}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white border border-gray-300 rounded-full p-2 shadow-md hover:shadow-lg hover:bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} className="text-gray-700" />
            </button>
            
            {/* Flecha derecha */}
            <button 
              onClick={() => {
                const maxScroll = Math.max(0, (categories.length - 5) * 196);
                setCarouselScroll(Math.min(maxScroll, carouselScroll + 200));
              }}
              disabled={carouselScroll >= Math.max(0, (categories.length - 5) * 196)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white border border-gray-300 rounded-full p-2 shadow-md hover:shadow-lg hover:bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} className="text-gray-700" />
            </button>
          </div>
        </div>
      </section>

      {/* All products - randomized with pagination */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Nuestros productos</h2>
            </div>
            {Array.isArray(products) && products.length > 8 && (
              <Link 
                to="/tienda"
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center gap-2 cursor-pointer text-sm"
              >
                Ver todos
                <ChevronRight size={16} />
              </Link>
            )}
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {loading && displayedProducts.length === 0 ? (
                <p className="col-span-full text-center text-gray-500 py-12">Cargando productos…</p>
              ) : Array.isArray(displayedProducts) && displayedProducts.length > 0 ? (
                displayedProducts.map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <ProductCard product={p} />
                    </motion.div>
                  ))
              ) : (
                <p className="col-span-full text-center text-gray-500 py-12">No hay productos disponibles</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <ProductsErrorBanner />
    </div>
  );
};

export default Home;
