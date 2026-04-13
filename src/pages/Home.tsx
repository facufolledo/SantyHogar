import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Truck, CreditCard, Shield, RefreshCw, X, ChevronLeft } from 'lucide-react';
import { products, categories } from '../data/products';
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
  const [slide, setSlide] = useState(0);
  const [promoOpen, setPromoOpen] = useState(true);
  const featured = products.filter(p => p.featured).slice(0, 8);

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);

  const prev = () => setSlide(s => (s - 1 + slides.length) % slides.length);
  const next = () => setSlide(s => (s + 1) % slides.length);

  return (
    <div>
      {/* Promo popup */}
      <AnimatePresence>
        {promoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            onClick={() => setPromoOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="relative bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl overflow-hidden max-w-sm w-full shadow-2xl"
            >
              <button onClick={() => setPromoOpen(false)} className="absolute top-3 right-3 bg-white/20 hover:bg-white/30 rounded-full p-1 text-white z-10">
                <X size={18} />
              </button>
              <div className="p-8 text-white text-center">
                <p className="text-sm font-medium uppercase tracking-widest mb-2 opacity-80">Oferta especial</p>
                <h2 className="text-4xl font-black leading-tight mb-2">HASTA<br />40% OFF</h2>
                <p className="text-lg font-semibold mb-1">en electrodomésticos</p>
                <p className="text-sm opacity-80 mb-6">Válido hasta agotar stock</p>
                <Link
                  to="/tienda?cat=electrodomesticos"
                  onClick={() => setPromoOpen(false)}
                  className="inline-block bg-white text-orange-600 font-bold px-8 py-3 rounded-xl hover:bg-orange-50 transition-colors"
                >
                  Ver ofertas
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            {/* Full background image */}
            <img
              src={slides[slide].image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-gray-900/20" />
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
              className="max-w-lg"
            >
              <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-2">
                {slides[slide].title}<br />
                <span className="text-accent">{slides[slide].highlight}</span>
              </h1>
              <p className="text-gray-300 text-lg mb-6">{slides[slide].subtitle}</p>
              <Link to={slides[slide].link} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold px-8 py-3.5 rounded-xl transition-all duration-200 active:scale-95">
                {slides[slide].cta} <ChevronRight size={18} />
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Arrows */}
        <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors">
          <ChevronRight size={20} />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)} className={`w-2 h-2 rounded-full transition-all ${i === slide ? 'bg-white w-6' : 'bg-white/40'}`} />
          ))}
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-gray-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trust.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-primary-600 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800 uppercase leading-tight">{label}</p>
                  <p className="text-xs text-gray-500">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Categorías</h2>
          <Link to="/tienda" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
            Ver todo <ChevronRight size={16} />
          </Link>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link to={`/tienda?cat=${cat.id}`} className="group relative overflow-hidden rounded-2xl block aspect-[4/3]">
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-5">
                  <div className="w-8 h-8 mb-2 text-white opacity-90">
                    {cat.id === 'electrodomesticos' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/><path d="M9 6h6M9 10h6"/>
                      </svg>
                    )}
                    {cat.id === 'muebleria' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0Z"/><path d="M4 18v2M20 18v2M12 4v9"/>
                      </svg>
                    )}
                    {cat.id === 'colchoneria' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>
                      </svg>
                    )}
                  </div>
                  <h3 className="text-white text-xl font-bold">{cat.name}</h3>
                  <p className="text-gray-300 text-sm">{cat.count} productos</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Productos destacados</h2>
            <Link to="/tienda" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
              Ver todos <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <ProductCard product={p} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Banner CTA */}
      <section className="bg-primary-600 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black text-white mb-2">¿Necesitás financiación?</h2>
          <p className="text-primary-100 mb-6">Hasta 12 cuotas sin interés con todos los bancos</p>
          <Link to="/tienda" className="inline-block bg-white text-primary-600 font-bold px-8 py-3 rounded-xl hover:bg-primary-50 transition-colors">
            Ver productos
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
