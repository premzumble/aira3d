import { useState, useEffect } from 'react';
import { collection, getDocs, db } from '../../firebase';
import { formatPrice } from '../../utils/formatHelpers.js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  UsersIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ShoppingBagIcon,
  AcademicCapIcon,
  ClockIcon,
  XMarkIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  EyeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedText, setCopiedText] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // 1. Fetch registered users from /users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const registeredUsers = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 2. Fetch orders from /orders
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const orders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 3. Fetch enrollments from /enrollments
      const enrollmentsSnapshot = await getDocs(collection(db, 'enrollments'));
      const enrollments = enrollmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const customerMap = {};

      // Seed map with all registered users
      registeredUsers.forEach(user => {
        const email = (user.email || '').toLowerCase().trim();
        if (!email) return;
        customerMap[email] = {
          uid: user.uid || user.id,
          email: user.email,
          name: user.name || 'Registered User',
          phone: user.phone || 'N/A',
          createdAt: user.createdAt || null,
          lastActive: user.lastActive || null,
          ordersCount: 0,
          coursesEnrolled: 0,
          totalSpent: 0,
          type: 'Registered',
          ordersList: [],
          coursesList: [],
          status: 'Active' // Registered accounts are Active by default
        };
      });

      // Integrate eCommerce orders data
      orders.forEach(order => {
        const email = (order.customerInfo?.email || order.customerEmail || order.email || '').toLowerCase().trim();
        if (!email) return;

        // If customer is not in map (Guest checkout), initialize profile
        if (!customerMap[email]) {
          customerMap[email] = {
            uid: order.userId || order.customerInfo?.userId || null,
            email: email,
            name: order.customerInfo?.fullName || order.customerName || 'Guest Customer',
            phone: order.customerInfo?.mobileNumber || order.customerPhone || 'N/A',
            createdAt: order.date || null,
            lastActive: order.date || null,
            ordersCount: 0,
            coursesEnrolled: 0,
            totalSpent: 0,
            type: 'Guest',
            ordersList: [],
            coursesList: [],
            status: 'Active'
          };
        }

        // Add to customer's order history list
        customerMap[email].ordersList.push({
          id: order.id,
          orderId: order.orderId || order.id,
          date: order.date || null,
          amount: order.totalAmount || order.amount || 0,
          status: order.status || 'Pending'
        });

        // Accumulate statistics on successful payments
        const orderStatus = (order.status || '').toLowerCase();
        if (orderStatus === 'paid' || orderStatus === 'completed' || orderStatus === 'shipped') {
          customerMap[email].ordersCount += 1;
          customerMap[email].totalSpent += Number(order.totalAmount || order.amount || 0);
        }

        // Keep the earliest date as registration/first contact date
        if (order.date) {
          const orderTime = getTimestampMs(order.date);
          const currentRegTime = getTimestampMs(customerMap[email].createdAt);
          if (!currentRegTime || orderTime < currentRegTime) {
            customerMap[email].createdAt = order.date;
          }
          // Update last active based on order date if newer
          const currentActiveTime = getTimestampMs(customerMap[email].lastActive);
          if (!currentActiveTime || orderTime > currentActiveTime) {
            customerMap[email].lastActive = order.date;
          }
        }
      });

      // Integrate Course Enrollments data
      enrollments.forEach(enroll => {
        const email = (enroll.email || '').toLowerCase().trim();
        if (!email) return;

        if (!customerMap[email]) {
          customerMap[email] = {
            uid: enroll.userId || null,
            email: email,
            name: enroll.fullName || enroll.studentName || 'Student',
            phone: enroll.phone || 'N/A',
            createdAt: enroll.createdAt || null,
            lastActive: enroll.createdAt || null,
            ordersCount: 0,
            coursesEnrolled: 0,
            totalSpent: 0,
            type: 'Registered',
            ordersList: [],
            coursesList: [],
            status: 'Active'
          };
        }

        // Add course enrollment record
        customerMap[email].coursesList.push({
          id: enroll.id,
          courseId: enroll.courseId,
          courseTitle: enroll.courseTitle || 'Course Spec',
          date: enroll.createdAt || null,
          status: enroll.enrollmentStatus || 'Pending',
          amount: enroll.amount || 0
        });

        const enrollStatus = (enroll.enrollmentStatus || '').toLowerCase();
        if (enrollStatus === 'confirmed') {
          customerMap[email].coursesEnrolled += 1;
          customerMap[email].totalSpent += Number(enroll.amount || 0);
        }

        if (enroll.createdAt) {
          const enrollTime = getTimestampMs(enroll.createdAt);
          const currentRegTime = getTimestampMs(customerMap[email].createdAt);
          if (!currentRegTime || enrollTime < currentRegTime) {
            customerMap[email].createdAt = enroll.createdAt;
          }
          const currentActiveTime = getTimestampMs(customerMap[email].lastActive);
          if (!currentActiveTime || enrollTime > currentActiveTime) {
            customerMap[email].lastActive = enroll.createdAt;
          }
        }
      });

      const customerList = Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent);
      setCustomers(customerList);
    } catch (error) {
      console.error('Error fetching customers directory:', error);
      toast.error('Failed to compile customer profiles.');
    } finally {
      setLoading(false);
    }
  };

  const getTimestampMs = (val) => {
    if (!val) return 0;
    if (typeof val.toMillis === 'function') return val.toMillis();
    if (typeof val.toDate === 'function') return val.toDate().getTime();
    if (val.seconds) return val.seconds * 1000;
    return new Date(val).getTime();
  };

  const getActivityStatus = (lastActive) => {
    if (!lastActive) return { label: 'Inactive', color: 'bg-gray-100 text-gray-500' };
    const dateMs = getTimestampMs(lastActive);
    if (!dateMs) return { label: 'Inactive', color: 'bg-gray-100 text-gray-500' };
    
    const diffMs = Date.now() - dateMs;
    const diffMins = diffMs / (1000 * 60);
    const diffHours = diffMins / 60;
    
    if (diffMins < 15) {
      return { label: 'Active', color: 'bg-green-100 text-green-700 font-bold border border-green-200 animate-pulse' };
    } else if (diffHours < 24) {
      return { label: 'Recently Active', color: 'bg-amber-100 text-amber-700 font-bold border border-amber-200' };
    } else {
      return { label: 'Inactive', color: 'bg-gray-100 text-gray-500 font-bold border border-gray-200' };
    }
  };

  const formatDisplayDate = (val) => {
    const ms = getTimestampMs(val);
    if (!ms) return 'N/A';
    return new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const getWhatsAppLink = (name, phone) => {
    const cleanPhone = (phone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const text = `Hello ${name || 'Customer'},\n\nGreetings from Aira3D.\n\nThank you for choosing us. We are always happy to help with your inquiries.\n\nRegards,\nAira3D Team`;
    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
  };

  const filteredCustomers = searchTerm
    ? customers.filter(c =>
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : customers;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Customer Accounts Directory</h1>
          <p className="text-gray-500 mt-1">Consolidated view of registered users, custom fabrication inquiries, and guest buyers.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchCustomers} 
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:text-orange-600 transition-colors shadow-sm text-sm font-medium"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Refresh
          </button>
          <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold">{filteredCustomers.length} profiles</span>
        </div>
      </div>

      {/* Search and stats bar */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-80">
          <Input
            icon={MagnifyingGlassIcon}
            placeholder="Search name, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-6 text-sm font-semibold text-gray-500 pr-2">
          <p>Registered: <span className="text-gray-900">{customers.filter(c => c.type === 'Registered').length}</span></p>
          <p>Guests: <span className="text-gray-900">{customers.filter(c => c.type === 'Guest').length}</span></p>
        </div>
      </div>

      {/* Customers Table */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
          <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">No customer profiles matching search parameters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-gray-50/80 sticky top-0 z-10 border-b border-gray-100 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Customer Profile</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Activity State</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Account Type</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-center">eCom Orders</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-center">Courses Enrolled</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Total Spending</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredCustomers.map((customer, index) => {
                  const activity = getActivityStatus(customer.lastActive);
                  return (
                    <motion.tr
                      key={customer.email}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-gray-50/80 transition-colors group"
                    >
                      {/* Name & Contact */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                            customer.type === 'Registered' 
                              ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {(customer.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{customer.name || 'Anonymous User'}</p>
                            <p className="text-xs text-gray-500">{customer.email}</p>
                            {customer.phone && customer.phone !== 'N/A' && (
                              <p className="text-[10px] text-gray-400 font-semibold">{customer.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      {/* User Activity Indicator */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full w-fit ${activity.color}`}>
                            {activity.label}
                          </span>
                          {customer.lastActive && (
                            <span className="text-[10px] font-semibold text-gray-400 font-mono">
                              Seen: {new Date(getTimestampMs(customer.lastActive)).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${
                          customer.type === 'Registered' 
                            ? 'bg-purple-50 text-purple-700 border-purple-100' 
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {customer.type}
                        </span>
                      </td>

                      {/* eCommerce count */}
                      <td className="px-6 py-4 text-center">
                        <Badge variant={customer.ordersCount > 0 ? 'success' : 'info'} className="px-3">
                          {customer.ordersCount}
                        </Badge>
                      </td>

                      {/* Course count */}
                      <td className="px-6 py-4 text-center">
                        <Badge variant={customer.coursesEnrolled > 0 ? 'warning' : 'info'} className="px-3">
                          {customer.coursesEnrolled}
                        </Badge>
                      </td>

                      {/* Total Spending */}
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        {formatPrice(customer.totalSpent)}
                      </td>

                      {/* Action buttons (always visible) */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* View details */}
                          <button
                            onClick={() => setSelectedCustomer(customer)}
                            className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="View Purchases History"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>

                          {/* WhatsApp */}
                          {customer.phone && customer.phone !== 'N/A' && (
                            <a
                              href={getWhatsAppLink(customer.name, customer.phone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Chat WhatsApp"
                            >
                              <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" />
                            </a>
                          )}

                          {/* Email */}
                          <a
                            href={`mailto:${customer.email}?subject=Message from Aira3D`}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Email Customer"
                          >
                            <EnvelopeIcon className="w-5 h-5" />
                          </a>

                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Profile Details Modal (Orders list & Course registration) */}
      <AnimatePresence>
        {selectedCustomer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-end"
            onClick={() => setSelectedCustomer(null)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-display font-bold text-gray-900">Customer Purchase File</h2>
                  <p className="text-xs text-gray-500 mt-1">Profile: {selectedCustomer.name}</p>
                </div>
                <button 
                  onClick={() => setSelectedCustomer(null)} 
                  className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                
                {/* Details card */}
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-3.5 text-sm">
                  <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Profile Information</h3>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Email:</span>
                    <span className="font-bold text-gray-900">{selectedCustomer.email}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Phone Number:</span>
                    <span className="font-bold text-gray-900">{selectedCustomer.phone || 'N/A'}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">First Interaction:</span>
                    <span className="font-semibold text-gray-900">{formatDisplayDate(selectedCustomer.createdAt)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Last Login / Activity:</span>
                    <span className="font-semibold text-gray-900">
                      {selectedCustomer.lastActive ? new Date(getTimestampMs(selectedCustomer.lastActive)).toLocaleString() : 'N/A'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-gray-500 font-bold">Total Platform Spending:</span>
                    <span className="text-lg font-bold text-orange-600">{formatPrice(selectedCustomer.totalSpent)}</span>
                  </div>
                </div>

                {/* Orders History section */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3.5">
                  <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBagIcon className="w-5 h-5 text-orange-500" /> eCommerce Order History ({selectedCustomer.ordersList.length})
                  </h3>

                  {selectedCustomer.ordersList.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No product purchases on record.</p>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-[30vh] overflow-y-auto scrollbar-thin pr-1">
                      {selectedCustomer.ordersList.map(order => (
                        <div key={order.id} className="py-2.5 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-mono font-bold text-gray-900">{order.orderId}</p>
                            <p className="text-gray-400 font-semibold">{formatDisplayDate(order.date)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-950">{formatPrice(order.amount)}</p>
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              order.status === 'Paid' || order.status === 'Completed' || order.status === 'Shipped'
                                ? 'bg-green-50 text-green-700' 
                                : 'bg-yellow-50 text-yellow-700'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Courses Enrolled Section */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3.5">
                  <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <AcademicCapIcon className="w-5 h-5 text-orange-500" /> Course Registrations ({selectedCustomer.coursesList.length})
                  </h3>

                  {selectedCustomer.coursesList.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No course enrollments on record.</p>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-[30vh] overflow-y-auto scrollbar-thin pr-1">
                      {selectedCustomer.coursesList.map(course => (
                        <div key={course.id} className="py-2.5 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-gray-900">{course.courseTitle}</p>
                            <p className="text-gray-400 font-semibold">{formatDisplayDate(course.date)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-950">{formatPrice(course.amount)}</p>
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              course.status === 'Confirmed' 
                                ? 'bg-green-50 text-green-700' 
                                : 'bg-yellow-50 text-yellow-700'
                            }`}>
                              {course.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
