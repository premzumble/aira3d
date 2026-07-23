import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { collection, query, getDocs, limit } from "firebase/firestore";
import { db } from "../firebase";
import { formatPrice } from "../utils/formatHelpers";
import { CATEGORIES } from "../utils/constants";
import Button from "../components/ui/Button";
import { 
  ArrowRightIcon, 
  ChevronDownIcon, 
  SparklesIcon, 
  TruckIcon, 
  ShieldCheckIcon, 
  CubeTransparentIcon,
  StarIcon,
  ShoppingBagIcon
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-100px" });

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
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const features = [
    { icon: <ShieldCheckIcon className="w-8 h-8" />, title: "Premium Quality", desc: "Top-grade PLA & resin materials for flawless finishes that last." },
    { icon: <TruckIcon className="w-8 h-8" />, title: "Fast Delivery", desc: "Quick turnaround across India without compromising on quality." },
    { icon: <SparklesIcon className="w-8 h-8" />, title: "Custom Designs", desc: "Your imagination combined with our engineering expertise." },
  ];

  const stats = [
    { value: "10k+", label: "Products Delivered" },
    { value: "4.9/5", label: "Average Rating" },
    { value: "50+", label: "Design Categories" },
    { value: "24/7", label: "Expert Support" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[95vh] min-h-[700px] flex items-center justify-center overflow-hidden bg-white">
        <div className="absolute inset-0 z-0">
          {/* Subtle gradient background */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-50 rounded-full blur-[120px] opacity-80 transform translate-x-1/3 -translate-y-1/4"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-50 rounded-full blur-[100px] opacity-80 transform -translate-x-1/3 translate-y-1/4"></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto mt-16 pt-10">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-100 text-primary-700 font-medium text-sm mb-8">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
            </span>
            <span>Now shipping pan-India</span>
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-display font-bold text-gray-900 mb-8 leading-[1.05] tracking-tight">
            <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }} className="block">
              Premium 3D Printed
            </motion.span>
            <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-orange-400 pb-2">
              Products & Parts.
            </motion.span>
          </h1>
          
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.8 }} className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            Discover exquisite 3D printed Ganesh idols, personalized home decor, and bespoke manufacturing solutions crafted with precision engineering.
          </motion.p>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.6 }} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/shop">
              <Button size="lg" className="w-full sm:w-auto px-10 shadow-lg shadow-primary-500/20 group">
                Explore Collection
                <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/custom-order">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-10 bg-white">
                Request Custom Order
              </Button>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.8 }} className="mt-12 flex items-center justify-center gap-4 text-sm text-gray-500 font-medium">
            <div className="flex items-center gap-1">
               <div className="flex -space-x-1">
                 {[1,2,3,4,5].map(i => <StarIconSolid key={i} className="w-4 h-4 text-yellow-400" />)}
               </div>
               <span className="ml-2">Loved by 500+ creators</span>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden md:block">
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="text-gray-400 cursor-pointer" onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}>
            <ChevronDownIcon className="w-6 h-6" />
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-gray-50 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">Trending Now</h2>
              <p className="text-gray-500 text-lg">Our most popular and highest rated items this week.</p>
            </div>
            <Link to="/shop" className="text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1 transition-colors">
              View All Products <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="animate-pulse bg-white rounded-3xl p-4 border border-gray-100">
                  <div className="bg-gray-100 aspect-square rounded-2xl mb-4"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/3 mb-2"></div>
                  <div className="h-6 bg-gray-100 rounded w-3/4 mb-4"></div>
                  <div className="h-6 bg-gray-100 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featured.map((product) => (
                <motion.div key={product.id} variants={itemVariants} className="group bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 flex flex-col h-full">
                  <Link to={`/product/${product.id}`} className="block relative overflow-hidden aspect-square bg-gray-50 m-2 rounded-2xl">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <CubeTransparentIcon className="w-16 h-16" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300"></div>
                    {/* Quick Add Button Overlay (Desktop) */}
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 px-4">
                      <Button variant="primary" size="sm" className="w-full shadow-lg">Quick View</Button>
                    </div>
                  </Link>
                  <div className="p-5 flex flex-col flex-grow">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">{product.category || "General"}</span>
                    <Link to={`/product/${product.id}`} className="block mb-2 flex-grow">
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">{product.name}</h3>
                    </Link>
                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-50">
                      <p className="text-lg font-bold text-gray-900">{formatPrice(product.price)}</p>
                      <div className="flex items-center text-sm text-gray-500 font-medium">
                        <StarIconSolid className="w-4 h-4 text-yellow-400 mr-1" />
                        4.9
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">Explore by Category</h2>
            <p className="text-gray-500 text-lg">From divine idols to functional mechanical parts.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((cat, i) => (
              <motion.div key={cat} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.4 }}>
                <Link to={`/shop?category=${encodeURIComponent(cat)}`} className="group block h-full bg-gray-50 p-6 rounded-3xl hover:bg-white hover:shadow-lg border border-transparent hover:border-gray-100 transition-all duration-300 hover:-translate-y-1 text-center">
                  <div className="w-14 h-14 bg-white text-gray-400 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-50 group-hover:text-primary-600 group-hover:scale-110 shadow-sm transition-all duration-300">
                    <CubeTransparentIcon className="w-7 h-7" />
                  </div>
                  <h3 className="font-semibold text-gray-900 leading-tight text-sm">{cat}</h3>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-gray-900 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary-600 via-gray-900 to-gray-900"></div>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-orange-600 via-transparent to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-primary-400 font-bold tracking-wider uppercase text-sm mb-4 block">The Aira3D Standard</span>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 leading-tight">Engineered for Excellence</h2>
            <p className="text-gray-400 text-lg md:text-xl font-light">We combine state-of-the-art 3D printing technology with meticulous craftsmanship to deliver products that exceed expectations.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {features.map((feature, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }} className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-3xl border border-gray-700/50 text-center hover:bg-gray-800 transition-colors">
                <div className="w-16 h-16 mx-auto bg-gray-900 rounded-2xl flex items-center justify-center text-primary-400 mb-6 shadow-inner border border-gray-700">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section ref={statsRef} className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 divide-x divide-gray-100">
            {stats.map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={statsInView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.5, delay: i * 0.1 }} className="text-center px-4">
                <div className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-500 font-medium tracking-wide text-sm uppercase">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter / CTA */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white rounded-[3rem] p-10 md:p-20 shadow-xl shadow-gray-200/40 border border-gray-100 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-display font-bold text-gray-900 mb-6">Bring your unique ideas to life.</h2>
              <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto">Upload your 3D model or share your concept, and our experts will manufacture it with precision and care.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/custom-order">
                  <Button size="lg" className="w-full sm:w-auto px-10 shadow-lg shadow-primary-500/20">
                    Request a Custom Quote
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
