import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { collection, addDoc, serverTimestamp, db } from "../firebase/index.js";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { formatPrice, generateOrderId } from "../utils/formatHelpers";
import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001/aira3d-b4f05/us-central1';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from");
  const { cartItems, clearCart, getCartTotal, updateQuantity, removeFromCart } = useCart();
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    mobileNumber: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pinCode: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadRazorpayScript();
  }, []);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please login to place order</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to place an order.</p>
          <Link to={`/login?from=${encodeURIComponent(from || '/checkout')}`} className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">Go to Login</Link>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add items to your cart before proceeding to checkout.</p>
          <Link to="/shop" className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePaymentSuccess = async (response, orderDocRef, orderId, orderData) => {
    try {
      const verifyRes = await fetch(`${API_BASE_URL}/verifyPayment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          firestoreOrderId: orderDocRef.id,
        }),
      });

      const verifyData = await verifyRes.json();
      if (verifyData.success) {
        clearCart();
        sessionStorage.setItem("lastOrder", JSON.stringify(orderData));
        navigate(`/order-confirmation/${orderId}`);
      } else {
        toast.error("Payment verification failed!");
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      toast.error("An error occurred during payment verification.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      fullName: formData.fullName,
      mobileNumber: formData.mobileNumber,
      email: currentUser.email,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      pinCode: formData.pinCode,
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
      // 1. Save Pending Order to Firestore
      const orderDocRef = await addDoc(collection(db, "orders"), {
        orderId,
        customerInfo,
        items: cartItems,
        totalAmount,
        status: "Pending",
        date: serverTimestamp(),
      });

      // 2. Create Razorpay Order
      const res = await fetch(`${API_BASE_URL}/createRazorpayOrder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalAmount,
          currency: "INR",
          receipt: orderDocRef.id,
          notes: {
            orderId: orderId,
          }
        }),
      });

      const data = await res.json();
      if (!data.success) {
        toast.error("Failed to initialize payment gateway");
        setIsSubmitting(false);
        return;
      }

      // 3. Open Razorpay Checkout Modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_YourRazorpayKey',
        amount: data.amount,
        currency: data.currency,
        name: "Aira3D eCommerce",
        description: `Order ${orderId}`,
        order_id: data.id,
        handler: function (response) {
          handlePaymentSuccess(response, orderDocRef, orderId, orderData);
        },
        prefill: {
          name: customerInfo.fullName,
          email: customerInfo.email,
          contact: customerInfo.mobileNumber,
        },
        theme: {
          color: "#ea580c",
        },
        modal: {
          ondismiss: function () {
            toast.error("Payment cancelled");
            setIsSubmitting(false);
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-grow py-12 bg-gray-50 dark:bg-gray-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-center mb-12">Checkout</h1>

          {cartItems.length === 0 ? (
            <div className="text-center p-8">
              <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
              <Link to="/shop" className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">Continue Shopping</Link>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 bg-white dark:bg-gray-50 rounded-lg shadow-md p-6"
              >
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={currentUser.email}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Using your logged-in account email</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Address *</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-50"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">City *</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">State *</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Pin Code *</label>
                      <input
                        type="text"
                        name="pinCode"
                        value={formData.pinCode}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-50"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Processing Payment..." : `Pay ${formatPrice(getCartTotal())}`}
                  </button>
                </form>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:w-96 bg-white dark:bg-gray-50 rounded-lg shadow-md p-6 h-fit"
              >
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                <div className="space-y-3 mb-4">
                  {cartItems.map((item) => {
                    const itemCustomPrice = item.customPrice || 0;
                    const unitPrice = (item.price || 0) + itemCustomPrice;
                    const lineTotal = unitPrice * (item.quantity || 1);
                    return (
                      <div key={item.id} className="flex justify-between items-start py-2 border-b border-gray-200 dark:border-gray-200 gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-800">
                            ₹{item.price || 0} × {item.quantity || 1}
                            {itemCustomPrice > 0 && <span className="text-orange-600"> + ₹{itemCustomPrice} customization</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="inline-flex items-center border border-gray-200 rounded overflow-hidden">
                            <button onClick={() => updateQuantity(item.id, Math.max(1, (item.quantity || 1) - 1), item.customData)} className="px-2 py-1 text-gray-600 hover:bg-gray-100 font-bold disabled:opacity-30" disabled={(item.quantity || 1) <= 1}>−</button>
                            <span className="px-2 py-1 font-semibold text-xs">{item.quantity || 1}</span>
                            <button onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1, item.customData)} className="px-2 py-1 text-gray-600 hover:bg-gray-100 font-bold">+</button>
                          </div>
                          <button onClick={() => removeFromCart(item.id, item.customData)} className="text-red-500 hover:text-red-700 text-sm font-medium" title="Remove">✕</button>
                          <p className="font-medium text-sm w-20 text-right">{formatPrice(lineTotal)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-200">
                  <div className="flex justify-between text-lg font-bold pt-2">
                    <span>Total</span>
                    <span>{formatPrice(getCartTotal())}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Checkout;
