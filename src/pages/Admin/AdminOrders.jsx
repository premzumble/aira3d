import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { formatPrice } from '../../utils/formatHelpers.js';
import { exportOrdersToExcel } from '../../utils/excelExport.js';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  ArchiveBoxXMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  TruckIcon
} from '@heroicons/react/24/outline';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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

  const statuses = ['Pending', 'Processing', 'Paid', 'Shipped', 'Completed', 'Delivered', 'Cancelled'];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
      case 'Delivered':
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircleIcon className="w-3.5 h-3.5" /> {status}</Badge>;
      case 'Paid':
      case 'Processing':
        return <Badge variant="info" className="flex items-center gap-1"><ClockIcon className="w-3.5 h-3.5" /> {status}</Badge>;
      case 'Shipped':
        return <Badge variant="primary" className="flex items-center gap-1"><TruckIcon className="w-3.5 h-3.5" /> {status}</Badge>;
      case 'Pending':
        return <Badge variant="warning" className="flex items-center gap-1"><ClockIcon className="w-3.5 h-3.5" /> {status}</Badge>;
      case 'Cancelled':
        return <Badge variant="danger" className="flex items-center gap-1"><XMarkIcon className="w-3.5 h-3.5" /> {status}</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Pending'}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-500 mt-1">View, track, and process customer orders.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-full sm:w-64">
            <Input
              icon={MagnifyingGlassIcon}
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <FunnelIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none shadow-sm appearance-none cursor-pointer w-full"
            >
              <option value="All">All Statuses</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Button
            variant="secondary"
            onClick={handleExportExcel}
            disabled={filteredOrders.length === 0}
            className="flex-shrink-0"
          >
            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
          <ArchiveBoxXMarkIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-900 text-lg font-bold mb-1">No orders match your criteria.</p>
          <p className="text-gray-500">Try adjusting your filters or search term.</p>
        </div>
      ) : (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-gray-50/80 sticky top-0 z-10 border-b border-gray-100 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Order ID</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Customer</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Date</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Amount</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Status</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.map((order) => {
                const orderId = order.orderId || order.id;
                const customerInfo = order.customerInfo || {};
                const dateMs = order.date?.seconds ? order.date.seconds * 1000 : (order.date ? new Date(order.date).getTime() : 0);
                
                return (
                  <tr key={orderId} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-md">{orderId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{customerInfo.fullName || order.customerName || 'N/A'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{customerInfo.email || order.customerEmail}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">
                      {dateMs ? new Date(dateMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">{formatPrice(order.totalAmount || order.amount || 0)}</td>
                    <td className="px-6 py-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors tooltip-trigger"
                          title="View Details"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => { setEditingOrder(order); setNewStatus(order.status || 'Pending'); }}
                          className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors tooltip-trigger"
                          title="Update Status"
                        >
                          <PencilSquareIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(order.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip-trigger"
                          title="Delete Order"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
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

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 sm:p-6"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl p-0 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                <div>
                   <h2 className="text-xl font-display font-bold text-gray-900">Order Details</h2>
                   <p className="text-sm text-gray-500 font-mono mt-1 font-bold">{selectedOrder.orderId || selectedOrder.id}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors bg-gray-100">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto scrollbar-thin">
                {(() => {
                  const order = selectedOrder;
                  const date = order.date;
                  const dateMs = date?.seconds ? date.seconds * 1000 : (date ? new Date(date).getTime() : 0);
                  const items = order.items || order.cartItems || [];
                  const customerInfo = order.customerInfo || {};
                  
                  return (
                    <div className="space-y-8">
                      {/* Customer & Order Meta */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                           <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Customer Info</h3>
                           <div className="space-y-3 text-sm">
                             <p className="flex justify-between"><span className="text-gray-500">Name:</span> <span className="font-bold text-gray-900">{customerInfo.fullName || order.customerName || 'N/A'}</span></p>
                             <p className="flex justify-between"><span className="text-gray-500">Email:</span> <span className="font-medium text-gray-900">{customerInfo.email || order.customerEmail || 'N/A'}</span></p>
                             <p className="flex justify-between"><span className="text-gray-500">Phone:</span> <span className="font-medium text-gray-900">{customerInfo.mobileNumber || order.customerPhone || 'N/A'}</span></p>
                           </div>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                           <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Order Info</h3>
                           <div className="space-y-3 text-sm">
                             <p className="flex justify-between items-center"><span className="text-gray-500">Status:</span> {getStatusBadge(order.status)}</p>
                             <p className="flex justify-between"><span className="text-gray-500">Date:</span> <span className="font-medium text-gray-900">{dateMs ? new Date(dateMs).toLocaleString() : 'N/A'}</span></p>
                             <p className="flex justify-between"><span className="text-gray-500">Payment:</span> <span className="font-medium text-gray-900">{order.paymentMethod || 'Razorpay'}</span></p>
                             {order.paymentId && <p className="flex justify-between items-center"><span className="text-gray-500">Pay ID:</span> <span className="font-mono text-[10px] bg-gray-200 px-2 py-1 rounded text-gray-900 truncate ml-4 max-w-[150px]">{order.paymentId}</span></p>}
                           </div>
                        </div>
                      </div>

                      {/* Shipping Info */}
                      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                         <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2"><TruckIcon className="w-4 h-4" /> Shipping Details</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            <div>
                               <p className="text-gray-500 mb-1">Delivery Address</p>
                               <p className="font-medium text-gray-900 leading-relaxed max-w-sm">
                                 {[customerInfo.address, customerInfo.city, customerInfo.state, customerInfo.pinCode].filter(Boolean).join(', ') || 'N/A'}
                               </p>
                            </div>
                            <div className="space-y-3">
                               {order.shiprocketOrderId && (
                                 <div className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 flex justify-between items-center">
                                    <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Shiprocket Order</span>
                                    <span className="font-mono text-xs font-bold text-gray-900 bg-white px-2 py-1 rounded shadow-sm">{order.shiprocketOrderId}</span>
                                 </div>
                               )}
                               {order.awb_code && (
                                 <div className="bg-indigo-50 px-4 py-3 rounded-xl border border-indigo-100 flex justify-between items-center">
                                    <span className="text-indigo-700 text-xs font-bold uppercase tracking-wider">AWB Tracking</span>
                                    <span className="font-mono text-xs font-bold text-indigo-900 bg-white px-2 py-1 rounded shadow-sm">{order.awb_code}</span>
                                 </div>
                               )}
                            </div>
                         </div>
                      </div>

                      {/* Items */}
                      <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Order Items</h3>
                        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                               <tr>
                                 <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Product</th>
                                 <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-center">Qty</th>
                                 <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Price</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {items.length > 0 ? items.map((item, idx) => {
                                const cd = item.customData || {};
                                return (
                                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                      <p className="font-bold text-gray-900">{item.name || item.productName}</p>
                                      {Object.keys(cd).length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                          {cd.name && <span className="text-[10px] font-bold uppercase tracking-wider bg-primary-50 text-primary-700 px-2 py-1 rounded-md">Name: {cd.name}</span>}
                                          {cd.licenseNumber && <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 px-2 py-1 rounded-md">License: <span className="font-mono">{cd.licenseNumber}</span></span>}
                                          {cd.color && <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 px-2 py-1 rounded-md">Color: {cd.color}</span>}
                                          {cd.photoLink && <a href={cd.photoLink} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors">View Photo ↗</a>}
                                        </div>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-gray-600">{item.quantity || 1}</td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-900">{formatPrice(item.price || 0)}</td>
                                  </tr>
                                );
                              }) : <tr><td colSpan="3" className="p-6 text-center text-gray-400 font-medium">No items found</td></tr>}
                            </tbody>
                            <tfoot className="bg-gray-50 border-t border-gray-100">
                               <tr>
                                 <td colSpan="2" className="px-6 py-4 text-right font-bold text-gray-500 uppercase tracking-wider text-xs">Total Amount</td>
                                 <td className="px-6 py-4 text-right font-display font-bold text-xl text-primary-600">{formatPrice(order.totalAmount || order.amount || 0)}</td>
                               </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>

                      {order.additionalMessage && (
                        <div className="bg-yellow-50/80 border border-yellow-200 rounded-2xl p-5">
                          <p className="text-xs font-bold text-yellow-800 uppercase tracking-wider mb-2">Customer Note</p>
                          <p className="text-sm text-yellow-900 font-medium italic">"{order.additionalMessage}"</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Update Modal */}
      <AnimatePresence>
        {editingOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setEditingOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">Update Status</h2>
              <p className="text-sm text-gray-500 mb-6 font-mono font-bold">{editingOrder.orderId || editingOrder.id}</p>
              
              <div className="space-y-6">
                <div className="relative">
                   <select
                     value={newStatus}
                     onChange={(e) => setNewStatus(e.target.value)}
                     className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none appearance-none font-bold shadow-sm transition-all cursor-pointer"
                   >
                     {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                   </select>
                   <ArrowDownTrayIcon className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setEditingOrder(null)} className="flex-1 justify-center">
                    Cancel
                  </Button>
                  <Button onClick={handleStatusUpdate} className="flex-1 justify-center">
                    Save
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center"
            >
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                 <TrashIcon className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">Delete Order?</h3>
              <p className="text-gray-500 mb-8">This action cannot be undone. This will permanently remove the order from the database.</p>
              
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="flex-1 justify-center">
                  Cancel
                </Button>
                <Button onClick={() => handleDelete(deleteConfirm)} className="flex-1 justify-center bg-red-600 hover:bg-red-700 shadow-red-500/20 text-white">
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
