import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { collection, getDocs, db, query, orderBy } from "../firebase/index.js";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/formatHelpers";
import toast from "react-hot-toast";

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { addToCart } = useCart();
  const navigate = useNavigate();

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

  const getFilteredForCategory = (cat) => {
    let result = products.filter((p) => p.category === cat);
    if (search) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    return result;
  };

  const allFiltered = search
    ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : products;

  const visibleCategories = selectedCategory
    ? [selectedCategory]
    : categories.filter((cat) => {
        const catProducts = products.filter((p) => p.category === cat);
        if (search) {
          return catProducts.some((p) =>
            p.name.toLowerCase().includes(search.toLowerCase())
          );
        }
        return catProducts.length > 0;
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-50 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow flex flex-col"
    >
      <Link to={`/product/${product.id}`}>
        <div className="h-56 bg-gradient-to-br from-orange-100 to-gray-50 flex items-center justify-center text-gray-400 relative">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-4xl">📦</span>
          )}
          {product.category && (
            <span className="absolute top-3 left-3 text-xs font-medium text-orange-600 bg-white/90 px-2 py-1 rounded-full">
              {product.category}
            </span>
          )}
        </div>
      </Link>
      <div className="p-5 flex-1 flex flex-col">
        <Link to={`/product/${product.id}`}>
          <h3 className="text-lg font-semibold mb-2 flex-1 hover:text-orange-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="text-xl font-bold text-orange-600 mb-4">
          {formatPrice(product.price)}
        </p>
        <div className="flex gap-2">
          <Link to={`/product/${product.id}`} className="flex-1">
            <button className="w-full py-2.5 border-2 border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors text-sm font-medium">
              View Details
            </button>
          </Link>
          <button
            onClick={() => handleBuyNow(product)}
            disabled={product.stock === 0}
            className="flex-1 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {product.stock === 0 ? 'Out of Stock' : 'Buy Now'}
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-50">
      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
          Our <span className="text-orange-600">Shop</span>
        </h1>

        <div className="bg-white dark:bg-gray-50 rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="🔍 Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-300 bg-white dark:bg-gray-50 text-gray-900 dark:text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            />
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !selectedCategory
                    ? "bg-orange-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All Categories
              </button>
              {categories.slice(0, 6).map((cat) => (
                <button
                  key={cat}
                  onClick={() =>
                    setSelectedCategory(selectedCategory === cat ? null : cat)
                  }
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === cat
                      ? "bg-orange-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-32">
            <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : allFiltered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-gray-400 mb-6">
              Try adjusting your search or filter criteria
            </p>
          </motion.div>
        ) : (
          <div className="space-y-12">
            {visibleCategories.map((cat) => {
              const catProducts = selectedCategory
                ? allFiltered.filter((p) => p.category === cat)
                : getFilteredForCategory(cat);

              if (catProducts.length === 0) return null;

              return (
                <motion.div
                  key={cat}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white dark:bg-gray-50 rounded-2xl shadow-lg overflow-hidden"
                >
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {cat}
                      <span className="text-sm font-normal text-gray-400 ml-3">
                        {catProducts.length} product{catProducts.length !== 1 ? "s" : ""}
                      </span>
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <AnimatePresence mode="wait">
                        {catProducts.map((product) => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Shop;
