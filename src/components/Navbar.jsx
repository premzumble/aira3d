import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { cartCount } = useCart();
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Custom Order', path: '/custom-order' },
    { name: 'Workshop', path: '/workshop' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex-shrink-0">
            <h1 className="text-xl font-bold text-gray-900">Aira3D</h1>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-3 py-2 text-sm font-medium tracking-wide transition-colors ${
                  isActive(link.path) ? 'text-orange-600' : 'text-gray-700 hover:text-orange-600'
                }`}
              >
                {link.name}
                {isActive(link.path) && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-600" />
                )}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/cart"
              className="relative p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Cart"
            >
              🛒
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {currentUser ? (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-full">
                  <div className="w-7 h-7 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-bold">
                    {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-900 max-w-[120px] truncate">
                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                  </span>
                </div>
                <Link
                  to="/profile"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors"
                >
                  My Orders
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors"
              >
                Login
              </Link>
            )}

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
              aria-label="Toggle menu"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-md z-40"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="md:hidden fixed top-16 right-0 bottom-0 w-72 bg-black text-white shadow-2xl z-40 border-l border-gray-700"
            >
              <div className="flex flex-col py-4">
                {navLinks.map((link) => {
                  const active = isActive(link.path);
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setMenuOpen(false)}
                      className={`px-6 py-4 text-base font-semibold tracking-wide transition-all border-l-4 ${
                        active
                          ? 'border-orange-500 text-orange-400 bg-white/10'
                          : 'border-transparent text-white hover:bg-white/10'
                      }`}
                    >
                      {link.name}
                    </Link>
                  );
                })}
                <div className="border-t border-gray-700 mt-4 pt-4">
                  {currentUser ? (
                    <>
                      <div className="px-6 py-3 text-base font-semibold text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center text-sm font-bold">
                          {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        {currentUser.displayName || currentUser.email?.split('@')[0]}
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setMenuOpen(false)}
                        className={`px-6 py-4 text-base font-semibold tracking-wide transition-all border-l-4 block ${
                          isActive('/profile')
                            ? 'border-orange-500 text-orange-400 bg-white/10'
                            : 'border-transparent text-white hover:bg-white/10'
                        }`}
                      >
                        My Orders
                      </Link>
                      <button
                        onClick={() => { logout(); setMenuOpen(false); }}
                        className="px-6 py-4 text-base font-semibold tracking-wide text-gray-300 hover:text-red-400 hover:bg-white/10 w-full text-left border-l-4 border-transparent transition-all"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className={`px-6 py-4 text-base font-semibold tracking-wide transition-all border-l-4 block ${
                        isActive('/login')
                          ? 'border-orange-500 text-orange-400 bg-white/10'
                          : 'border-transparent text-white hover:bg-white/10'
                      }`}
                    >
                      Login
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
