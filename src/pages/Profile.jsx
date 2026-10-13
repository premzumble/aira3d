import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext.jsx';
import { formatPrice } from '../utils/formatHelpers.js';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { 
  UserCircleIcon, 
  ShoppingBagIcon, 
  TruckIcon, 
  CheckCircleIcon,
  ClockIcon,
  ChevronRightIcon,
  XCircleIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import MyCourses from '../components/MyCourses';

export default function Profile() {
  const { currentUser, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const from = searchParams.get("from");
  const defaultTab = searchParams.get("tab") || "orders";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const email = currentUser?.email || user?.email;
  const uid = currentUser?.uid || user?.uid;

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, 'orders'), where('customerInfo.userId', '==', uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => {
        const dateA = a.date?.seconds || 0;
        const dateB = b.date?.seconds || 0;
        return dateB - dateA;
      });
      setOrders(data);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to orders:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [uid]);

  if (!email) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center bg-gray-50">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-12 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-md w-full mx-4">
          <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6 text-primary-600">
            <UserCircleIcon className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">Account Access</h2>
          <p className="text-gray-500 mb-8">Please sign in to view your profile, manage your addresses, and track your orders.</p>
          <Link to={`/login?from=${encodeURIComponent(from || '/profile')}`}>
            <Button size="lg" className="w-full justify-center">Sign In</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const getStatusConfig = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return { icon: CheckCircleIcon, variant: 'success' };
      case 'paid':
      case 'processing':
        return { icon: ClockIcon, variant: 'info' };
      case 'shipped':
        return { icon: TruckIcon, variant: 'primary' };
      case 'cancelled':
        return { icon: XCircleIcon, variant: 'danger' };
      default:
        return { icon: ClockIcon, variant: 'warning' };
    }
  };

  const userName = user?.displayName || currentUser?.displayName || 'Aira3D Customer';

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900">My Dashboard</h1>
            <p className="text-gray-500 mt-2">Manage your profile, track your orders, and access your courses.</p>
          </div>
        </div>

        <div className="flex gap-4 mb-8 border-b border-gray-200 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => { setActiveTab('orders'); setSearchParams({ tab: 'orders' }); }}
            className={`flex items-center gap-2 pb-4 px-2 font-bold transition-colors whitespace-nowrap border-b-2 ${
              activeTab === 'orders' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <ShoppingBagIcon className="w-5 h-5" /> Orders
          </button>
          <button
            onClick={() => { setActiveTab('courses'); setSearchParams({ tab: 'courses' }); }}
            className={`flex items-center gap-2 pb-4 px-2 font-bold transition-colors whitespace-nowrap border-b-2 ${
              activeTab === 'courses' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <AcademicCapIcon className="w-5 h-5" /> My Courses
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Profile Sidebar */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 lg:sticky lg:top-24">
               <div className="flex flex-col items-center text-center mb-6 pb-6 border-b border-gray-100">
                  <div className="w-24 h-24 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 text-3xl font-bold mb-4 border-4 border-white shadow-sm">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <h2 className="font-bold text-xl text-gray-900 truncate w-full px-2">
                    {userName}
                  </h2>
                  <p className="text-sm text-gray-500 truncate w-full px-2 mt-1">{email}</p>
               </div>
               
               <div className="space-y-4 text-sm font-medium">
                 <div className="flex items-center justify-between text-gray-700 bg-gray-50 p-4 rounded-2xl">
                   <span className="flex items-center gap-2"><ShoppingBagIcon className="w-5 h-5 text-gray-400" /> Total Orders</span>
                   <span className="font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md">{orders.length}</span>
                 </div>
               </div>
            </div>
          </motion.div>

          {/* Main Content Area */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-3">
            
            {activeTab === 'courses' ? (
              <MyCourses currentUser={currentUser} />
            ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                 <h2 className="text-xl font-bold text-gray-900">Order History</h2>
               </div>
              
              <div className="p-6">
                {loading ? (
                  <div className="space-y-6">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
                        <div className="h-6 bg-gray-100 rounded w-1/4 mb-4"></div>
                        <div className="h-4 bg-gray-50 rounded w-1/3 mb-6"></div>
                        <div className="h-24 bg-gray-50 rounded-xl"></div>
                      </div>
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                      <ShoppingBagIcon className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h3>
                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">When you place orders, they will appear here along with their tracking status.</p>
                    <Link to="/shop">
                      <Button>Start Shopping</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <AnimatePresence>
                      {orders.map((order, idx) => {
                        const statusConf = getStatusConfig(order.status);
                        const StatusIcon = statusConf.icon;
                        return (
                          <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
                          >
                            <div className="bg-gray-50/50 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100">
                              <div>
                                <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                                  Ordered on {order.date ? new Date(order.date.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                </p>
                                <div className="flex flex-wrap items-center gap-3">
                                  <p className="font-mono font-bold text-gray-900">#{order.orderId || order.id}</p>
                                  <Badge variant={statusConf.variant} className="flex items-center gap-1">
                                    <StatusIcon className="w-3.5 h-3.5" />
                                    {order.status || 'Pending'}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="text-left md:text-right">
                                <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Total Amount</p>
                                <p className="text-lg font-bold text-gray-900">{formatPrice(order.totalAmount || 0)}</p>
                              </div>
                            </div>

                            <div className="p-6">
                              <div className="flex flex-col md:flex-row gap-6 items-center">
                                {/* First Item Thumbnail */}
                                <div className="w-24 h-24 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100 flex items-center justify-center">
                                  {order.items && order.items[0]?.imageUrl ? (
                                    <img src={order.items[0].imageUrl} alt="Product" className="w-full h-full object-cover" />
                                  ) : (
                                    <ShoppingBagIcon className="w-8 h-8 text-gray-300" />
                                  )}
                                </div>
                                
                                {/* Order Info */}
                                <div className="flex-1 text-center md:text-left">
                                  <h4 className="text-lg font-bold text-gray-900 mb-1">
                                    {order.items && order.items[0]?.name}
                                    {order.items && order.items.length > 1 && (
                                      <span className="text-gray-500 font-medium text-sm ml-2">
                                        + {order.items.length - 1} more {order.items.length - 1 === 1 ? 'item' : 'items'}
                                      </span>
                                    )}
                                  </h4>
                                  <div className="text-sm text-gray-500 space-y-1 mb-4 md:mb-0">
                                    <p>Payment Status: <span className="font-semibold text-green-600">Paid</span></p>
                                    <p>Expected Delivery: <span className="font-semibold text-gray-900">Arriving soon</span></p>
                                  </div>
                                </div>

                                {/* Action */}
                                <div className="flex-shrink-0 w-full md:w-auto text-center md:text-right">
                                  <Link 
                                    to={`/profile/orders/${order.id}`} 
                                    className="btn-primary w-full md:w-auto py-3 px-6 shadow-md shadow-primary-500/20 group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all inline-flex items-center justify-center gap-2"
                                  >
                                    View Order Details <ChevronRightIcon className="w-4 h-4" />
                                  </Link>
                                </div>
                              </div>
                            </div>

                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
