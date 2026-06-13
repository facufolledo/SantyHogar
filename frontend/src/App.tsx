import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CartProvider, useCart } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { OrdersProvider } from './context/OrdersContext';
import { ProductsProvider } from './context/ProductsContext';
import { FavoritesProvider } from './context/FavoritesContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import CartSidebar from './components/CartSidebar';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';
import CheckoutFailure from './pages/CheckoutFailure';
import CheckoutPending from './pages/CheckoutPending';
import Contact from './pages/Contact';
import AuthCallback from './pages/AuthCallback';
// Admin
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminUsers from './pages/admin/AdminUsers';
import BulkImport from './pages/admin/BulkImport';
import PriceManagement from './pages/admin/PriceManagement';
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
            <Route path="/checkout/success" element={<PageWrap><CheckoutSuccess /></PageWrap>} />
            <Route path="/checkout/failure" element={<PageWrap><CheckoutFailure /></PageWrap>} />
            <Route path="/checkout/pending" element={<PageWrap><CheckoutPending /></PageWrap>} />
            <Route path="/contacto" element={<PageWrap><Contact /></PageWrap>} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
};

// Wrapper para CartSidebar que usa useCart
const CartSidebarWrapper = () => {
  const { isSidebarOpen, closeSidebar } = useCart();
  return <CartSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />;
};

function App() {
  // No usar basename - el dominio está en la raíz (santyhogar.com.ar/, no santyhogar.com.ar/SantyHogar/)
  const basename = '';
  
  return (
    <BrowserRouter basename={basename}>
      <ScrollToTop />
      <AuthProvider>
        <OrdersProvider>
        <ProductsProvider>
        <FavoritesProvider>
        <CartProvider>
          <ToastProvider>
          <CartSidebarWrapper />
          <Routes>
            {/* Auth callback */}
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Admin — sin Navbar/Footer */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="productos" element={<AdminProducts />} />
              <Route path="precios" element={<PriceManagement />} />
              <Route path="pedidos" element={<AdminOrders />} />
              <Route path="clientes" element={<AdminCustomers />} />
              <Route path="usuarios" element={<AdminUsers />} />
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
        </FavoritesProvider>
        </ProductsProvider>
        </OrdersProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
