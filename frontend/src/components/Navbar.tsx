import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Menu, X, ChevronDown, LogOut, Lock,
  User, ShoppingCart, Package, Heart, LayoutGrid,
  Truck, CreditCard,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

const NAV_BG = 'bg-[#0c1528]/95';
const NAV_BORDER = 'border-[#1a2540]';

const categories = [
  { label: 'Electrodomésticos', to: '/tienda?cat=electrodomesticos', icon: LayoutGrid },
  { label: 'Mueblería', to: '/tienda?cat=muebleria', icon: LayoutGrid },
  { label: 'Colchonería', to: '/tienda?cat=colchoneria', icon: LayoutGrid },
];

const searchSuggestions = [
  { label: 'Electrodomésticos', to: '/tienda?cat=electrodomesticos' },
  { label: 'Mueblería', to: '/tienda?cat=muebleria' },
  { label: 'Colchonería', to: '/tienda?cat=colchoneria' },
  { label: 'Lavarropas', to: '/tienda?q=lavarropas' },
  { label: 'Heladeras', to: '/tienda?q=heladera' },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { count } = useCart();
  const { user, isAdmin, isLogged, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const userMenuRef = useRef<HTMLDivElement>(null);
  const productsMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setSearchOpen(false);
    setSearchFocused(false);
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
      if (productsMenuRef.current && !productsMenuRef.current.contains(target)) {
        setProductsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tienda?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchFocused(false);
      setSearchQuery('');
    }
  };

  const handleAccountClick = () => {
    if (isLogged) {
      setUserMenuOpen(v => !v);
    } else {
      setAuthModalOpen(true);
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  const initials = user?.name.split(' ').map(n => n[0]).join('').slice(0, 2) || '';

  const navLinkClass = (active: boolean) =>
    `relative flex items-center h-10 text-sm transition-colors duration-200 cursor-pointer ${
      active ? 'text-white font-medium' : 'text-gray-300 hover:text-white'
    }`;

  return (
    <>
      <div className="sticky top-0 z-50">
        {/* Barra de confianza */}
        <div className={`hidden md:block ${NAV_BG} backdrop-blur-lg text-gray-400 text-xs py-1.5 px-4 border-b ${NAV_BORDER}`}>
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-6">
            <span className="flex items-center gap-1.5">
              <Truck size={12} className="text-orange-400" />
              Envíos a todo el país
            </span>
            <span className="text-gray-600">·</span>
            <span className="flex items-center gap-1.5">
              <CreditCard size={12} className="text-orange-400" />
              Hasta 12 cuotas sin interés
            </span>
            <span className="text-gray-600">·</span>
            <span>Atención al cliente: (011) 4000-0000</span>
          </div>
        </div>

        <header className={`${NAV_BG} backdrop-blur-lg border-b ${NAV_BORDER} transition-all duration-300 ${scrolled ? 'shadow-2xl shadow-black/30' : 'shadow-lg shadow-black/20'}`}>
          {/* Main bar */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-4 h-16">
              <Link to="/" className="flex-shrink-0">
                <img src={`${import.meta.env.BASE_URL}santyhogar-logo.png`} alt="Santy Hogar" className="h-9 sm:h-10 w-auto object-contain" />
              </Link>

              {/* Search bar - desktop */}
              <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-4">
                <div ref={searchRef} className="relative w-full">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    placeholder="¿Qué estás buscando?"
                    className="w-full pl-4 pr-12 py-2.5 rounded-lg bg-[#111827]/80 border border-[#1a2540] text-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  />
                  <button type="submit" className="absolute right-0 top-0 h-full px-4 bg-primary-600 hover:bg-primary-700 rounded-r-lg text-white transition-all duration-200 cursor-pointer">
                    <Search size={18} />
                  </button>

                  <AnimatePresence>
                    {searchFocused && !searchQuery && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className={`absolute top-full left-0 right-0 mt-1.5 ${NAV_BG} border ${NAV_BORDER} rounded-xl shadow-2xl py-2 z-50 overflow-hidden`}
                      >
                        <p className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Búsquedas populares</p>
                        {searchSuggestions.map(s => (
                          <Link
                            key={s.to}
                            to={s.to}
                            onClick={() => { setSearchFocused(false); setSearchQuery(''); }}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                          >
                            <Search size={13} className="text-gray-500" />
                            {s.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </form>

              {/* Right icons */}
              <div className="flex items-center gap-0.5 ml-auto">
                <button
                  onClick={() => setSearchOpen(v => !v)}
                  aria-label="Buscar"
                  className="md:hidden p-2 text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer"
                >
                  <Search size={20} />
                </button>

                {isAdmin && (
                  <Link to="/admin" className="hidden sm:flex flex-col items-center p-2 text-yellow-400 hover:text-yellow-300 transition-colors duration-200 text-xs gap-0.5 cursor-pointer" title="Panel Admin">
                    <Lock size={20} />
                    <span>Admin</span>
                  </Link>
                )}

                {/* Mi cuenta — visible en mobile también */}
                <div ref={userMenuRef} className="relative">
                  <button
                    onClick={handleAccountClick}
                    aria-label="Mi cuenta"
                    className="flex flex-col items-center p-2 text-gray-300 hover:text-white transition-colors duration-200 text-xs gap-0.5 cursor-pointer"
                  >
                    {isLogged ? (
                      <>
                        <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center text-white text-[9px] font-bold">
                          {initials}
                        </div>
                        <span className="hidden sm:block max-w-[60px] truncate">{user?.name.split(' ')[0]}</span>
                      </>
                    ) : (
                      <>
                        <User size={20} />
                        <span className="hidden sm:block">Mi cuenta</span>
                      </>
                    )}
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && isLogged && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        className={`absolute right-0 top-full mt-2 ${NAV_BG} rounded-xl shadow-2xl py-2 min-w-[200px] z-50 border ${NAV_BORDER}`}
                      >
                        <div className={`px-4 py-2 border-b ${NAV_BORDER} mb-1`}>
                          <p className="font-semibold text-white text-sm">{user?.name}</p>
                          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                          {isAdmin && (
                            <span className="inline-flex items-center gap-1 mt-1 text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-semibold">
                              <Lock size={9} /> Administrador
                            </span>
                          )}
                        </div>
                        <Link to="/cuenta" className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-all duration-200 cursor-pointer">
                          <User size={14} className="text-gray-400" /> Mi cuenta
                        </Link>
                        <Link to="/cuenta/pedidos" className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-all duration-200 cursor-pointer">
                          <Package size={14} className="text-gray-400" /> Mis pedidos
                        </Link>
                        <Link to="/cuenta/favoritos" className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-all duration-200 cursor-pointer">
                          <Heart size={14} className="text-gray-400" /> Favoritos
                        </Link>
                        {isAdmin && (
                          <Link to="/admin" className="flex items-center gap-2.5 px-4 py-2 text-sm text-yellow-400 hover:bg-yellow-500/10 transition-all duration-200 font-medium cursor-pointer">
                            <Lock size={14} /> Panel Admin
                          </Link>
                        )}
                        <div className={`border-t ${NAV_BORDER} mt-1 pt-1`}>
                          <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer">
                            <LogOut size={14} /> Cerrar sesión
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link to="/carrito" aria-label="Mi carrito" className="relative flex flex-col items-center p-2 text-gray-300 hover:text-white transition-colors duration-200 text-xs gap-0.5 cursor-pointer">
                  <div className="relative">
                    <ShoppingCart size={20} />
                    {count > 0 && (
                      <motion.span
                        key={count}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 bg-accent text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-lg"
                      >
                        {count}
                      </motion.span>
                    )}
                  </div>
                  <span className="hidden sm:block">Mi carrito</span>
                </Link>

                <button
                  onClick={() => setMobileOpen(v => !v)}
                  aria-label="Menú"
                  className="md:hidden p-2 text-gray-300 hover:text-white ml-1 transition-colors duration-200 cursor-pointer"
                >
                  {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
              </div>
            </div>
          </div>

          {/* Nav links */}
          <div className={`hidden md:block border-t ${NAV_BORDER}`}>
            <div className="max-w-7xl mx-auto px-6 flex items-center gap-6 text-sm">
              <Link to="/" className={navLinkClass(location.pathname === '/')}>
                Inicio
                {location.pathname === '/' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />}
              </Link>

              <div
                ref={productsMenuRef}
                className="relative"
                onMouseEnter={() => setProductsOpen(true)}
                onMouseLeave={() => setProductsOpen(false)}
              >
                <button className={navLinkClass(location.pathname.startsWith('/tienda'))}>
                  Productos <ChevronDown size={14} className={`ml-0.5 transition-transform duration-200 ${productsOpen ? 'rotate-180' : ''}`} />
                  {location.pathname.startsWith('/tienda') && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />}
                </button>

                <AnimatePresence>
                  {productsOpen && (
                    <div className="absolute top-full left-0 pt-2 z-50">
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className={`${NAV_BG} rounded-xl shadow-2xl py-2 min-w-[220px] border ${NAV_BORDER}`}
                      >
                        <Link to="/tienda" className="flex items-center gap-2.5 px-4 py-2.5 text-gray-300 hover:bg-white/5 hover:text-white text-sm transition-all duration-200 cursor-pointer">
                          <LayoutGrid size={14} className="text-gray-400" /> Ver todo
                        </Link>
                        {categories.map(c => {
                          const Icon = c.icon;
                          return (
                            <Link key={c.to} to={c.to} className="flex items-center gap-2.5 px-4 py-2.5 text-gray-300 hover:bg-white/5 hover:text-white text-sm transition-all duration-200 cursor-pointer">
                              <Icon size={14} className="text-gray-400" /> {c.label}
                            </Link>
                          );
                        })}
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              <Link to="/contacto" className={navLinkClass(location.pathname === '/contacto')}>
                Contacto
                {location.pathname === '/contacto' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />}
              </Link>
            </div>
          </div>

          {/* Mobile search */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={`md:hidden overflow-hidden bg-[#111827] px-4 py-3 border-t ${NAV_BORDER}`}
              >
                <form onSubmit={handleSearch} className="flex gap-2 mb-2">
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="¿Qué estás buscando?"
                    className="flex-1 px-4 py-2 rounded-lg bg-[#0c1528] border border-[#1a2540] text-white placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 cursor-pointer">
                    <Search size={18} />
                  </button>
                </form>
                {!searchQuery && (
                  <div className="flex flex-wrap gap-2">
                    {searchSuggestions.slice(0, 3).map(s => (
                      <Link
                        key={s.to}
                        to={s.to}
                        onClick={() => setSearchOpen(false)}
                        className="text-xs px-3 py-1 rounded-full bg-white/5 border border-[#1a2540] text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        {s.label}
                      </Link>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile menu */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.nav
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={`md:hidden overflow-hidden bg-[#111827] border-t ${NAV_BORDER}`}
              >
                <div className="px-4 py-3 space-y-1">
                  {/* Trust info mobile */}
                  <div className={`flex flex-col gap-1 pb-3 mb-2 border-b ${NAV_BORDER} text-xs text-gray-400`}>
                    <span className="flex items-center gap-1.5"><Truck size={12} className="text-orange-400" /> Envíos a todo el país</span>
                    <span className="flex items-center gap-1.5"><CreditCard size={12} className="text-orange-400" /> Hasta 12 cuotas sin interés</span>
                  </div>

                  {isLogged && (
                    <div className={`flex items-center gap-3 py-3 border-b ${NAV_BORDER} mb-2`}>
                      <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {initials}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{user?.name}</p>
                        <p className="text-gray-400 text-xs">{user?.email}</p>
                      </div>
                    </div>
                  )}
                  <Link to="/" className="block py-2.5 text-gray-300 hover:text-white text-sm transition-colors duration-200 cursor-pointer">Inicio</Link>
                  <Link to="/tienda" className="block py-2.5 text-gray-300 hover:text-white text-sm transition-colors duration-200 cursor-pointer">Todos los productos</Link>
                  {categories.map(c => (
                    <Link key={c.to} to={c.to} className="block py-2 pl-4 text-gray-400 hover:text-white text-sm transition-colors duration-200 cursor-pointer">{c.label}</Link>
                  ))}
                  <Link to="/contacto" className="block py-2.5 text-gray-300 hover:text-white text-sm transition-colors duration-200 cursor-pointer">Contacto</Link>
                  {isLogged ? (
                    <>
                      <Link to="/cuenta" className="block py-2.5 text-gray-300 hover:text-white text-sm transition-colors duration-200 cursor-pointer">Mi cuenta</Link>
                      {isAdmin && <Link to="/admin" className="block py-2.5 text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors duration-200 cursor-pointer"><Lock size={14} className="inline mr-1" /> Panel Admin</Link>}
                      <button onClick={handleLogout} className="block py-2.5 text-red-400 hover:text-red-300 text-sm w-full text-left transition-colors duration-200 cursor-pointer">Cerrar sesión</button>
                    </>
                  ) : (
                    <button onClick={() => { setMobileOpen(false); setAuthModalOpen(true); }} className="block py-2.5 text-primary-400 hover:text-primary-300 text-sm w-full text-left transition-colors duration-200 cursor-pointer">
                      Iniciar sesión / Registrarse
                    </button>
                  )}
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
        </header>
      </div>

      <AnimatePresence>
        {authModalOpen && (
          <AuthModal
            onClose={() => setAuthModalOpen(false)}
            onSuccess={(role) => navigate(role === 'admin' ? '/admin' : '/cuenta')}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
