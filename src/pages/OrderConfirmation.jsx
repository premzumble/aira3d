import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { collection, query, where, getDocs, db } from "../firebase/index.js";
import { formatPrice } from "../utils/formatHelpers";

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const stored = sessionStorage.getItem("lastOrder");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.orderId === orderId) {
            setOrder(parsed);
            setLoading(false);
            return;
          }
        }

        const q = query(collection(db, "orders"), where("orderId", "==", orderId));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setOrder({ id: snapshot.docs[0].id, ...data });
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4">Order Not Found</h2>
          <p className="text-gray-600 mb-6">
            We could not find your order. Please contact support.
          </p>
          <Link
            to="/shop"
            className="px-6 py-3 bg-orange-600 text-gray-800 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-grow py-12 bg-gray-50 dark:bg-gray-50"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4"
            >
              <span className="text-3xl">✓</span>
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Order Placed Successfully!
            </h1>
            <p className="text-gray-600">
              Your payment has been verified. Your order is confirmed!
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-50 rounded-lg shadow-md p-6 mb-6"
          >
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-200 pb-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Order ID</p>
                <p className="font-mono font-bold text-lg">{order.orderId || order.id}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Status</p>
                <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  {order.status || "Pending"}
                </span>
              </div>
            </div>

            <h2 className="text-lg font-bold mb-3">Customer Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="font-medium">{order.customerInfo?.fullName || order.customerName || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="font-medium">{order.customerInfo?.mobileNumber || order.customerPhone || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-medium">{order.customerInfo?.email || order.customerEmail || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Payment Method</p>
                <p className="font-medium">Online Payment (UPI / Razorpay / Bank Transfer)</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500">Delivery Address</p>
                <p className="font-medium">
                  {order.customerInfo?.address || order.customerAddress || "N/A"}
                  {order.customerInfo?.city && `, ${order.customerInfo.city}`}
                  {order.customerInfo?.state && `, ${order.customerInfo.state}`}
                  {order.customerInfo?.pinCode && ` - ${order.customerInfo.pinCode}`}
                </p>
              </div>
            </div>

            <h2 className="text-lg font-bold mb-3">Order Items</h2>
            <div className="bg-gray-50 dark:bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
               {(order.items || []).map((item, idx) => {
                 const qty = item.quantity || 1;
                 const basePrice = item.price || 0;
                 const customPrice = item.customPrice || 0;
                 const unitPrice = basePrice + customPrice;
                 const lineTotal = unitPrice * qty;
                 const cd = item.customData || {};
                 return (
                   <div
                     key={idx}
                     className="flex justify-between items-start border-b border-gray-200 dark:border-gray-200 pb-2 last:border-0"
                   >
                     <div>
                       <p className="font-medium">{item.name || item.productName || "Product"}</p>
                       <p className="text-sm text-gray-600 dark:text-gray-800">
                         ₹{basePrice} × {qty}
                         {customPrice > 0 && <span className="text-orange-600"> + ₹{customPrice} customization</span>}
                       </p>
                       {Object.keys(cd).length > 0 && (
                         <div className="mt-1 flex flex-wrap gap-2">
                           {cd.name && <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">Name: <strong>{cd.name}</strong></span>}
                           {cd.licenseNumber && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">License: <strong className="font-mono">{cd.licenseNumber}</strong></span>}
                           {cd.photoLink && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full"><a href={cd.photoLink} target="_blank" rel="noopener noreferrer" className="underline">Photo Link</a></span>}
                         </div>
                       )}
                     </div>
                     <p className="font-semibold">{formatPrice(lineTotal)}</p>
                   </div>
                 );
               })}
              <div className="pt-3 border-t border-gray-300 dark:border-gray-300 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatPrice(order.totalAmount || 0)}</span>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-900">
                <strong>Payment Successful!</strong> Your order is confirmed and is being processed. You will receive an email with tracking details once it ships.
              </p>
            </div>
          </motion.div>

          <div className="text-center">
            <Link
              to="/shop"
              className="inline-block px-8 py-3 bg-orange-600 text-gray-800 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderConfirmation;
