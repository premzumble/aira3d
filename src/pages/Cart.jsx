import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/formatHelpers";
import { 
  ShoppingBagIcon, 
  TrashIcon, 
  MinusIcon, 
  PlusIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  TruckIcon
} from "@heroicons/react/24/outline";

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20 px-4 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 max-w-lg w-full text-center"
        >
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
            <ShoppingBagIcon className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">
            Looks like you haven't added anything to your cart yet. Explore our collection of premium 3D printed products!
          </p>
          <Link to="/shop" className="btn-primary w-full py-4 text-lg justify-center">
            Start Shopping
          </Link>
        </motion.div>
      </div>
    );
  }

  const subtotal = getCartTotal();
  const estimatedShipping = 0; // Or calculate based on rules
  const total = subtotal + estimatedShipping;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-2">Shopping Cart</h1>
            <p className="text-gray-500">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart</p>
          </div>
          <Link to="/shop" className="hidden sm:inline-flex text-primary-600 hover:text-primary-700 font-medium items-center gap-1 transition-colors">
            Continue Shopping <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          
          {/* Cart Items */}
          <div className="flex-1 space-y-4">
            <AnimatePresence initial={false}>
              {cartItems.map((item) => {
                const itemCustomPrice = item.customPrice || 0;
                const unitPrice = (item.price || 0) + itemCustomPrice;
                const lineTotal = unitPrice * (item.quantity || 1);

                return (
                  <motion.div
                    key={item.id + (item.customData ? JSON.stringify(item.customData) : "")}
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-6 flex flex-col sm:flex-row gap-6 overflow-hidden"
                  >
                    {/* Product Image */}
                    <Link to={`/product/${item.id}`} className="w-full sm:w-32 h-40 sm:h-32 rounded-2xl bg-gray-50 flex-shrink-0 overflow-hidden border border-gray-100 relative group">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <ShoppingBagIcon className="w-8 h-8" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                    </Link>

                    {/* Product Details */}
                    <div className="flex-1 flex flex-col min-w-0">
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <Link to={`/product/${item.id}`} className="block group">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                            {item.name}
                          </h3>
                        </Link>
                        <p className="text-xl font-bold text-gray-900 whitespace-nowrap">{formatPrice(lineTotal)}</p>
                      </div>

                      <div className="text-sm text-gray-500 mb-4 flex-1">
                        <p>{formatPrice(item.price || 0)} each</p>
                        {itemCustomPrice > 0 && (
                          <p className="text-primary-600 mt-1 font-medium bg-primary-50 inline-block px-2 py-0.5 rounded-md">
                            + {formatPrice(itemCustomPrice)} customization
                          </p>
                        )}
                        {/* Custom Data display */}
                        {item.customData && Object.keys(item.customData).length > 0 && (
                          <div className="mt-2 text-xs bg-gray-50 p-2 rounded-lg border border-gray-100 inline-block">
                            {Object.entries(item.customData).map(([k, v]) => (
                              <div key={k} className="flex gap-2">
                                <span className="font-semibold capitalize text-gray-600">{k}:</span>
                                <span className="text-gray-900 truncate max-w-[150px]" title={String(v)}>{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                        {/* Quantity Selector */}
                        <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200">
                          <button
                            onClick={() => updateQuantity(item.id, Math.max(1, (item.quantity || 1) - 1), item.customData)}
                            disabled={(item.quantity || 1) <= 1}
                            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-l-xl transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                            aria-label="Decrease quantity"
                          >
                            <MinusIcon className="w-4 h-4" />
                          </button>
                          <span className="w-10 text-center font-semibold text-gray-900">
                            {item.quantity || 1}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1, item.customData)}
                            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-r-xl transition-colors"
                            aria-label="Increase quantity"
                          >
                            <PlusIcon className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => {
                            if(window.confirm('Are you sure you want to remove this item?')) {
                              removeFromCart(item.id, item.customData);
                            }
                          }}
                          className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                          <span className="hidden sm:inline">Remove</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            <div className="sm:hidden mt-6 text-center">
               <Link to="/shop" className="text-primary-600 font-medium inline-flex items-center gap-1">
                 Continue Shopping <ArrowRightIcon className="w-4 h-4" />
               </Link>
            </div>
          </div>

          {/* Order Summary (Sticky Sidebar) */}
          <div className="lg:w-[400px]">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 lg:sticky lg:top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span className="flex items-center gap-1"><TruckIcon className="w-4 h-4" /> Shipping</span>
                  <span className="font-medium text-green-600">Calculated at checkout</span>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 mb-8">
                <div className="flex justify-between items-end">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <div className="text-right">
                    <span className="text-3xl font-display font-bold text-gray-900">{formatPrice(total)}</span>
                    <span className="block text-xs text-gray-400 mt-1">Taxes included if applicable</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="btn-primary w-full py-4 text-lg justify-center mb-4 shadow-lg shadow-primary-500/30"
              >
                Proceed to Checkout
              </button>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-xl py-3 border border-gray-100">
                  <ShieldCheckIcon className="w-5 h-5 text-green-500" />
                  <span>Secure checkout process</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
