import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.jsx';
import { ADMIN_EMAIL } from '../../utils/constants.js';
import { signInWithEmailAndPassword, getAuth } from '../../firebase/index.js';
import toast from 'react-hot-toast';

const HARDCODED_ADMIN = { email: 'kraut9011@gmail.com', password: 'Shri@123' };

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    if (currentUser?.email === ADMIN_EMAIL) {
      navigate('/admin/dashboard');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (email === HARDCODED_ADMIN.email && password === HARDCODED_ADMIN.password) {
        sessionStorage.setItem('hardcodedAdmin', 'true');
        try {
          await signInWithEmailAndPassword(auth, email, password);
          toast.success('Login successful! Redirecting...');
        } catch (err) {
          toast.success('Session active! Redirecting...');
          console.log('Firebase auth note:', err.code, err.message);
        }
        setTimeout(() => navigate('/admin/dashboard'), 600);
      } else {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.length === 0) {
          setError('No account found with this email. Please register first.');
          setLoading(false);
          return;
        }
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/admin/dashboard');
      }
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password');
      } else {
        setError(err.code || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl shadow-orange-400/10 p-8 w-full max-w-md border border-gray-200"
      >
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">
          Admin<span className="text-orange-600"> Login</span>
        </h1>
        <p className="text-gray-600 text-center mb-8">Aira3D Dashboard</p>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border border-red-200 text-red-600 px-5 py-4 rounded-lg mb-6 text-center shadow-sm"
          >
            <p className="text-lg font-semibold">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition"
              placeholder="admin@aira3d.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition"
              placeholder="Enter password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white font-semibold py-3 rounded-lg hover:bg-orange-600 transition disabled:opacity-50 shadow-lg shadow-orange-400/30"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
