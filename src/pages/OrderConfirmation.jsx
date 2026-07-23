import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { collection, query, where, getDocs, db } from "../firebase/index.js";
import { formatPrice } from "../utils/formatHelpers";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { CheckCircleIcon, ArrowRightIcon, InformationCircleIcon } from "@heroicons/react/24/outline";

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
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
      <div className="min-h-screen pt-24 pb-20 flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium">Verifying your order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen pt-24 pb-20 flex items-center justify-center bg-gray-50">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-12 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-md w-full mx-4">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
            <InformationCircleIcon className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h2>
          <p className="text-gray-500 mb-8">
            We could not locate this order in our system. If your payment was deducted, please contact support.
          </p>
          <Button onClick={() => navigate('/shop')} className="w-full justify-center py-4">
            Return to Shop
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Success Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
            className="inline-flex items-center justify-center w-24 h-24 bg-green-50 text-green-500 rounded-full mb-6 border-4 border-white shadow-lg"
          >
            <CheckCircleIcon className="w-12 h-12" />
          </motion.div>
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">
            Thank you for your order!
          </h1>
          <p className="text-lg text-gray-500 max-w-lg mx-auto">
            Your payment was successful and your order is now being processed. We've sent a confirmation email to <span className="font-medium text-gray-900">{order.customerInfo?.email || "your email"}</span>.
          </p>
        </div>

        {/* Order Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden mb-8"
        >
          {/* Header Row */}
          <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Order Number</p>
              <p className="font-mono font-bold text-xl text-gray-900">{order.orderId || order.id}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Status</p>
              <Badge variant="success" size="lg">{order.status || "Confirmed"}</Badge>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              
              {/* Left Column: Customer & Shipping Info */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    Customer Details
                  </h2>
                  <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Name</span>
                      <span className="font-medium text-gray-900 text-sm text-right">{order.customerInfo?.fullName || order.customerName || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Phone</span>
                      <span className="font-medium text-gray-900 text-sm text-right">{order.customerInfo?.mobileNumber || order.customerPhone || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Email</span>
                      <span className="font-medium text-gray-900 text-sm text-right truncate max-w-[200px]">{order.customerInfo?.email || order.customerEmail || "N/A"}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    Shipping Address
                  </h2>
                  <div className="bg-gray-50 rounded-2xl p-5">
                    <p className="font-medium text-gray-900 text-sm leading-relaxed">
                      {order.customerInfo?.address || order.customerAddress || "N/A"}<br />
                      {order.customerInfo?.city && `${order.customerInfo.city}, `}
                      {order.customerInfo?.state && `${order.customerInfo.state} `}
                      {order.customerInfo?.pinCode && `- ${order.customerInfo.pinCode}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Order Items */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Order Summary
                </h2>
                <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
                   {(order.items || []).map((item, idx) => {
                     const qty = item.quantity || 1;
                     const basePrice = item.price || 0;
                     const customPrice = item.customPrice || 0;
                     const unitPrice = basePrice + customPrice;
                     const lineTotal = unitPrice * qty;
                     const cd = item.customData || {};
                     
                     return (
                       <div key={idx} className="flex gap-4 border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                         <div className="w-16 h-16 rounded-xl bg-white border border-gray-100 overflow-hidden flex-shrink-0">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">📦</div>
                            )}
                         </div>
                         <div className="flex-1 min-w-0">
                           <p className="font-bold text-gray-900 text-sm line-clamp-1">{item.name || item.productName || "Product"}</p>
                           <p className="text-xs text-gray-500 mt-1">Qty: {qty}</p>
                           {Object.keys(cd).length > 0 && (
                             <div className="mt-2 flex flex-col gap-1">
                               {cd.name && <span className="text-[10px] bg-primary-50 text-primary-700 px-2 py-0.5 rounded-md inline-block w-fit font-medium">Name: {cd.name}</span>}
                               {cd.licenseNumber && <span className="text-[10px] bg-gray-200 text-gray-800 px-2 py-0.5 rounded-md inline-block w-fit font-mono font-medium">{cd.licenseNumber}</span>}
                               {cd.color && <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md inline-block w-fit font-medium capitalize">Color: {cd.color}</span>}
                             </div>
                           )}
                         </div>
                         <div className="font-bold text-gray-900 text-sm text-right">
                           {formatPrice(lineTotal)}
                         </div>
                       </div>
                     );
                   })}
                   
                   <div className="pt-4 mt-2">
                     <div className="flex justify-between text-sm text-gray-500 mb-2">
                       <span>Subtotal</span>
                       <span className="font-medium text-gray-900">{formatPrice(order.totalAmount || 0)}</span>
                     </div>
                     <div className="flex justify-between text-sm text-gray-500 mb-4">
                       <span>Shipping</span>
                       <span className="font-medium text-green-600">Free</span>
                     </div>
                     <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                       <span className="font-bold text-gray-900">Total Paid</span>
                       <span className="text-2xl font-display font-bold text-gray-900">{formatPrice(order.totalAmount || 0)}</span>
                     </div>
                   </div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>

        <div className="flex justify-center">
           <Button onClick={() => navigate('/shop')} size="lg" className="w-full sm:w-auto px-12 group shadow-lg shadow-primary-500/20">
             Continue Shopping <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
           </Button>
        </div>

      </div>
    </div>
  );
};

export default OrderConfirmation;
