import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminLogin from './pages/Admin/AdminLogin';
import AdminLayout from './pages/Admin/AdminLayout';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminOrders from './pages/Admin/AdminOrders';
import AdminCustomOrders from './pages/Admin/AdminCustomOrders';
import AdminProducts from './pages/Admin/AdminProducts';
import AdminGallery from './pages/Admin/AdminGallery';
import AdminCustomers from './pages/Admin/AdminCustomers';
import AdminContact from './pages/Admin/AdminContact';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductPage from './pages/ProductPage';
import Gallery from './pages/Gallery';
import CustomOrder from './pages/CustomOrder';
import Checkout from './pages/Checkout';
import About from './pages/About';
import Contact from './pages/Contact';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import OrderConfirmation from './pages/OrderConfirmation';
import Workshop from './pages/Workshop';
import WorkshopRegistration from './pages/WorkshopRegistration';

function AnimatedRoutes() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}><Home /></motion.div>} />
        <Route path="/shop" element={<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}><Shop /></motion.div>} />
        <Route path="/product/:id" element={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}><ProductPage /></motion.div>} />
        <Route path="/gallery" element={<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}><Gallery /></motion.div>} />
        <Route path="/custom-order" element={<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}><CustomOrder /></motion.div>} />
         <Route path="/checkout" element={<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}><Checkout /></motion.div>} />
         <Route path="/order-confirmation/:orderId" element={<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}><OrderConfirmation /></motion.div>} />
         <Route path="/about" element={<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}><About /></motion.div>} />
         <Route path="/workshop" element={<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}><Workshop /></motion.div>} />
         <Route path="/workshop/register" element={<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}><WorkshopRegistration /></motion.div>} />
         <Route path="/contact" element={<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}><Contact /></motion.div>} />
        <Route path="/login" element={<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}><Auth /></motion.div>} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="custom-orders" element={<AdminCustomOrders />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="gallery" element={<AdminGallery />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="contact" element={<AdminContact />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <CartProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-50 transition-colors duration-300">
            <ConditionalNavbar />
            <main>
              <AnimatedRoutes />
            </main>
            <ConditionalFooter />
          </div>
          <Toaster position="top-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
        </Router>
      </AuthProvider>
    </CartProvider>
  );
}

function ConditionalNavbar() {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) return null;
  return <Navbar />;
}

function ConditionalFooter() {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) return null;
  return <Footer />;
}






