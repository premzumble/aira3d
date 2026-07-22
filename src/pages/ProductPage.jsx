import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { doc, getDoc, collection, getDocs, query, where, db } from "../firebase/index.js";
import { useCart } from "../context/CartContext.jsx";
import { formatPrice } from "../utils/formatHelpers.js";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState(0);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customData, setCustomData] = useState({});
  const [customErrors, setCustomErrors] = useState({});

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setProduct(data);
          if (data.colors && data.colors.length > 0) {
            setSelectedColor(data.colors[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!product) return;
      try {
        const q = query(collection(db, "products"), where("category", "==", product.category));
        const snapshot = await getDocs(q);
        const related = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((p) => p.id !== id)
          .slice(0, 4);
        setRelatedProducts(related);
      } catch (err) {
        console.error("Error fetching related products:", err);
      }
    };

    fetchRelated();
  }, [product, id]);

  const needsCustomization = () => {
    if (!product) return false;
    return product.customizationType && product.customizationType !== 'none';
  };

  const getCustomizationType = () => {
    return product?.customizationType || 'none';
  };

  const validateCustomData = () => {
    const errors = {};
    const ct = getCustomizationType();
    if (ct === 'name' && !customData.name?.trim()) {
      errors.name = "Please enter the name to print";
    }
    if (ct === 'license' && !customData.licenseNumber?.trim()) {
      errors.licenseNumber = "Please enter your license plate number (e.g. MH 12 DS 3454)";
    }
    setCustomErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (needsCustomization()) {
      setCustomPrice(product.customizationPrice || product.customPrice || 0);
      setShowCustomModal(true);
      return;
    }
    proceedToCheckout({});
  };

  const proceedToCheckout = (customData) => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity,
      customData,
      customPrice: customPrice || 0,
    });
    setShowCustomModal(false);
    setCustomPrice(0);
    navigate("/checkout");
  };

  const handleCustomSubmit = () => {
    if (!validateCustomData()) return;
    proceedToCheckout(customData);
  };

  const handleQuantityChange = (newQty) => {
    setQuantity(Math.max(1, newQty));
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity,
      customData: {},
      customPrice: 0,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-600 border-t-transparent"></div>
          <p className="text-gray-600 dark:text-gray-800 text-sm">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-50 px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="text-8xl mb-4">🔍</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 dark:text-gray-800 mb-8">The product you're looking for doesn't exist or has been removed.</p>
          <Link to="/shop" className="inline-block px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-medium">Back to Shop</Link>
        </motion.div>
      </div>
    );
  }

