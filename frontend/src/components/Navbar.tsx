import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, X, ChevronDown, LogOut, Lock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [productsOpen, setProductsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { count } = useCart();
  const { user, isAdmin, isLogged, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); setUserMenuOpen(false); }, [location]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tienda?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleAccountClick = () => {
    if (isLogged) {
      setUserMenuOpen(!userMenuOpen);
    } else {
      setAuthModalOpen(true);
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  const categories = [
    { label: 'Electrodomésticos', to: '/tienda?cat=electrodomesticos' },
    { label: 'Mueblería', to: '/tienda?cat=muebleria' },
    { label: 'Colchonería', to: '/tienda?cat=colchoneria' },
  ];

  const initials = user?.name.split(' ').map(n => n[0]).join('').slice(0, 2) || '';

  return (
    <>
      {/* Top bar */}
      <div className="bg-gray-900 text-gray-300 text-xs py-1.5 px-4 text-center hidden md:block">
        Envíos a todo el país · Cuotas sin interés · Atención al cliente: (011) 4000-0000
      </div>

      <header className={`sticky top-0 z-50 bg-gray-900 transition-shadow duration-300 ${scrolled ? 'shadow-xl' : ''}`}>
        {/* Main bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 h-16">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <img src={`${import.meta.env.BASE_URL}santyhogar-logo.png`} alt="Santy Hogar" className="h-9 sm:h-10 w-auto object-contain" />
            </Link>

            {/* Search bar - desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-4">
              <div className="relative w-full">
                <input
                  type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="¿Qué estás buscando?"
                  className="w-full pl-4 pr-12 py-2.5 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button type="submit" className="absolute right-0 top-0 h-full px-4 bg-primary-600 hover:bg-primary-700 rounded-r-lg text-white transition-colors">
                  <Search size={18} />
                </button>
              </div>
            </form>

            {/* Right icons */}
            <div className="flex items-center gap-1 ml-auto">
              {/* Search mobile */}
              <button onClick={() => setSearchOpen(!searchOpen)} className="md:hidden p-2 text-gray-300 hover:text-white">
                <Search size={20} />
              </button>

              {/* Admin lock — solo visible si es admin */}
              {isAdmin && (
                <Link to="/admin" className="hidden sm:flex flex-col items-center p-2 text-yellow-400 hover:text-yellow-300 transition-colors text-xs gap-0.5" title="Panel Admin">
                  <Lock size={20} />
                  <span>Admin</span>
                </Link>
              )}

              {/* Mi cuenta */}
              <div className="relative">
                <button
                  onClick={handleAccountClick}
                  className="hidden sm:flex flex-col items-center p-2 text-gray-300 hover:text-white transition-colors text-xs gap-0.5"
                >
                  {isLogged ? (
                    <>
                      <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center text-white text-[9px] font-bold">
                        {initials}
                      </div>
                      <span className="max-w-[60px] truncate">{user?.name.split(' ')[0]}</span>
                    </>
                  ) : (
                    <>
                      {/* fi fi-rr-user icon via flaticon uicons */}
                      <i className="fi fi-rr-user text-lg leading-none" />
                      <span>Mi cuenta</span>
                    </>
                  )}
                </button>

                {/* User dropdown */}
                <AnimatePresence>
                  {userMenuOpen && isLogged && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl py-2 min-w-[200px] z-50 border border-gray-100"
                    >
                      <div className="px-4 py-2 border-b border-gray-100 mb-1">
                        <p className="font-semibold text-gray-900 text-sm">{user?.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                        {isAdmin && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">
                            <Lock size={9} /> Administrador
                          </span>
                        )}
                      </div>
                      <Link to="/cuenta" className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <i className="fi fi-rr-user text-gray-400 text-sm leading-none" />
                        Mi cuenta
                      </Link>
                      <Link to="/cuenta/pedidos" className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <i className="fi fi-rr-box-alt text-gray-400 text-sm leading-none" />
                        Mis pedidos
                      </Link>
                      <Link to="/cuenta/favoritos" className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <i className="fi fi-rr-heart text-gray-400 text-sm leading-none" />
                        Favoritos
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" className="flex items-center gap-2.5 px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50 transition-colors font-medium">
                          <Lock size={14} className="text-yellow-500" />
                          Panel Admin
                        </Link>
                      )}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                          <LogOut size={14} />
                          Cerrar sesión
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Carrito */}
              <Link to="/carrito" className="relative flex flex-col items-center p-2 text-gray-300 hover:text-white transition-colors text-xs gap-0.5">
                <div className="relative">
                  <i className="fi fi-rr-shopping-cart text-xl leading-none" />
                  {count > 0 && (
                    <motion.span
                      key={count}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-accent text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
                    >
                      {count}
                    </motion.span>
                  )}
                </div>
                <span>Mi carrito</span>
              </Link>

              {/* Mobile menu */}
              <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-gray-300 hover:text-white ml-1">
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <div className="hidden md:block border-t border-gray-700">
          <div className="max-w-7xl mx-auto px-6 flex items-center gap-6 h-10 text-sm">
            <Link to="/" className={`text-gray-300 hover:text-white transition-colors ${location.pathname === '/' ? 'text-white font-medium' : ''}`}>
              Inicio
            </Link>

            <div className="relative" onMouseEnter={() => setProductsOpen(true)} onMouseLeave={() => setProductsOpen(false)}>
              <button className={`flex items-center gap-1 text-gray-300 hover:text-white transition-colors ${location.pathname.startsWith('/tienda') ? 'text-white font-medium' : ''}`}>
                Productos <ChevronDown size={14} />
              </button>
              <AnimatePresence>
                {productsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl py-2 min-w-[200px] z-50 border border-gray-100"
                  >
                    <Link to="/tienda" className="flex items-center gap-2.5 px-4 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-primary-600 text-sm transition-colors">
                      <i className="fi fi-rr-apps text-gray-400 text-sm leading-none" />
                      Ver todo
                    </Link>
                    {categories.map(c => (
                      <Link key={c.to} to={c.to} className="flex items-center gap-2.5 px-4 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-primary-600 text-sm transition-colors">
                        <i className={`fi fi-rr-${c.label === 'Electrodomésticos' ? 'plug' : c.label === 'Mueblería' ? 'sofa' : 'bed'} text-gray-400 text-sm leading-none`} />
                        {c.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link to="/contacto" className={`text-gray-300 hover:text-white transition-colors ${location.pathname === '/contacto' ? 'text-white font-medium' : ''}`}>
              Contacto
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
              className="md:hidden overflow-hidden bg-gray-800 px-4 py-3"
            >
              <form onSubmit={handleSearch} className="flex gap-2">
                <input autoFocus type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="¿Qué estás buscando?"
                  className="flex-1 px-4 py-2 rounded-lg bg-white text-gray-900 text-sm focus:outline-none"
                />
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg">
                  <Search size={18} />
                </button>
              </form>
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
              className="md:hidden overflow-hidden bg-gray-800 border-t border-gray-700"
            >
              <div className="px-4 py-3 space-y-1">
                {isLogged && (
                  <div className="flex items-center gap-3 py-3 border-b border-gray-700 mb-2">
                    <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {initials}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{user?.name}</p>
                      <p className="text-gray-400 text-xs">{user?.email}</p>
                    </div>
                  </div>
                )}
                <Link to="/" className="block py-2.5 text-gray-300 hover:text-white text-sm">Inicio</Link>
                <Link to="/tienda" className="block py-2.5 text-gray-300 hover:text-white text-sm">Todos los productos</Link>
                {categories.map(c => (
                  <Link key={c.to} to={c.to} className="block py-2 pl-4 text-gray-400 hover:text-white text-sm">{c.label}</Link>
                ))}
                <Link to="/contacto" className="block py-2.5 text-gray-300 hover:text-white text-sm">Contacto</Link>
                {isLogged ? (
                  <>
                    <Link to="/cuenta" className="block py-2.5 text-gray-300 hover:text-white text-sm">Mi cuenta</Link>
                    {isAdmin && <Link to="/admin" className="block py-2.5 text-yellow-400 hover:text-yellow-300 text-sm font-medium">🔒 Panel Admin</Link>}
                    <button onClick={handleLogout} className="block py-2.5 text-red-400 hover:text-red-300 text-sm w-full text-left">Cerrar sesión</button>
                  </>
                ) : (
                  <button onClick={() => { setMobileOpen(false); setAuthModalOpen(true); }} className="block py-2.5 text-primary-400 hover:text-primary-300 text-sm w-full text-left">
                    Iniciar sesión / Registrarse
                  </button>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* Auth Modal */}
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
