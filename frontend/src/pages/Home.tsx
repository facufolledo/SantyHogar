import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Truck, CreditCard, Shield, RefreshCw, ChevronLeft, LayoutGrid } from 'lucide-react';
import { useProducts } from '../context/ProductsContext';
import { useCategories } from '../hooks/useCategories';
import ProductsErrorBanner from '../components/ProductsErrorBanner';
import ProductCard from '../components/ProductCard';

// Hero slides
const slides = [
  {
    title: 'Los mejores',
    highlight: 'Lavarropas',
    subtitle: 'Tecnología que simplifica tu vida',
    cta: 'Ver lavarropas',
    link: '/tienda?cat=electrodomesticos',
    image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&q=80',
  },
  {
    title: 'Dormitorios',
    highlight: 'de ensueño',
    subtitle: 'Colchones y sommiers premium',
    cta: 'Ver colchonería',
    link: '/tienda?cat=colchoneria',
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
  },
  {
    title: 'Amueblá tu hogar',
    highlight: 'con estilo',
    subtitle: 'Muebles modernos al mejor precio',
    cta: 'Ver mueblería',
    link: '/tienda?cat=muebleria',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
  },
];

const trust = [
  { icon: Truck, label: 'Envíos a todo el país', sub: 'Gratis en compras +$200.000' },
  { icon: CreditCard, label: 'Todos los medios de pago', sub: 'Hasta 12 cuotas sin interés' },
  { icon: Shield, label: 'Compra segura', sub: 'Datos protegidos' },
  { icon: RefreshCw, label: 'Garantía oficial', sub: 'Respaldo de fábrica' },
];

const Home = () => {
  const { products, loading: productsLoading } = useProducts();
  const { categories: apiCategories, loading: categoriesLoading } = useCategories();
  const [slide, setSlide] = useState(0);
  
  const categoryCards = useMemo(() => {
    return apiCategories.filter(c => c.active).map(cat => {
      // Find a product that belongs to this category to get an image
      const categoryProducts = products.filter(p => p.categoryId === cat.id || p.category === cat.slug);
      const firstProductWithImage = categoryProducts.find(p => p.images && p.images.length > 0);
      return {
        id: cat.slug,
        name: cat.name,
        count: categoryProducts.length,
        image: firstProductWithImage?.images[0] || 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&q=80',
        color: cat.color || '#F97316'
      };
    });
  }, [apiCategories, products]);

  const featured = useMemo(
    () => products.filter(p => p.featured).slice(0, 8),
    [products]
  );

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);

  const prev = () => setSlide(s => (s - 1 + slides.length) % slides.length);
  const next = () => setSlide(s => (s + 1) % slides.length);

  return (
    <div>
      {/* Hero */}
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
              src={slides[slide].image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Continuidad con navbar — mismo gray-900, menos intenso */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900/85 from-0% via-gray-900/50 via-35% to-transparent to-100%" />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900/65 via-gray-900/35 to-gray-900/20" />
            {/* Azul muy sutil en bordes */}
            <div className="absolute inset-y-0 left-0 w-2/5 bg-gradient-to-r from-[#0c1528]/50 to-transparent" />
            <div className="absolute inset-y-0 right-0 w-2/5 bg-gradient-to-l from-[#0c1528]/35 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/45 via-transparent to-transparent" />
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
                {slides[slide].title}<br />
                <span className="text-orange-400 drop-shadow-lg">{slides[slide].highlight}</span>
              </h1>
              <p className="text-white/90 text-lg mb-6 drop-shadow-md">{slides[slide].subtitle}</p>
              <Link
                to={slides[slide].link}
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-orange-500/30 cursor-pointer"
              >
                {slides[slide].cta} <ChevronRight size={18} />
              </Link>
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

      {/* Trust bar */}
      <section className="bg-gray-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trust.map(({ icon: Icon, label, sub }) => (
              <div 
                key={label} 
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800 uppercase leading-tight">{label}</p>
                  <p className="text-xs text-gray-600">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ProductsErrorBanner />

      {/* Categories */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-2">Categorías</h2>
              <p className="text-gray-600">Explorá nuestra variedad de productos para el hogar</p>
            </div>
            <Link 
              to="/tienda" 
              className="group flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold transition-colors duration-200 cursor-pointer"
            >
              Ver todas las categorías 
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(categoriesLoading || productsLoading) && categoryCards.length === 0 ? (
            <p className="col-span-full text-center text-gray-500 py-8">Cargando categorías…</p>
          ) : (
          categoryCards.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link 
                to={`/tienda?cat=${cat.id}`} 
                className="group relative overflow-hidden rounded-2xl block aspect-[4/3] shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                <img 
                  src={cat.image} 
                  alt={cat.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />

                {/* Overlay oscuro solo en hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Gradiente suave siempre visible para el texto */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent group-hover:opacity-0 transition-opacity duration-300" />

                <div className="absolute bottom-0 left-0 p-5 w-full">
                  <div className="w-8 h-8 mb-2 text-white opacity-90" style={{ color: cat.color }}>
                    <LayoutGrid size={28} />
                  </div>
                  <h3 className="text-white text-xl font-bold">{cat.name}</h3>
                  <p className="text-gray-300 text-sm">{cat.count} productos</p>
                </div>
              </Link>
            </motion.div>
          ))
          )}
        </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-2">Productos destacados</h2>
              <p className="text-gray-600">Los mejores productos seleccionados para vos</p>
            </div>
            <Link 
              to="/tienda" 
              className="group flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold transition-colors duration-200 cursor-pointer"
            >
              Ver todos los productos 
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {loading && featured.length === 0 ? (
              <p className="col-span-full text-center text-gray-500 py-12">Cargando productos…</p>
            ) : (
            featured.map((p, i) => (
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
            )}
          </div>
        </div>
      </section>

      {/* Banner CTA */}
      <section className="relative overflow-hidden py-20 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-10 border border-white/20 shadow-2xl">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
              ¿Necesitás financiación?
            </h2>
            <p className="text-blue-100 text-lg md:text-xl mb-8 font-medium">
              Hasta 12 cuotas sin interés con todos los bancos
            </p>
            <Link 
              to="/tienda" 
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 py-4 rounded-xl transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 cursor-pointer"
            >
              Ver productos <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
