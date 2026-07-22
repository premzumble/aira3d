import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, db } from '../../firebase/index.js';
import { formatPrice } from '../../utils/formatHelpers.js';
import { exportOrdersToExcel } from '../../utils/excelExport.js';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const pendingId = sessionStorage.getItem('pendingOrderId');
    if (pendingId) {
      sessionStorage.removeItem('pendingOrderId');
      const found = orders.find(o => o.id === pendingId || o.orderId === pendingId);
      if (found) setSelectedOrder(found);
    }
  }, [orders]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'orders'));
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => {
        const dateA = a.date?.seconds || a.date || 0;
        const dateB = b.date?.seconds || b.date || 0;
        return dateB - dateA;
      });
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!editingOrder || !newStatus) return;
    try {
      await updateDoc(doc(db, 'orders', editingOrder.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      setOrders(prev => prev.map(o => o.id === editingOrder.id ? { ...o, status: newStatus } : o));
      setEditingOrder(null);
      setNewStatus('');
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (orderId) => {
    setSelectedOrder(null);
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      setOrders(prev => prev.filter(o => o.id !== orderId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Delete failed: ' + error.message + '\n\nTo enable delete: Update Firestore rules to allow delete without auth, OR create admin user in Firebase Console.');
    }
  };

  const handleExportExcel = () => {
    exportOrdersToExcel(filteredOrders);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchTerm ||
      (order.orderId || order.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customerInfo?.fullName || order.customerName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses = ['Pending', 'Processing', 'Completed', 'Cancelled'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-900">Orders Management</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Search by Order ID or Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-300 bg-white dark:bg-gray-50 text-gray-900 dark:text-gray-900 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-300 bg-white dark:bg-gray-50 text-gray-900 dark:text-gray-900 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <button
            onClick={handleExportExcel}
            disabled={filteredOrders.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >📥 Download Excel</button>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-gray-50 rounded-xl shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-gray-400 text-lg">No orders found</p>
        </div>
      ) : (
      <div className="bg-white dark:bg-gray-50 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-800 uppercase">Order ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-800 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-800 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-800 uppercase">Address</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-800 uppercase">Products</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-800 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-800 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-800 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredOrders.map((order) => {
                const orderId = order.orderId || order.id;
                const items = order.items || order.cartItems || [];
                const customerInfo = order.customerInfo || {};
                const productSummary = items.map(i => i.name || i.productName || 'Product').join(', ');
                return (
                  <tr key={orderId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-mono text-xs">{orderId}</td>
                    <td className="px-4 py-3">{customerInfo.fullName || order.customerName || 'N/A'}</td>
                    <td className="px-4 py-3">{customerInfo.mobileNumber || order.customerPhone || 'N/A'}</td>
                    <td className="px-4 py-3 max-w-[150px] truncate">{customerInfo.address || order.customerAddress || 'N/A'}</td>
                    <td className="px-4 py-3 max-w-[150px] truncate" title={productSummary}>{productSummary || 'N/A'}</td>
                    <td className="px-4 py-3 font-semibold">{formatPrice(order.totalAmount || order.amount || 0)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'Paid' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >View</button>
                        <button
                          onClick={() => { setEditingOrder(order); setNewStatus(order.status || 'Pending'); }}
                          className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                        >Status</button>
                        <button
                          onClick={() => setDeleteConfirm(order.id)}
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white dark:bg-gray-50 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-900">Order Details</h2>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-900 text-2xl">✕</button>
              </div>
              {(() => {
                const order = selectedOrder;
                const oid = order.orderId || order.id;
                const date = order.date;
                const items = order.items || order.cartItems || [];
                const customerInfo = order.customerInfo || {};
                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-400">Order ID</p>
                        <p className="font-mono font-semibold text-gray-900 dark:text-gray-900">{oid}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Date</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-900">{date ? new Date(date.seconds * 1000).toLocaleString() : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Customer Name</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-900">{customerInfo.fullName || order.customerName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Email</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-900">{customerInfo.email || order.customerEmail || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Phone</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-900">{customerInfo.mobileNumber || order.customerPhone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Payment Method</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-900">{order.paymentMethod || 'Razorpay'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Payment ID</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-900">{order.paymentId || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Shiprocket Order ID</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-900">{order.shiprocketOrderId || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Shiprocket Shipment ID</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-900">{order.shiprocketShipmentId || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Status</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'Paid' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>{order.status || 'Pending'}</span>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-400">Delivery Address</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-900">{[customerInfo.address, customerInfo.city, customerInfo.state, customerInfo.pinCode].filter(Boolean).join(', ') || 'N/A'}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-900 mb-2">Order Items & Customization Details</p>
                      <div className="bg-gray-50 dark:bg-gray-50 rounded-lg p-4 space-y-3">
                        {items.length > 0 ? items.map((item, idx) => {
                          const cd = item.customData || {};
                          return (
                            <div key={idx} className="border-b border-gray-200 dark:border-gray-200 pb-3 last:border-0">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-gray-900">{item.name || item.productName}</p>
                                  <p className="text-xs text-gray-400">Qty: {item.quantity || 1} × ₹{item.price || 0}</p>
                                </div>
                                <p className="font-semibold text-gray-900 dark:text-gray-900">{formatPrice((item.price || 0) * (item.quantity || 1))}</p>
                              </div>
                              {Object.keys(cd).length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {cd.name && <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">🏷️ Name: <strong>{cd.name}</strong></span>}
                                  {cd.licenseNumber && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">🚗 License: <strong className="font-mono">{cd.licenseNumber}</strong></span>}
                                  {cd.photoLink && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">🖼️ <a href={cd.photoLink} target="_blank" rel="noopener noreferrer" className="underline">Photo Link</a></span>}
                                </div>
                              )}
                            </div>
                          );
                        }) : <p className="text-gray-400">No items</p>}
                        <div className="pt-3 border-t border-gray-300 dark:border-gray-300 flex justify-between font-bold text-gray-900 dark:text-gray-900">
                          <span>Total Amount</span>
                          <span>{formatPrice(order.totalAmount || order.amount || 0)}</span>
                        </div>
                      </div>
                    </div>

                    {order.additionalMessage && (
                      <div className="bg-yellow-50 rounded-lg p-3">
                        <p className="text-xs text-gray-400">Additional Message from Customer</p>
                        <p className="text-sm text-gray-900">{order.additionalMessage}</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setEditingOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white dark:bg-gray-50 rounded-xl shadow-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-900 mb-4">Update Order Status</h2>
              <p className="text-sm text-gray-400 mb-4">Order ID: {editingOrder.orderId || editingOrder.id}</p>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-300 bg-white dark:bg-gray-50 text-gray-900 dark:text-gray-900 mb-4"
              >
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="flex gap-3">
                <button
                  onClick={handleStatusUpdate}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >Update Status</button>
                <button
                  onClick={() => setEditingOrder(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-100 text-gray-900 dark:text-gray-900 rounded-lg hover:bg-gray-300"
                >Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white dark:bg-gray-50 rounded-xl shadow-2xl p-6 w-full max-w-sm"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-900 mb-2">Confirm Delete</h3>
              <p className="text-sm text-gray-600 dark:text-gray-800 mb-6">Are you sure you want to delete this order? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >Delete</button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300"
                >Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
