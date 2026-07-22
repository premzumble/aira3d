import { useState, useEffect } from 'react';
import { Outlet, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { ADMIN_EMAIL } from '../../utils/constants.js';
import { motion } from 'framer-motion';

const HARDCODED_ADMIN = { email: 'kraut9011@gmail.com' };

const navItems = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
  { name: 'Orders', path: '/admin/orders', icon: '🛒' },
  { name: 'Custom Orders', path: '/admin/custom-orders', icon: '📐' },
  { name: 'Products', path: '/admin/products', icon: '📦' },
  { name: 'Gallery', path: '/admin/gallery', icon: '🖼️' },
  { name: 'Customers', path: '/admin/customers', icon: '👥' },
  { name: 'Contact', path: '/admin/contact', icon: '📧' },
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
    }
  }, [currentUser, loading, navigate]);

  const handleLogout = async () => {
    sessionStorage.removeItem('hardcodedAdmin');
    await logout();
    navigate('/admin/login');
  };

  const adminEmail = currentUser?.email || HARDCODED_ADMIN?.email || 'admin';
  const shortEmail = adminEmail.split('@')[0];

return (
    <div className="min-h-screen bg-white flex">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-gray-100 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 border-r border-slate-700`}
      >
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-white">
            Aira3D<span className="text-orange-400">Admin</span>
          </h1>
          <p className="text-xs text-gray-300 mt-1">Dashboard Panel</p>
        </div>

        <nav className="mt-6 px-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-orange-500/30 text-orange-300 border border-orange-400/50'
                    : 'text-gray-200 hover:bg-white/15 hover:text-white'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className="text-lg">{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-red-300 transition-colors"
          >
            <span className="text-lg">🚪</span>
            Logout
          </button>
        </div>
      </aside>

{sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 md:ml-64">
<header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800"
            >
              ☰
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              Admin Panel
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{shortEmail}</p>
              <p className="text-xs text-gray-600">Administrator</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold border-2 border-orange-400">
              {shortEmail.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="p-6 bg-gray-50 min-h-[calc(100vh-64px)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}









