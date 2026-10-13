import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.jsx';
import { ADMIN_EMAIL } from '../../utils/constants.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, getAuth } from '../../firebase/index.js';

const HARDCODED_ADMIN = { email: 'kraut9011@gmail.com', password: 'Shri@123' };

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    if (currentUser?.email === ADMIN_EMAIL) {
      navigate('/admin/dashboard');
    }
  }, [currentUser, navigate]);

  const handleResetPassword = async () => {
    const targetEmail = email || HARDCODED_ADMIN.email;
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      setError('');
      setSuccess(`Password reset email sent to ${targetEmail}. Check your inbox, set a new password, then log in here.`);
      setResetSent(true);
    } catch (err) {
      console.error('[AdminLogin] Reset email error:', err.code);
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const isHardcodedAdmin = email === HARDCODED_ADMIN.email && password === HARDCODED_ADMIN.password;

    try {
      // Step 1: Try to sign in via Firebase Auth
      await signInWithEmailAndPassword(auth, email, password);
      setSuccess('Login successful! Redirecting...');
      setTimeout(() => navigate('/admin/dashboard'), 600);
    } catch (signInError) {
      console.error('[AdminLogin] Sign-in failed:', signInError.code);

      // Step 2: If hardcoded admin and sign-in failed, try to create the account
      if (isHardcodedAdmin && (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential')) {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          setSuccess('Admin account created! Redirecting...');
          setTimeout(() => navigate('/admin/dashboard'), 600);
        } catch (createError) {
          console.error('[AdminLogin] Account creation failed:', createError.code);
          if (createError.code === 'auth/email-already-in-use') {
            setError('The password for this account has changed. Click "Reset Password" below to set a new one via email.');
          } else {
            setError(createError.message || 'Failed to create admin account.');
          }
        }
      } else {
        if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
          setError('Invalid email or password.');
        } else if (signInError.code === 'auth/too-many-requests') {
          setError('Too many failed attempts. Please try again later.');
        } else {
          setError(signInError.message || 'Login failed.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">Aira3D Admin</h1>
        <p className="text-gray-500 font-medium">Secure Dashboard Access</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 w-full max-w-md border border-gray-100"
      >
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </motion.div>
          )}
          {success && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mb-6 bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
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
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="Enter password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-500/20"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={resetSent}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {resetSent ? 'Reset email sent — check your inbox' : 'Reset Password'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
