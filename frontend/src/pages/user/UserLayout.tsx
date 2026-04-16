import { useState } from 'react';
import { NavLink, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import MyAccount from './MyAccount';
import MyOrders from './MyOrders';
import MyAddresses from './MyAddresses';
import MyFavorites from './MyFavorites';
import MySecurity from './MySecurity';

const navItems = [
  { to: '/cuenta', label: 'Mi cuenta', icon: 'fi-rr-user', exact: true },
  { to: '/cuenta/pedidos', label: 'Mis pedidos', icon: 'fi-rr-box-alt' },
  { to: '/cuenta/direcciones', label: 'Direcciones', icon: 'fi-rr-marker' },
  { to: '/cuenta/favoritos', label: 'Favoritos', icon: 'fi-rr-heart' },
  { to: '/cuenta/seguridad', label: 'Seguridad', icon: 'fi-rr-lock' },
];

export default function UserLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user, isLogged } = useAuth();

  if (!isLogged) return <Navigate to="/" replace />;

  const initials = user!.name.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Mobile header */}
      <div className="flex items-center justify-between mb-4 md:hidden">
        <h1 className="font-bold text-gray-900">Mi cuenta</h1>
        <button onClick={() => setOpen(!open)} className="p-2 text-gray-500">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className={`${open ? 'block' : 'hidden'} md:block w-full md:w-56 flex-shrink-0`}>
          <div className="card p-4 sticky top-24">
            {/* Avatar */}
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-100">
              <div className="w-11 h-11 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{user!.name}</p>
                <p className="text-xs text-gray-400 truncate">{user!.email}</p>
              </div>
            </div>

            <nav className="space-y-0.5">
              {navItems.map(({ to, label, icon, exact }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={exact}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <i className={`fi ${icon} text-base leading-none`} />
                  {label}
                  <ChevronRight size={13} className="ml-auto opacity-40" />
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Routes>
                <Route index element={<MyAccount />} />
                <Route path="pedidos" element={<MyOrders />} />
                <Route path="direcciones" element={<MyAddresses />} />
                <Route path="favoritos" element={<MyFavorites />} />
                <Route path="seguridad" element={<MySecurity />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
