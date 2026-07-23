import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { formatPrice, generateOrderId } from "../utils/formatHelpers";
import toast from "react-hot-toast";
import { 
  ShieldCheckIcon, 
  MapPinIcon,
  UserIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from "@heroicons/react/24/outline";
import { LockClosedIcon } from "@heroicons/react/24/solid";
import { apiService } from "../services/api";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from");
  const { cartItems, clearCart, getCartTotal } = useCart();
  const { currentUser } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: "",
    mobileNumber: "",
    address: "",
    city: "",
    state: "",
    pinCode: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    loadRazorpayScript();
  }, []);

  if (!currentUser) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center bg-gray-50">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center p-12 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-md w-full mx-4">
          <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6 text-primary-600">
            <LockClosedIcon className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">Sign in to checkout</h2>
          <p className="text-gray-500 mb-8">You need an account to securely place your order and track its status.</p>
          <Link to={`/login?from=${encodeURIComponent(from || '/checkout')}`} className="btn-primary w-full py-4 text-lg justify-center">
            Sign In or Create Account
          </Link>
        </motion.div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center bg-gray-50">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center p-12 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-md w-full mx-4">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
            <ShoppingBagIcon className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
          <Link to="/shop" className="btn-primary w-full py-4 text-lg justify-center">
            Start Shopping
          </Link>
        </motion.div>
      </div>
    );
  }

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const validateForm = () => {
    const { fullName, mobileNumber, address, city, state, pinCode } = formData;
    if (!fullName || !mobileNumber || !address || !city || !state || !pinCode) {
      toast.error("Please fill all required fields");
      return false;
    }
    if (mobileNumber.length < 10) {
      toast.error("Please enter a valid mobile number");
      return false;
    }
    return true;
  };

  const handlePaymentSuccess = async (response, orderDocRef, orderId, orderData) => {
    try {
      const verifyData = await apiService.verifyPayment({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        firestoreOrderId: orderDocRef.id,
      });

      if (verifyData.success) {
        clearCart();
        sessionStorage.setItem("lastOrder", JSON.stringify(orderData));
        navigate(`/order-confirmation/${orderId}`);
      } else {
        toast.error("Payment verification failed! Please contact support.");
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      toast.error(error.message || "An error occurred verifying your payment. We will look into it.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      toast.error("Razorpay SDK failed to load. Are you online?");
      setIsSubmitting(false);
      return;
    }

    const orderId = generateOrderId();
    const totalAmount = getCartTotal();

    const customerInfo = {
      ...formData,
      email: currentUser.email,
      userId: currentUser.uid,
    };

    const orderData = {
      orderId,
      customerInfo,
      items: cartItems,
      totalAmount,
      date: new Date().toISOString(),
    };

    try {
      // 1. Save Pending Order
      const orderDocRef = await addDoc(collection(db, "orders"), {
        ...orderData,
        status: "Pending",
        date: serverTimestamp(),
      });

      // 2. Create Razorpay Order
      let data;
      try {
        data = await apiService.createRazorpayOrder({
          amount: totalAmount,
          currency: "INR",
          receipt: orderDocRef.id,
          notes: { orderId: orderId }
        });
      } catch (apiError) {
        console.error("Payment Gateway Error:", apiError);
        toast.error(apiError.message || "Failed to create order. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // 3. Open Razorpay Checkout Modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_YourRazorpayKey',
        amount: data.amount,
        currency: data.currency,
        name: "Aira3D",
        description: `Order #${orderId}`,
        order_id: data.id,
        handler: function (response) {
          handlePaymentSuccess(response, orderDocRef, orderId, orderData);
        },
        prefill: {
          name: customerInfo.fullName,
          email: customerInfo.email,
          contact: customerInfo.mobileNumber,
        },
        theme: { color: "#ea580c" },
        modal: {
          ondismiss: function () {
            toast.error("Payment process was cancelled");
            setIsSubmitting(false);
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (error) {
      console.error("Error in checkout flow:", error);
      toast.error("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Progress Tracker */}
        <div className="max-w-3xl mx-auto mb-10">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/2 h-1 bg-primary-600 rounded-full z-0 transition-all duration-500"></div>
            
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold shadow-md shadow-primary-500/30">
                <CheckCircleIcon className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-gray-900">Cart</span>
            </div>
            
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold shadow-md shadow-primary-500/30">
                2
              </div>
              <span className="text-sm font-medium text-gray-900">Details</span>
            </div>
            
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 text-gray-400 flex items-center justify-center font-bold">
                3
              </div>
              <span className="text-sm font-medium text-gray-400">Payment</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 max-w-6xl mx-auto">
          {/* Shipping Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 space-y-6">
            
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Contact Details</h2>
                  <p className="text-sm text-gray-500">Where should we send your updates?</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={currentUser.email}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number *</label>
                    <input
                      type="tel"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <MapPinIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Shipping Address</h2>
                  <p className="text-sm text-gray-500">Where should we deliver your order?</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Street Address *</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    placeholder="House No, Building, Street, Area"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">State *</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">PIN Code *</label>
                    <input
                      type="text"
                      name="pinCode"
                      value={formData.pinCode}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 text-blue-800 p-4 rounded-2xl flex items-start gap-3 border border-blue-100">
              <InformationCircleIcon className="w-6 h-6 flex-shrink-0 mt-0.5 text-blue-600" />
              <p className="text-sm leading-relaxed">
                Make sure your address and contact details are accurate. Our delivery partners rely on this to ensure your custom printed items reach you safely and on time.
              </p>
            </div>
            
          </motion.div>

          {/* Sticky Order Summary */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:w-[420px]">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 lg:sticky lg:top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent mb-6">
                <AnimatePresence initial={false}>
                  {cartItems.map((item) => {
                    const itemCustomPrice = item.customPrice || 0;
                    const unitPrice = (item.price || 0) + itemCustomPrice;
                    const lineTotal = unitPrice * (item.quantity || 1);
                    return (
                      <div key={item.id + (item.customData ? JSON.stringify(item.customData) : "")} className="flex gap-4 py-3 border-b border-gray-50 last:border-0">
                        <div className="w-16 h-16 rounded-xl bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-100">
                           {item.imageUrl ? (
                             <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-gray-300">📦</div>
                           )}
                        </div>
                        <div className="flex-1 flex flex-col min-w-0 justify-center">
                          <h3 className="font-semibold text-gray-900 truncate text-sm">{item.name}</h3>
                          <div className="text-xs text-gray-500 mt-1">
                            Qty: {item.quantity || 1}
                          </div>
                        </div>
                        <div className="font-bold text-gray-900 flex items-center">
                          {formatPrice(lineTotal)}
                        </div>
                      </div>
                    );
                  })}
                </AnimatePresence>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-gray-500 text-sm">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">{formatPrice(getCartTotal())}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-sm">
                  <span>Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <div className="flex justify-between items-end pt-4 border-t border-gray-100 mt-4">
                  <span className="text-gray-900 font-bold">Total to Pay</span>
                  <div className="text-right">
                    <span className="text-3xl font-display font-bold text-gray-900">{formatPrice(getCartTotal())}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-primary w-full py-4 text-lg mt-8 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CreditCardIcon className="w-6 h-6" />
                    Pay Securely Now
                  </>
                )}
              </button>
              
              <div className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold tracking-widest text-gray-400 uppercase text-center">
                 <ShieldCheckIcon className="w-4 h-4 text-green-500" /> Secured by Razorpay
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
