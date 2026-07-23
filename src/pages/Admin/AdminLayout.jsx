import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChartPieIcon,
  ShoppingCartIcon,
  WrenchScrewdriverIcon,
  CubeIcon,
  PhotoIcon,
  UsersIcon,
  EnvelopeIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

import { Toaster, toast } from 'react-hot-toast';
const ALLOWED_ADMIN_EMAILS = ['kraut9011@gmail.com'];
const navItems = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: ChartPieIcon },
  { name: 'Orders', path: '/admin/orders', icon: ShoppingCartIcon },
  { name: 'Custom Orders', path: '/admin/custom-orders', icon: WrenchScrewdriverIcon },
  { name: 'Products', path: '/admin/products', icon: CubeIcon },
  { name: 'Courses', path: '/admin/courses', icon: AcademicCapIcon },
  { name: 'Enrollments', path: '/admin/enrollments', icon: ClipboardDocumentListIcon },
  { name: 'Gallery', path: '/admin/gallery', icon: PhotoIcon },
  { name: 'Customers', path: '/admin/customers', icon: UsersIcon },
  { name: 'Contact', path: '/admin/contact', icon: EnvelopeIcon },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, logout, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    const hardcodedAdmin = sessionStorage.getItem('hardcodedAdmin');
    
    if (!currentUser && !hardcodedAdmin) {
      navigate('/admin/login', { replace: true });
      return;
    }

    if (currentUser) {
      if (!ALLOWED_ADMIN_EMAILS.includes(currentUser.email)) {
        toast.error('Unauthorized access. Admin privileges required.');
        navigate('/', { replace: true });
      }
    }
  }, [currentUser, loading, navigate]);

  const handleLogout = async () => {
    sessionStorage.removeItem('hardcodedAdmin');
    await logout();
    navigate('/admin/login');
  };

  const adminEmail = currentUser?.email || 'kraut9011@gmail.com';
  const shortEmail = adminEmail.split('@')[0];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0f172a] text-gray-300 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 border-r border-slate-800 shadow-xl flex flex-col`}
      >
        <div className="p-6 pb-4 border-b border-slate-800/60 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-white tracking-tight">
              Aira3D<span className="text-orange-500">.</span>
            </h1>
            <p className="text-[11px] font-medium tracking-widest text-slate-500 uppercase mt-1">Admin Workspace</p>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 -mr-2 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-orange-500/10 text-orange-400'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`
                }
                onClick={() => setSidebarOpen(false)}
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-orange-500' : 'text-slate-500'}`} />
                    {item.name}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/60 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-orange-400 font-bold border border-slate-700">
              {shortEmail.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{shortEmail}</p>
              <p className="text-xs text-slate-500 truncate">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 bg-slate-800 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 sm:px-8 h-16 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 -ml-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-display font-semibold text-gray-900 hidden sm:block">
              Control Panel
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{shortEmail}</p>
              <p className="text-xs text-gray-500">Active Session</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold">
              {shortEmail.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-50/50">
          <Outlet />
        </main>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
