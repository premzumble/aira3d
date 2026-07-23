import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { doc, getDoc, collection, getDocs, query, where, db } from "../firebase/index.js";
import { useCart } from "../context/CartContext.jsx";
import { formatPrice } from "../utils/formatHelpers.js";
import toast from "react-hot-toast";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import { 
  ShoppingBagIcon, 
  ArrowLeftIcon, 
  TruckIcon, 
  ShieldCheckIcon, 
  ArrowPathIcon,
  MinusIcon,
  PlusIcon
} from "@heroicons/react/24/outline";

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
      window.scrollTo(0, 0);
      setLoading(true);
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setProduct(data);
          if (data.colors && data.colors.length > 0) {
            setSelectedColor(data.colors[0]);
          }
        } else {
          toast.error("Product not found");
          navigate('/shop');
        }
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

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

  const validateCustomData = () => {
    const errors = {};
    const ct = product?.customizationType || 'none';
    if (ct === 'name' && !customData.name?.trim()) {
      errors.name = "Please enter the name to print";
    }
    if (ct === 'license' && !customData.licenseNumber?.trim()) {
      errors.licenseNumber = "Please enter your license plate number";
    }
    setCustomErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAction = (isBuyNow) => {
    if (!product) return;
    if (needsCustomization()) {
      setCustomPrice(product.customizationPrice || product.customPrice || 0);
      setShowCustomModal({ isOpen: true, isBuyNow });
      return;
    }
    if (isBuyNow) {
      proceedToCheckout({});
    } else {
      performAddToCart({});
    }
  };

  const performAddToCart = (finalCustomData) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity,
      customData: { ...finalCustomData, ...(selectedColor && { color: selectedColor }) },
      customPrice: customPrice || 0,
    });
    toast.success(`${product.name} added to cart`);
    setShowCustomModal(false);
  };

  const proceedToCheckout = (finalCustomData) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity,
      customData: { ...finalCustomData, ...(selectedColor && { color: selectedColor }) },
      customPrice: customPrice || 0,
    });
    setShowCustomModal(false);
    navigate("/checkout");
  };

  const handleCustomSubmit = () => {
    if (!validateCustomData()) return;
    if (showCustomModal.isBuyNow) {
      proceedToCheckout(customData);
    } else {
      performAddToCart(customData);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-24 pb-20 px-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12">
          <div className="flex-1 animate-pulse bg-gray-100 rounded-[2rem] aspect-square"></div>
          <div className="flex-1 space-y-6">
            <div className="h-4 bg-gray-100 w-1/4 rounded"></div>
            <div className="h-10 bg-gray-100 w-3/4 rounded"></div>
            <div className="h-8 bg-gray-100 w-1/3 rounded"></div>
            <div className="h-40 bg-gray-100 w-full rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-white pt-24 pb-32 lg:pb-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb / Back */}
        <button onClick={() => navigate(-1)} className="mb-8 flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Shop
        </button>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          
          {/* Image Gallery - Sticky on Desktop */}
          <div className="lg:w-1/2 relative lg:sticky lg:top-24 h-fit">
            <div className="aspect-square bg-gray-50 rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm relative group cursor-zoom-in">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-125"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <ShoppingBagIcon className="w-24 h-24" />
                </div>
              )}
              {product.stock === 0 && (
                <div className="absolute top-4 left-4">
                  <Badge variant="danger" size="lg" className="shadow-lg backdrop-blur-md bg-white/90">Out of Stock</Badge>
                </div>
              )}
            </div>
            
            {/* Trust Indicators below image */}
            <div className="grid grid-cols-3 gap-4 mt-8 border-t border-gray-100 pt-8">
               <div className="text-center">
                 <TruckIcon className="w-6 h-6 mx-auto mb-2 text-primary-600" />
                 <span className="text-xs font-semibold text-gray-900 block">Pan-India Delivery</span>
                 <span className="text-[11px] text-gray-500">Fast & secure</span>
               </div>
               <div className="text-center border-l border-r border-gray-100 px-2">
                 <ShieldCheckIcon className="w-6 h-6 mx-auto mb-2 text-primary-600" />
                 <span className="text-xs font-semibold text-gray-900 block">Premium Quality</span>
                 <span className="text-[11px] text-gray-500">Finest materials</span>
               </div>
               <div className="text-center">
                 <ArrowPathIcon className="w-6 h-6 mx-auto mb-2 text-primary-600" />
                 <span className="text-xs font-semibold text-gray-900 block">Replacement</span>
                 <span className="text-[11px] text-gray-500">If damaged</span>
               </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="lg:w-1/2">
            <Badge variant="primary" className="mb-4">{product.category || 'General'}</Badge>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-4 leading-tight">
              {product.name}
            </h1>
            
            <div className="text-3xl font-display font-bold text-gray-900 mb-6 flex items-baseline gap-2">
              {formatPrice(product.price)}
              <span className="text-sm font-medium text-gray-500 font-sans tracking-wide uppercase">MRP (Incl. taxes)</span>
            </div>

            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              {product.description || "Premium 3D printed product crafted with precision engineering."}
            </p>

            <div className="space-y-8 py-8 border-y border-gray-100 mb-8">
              
              {/* Dimensions & Specs */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Dimensions</h4>
                  <p className="text-gray-600">{product.dimensions || "Standard size"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Material</h4>
                  <p className="text-gray-600">{product.material || "Premium PLA/Resin"}</p>
                </div>
              </div>

              {/* Color Selection */}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Color Options</h4>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                          selectedColor === color
                            ? "border-primary-500 bg-primary-50 text-primary-700 shadow-sm"
                            : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Quantity</h4>
                <div className="flex items-center w-fit border border-gray-200 rounded-xl bg-gray-50">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-l-xl transition-colors"
                  >
                    <MinusIcon className="w-5 h-5" />
                  </button>
                  <span className="w-16 text-center font-bold text-gray-900">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-r-xl transition-colors"
                  >
                    <PlusIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex gap-4">
              <Button 
                variant="outline" 
                size="lg" 
                className="flex-1"
                disabled={product.stock === 0}
                onClick={() => handleAction(false)}
              >
                Add to Cart
              </Button>
              <Button 
                size="lg" 
                className="flex-1 shadow-lg shadow-primary-500/30"
                disabled={product.stock === 0}
                onClick={() => handleAction(true)}
              >
                {product.stock === 0 ? 'Out of Stock' : 'Buy Now'}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Action Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40 flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 bg-white"
              disabled={product.stock === 0}
              onClick={() => handleAction(false)}
            >
              Add to Cart
            </Button>
            <Button 
              className="flex-1 shadow-lg shadow-primary-500/30"
              disabled={product.stock === 0}
              onClick={() => handleAction(true)}
            >
              {product.stock === 0 ? 'Out of Stock' : 'Buy Now'}
            </Button>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-32 border-t border-gray-100 pt-16">
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-8 text-center">You Might Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <Link to={`/product/${p.id}`} key={p.id} className="group flex flex-col bg-white rounded-3xl border border-gray-100 p-4 hover:shadow-xl hover:shadow-gray-200/50 hover:border-gray-200 transition-all">
                  <div className="aspect-square bg-gray-50 rounded-2xl mb-4 overflow-hidden relative">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ShoppingBagIcon className="w-10 h-10" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">{p.name}</h3>
                  <p className="font-bold text-gray-900 mt-auto">{formatPrice(p.price)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Customization Modal */}
      <AnimatePresence>
        {showCustomModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCustomModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl p-8 z-50 shadow-2xl"
            >
              <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">
                Customize Your Order
              </h3>
              <p className="text-gray-500 mb-6">
                Personalization charge: <span className="font-bold text-primary-600">+{formatPrice(customPrice)}</span>
              </p>

              <div className="space-y-4 mb-8">
                {product.customizationType === 'name' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1.5 uppercase tracking-wider">Name to Print *</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                      placeholder="e.g. Ramesh"
                      value={customData.name || ''}
                      onChange={(e) => {
                        setCustomData({ ...customData, name: e.target.value });
                        if (customErrors.name) setCustomErrors({ ...customErrors, name: null });
                      }}
                    />
                    {customErrors.name && <p className="text-red-500 text-sm mt-1.5">{customErrors.name}</p>}
                  </div>
                )}
                
                {product.customizationType === 'license' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1.5 uppercase tracking-wider">License Plate Number *</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all uppercase"
                      placeholder="e.g. MH 12 DS 3454"
                      value={customData.licenseNumber || ''}
                      onChange={(e) => {
                        setCustomData({ ...customData, licenseNumber: e.target.value.toUpperCase() });
                        if (customErrors.licenseNumber) setCustomErrors({ ...customErrors, licenseNumber: null });
                      }}
                    />
                    {customErrors.licenseNumber && <p className="text-red-500 text-sm mt-1.5">{customErrors.licenseNumber}</p>}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setShowCustomModal(false)}>Cancel</Button>
                <Button className="flex-1" onClick={handleCustomSubmit}>Confirm</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