const cat = product.category || "";
   const ct = getCustomizationType();
   const isNamePlate = ct === 'name';
   const isLicensePlate = ct === 'license';
   const isPhotoFrame = ct === 'photo';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-50 scroll-smooth">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div variants={itemVariants} className="relative">
            <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-orange-100 via-pink-50 to-indigo-100 dark:from-orange-900/30 dark:via-pink-900/20 dark:to-indigo-900/30">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><span className="text-9xl opacity-50">🪄</span></div>
              )}
            </div>
            {product.featured && (
              <span className="absolute top-4 left-4 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg">FEATURED</span>
            )}
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-col gap-6">
            <div>
              <span className="inline-block px-3 py-1 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded-full text-xs font-semibold mb-4">{cat || "Uncategorized"}</span>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-900 leading-tight">{product.name}</h1>
            </div>

            <div className="text-4xl font-bold text-orange-600">
              {formatPrice(product.price * quantity)}
              {quantity > 1 && <span className="text-lg text-gray-500 ml-2">(₹{product.price} × {quantity})</span>}
            </div>

            <p className="text-gray-600 dark:text-gray-800 leading-relaxed">{product.description || "Premium 3D printed product crafted with precision."}</p>

            <div className="flex flex-wrap gap-4">
              <div className="bg-white dark:bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-200">
                <span className="text-xs text-gray-400 dark:text-gray-800 uppercase tracking-wider">Material</span>
                <p className="font-semibold text-gray-900 dark:text-gray-900 mt-1">{product.material || "PLA"}</p>
              </div>
              <div className="bg-white dark:bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-200">
                <span className="text-xs text-gray-400 dark:text-gray-800 uppercase tracking-wider">Size</span>
                <p className="font-semibold text-gray-900 dark:text-gray-900 mt-1">{product.size || "Standard"}</p>
              </div>
            </div>

            {product.colors && product.colors.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-900 mb-2 block">Color: <span className="font-bold text-gray-900 dark:text-gray-900">{selectedColor}</span></span>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color) => (
                    <button key={color} onClick={() => setSelectedColor(color)} className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${selectedColor === color ? "border-orange-600 ring-2 ring-orange-200 scale-110" : "border-transparent hover:scale-110"}`} style={{ backgroundColor: color }} aria-label={color} />
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-900 mb-2 block">Quantity</span>
              <div className="inline-flex items-center border border-gray-200 dark:border-gray-200 rounded-xl overflow-hidden bg-white dark:bg-gray-50">
                <button onClick={() => handleQuantityChange(quantity - 1)} className="px-4 py-3 text-gray-600 hover:bg-gray-100 transition-colors font-bold disabled:opacity-30" disabled={quantity <= 1}>−</button>
                <span className="px-6 py-3 font-semibold text-gray-900 min-w-[3rem] text-center">{quantity}</span>
                <button onClick={() => handleQuantityChange(quantity + 1)} className="px-4 py-3 text-gray-600 hover:bg-gray-100 transition-colors font-bold">+</button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-2">
              <button 
                onClick={handleAddToCart} 
                disabled={product.stock === 0}
                className="flex-1 py-4 border-2 border-orange-600 text-orange-600 rounded-xl hover:bg-orange-50 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to Cart
              </button>
              <button 
                onClick={handleBuyNow} 
                disabled={product.stock === 0}
                className="flex-1 py-4 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {product.stock === 0 ? 'Out of Stock' : 'Buy Now'}
              </button>
            </div>
          </motion.div>
        </motion.div>

        {relatedProducts.length > 0 && (
          <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-24">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-900">Related Products</h2>
              <Link to="/shop" className="text-orange-600 hover:text-orange-700 font-medium text-sm">View All →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relProduct) => (
                <motion.div key={relProduct.id} whileHover={{ y: -8 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Link to={`/product/${relProduct.id}`} className="block bg-white dark:bg-gray-50 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-200">
                    <div className="aspect-square bg-gradient-to-br from-orange-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                      {relProduct.imageUrl ? <img src={relProduct.imageUrl} alt={relProduct.name} className="w-full h-full object-cover" /> : <span className="text-6xl opacity-50">📦</span>}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-900 truncate">{relProduct.name}</h3>
                      <p className="text-orange-600 dark:text-orange-400 font-bold mt-1">{formatPrice(relProduct.price)}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </div>

      {/* Customization Modal */}
      <AnimatePresence>
        {showCustomModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCustomModal(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white dark:bg-gray-50 rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {isNamePlate ? "🏷️ Enter Name for Name Plate" : isLicensePlate ? "🚗 Enter License Plate Number" : "🖼️ Share Your Photo"}
                </h2>
                <button onClick={() => setShowCustomModal(false)} className="text-gray-400 hover:text-gray-900 text-2xl">✕</button>
              </div>

              <p className="text-sm text-gray-500 mb-6">
                {isNamePlate && "Enter the name you want printed on your name plate."}
                {isLicensePlate && "Enter your vehicle registration number (e.g. MH 12 DS 3454)."}
                {isPhotoFrame && "Share your photo for the frame. Use either option below."}
              </p>

{isNamePlate && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name to Print *</label>
                    <input type="text" value={customData.name || ""} onChange={(e) => setCustomData({...customData, name: e.target.value})} placeholder="Enter name to print" className={`w-full px-4 py-3 rounded-lg border ${customErrors.name ? "border-red-500" : "border-gray-300"} bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none`} />
                    {customErrors.name && <p className="mt-1 text-sm text-red-500">{customErrors.name}</p>}
                  </div>
                </div>
              )}

              {isLicensePlate && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">License Plate Number *</label>
                    <input type="text" value={customData.licenseNumber || ""} onChange={(e) => setCustomData({...customData, licenseNumber: e.target.value.toUpperCase()})} placeholder="MH 12 DS 3454" className={`w-full px-4 py-3 rounded-lg border ${customErrors.licenseNumber ? "border-red-500" : "border-gray-300"} bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none font-mono tracking-wider`} />
                    {customErrors.licenseNumber && <p className="mt-1 text-sm text-red-500">{customErrors.licenseNumber}</p>}
                    <p className="mt-1 text-xs text-gray-400">Format: MH 12 DS 3454 (State Code + RTO + Series + Number)</p>
                  </div>
                </div>
              )}

{isPhotoFrame && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Option 1: Google Drive Photo Link</label>
                    <input type="url" value={customData.photoLink || ""} onChange={(e) => setCustomData({...customData, photoLink: e.target.value})} placeholder="https://drive.google.com/file/d/..." className={`w-full px-4 py-3 rounded-lg border ${customErrors.photoLink ? "border-red-500" : "border-gray-300"} bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none`} />
                    <p className="mt-1 text-xs text-gray-400">Upload photo to Google Drive, set to "Anyone with link can view", paste link here.</p>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                    <div className="relative flex justify-center text-xs"><span className="px-2 bg-white text-gray-400">OR</span></div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Option 2: Send Photo on WhatsApp</label>
                    <p className="text-sm text-gray-500 mb-3">Send your photo directly to our WhatsApp after placing the order. We'll contact you within 24 hours.</p>
                    <a href="https://wa.me/919876543210?text=Hi%20Aira3D!%20I%20want%20to%20order%20a%20photo%20frame.%20Product:%20" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
                      💬 Open WhatsApp to Send Photo
                    </a>
                  </div>
                </div>
              )}

               <div className="mt-6 pt-4 border-t border-gray-200">
                 <div className="flex items-center justify-between mb-4">
                   <div>
                     <div className="flex items-baseline gap-2">
                       <p className="text-sm text-gray-500">Product</p>
                       <p className="font-medium text-gray-900">{formatPrice(product.price)}</p>
                       {customPrice > 0 && <span className="text-xs text-orange-600">+ {formatPrice(customPrice)} customization</span>}
                     </div>
                     <p className="text-xs text-gray-400 mt-0.5">Total ({quantity} × {formatPrice(product.price + customPrice)})</p>
                     <p className="text-2xl font-bold text-orange-600">{formatPrice((product.price + customPrice) * quantity)}</p>
                   </div>
                 </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowCustomModal(false)} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
                  <button onClick={handleCustomSubmit} className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium">Continue to Checkout</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
