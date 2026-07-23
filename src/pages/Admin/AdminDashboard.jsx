import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../../firebase';
import { formatPrice } from '../../utils/formatHelpers.js';
import { motion } from 'framer-motion';
import Badge from '../../components/ui/Badge';
import {
  ShoppingCartIcon,
  BanknotesIcon,
  CubeIcon,
  UsersIcon,
  ArrowPathIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  EnvelopeIcon,
  TruckIcon,
  ChartPieIcon
} from '@heroicons/react/24/outline';

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
  const [pendingOrdersList, setPendingOrdersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState({});
  const [contactMessages, setContactMessages] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sorted = [...orders].sort((a, b) => {
        const dateA = a.date?.seconds || 0;
        const dateB = b.date?.seconds || 0;
        return dateB - dateA;
      });
      setRecentOrders(sorted.slice(0, 5));
      setPendingOrdersList(sorted.filter(o => o.status === 'Pending').slice(0, 5));

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
        if (order.status === 'Completed' || order.status === 'Delivered') completedOrders++;
        if (order.status === 'Processing' || order.status === 'Paid') processingOrders++;

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
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingCartIcon, bg: 'bg-blue-50', color: 'text-blue-600' },
    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: BanknotesIcon, bg: 'bg-emerald-50', color: 'text-emerald-600' },
    { label: 'Total Products', value: stats.totalProducts, icon: CubeIcon, bg: 'bg-purple-50', color: 'text-purple-600' },
    { label: 'Total Customers', value: stats.totalCustomers, icon: UsersIcon, bg: 'bg-primary-50', color: 'text-primary-600' },
  ];

  const maxMonthlyOrders = Math.max(...Object.values(monthlyData), 1);
  const sortedMonths = Object.keys(monthlyData).sort();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">{getGreeting()}, Admin</h1>
           <p className="text-gray-500 mt-1">Here's what's happening with your store today.</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:text-primary-600 transition-colors shadow-sm text-sm font-medium"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">{card.label}</p>
                <p className="text-3xl font-display font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`w-14 h-14 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center`}>
                <Icon className="w-7 h-7" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Order Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Link to="/admin/orders?status=Pending" className="block group">
          <motion.div whileHover={{ scale: 1.02 }} className="bg-yellow-50/80 border border-yellow-200 rounded-3xl p-6 text-center h-full transition-all group-hover:shadow-md group-hover:border-yellow-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400 rounded-full blur-[40px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
            <ClockIcon className="w-8 h-8 text-yellow-600 mx-auto mb-3 relative z-10" />
            <p className="text-4xl font-display font-bold text-yellow-700 mb-1 relative z-10">{stats.pendingOrders}</p>
            <p className="text-sm font-bold text-yellow-800 uppercase tracking-wider relative z-10">Pending Orders</p>
            <p className="text-xs text-yellow-600 mt-3 font-bold flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity relative z-10">Review Now <ArrowRightIcon className="w-3 h-3" /></p>
          </motion.div>
        </Link>
        <Link to="/admin/orders?status=Processing" className="block group">
          <motion.div whileHover={{ scale: 1.02 }} className="bg-blue-50/80 border border-blue-200 rounded-3xl p-6 text-center h-full transition-all group-hover:shadow-md group-hover:border-blue-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-400 rounded-full blur-[40px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
            <TruckIcon className="w-8 h-8 text-blue-600 mx-auto mb-3 relative z-10" />
            <p className="text-4xl font-display font-bold text-blue-700 mb-1 relative z-10">{stats.processingOrders}</p>
            <p className="text-sm font-bold text-blue-800 uppercase tracking-wider relative z-10">Processing</p>
            <p className="text-xs text-blue-600 mt-3 font-bold flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity relative z-10">View Orders <ArrowRightIcon className="w-3 h-3" /></p>
          </motion.div>
        </Link>
        <div className="bg-green-50/80 border border-green-200 rounded-3xl p-6 text-center h-full relative overflow-hidden">
           <div className="absolute top-0 right-0 w-24 h-24 bg-green-400 rounded-full blur-[40px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
          <CheckCircleIcon className="w-8 h-8 text-green-600 mx-auto mb-3 relative z-10" />
          <p className="text-4xl font-display font-bold text-green-700 mb-1 relative z-10">{stats.completedOrders}</p>
          <p className="text-sm font-bold text-green-800 uppercase tracking-wider relative z-10">Completed Orders</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Widget */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col justify-between overflow-hidden relative">
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <BanknotesIcon className="w-5 h-5 text-gray-400" /> Revenue at a Glance
            </h3>
            <div className="bg-gray-900 rounded-2xl p-8 text-white shadow-xl shadow-gray-900/20 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500 rounded-full blur-[60px] opacity-30 -translate-y-1/2 translate-x-1/2"></div>
              <p className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider relative z-10">Total Revenue Generated</p>
              <p className="text-5xl font-display font-bold tracking-tight relative z-10">{formatPrice(stats.totalRevenue)}</p>
            </div>
          </div>
        </div>

        {/* Chart Widget */}
        {sortedMonths.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <ChartPieIcon className="w-5 h-5 text-gray-400" /> Monthly Orders
            </h3>
            <div className="flex items-end justify-between gap-3 h-40 px-2 mt-4">
              {sortedMonths.map((month) => {
                const orderCount = monthlyData[month];
                const heightPercent = (orderCount / maxMonthlyOrders) * 100;
                return (
                  <div key={month} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-xs font-bold text-gray-500 group-hover:text-primary-600 transition-colors">{orderCount}</span>
                    <div className="w-full max-w-[48px] bg-gray-100 group-hover:bg-primary-100 rounded-t-xl min-h-[4px] relative overflow-hidden transition-colors"
                      style={{ height: `${Math.max(heightPercent, 4)}%` }}
                    >
                       <div className="absolute bottom-0 left-0 right-0 bg-primary-500 transition-all duration-500 ease-out" style={{ height: '100%' }} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate w-full text-center">
                      {month.slice(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Action Required: Pending Orders */}
      {pendingOrdersList.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-red-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                 <ClockIcon className="w-5 h-5" />
              </div>
              <div>
                 <h3 className="text-lg font-bold text-gray-900">Action Required: Pending Orders</h3>
                 <p className="text-sm text-gray-500">These orders need to be processed or shipped.</p>
              </div>
            </div>
            <Link to="/admin/orders?status=Pending" className="text-sm font-bold text-primary-600 hover:text-primary-700 bg-white border border-gray-200 px-5 py-2 rounded-xl shadow-sm text-center">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Order ID</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Customer</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Phone</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Amount</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pendingOrdersList.map((order) => {
                  const customerInfo = order.customerInfo || {};
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-gray-900">{order.orderId || order.id}</td>
                      <td className="px-6 py-4 text-gray-600 font-medium">{customerInfo.fullName || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-600">{customerInfo.mobileNumber || 'N/A'}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">{formatPrice(order.totalAmount || 0)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            sessionStorage.setItem('pendingOrderId', order.id);
                            window.location.href = '/admin/orders';
                          }}
                          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-xs font-bold shadow-sm transition-colors"
                        >
                          Process Now
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

      {/* Recent Orders List */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCartIcon className="w-5 h-5 text-gray-400" /> Recent Orders
          </h3>
          <Link to="/admin/orders" className="text-sm font-bold text-gray-500 hover:text-primary-600">See All</Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <ShoppingCartIcon className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">No recent orders to show.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Order ID</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Customer</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Status</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Date</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((order) => {
                  const customerInfo = order.customerInfo || {};
                  const date = order.date;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-gray-900">{order.orderId || order.id}</td>
                      <td className="px-6 py-4 text-gray-600 font-medium">{customerInfo.fullName || order.customerName || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <Badge 
                           variant={
                             order.status === 'Completed' || order.status === 'Delivered' ? 'success' :
                             order.status === 'Pending' ? 'warning' :
                             order.status === 'Processing' || order.status === 'Paid' ? 'info' :
                             order.status === 'Cancelled' ? 'danger' : 'secondary'
                           }
                        >
                          {order.status || 'Pending'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-medium">
                        {date ? new Date(date.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900 text-right">{formatPrice(order.totalAmount || 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Contact Messages */}
      {contactMessages.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <EnvelopeIcon className="w-5 h-5 text-gray-400" /> Recent Messages
            </h3>
            <Link to="/admin/contact" className="text-sm font-bold text-gray-500 hover:text-primary-600">See All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Name</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Email</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Message</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {contactMessages.map((msg) => {
                  const dateVal = msg.date || msg.createdAt;
                  const dateMs = dateVal ? (dateVal.seconds ? dateVal.seconds * 1000 : new Date(dateVal).getTime()) : 0;
                  return (
                    <tr key={msg.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{msg.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-600">{msg.email || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-500 max-w-xs truncate" title={msg.message || ''}>
                        {msg.message || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-right font-medium">
                        {dateMs ? new Date(dateMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
