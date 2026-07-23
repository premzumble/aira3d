import { useState, useEffect } from 'react';
import { collection, getDocs, db } from '../../firebase';
import { formatPrice } from '../../utils/formatHelpers.js';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, UsersIcon } from '@heroicons/react/24/outline';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';

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
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 mt-1">View and manage customer data and purchase history.</p>
        </div>
        <div className="w-full sm:w-64">
          <Input
            icon={MagnifyingGlassIcon}
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
          <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">No customers found.</p>
          <p className="text-gray-400 mt-1">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-gray-50/80 sticky top-0 z-10 border-b border-gray-100 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Customer</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Contact</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Location</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-center">Orders</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredCustomers.map((customer, index) => (
                  <motion.tr
                    key={customer.email}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50/80 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg">
                           {(customer.name || 'U').charAt(0).toUpperCase()}
                         </div>
                         <div>
                            <p className="font-bold text-gray-900">{customer.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{customer.email}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900 font-medium">{customer.phone || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4 max-w-[200px] truncate text-gray-600 font-medium" title={customer.addresses}>
                      {customer.addresses || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="info" className="px-3">
                        {customer.orderCount}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                      {formatPrice(customer.totalSpent)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
