import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, db } from '../../firebase/index.js';
import { formatPrice } from '../../utils/formatHelpers.js';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    completedOrders: 0,
    processingOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState({});
  const [contactMessages, setContactMessages] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sorted = [...orders].sort((a, b) => {
        const dateA = a.date?.seconds || 0;
        const dateB = b.date?.seconds || 0;
        return dateB - dateA;
      });
      setRecentOrders(sorted.slice(0, 5));
      setPendingOrders(sorted.filter(o => o.status === 'Pending').slice(0, 5));

      const uniqueEmails = new Set();
      let totalRevenue = 0;
      let pendingOrders = 0;
      let completedOrders = 0;
      let processingOrders = 0;
      const monthCounts = {};

      orders.forEach(order => {
        const email = order.customerInfo?.email || order.customerEmail;
        if (email) uniqueEmails.add(email);
        const amount = order.totalAmount || order.amount || 0;
        totalRevenue += amount;

        if (order.status === 'Pending') pendingOrders++;
        if (order.status === 'Completed') completedOrders++;
        if (order.status === 'Processing') processingOrders++;

        const date = order.date;
        if (date) {
          const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
          if (!isNaN(d.getTime())) {
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthCounts[key] = (monthCounts[key] || 0) + 1;
          }
        }
      });

      setMonthlyData(monthCounts);

      const productsSnapshot = await getDocs(collection(db, 'products'));
      setStats({
        totalOrders: orders.length,
        totalRevenue,
        totalProducts: productsSnapshot.size,
        totalCustomers: uniqueEmails.size,
        pendingOrders,
        completedOrders,
        processingOrders,
      });

      const messagesSnapshot = await getDocs(query(collection(db, 'contactMessages')));
      const msgs = messagesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setContactMessages(msgs.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Orders', value: stats.totalOrders, icon: '🛒', color: 'from-orange-500 to-orange-400' },
    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: '💰', color: 'from-yellow-500 to-orange-400' },
    { label: 'Total Products', value: stats.totalProducts, icon: '📦', color: 'from-green-500 to-emerald-400' },
    { label: 'Total Customers', value: stats.totalCustomers, icon: '👥', color: 'from-orange-500 to-red-400' },
  ];

  const maxMonthlyOrders = Math.max(...Object.values(monthlyData), 1);
  const sortedMonths = Object.keys(monthlyData).sort();

  const getCustomerName = (order) => order.customerInfo?.fullName || order.customerName || 'N/A';
  const getOrderId = (order) => order.orderId || order.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-900">Dashboard Overview</h1>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-50 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 dark:text-gray-800">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-2xl`}>
                {card.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Link to="/admin/orders?status=Pending" className="block">
          <motion.div whileHover={{ scale: 1.02 }} className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 rounded-xl p-6 text-center cursor-pointer">
            <p className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</p>
            <p className="text-sm text-gray-500 dark:text-gray-800 mt-1">Pending Orders</p>
            <p className="text-xs text-orange-600 mt-2 font-medium">Click to review →</p>
          </motion.div>
        </Link>
        <Link to="/admin/orders?status=Processing" className="block">
          <motion.div whileHover={{ scale: 1.02 }} className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 rounded-xl p-6 text-center cursor-pointer">
            <p className="text-3xl font-bold text-blue-600">{stats.processingOrders}</p>
            <p className="text-sm text-gray-500 dark:text-gray-800 mt-1">Processing Orders</p>
            <p className="text-xs text-blue-600 mt-2 font-medium">Click to review →</p>
          </motion.div>
        </Link>
        <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 rounded-xl p-6 text-center">
          <p className="text-3xl font-bold text-green-600">{stats.completedOrders}</p>
          <p className="text-sm text-gray-500 dark:text-gray-800 mt-1">Completed Orders</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-50 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-900 mb-4">Revenue at a Glance</h3>
          <div className="bg-gradient-to-r from-orange-500 to-orange-300 rounded-lg p-4 text-white">
            <p className="text-sm opacity-80">Total Revenue</p>
            <p className="text-3xl font-bold mt-1">{formatPrice(stats.totalRevenue)}</p>
          </div>
        </div>

        {sortedMonths.length > 0 && (
          <div className="bg-white dark:bg-gray-50 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-900 mb-4">Monthly Orders</h3>
            <div className="flex items-end justify-between gap-2 h-32">
              {sortedMonths.map((month) => {
                const orderCount = monthlyData[month];
                const heightPercent = (orderCount / maxMonthlyOrders) * 100;
                return (
                  <div key={month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-900">{orderCount}</span>
                    <div className="w-full bg-gradient-to-t from-orange-500 to-orange-300 rounded-t-md min-h-[4px]"
                      style={{ height: `${Math.max(heightPercent, 4)}%` }}
                    />
                    <span className="text-xs text-gray-400 dark:text-gray-800 truncate w-full text-center">
                      {month.slice(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {pendingOrders.length > 0 && (
        <div className="bg-white dark:bg-gray-50 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-900">Pending Orders - Action Required</h3>
              <Link to="/admin/orders?status=Pending" className="text-sm text-orange-600 hover:text-orange-700 font-medium">View All →</Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pendingOrders.map((order) => {
                  const customerInfo = order.customerInfo || {};
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">{order.orderId || order.id}</td>
                      <td className="px-4 py-3">{customerInfo.fullName || 'N/A'}</td>
                      <td className="px-4 py-3">{customerInfo.mobileNumber || 'N/A'}</td>
                      <td className="px-4 py-3 font-semibold">{formatPrice(order.totalAmount || 0)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            sessionStorage.setItem('pendingOrderId', order.id);
                            window.location.href = '/admin/orders';
                          }}
                          className="px-3 py-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-xs font-medium"
                        >
                          Process
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {contactMessages.length > 0 && (
        <div className="bg-white dark:bg-gray-50 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-900">Recent Contact Messages</h3>
              <Link to="/admin/contact" className="text-sm text-orange-600 hover:text-orange-700 font-medium">View All →</Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Message</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {contactMessages.map((msg) => {
                  const dateVal = msg.date || msg.createdAt;
                  const dateMs = dateVal ? (dateVal.seconds ? dateVal.seconds * 1000 : new Date(dateVal).getTime()) : 0;
                  return (
                    <tr key={msg.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">{msg.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-600">{msg.email || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[300px] truncate" title={msg.message || ''}>
                        {msg.message || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {dateMs ? new Date(dateMs).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-50 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-900">Recent Orders</h3>
        </div>
        {recentOrders.length === 0 ? (
          <p className="p-6 text-center text-gray-400">No orders yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.map((order) => {
                  const customerInfo = order.customerInfo || {};
                  const date = order.date;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-gray-700">{order.orderId || order.id}</td>
                      <td className="px-6 py-4 text-gray-700">{customerInfo.fullName || order.customerName || 'N/A'}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{formatPrice(order.totalAmount || 0)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {date ? new Date(date.seconds * 1000).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
