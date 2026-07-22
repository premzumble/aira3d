import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
  getAuth,
} from "../firebase/index.js";
import { collection, addDoc, serverTimestamp, db } from "../firebase/index.js";

const getAuthErrorMessage = (code) => {
  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Please use a different email or log in.";
    case "auth/user-not-found":
      return "No account found with this email. Please register first.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/invalid-credential":
      return "Invalid email or password. Please check and try again.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    default:
      return "An unexpected error occurred. Please try again.";
  }
};

export default function Auth() {
  const [tab, setTab] = useState("register");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({ name: "", email: "", password: "", confirmPassword: "" });

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from") || "/shop";
  const auth = getAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const methods = await fetchSignInMethodsForEmail(auth, loginData.email);
      if (methods.length === 0) {
        const message = "No account found with this email. Please register first.";
        setError(message);
        setLoading(false);
        return;
      }
      await signInWithEmailAndPassword(auth, loginData.email, loginData.password);
      setSuccess("Login successful! Welcome back.");
      setTimeout(() => navigate(from), 1500);
    } catch (err) {
      const message = getAuthErrorMessage(err.code);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, new GoogleAuthProvider());
      if (res.user && !res.user.displayName) {
        try {
          await addDoc(collection(db, "users"), {
            uid: res.user.uid,
            email: res.user.email,
            name: res.user.displayName || res.user.email,
            createdAt: serverTimestamp(),
          });
        } catch (docErr) {
          console.error("Failed to create user profile in Firestore:", docErr);
        }
      }
      setSuccess("Welcome! Logging you in...");
      setTimeout(() => navigate(from), 1500);
    } catch (err) {
      const message = getAuthErrorMessage(err.code);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (registerData.password !== registerData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, registerData.email, registerData.password);
      try {
        await addDoc(collection(db, "users"), {
          uid: res.user.uid,
          email: registerData.email,
          name: registerData.name,
          createdAt: serverTimestamp(),
        });
      } catch (docErr) {
        console.error("User created but Firestore profile failed:", docErr);
      }
      setSuccess("Account created successfully! Redirecting...");
      setTimeout(() => navigate(from), 1500);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please log in instead.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else {
        setError(err.code || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 30 }}
            animate={{ y: 0 }}
            className="bg-red-500 text-white px-10 py-6 rounded-2xl shadow-2xl text-center max-w-lg mx-4"
          >
            <p className="text-3xl font-bold mb-2">⚠️</p>
            <p className="text-2xl font-bold leading-tight">{error}</p>
            <button
              onClick={() => setError("")}
              className="mt-6 px-8 py-3 bg-white text-red-500 font-bold rounded-xl hover:bg-gray-100 transition-colors text-lg"
            >OK</button>
          </motion.div>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 30 }}
            animate={{ y: 0 }}
            className="bg-green-500 text-white px-10 py-6 rounded-2xl shadow-2xl text-center max-w-lg mx-4"
          >
            <p className="text-3xl font-bold mb-2">✅</p>
            <p className="text-2xl font-bold leading-tight">{success}</p>
          </motion.div>
        </motion.div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-orange-600 px-8 py-6 text-center">
            <h1 className="text-2xl font-bold text-white">Aira3D</h1>
            <p className="text-orange-100 text-sm mt-1">Your account</p>
          </div>
          <div className="flex">
            <button
              onClick={() => { setTab("login"); setError(""); }}
              className={`flex-1 py-4 text-center font-semibold text-sm transition-all duration-300 ${
                tab === "login"
                  ? "bg-white text-orange-600 shadow-inner border-b-2 border-orange-600"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => { setTab("register"); setError(""); }}
              className={`flex-1 py-4 text-center font-semibold text-sm transition-all duration-300 relative ${
                tab === "register"
                  ? "bg-white text-orange-600 shadow-inner border-b-2 border-orange-600"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              Register
              <span className="absolute top-1 right-4 bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">New</span>
            </button>
          </div>

          <div className="p-8">
            {tab === "login" ? (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div className="text-right">
                  <span
                    onClick={(e) => {
                      e.preventDefault();
                      if (!loginData.email) {
                        toast.error("Please enter your email address first.");
                        return;
                      }
                      sendPasswordResetEmail(auth, loginData.email)
                        .then(() => toast.success("Password reset email sent! Check your inbox."))
                        .catch((err) => {
                          const msg = err.code === "auth/user-not-found"
                            ? "No account found with this email."
                            : "Failed to send reset email. Please try again.";
                          toast.error(msg);
                        });
                    }}
                    className="text-sm text-orange-600 hover:text-orange-700 cursor-pointer transition-colors"
                  >
                    Forgot Password?
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  {loading ? "Signing In..." : "Login"}
                </button>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-3 bg-white border border-gray-300 text-gray-800 font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Login with Google
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    placeholder="Create a password"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    placeholder="Confirm your password"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}