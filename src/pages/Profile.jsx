import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collection, getDocs, query, where, db } from '../firebase/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatPrice } from '../utils/formatHelpers.js';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Profile() {
  const { currentUser, user } = useAuth();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const email = currentUser?.email || user?.email;

  useEffect(() => {
    if (!email) return;
    const fetchOrders = async () => {
      try {
        const q = query(collection(db, 'orders'), where('customerInfo.email', '==', email.toLowerCase()));
        const snapshot = await getDocs(q);
        let data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => {
          const dateA = a.date?.seconds || 0;
          const dateB = b.date?.seconds || 0;
          return dateB - dateA;
        });
        setOrders(data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [email]);

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please login to view your orders</h2>
          <Link to={`/login?from=${encodeURIComponent(from || '/profile')}`} className="text-orange-600 hover:text-orange-700 font-medium">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Account</h1>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 border border-gray-200 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-semibold text-gray-900">{user?.displayName || currentUser?.displayName || email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-semibold text-gray-900">{email}</p>
            </div>
          </div>
        </motion.div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">My Orders</h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
            <p className="text-gray-600 mb-4">No orders found</p>
            <Link to="/shop" className="text-orange-600 hover:text-orange-700 font-medium">Continue Shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, idx) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-xl p-6 border border-gray-200"
              >
                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Order ID</p>
                    <p className="font-mono font-semibold text-gray-900">{order.orderId || order.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-semibold text-gray-900">
                      {order.date ? new Date(order.date.seconds * 1000).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                  <div className="border-t border-gray-200 pt-4 mb-4">
                   {order.items && order.items.map((item, i) => {
                     const qty = item.quantity || 1;
                     const price = item.price || 0;
                     const cPrice = item.customPrice || 0;
                     const unitPrice = price + cPrice;
                     const cd = item.customData || {};
                     return (
                       <div key={i} className="flex justify-between items-start py-2">
                         <div>
                           <p className="font-semibold text-gray-900">{item.name || item.productName}</p>
                           <p className="text-sm text-gray-600">Qty: {qty} × ₹{unitPrice}{cPrice > 0 && <span className="text-orange-600"> (incl. ₹{cPrice} customization)</span>}</p>
                           {Object.keys(cd).length > 0 && (
                             <div className="mt-1 flex flex-wrap gap-2">
                               {cd.name && <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">Name: <strong>{cd.name}</strong></span>}
                               {cd.licenseNumber && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">License: <strong className="font-mono">{cd.licenseNumber}</strong></span>}
                               {cd.photoLink && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full"><a href={cd.photoLink} target="_blank" rel="noopener noreferrer" className="underline">Photo Link</a></span>}
                             </div>
                           )}
                         </div>
                         <p className="font-bold text-orange-600">{formatPrice(unitPrice * qty)}</p>
                       </div>
                     );
                   })}
                 </div>

                <div className="flex flex-wrap justify-between items-center gap-4 border-t border-gray-200 pt-4">
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'Paid' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status || 'Pending'}
                    </span>
                    {order.shiprocketStatus && (
                      <span className="ml-3 inline-block px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                        🚚 Shipping: {order.shiprocketStatus}
                      </span>
                    )}
                    {order.shiprocketShipmentId && (
                      <p className="text-xs text-gray-500 mt-2">Tracking Ref: {order.shiprocketShipmentId}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-xl font-bold text-orange-600">{formatPrice(order.totalAmount || 0)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
