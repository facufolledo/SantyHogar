import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { OrdersProvider } from './context/OrdersContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Contact from './pages/Contact';
// Admin
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCustomers from './pages/admin/AdminCustomers';
import BulkImport from './pages/admin/BulkImport';
// User
import UserLayout from './pages/user/UserLayout';
import MyAccount from './pages/user/MyAccount';
import MyOrders from './pages/user/MyOrders';
import MyAddresses from './pages/user/MyAddresses';
import MyFavorites from './pages/user/MyFavorites';
import MySecurity from './pages/user/MySecurity';

const PageWrap = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.22 }}
  >
    {children}
  </motion.div>
);

const MainLayout = () => {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageWrap><Home /></PageWrap>} />
            <Route path="/tienda" element={<PageWrap><Shop /></PageWrap>} />
            <Route path="/producto/:slug" element={<PageWrap><ProductDetail /></PageWrap>} />
            <Route path="/carrito" element={<PageWrap><Cart /></PageWrap>} />
            <Route path="/checkout" element={<PageWrap><Checkout /></PageWrap>} />
            <Route path="/contacto" element={<PageWrap><Contact /></PageWrap>} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter basename="/SantyHogar">
      <AuthProvider>
        <OrdersProvider>
        <CartProvider>
          <ToastProvider>
          <Routes>
            {/* Admin — sin Navbar/Footer */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="productos" element={<AdminProducts />} />
              <Route path="pedidos" element={<AdminOrders />} />
              <Route path="clientes" element={<AdminCustomers />} />
              <Route path="importar" element={<BulkImport />} />
            </Route>

            {/* Panel de usuario — con Navbar/Footer */}
            <Route path="/cuenta/*" element={
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-1">
                  <UserLayout />
                </main>
                <Footer />
              </div>
            } />

            {/* Public */}
            <Route path="/*" element={<MainLayout />} />
          </Routes>
        </ToastProvider>
        </CartProvider>
        </OrdersProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
