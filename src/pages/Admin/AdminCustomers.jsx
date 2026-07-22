import { useState, useEffect } from 'react';
import { collection, getDocs, query, db } from '../../firebase/index.js';
import { formatPrice } from '../../utils/formatHelpers.js';
import { motion } from 'framer-motion';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'orders'));
      const orders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      const customerMap = {};

      orders.forEach(order => {
        const email = order.customerInfo?.email || order.customerEmail || order.email;
        if (!email) return;
        if (!customerMap[email]) {
          customerMap[email] = {
            email,
            name: order.customerInfo?.fullName || order.customerName || order.name || '',
            phone: order.customerInfo?.mobileNumber || order.customerPhone || order.phone || '',
            addresses: order.customerInfo?.address || order.customerAddress || order.address || '',
            orderCount: 0,
            totalSpent: 0,
          };
        }
        customerMap[email].orderCount += 1;
        customerMap[email].totalSpent += order.totalAmount || order.amount || 0;
      });

      const sorted = Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent);
      setCustomers(sorted);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = searchTerm
    ? customers.filter(c =>
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : customers;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-900">Customers</h1>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-300 bg-white dark:bg-gray-50 text-gray-900 dark:text-gray-900 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
        />
      </div>

      <div className="bg-white dark:bg-gray-50 rounded-xl shadow-sm overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <p className="p-6 text-center text-gray-400">No customers found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-800 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-800 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-800 uppercase">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-800 uppercase">Address</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-800 uppercase">Total Orders</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-800 uppercase">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCustomers.map((customer, index) => (
                  <motion.tr
                    key={customer.email}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-900">{customer.name || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-900">{customer.email}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-900">{customer.phone || 'N/A'}</td>
                    <td className="px-4 py-3 max-w-[150px] truncate text-gray-600 dark:text-gray-900">{customer.addresses || 'N/A'}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-900">{customer.orderCount}</td>
                    <td className="px-4 py-3 font-semibold text-orange-600 dark:text-orange-400">{formatPrice(customer.totalSpent)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}









