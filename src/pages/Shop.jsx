import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/formatHelpers";
import toast from "react-hot-toast";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  CubeTransparentIcon,
  ShoppingBagIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsSnap, categoriesSnap] = await Promise.all([
        getDocs(collection(db, "products")),
        getDocs(query(collection(db, "categories"), orderBy("name", "asc"))),
      ]);
      const productsData = productsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      productsData.sort((a, b) => {
        const dateA = a.createdAt?.toMillis?.() || a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.toMillis?.() || b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      setProducts(productsData);
      const cats = categoriesSnap.docs.map(d => d.data().name);
      setCategories(cats.length > 0 ? cats : [
        'Name Plates', 'License Plates', 'Photo Frames', 'Ganesh Models',
        'Krishna Models', 'Chiranjiva Models', 'Home Decor', 'Kitchen Products',
        'Phone Stands', 'Robotic Chess', 'Electronics', 'Statues',
        'Office Decor', 'Gifts', 'Customized Products'
      ]);
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Check for category in URL query params
    const queryParams = new URLSearchParams(location.search);
    const categoryParam = queryParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [location]);

  const allFiltered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleBuyNow = (product) => {
    const customizationTypes = ['name', 'license', 'photo'];
    if (customizationTypes.includes(product.customizationType)) {
      navigate(`/product/${product.id}`);
      return;
    }
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity: 1,
      customData: {},
    });
    navigate("/checkout");
  };

  const ProductCard = ({ product }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="group bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-gray-200/50 hover:border-gray-200 transition-all duration-300 flex flex-col h-full"
    >
      <Link to={`/product/${product.id}`} className="block relative overflow-hidden aspect-square bg-gray-50 m-2 rounded-2xl">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <CubeTransparentIcon className="w-16 h-16" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300"></div>
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 items-start">
           {product.category && (
             <Badge variant="primary" className="bg-white/90 backdrop-blur-sm shadow-sm">{product.category}</Badge>
           )}
           {product.stock === 0 && (
             <Badge variant="danger" className="bg-white/90 backdrop-blur-sm shadow-sm">Out of Stock</Badge>
           )}
        </div>
      </Link>
      
      <div className="p-5 flex flex-col flex-grow">
        <Link to={`/product/${product.id}`} className="block mb-2 flex-grow">
          <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-50">
          <p className="text-xl font-bold text-gray-900">
            {formatPrice(product.price)}
          </p>
          <button
            onClick={() => handleBuyNow(product)}
            disabled={product.stock === 0}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
              product.stock === 0 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-primary-50 text-primary-600 hover:bg-primary-600 hover:text-white shadow-sm hover:shadow-md'
            }`}
            title={product.stock === 0 ? 'Out of Stock' : 'Add to Cart / Buy Now'}
          >
            <ShoppingBagIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10 text-center lg:text-left">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-4">
            Our Collection
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto lg:mx-0">
            Browse our premium selection of 3D printed products, designed with precision and crafted for quality.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden w-full flex items-center gap-4">
            <div className="relative flex-grow">
               <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                 <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
               </div>
               <input
                 type="text"
                 placeholder="Search products..."
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="w-full pl-11 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all shadow-sm"
               />
            </div>
            <Button variant="secondary" className="flex-shrink-0" onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}>
              <FunnelIcon className="w-5 h-5 mr-2" /> Filters
            </Button>
          </div>

          {/* Sidebar Filters (Desktop Sticky, Mobile Expandable) */}
          <div className={`w-full lg:w-[280px] lg:sticky lg:top-24 flex-shrink-0 ${isMobileFiltersOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
               
               <div className="hidden lg:block mb-8">
                 <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Search</label>
                 <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                     <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                   </div>
                   <input
                     type="text"
                     placeholder="Find something..."
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                     className="w-full pl-11 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                   />
                 </div>
               </div>

               <div className="mb-4 flex items-center justify-between">
                 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Categories</h3>
                 {selectedCategory !== "All" && (
                   <button onClick={() => setSelectedCategory("All")} className="text-xs text-primary-600 font-medium hover:underline">Clear</button>
                 )}
               </div>

               <div className="flex flex-col gap-1.5 max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                  <button
                    onClick={() => { setSelectedCategory("All"); setIsMobileFiltersOpen(false); }}
                    className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      selectedCategory === "All"
                        ? "bg-primary-50 text-primary-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    All Products
                  </button>
                  {categories.map((cat) => {
                    const count = products.filter(p => p.category === cat).length;
                    if(count === 0) return null;
                    return (
                      <button
                        key={cat}
                        onClick={() => { setSelectedCategory(cat); setIsMobileFiltersOpen(false); }}
                        className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          selectedCategory === cat
                            ? "bg-primary-50 text-primary-700"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <span className="truncate pr-2 text-left">{cat}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${selectedCategory === cat ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'}`}>
                          {count}
                        </span>
                      </button>
                    )
                  })}
               </div>
            </div>
          </div>
          
          {/* Main Product Grid */}
          <div className="flex-1 w-full min-w-0">
            
            {/* Active Filters Bar */}
            {(search || selectedCategory !== "All") && (
              <div className="flex flex-wrap items-center gap-2 mb-6 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-sm text-gray-500 font-medium mr-2 ml-2">Active filters:</span>
                {selectedCategory !== "All" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-sm font-medium text-gray-700 border border-gray-200">
                    Category: {selectedCategory}
                    <button onClick={() => setSelectedCategory("All")} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-4 h-4" /></button>
                  </span>
                )}
                {search && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-sm font-medium text-gray-700 border border-gray-200">
                    Search: "{search}"
                    <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-4 h-4" /></button>
                  </span>
                )}
              </div>
            )}

            {/* Product Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div key={n} className="animate-pulse bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
                    <div className="bg-gray-100 aspect-square rounded-2xl mb-4"></div>
                    <div className="h-4 bg-gray-100 rounded w-1/3 mb-2"></div>
                    <div className="h-6 bg-gray-100 rounded w-3/4 mb-4"></div>
                    <div className="h-6 bg-gray-100 rounded w-1/4 mt-8"></div>
                  </div>
                ))}
              </div>
            ) : allFiltered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 px-4 bg-white rounded-3xl border border-gray-100 shadow-sm"
              >
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                  <MagnifyingGlassIcon className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-display font-bold text-gray-900 mb-3">No products found</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  We couldn't find any products matching your current filters. Try removing them to see more options.
                </p>
                <Button variant="secondary" onClick={() => { setSearch(""); setSelectedCategory("All"); }}>
                  Clear all filters
                </Button>
              </motion.div>
            ) : (
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                  {allFiltered.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Shop;
