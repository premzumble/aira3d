import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Lazy load pages for performance optimization
const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const Gallery = lazy(() => import('./pages/Gallery'));
const CustomOrder = lazy(() => import('./pages/CustomOrder'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Auth = lazy(() => import('./pages/Auth'));
const Profile = lazy(() => import('./pages/Profile'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const Workshop = lazy(() => import('./pages/Workshop'));
const WorkshopRegistration = lazy(() => import('./pages/WorkshopRegistration'));

// Lazy load course pages
const Courses = lazy(() => import('./pages/Courses'));
const CourseDetails = lazy(() => import('./pages/CourseDetails'));
const CourseEnrollment = lazy(() => import('./pages/CourseEnrollment'));

// Lazy load admin pages
const AdminLogin = lazy(() => import('./pages/Admin/AdminLogin'));
const AdminLayout = lazy(() => import('./pages/Admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
const AdminOrders = lazy(() => import('./pages/Admin/AdminOrders'));
const AdminCustomOrders = lazy(() => import('./pages/Admin/AdminCustomOrders'));
const AdminProducts = lazy(() => import('./pages/Admin/AdminProducts'));
const AdminGallery = lazy(() => import('./pages/Admin/AdminGallery'));
const AdminCustomers = lazy(() => import('./pages/Admin/AdminCustomers'));
const AdminContact = lazy(() => import('./pages/Admin/AdminContact'));
const AdminCourses = lazy(() => import('./pages/Admin/AdminCourses'));
const AdminEnrollments = lazy(() => import('./pages/Admin/AdminEnrollments'));

// Loading Fallback Component
const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
    <p className="text-gray-500 font-medium animate-pulse">Loading Aira3D...</p>
  </div>
);

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageLoader />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/custom-order" element={<CustomOrder />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
          <Route path="/about" element={<About />} />
          <Route path="/workshop" element={<Workshop />} />
          <Route path="/workshop/register" element={<WorkshopRegistration />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetails />} />
          <Route path="/courses/:id/enroll" element={<CourseEnrollment />} />
          
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
            <Route path="courses" element={<AdminCourses />} />
            <Route path="enrollments" element={<AdminEnrollments />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <CartProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-50 transition-colors duration-300 flex flex-col">
            <ConditionalNavbar />
            <main className="flex-1">
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
