import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { collection, query, getDocs, limit, db } from "../firebase/index.js";
import { formatPrice } from "../utils/formatHelpers";
import { CATEGORIES } from "../utils/constants";

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true });

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const q = query(collection(db, 'products'), limit(4));
        const snapshot = await getDocs(q);
        setFeatured(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
      } catch (err) {
        console.error("Error fetching featured products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const featureIcons = [
    { icon: "💎", title: "Premium Quality", desc: "Top-grade materials for flawless finishes" },
    { icon: "🚀", title: "Fast Delivery", desc: "Quick turnaround without compromising quality" },
    { icon: "🎨", title: "Custom Designs", desc: "Your imagination, our expertise" },
  ];

  const stats = [
    { value: "1000+", label: "Products" },
    { value: "500+", label: "Happy Customers" },
    { value: "50+", label: "Categories" },
    { value: "24/7", label: "Support" },
  ];

  return (
    <div className="min-h-screen">
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-100 via-white to-gray-50">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${120 + i * 60}px`,
              height: `${120 + i * 60}px`,
              top: `${10 + (i % 3) * 30}%`,
              left: `${5 + (i % 2) * 50}%`,
              background: `radial-gradient(circle, rgba(255,107,0,0.08) 0%, transparent 70%)`,
            }}
            animate={{ y: [0, -30 - i * 10, 0], x: [0, 20 - i * 5, 0], scale: [1, 1.1 + i * 0.05, 1] }}
            transition={{ duration: 4 + i * 0.8, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="block bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Bring Your Ideas To Life
            </motion.span>
            <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="block bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
              With High Quality 3D Printing
            </motion.span>
          </h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }} className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Transforming Ideas Into Reality Through 3D Printing
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.6 }} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/shop" className="px-8 py-4 bg-orange-400 text-gray-900 rounded-full font-semibold hover:bg-orange-300 transition-colors shadow-lg shadow-orange-400/30">Shop Now</Link>
            <Link to="/custom-order" className="px-8 py-4 bg-white text-gray-900 rounded-full font-semibold hover:bg-gray-100 transition-colors shadow-lg">Custom Order</Link>
            <Link to="/contact" className="px-8 py-4 border-2 border-orange-400 text-orange-400 rounded-full font-semibold hover:bg-orange-400/10 transition-colors">Contact Us</Link>
          </motion.div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div animate={{ y: [0, 12, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-gray-800/70 text-sm flex flex-col items-center gap-2 cursor-pointer">
            <span>Scroll Down</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-white dark:bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl md:text-4xl font-bold text-center mb-16">
            Why Choose <span className="text-orange-600">Aira3D</span>
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featureIcons.map((feature, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }} className="text-center p-8 rounded-2xl bg-gray-50 dark:bg-gray-50 hover:shadow-xl transition-shadow">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-900">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50 dark:bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl md:text-4xl font-bold text-center mb-12">
            Explore <span className="text-orange-600">Categories</span>
          </motion.h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((cat, i) => (
              <motion.div key={cat} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Link to={`/shop?category=${encodeURIComponent(cat)}`} className="block px-4 py-4 bg-white dark:bg-gray-50 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all text-center">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-900 leading-tight block">{cat}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white dark:bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl md:text-4xl font-bold text-center mb-12">
            Featured <span className="text-orange-600">Products</span>
          </motion.h2>
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((product) => (
                <motion.div key={product.id} variants={itemVariants} className="bg-white dark:bg-gray-50 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <Link to={`/product/${product.id}`}>
                    <div className="h-48 bg-gradient-to-br from-orange-100 to-gray-50 dark:from-orange-900 dark:to-gray-900 flex items-center justify-center text-gray-400">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl">📦</span>
                      )}
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link to={`/product/${product.id}`}>
                      <span className="text-xs font-medium text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full cursor-pointer">
                        {product.category || "General"}
                      </span>
                    </Link>
                    <Link to={`/product/${product.id}`}>
                      <h3 className="text-lg font-semibold mt-2 mb-1 line-clamp-1 cursor-pointer hover:text-orange-600 transition-colors">{product.name}</h3>
                    </Link>
                    <p className="text-lg font-bold text-orange-600 mb-3">{formatPrice(product.price)}</p>
                    <Link to={`/product/${product.id}`}>
                      <button className="w-full py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium">Buy Now</button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      <section ref={statsRef} className="py-20 bg-gradient-to-r from-orange-900 to-orange-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.5 }} animate={statsInView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.5, delay: i * 0.15 }} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-orange-200 text-sm md:text-base">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50 dark:bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl md:text-5xl font-bold mb-6">Ready to Start?</motion.h2>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-xl text-gray-600 dark:text-gray-900 mb-8">Order Custom 3D Printed Products Today!</motion.p>
          <Link to="/custom-order" className="inline-block px-10 py-4 bg-orange-600 text-white rounded-full font-semibold hover:bg-orange-700 transition-colors shadow-lg text-lg">Get Started</Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
