import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  WrenchScrewdriverIcon,
  TrashIcon,
  EyeIcon,
  PencilSquareIcon,
  XMarkIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

export default function AdminCustomOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { fetchCustomOrders(); }, []);

  const fetchCustomOrders = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'customOrders'));
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setOrders(data);
    } catch (error) {
      console.error('Error fetching custom orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!editingOrder || !newStatus) return;
    try {
      await updateDoc(doc(db, 'customOrders', editingOrder.id), { status: newStatus, updatedAt: new Date().toISOString() });
      setOrders(prev => prev.map(o => o.id === editingOrder.id ? { ...o, status: newStatus } : o));
      setEditingOrder(null);
      setNewStatus('');
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (orderId) => {
    try {
      await deleteDoc(doc(db, 'customOrders', orderId));
      setOrders(prev => prev.filter(o => o.id !== orderId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  const statuses = ['Pending', 'Processing', 'Completed', 'Cancelled'];

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5";
    switch (status) {
      case 'Completed':
        return <span className={`${baseClasses} bg-green-50 text-green-700 border-green-200`}><CheckCircleIcon className="w-3.5 h-3.5" /> {status}</span>;
      case 'Processing':
        return <span className={`${baseClasses} bg-blue-50 text-blue-700 border-blue-200`}><ClockIcon className="w-3.5 h-3.5" /> {status}</span>;
      case 'Pending':
        return <span className={`${baseClasses} bg-yellow-50 text-yellow-700 border-yellow-200`}><ClockIcon className="w-3.5 h-3.5" /> {status}</span>;
      case 'Cancelled':
        return <span className={`${baseClasses} bg-red-50 text-red-700 border-red-200`}><XMarkIcon className="w-3.5 h-3.5" /> {status}</span>;
      default:
        return <span className={`${baseClasses} bg-gray-50 text-gray-700 border-gray-200`}>{status || 'Pending'}</span>;
    }
  };

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
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Custom Orders</h1>
          <p className="text-gray-500 mt-1">Manage unique fabrication requests and personalized products.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold">{orders.length} total</span>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
          <WrenchScrewdriverIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">No custom orders yet.</p>
          <p className="text-gray-400 mt-1">Custom requests from customers will appear here.</p>
        </div>
      ) : (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-gray-50/80 sticky top-0 z-10 border-b border-gray-100 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-500">Customer</th>
                <th className="px-6 py-4 font-semibold text-gray-500">Contact</th>
                <th className="px-6 py-4 font-semibold text-gray-500">Product Type</th>
                <th className="px-6 py-4 font-semibold text-gray-500">Details</th>
                <th className="px-6 py-4 font-semibold text-gray-500">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order) => {
                const cat = (order.productType || '').toLowerCase();
                let detailText = order.description || 'No details';
                if (cat.includes('name plate')) {
                  const extra = order.namePlateText ? `<br/><strong>Name:</strong> ${order.namePlateText}` : '';
                  detailText = (order.description || '') + extra;
                }
                if (cat.includes('license')) {
                  const extra = order.licensePlateNumber ? `<br/><strong>License No:</strong> ${order.licensePlateNumber}` : '';
                  detailText = (order.description || '') + extra;
                }
                if (cat.includes('photo')) {
                  const extra = order.photoFrameDriveLink ? `<br/><a href="${order.photoFrameDriveLink}" target="_blank" rel="noopener noreferrer" className="text-orange-600 underline">📷 Photo Link</a>` : 'Photo to be sent via WhatsApp';
                  detailText = (detailText || '') + extra;
                }
                if (order.stlFileLink) {
                  detailText += `<br/><a href="${order.stlFileLink}" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">📄 STL File</a>`;
                }
                if (order.referenceImageLink) {
                  detailText += `<br/><a href="${order.referenceImageLink}" target="_blank" rel="noopener noreferrer" className="text-purple-600 underline">🖼️ Reference Image</a>`;
                }
                return (
                  <tr key={order.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{order.fullName || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{order.email || ''}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{order.mobileNumber || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100 rounded-md">
                        {order.productType || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-[200px] truncate text-gray-600" dangerouslySetInnerHTML={{ __html: detailText }} title={detailText.replace(/<[^>]*>/g, '')} />
                    <td className="px-6 py-4">
                      {getStatusBadge(order.status)}
                    </td>
                     <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         {order.mobileNumber && (
                           <a 
                             href={`https://wa.me/91${order.mobileNumber}`} 
                             target="_blank" 
                             rel="noopener noreferrer" 
                             className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors tooltip-trigger"
                             title="WhatsApp Customer"
                           >
                             <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" />
                           </a>
                         )}
                         <button onClick={() => setSelectedOrder(order)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip-trigger" title="View Details">
                            <EyeIcon className="w-5 h-5" />
                         </button>
                         <button onClick={() => { setEditingOrder(order); setNewStatus(order.status || 'Pending'); }} className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors tooltip-trigger" title="Update Status">
                            <PencilSquareIcon className="w-5 h-5" />
                         </button>
                         <button onClick={() => setDeleteConfirm(order.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip-trigger" title="Delete">
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

      {/* View Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 sm:p-6" onClick={() => setSelectedOrder(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white rounded-3xl shadow-2xl p-0 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                <div>
                   <h2 className="text-xl font-display font-bold text-gray-900">Custom Order Details</h2>
                   <p className="text-sm text-gray-500 font-mono mt-1">{selectedOrder.id}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto scrollbar-thin">
               {(() => {
                const o = selectedOrder;
                const date = o.createdAt ? new Date(o.createdAt.seconds * 1000).toLocaleString() : 'N/A';
                return (
                  <div className="space-y-6">
                    {o.mobileNumber && (
                      <a href={`https://wa.me/91${o.mobileNumber}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 border border-green-200 font-semibold rounded-xl hover:bg-green-100 transition-colors w-full justify-center">
                        <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" />
                        Chat on WhatsApp with {o.fullName}
                      </a>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-3 text-sm">
                          <p className="flex justify-between"><span className="text-gray-500">Date:</span> <span className="font-semibold text-gray-900">{date}</span></p>
                          <p className="flex justify-between"><span className="text-gray-500">Customer:</span> <span className="font-semibold text-gray-900">{o.fullName || 'N/A'}</span></p>
                          <p className="flex justify-between"><span className="text-gray-500">Phone:</span> <span className="font-semibold text-gray-900">{o.mobileNumber || 'N/A'}</span></p>
                          <p className="flex justify-between"><span className="text-gray-500">Email:</span> <span className="font-semibold text-gray-900">{o.email || 'N/A'}</span></p>
                       </div>
                       
                       <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-3 text-sm">
                          <p className="flex justify-between"><span className="text-gray-500">Product Type:</span> <span className="font-semibold text-gray-900">{o.productType || 'N/A'}</span></p>
                          <p className="flex justify-between"><span className="text-gray-500">Quantity:</span> <span className="font-semibold text-gray-900">{o.quantity || 1}</span></p>
                          <p className="flex justify-between items-center"><span className="text-gray-500">Status:</span> {getStatusBadge(o.status)}</p>
                       </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                       <div>
                         <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Delivery Address</p>
                         <p className="font-medium text-gray-900">{[o.address, o.city, o.state, o.pinCode].filter(Boolean).join(', ') || 'N/A'}</p>
                       </div>
                       
                       {o.description && (
                         <div>
                           <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description</p>
                           <p className="text-sm text-gray-900 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">{o.description}</p>
                         </div>
                       )}
                       
                       {o.namePlateText && (
                         <div className="bg-orange-50/50 rounded-lg p-4 border border-orange-100">
                           <p className="text-xs text-orange-800 font-bold uppercase tracking-wider mb-1">Name to Print</p>
                           <p className="text-xl font-bold text-orange-900">{o.namePlateText}</p>
                         </div>
                       )}
                       
                       {o.licensePlateNumber && (
                         <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                           <p className="text-xs text-blue-800 font-bold uppercase tracking-wider mb-1">License Plate Number</p>
                           <p className="text-xl font-bold text-blue-900 font-mono tracking-widest">{o.licensePlateNumber}</p>
                         </div>
                       )}
                       
                       <div className="flex flex-wrap gap-3">
                         {o.photoFrameDriveLink && (
                           <a href={o.photoFrameDriveLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 font-semibold rounded-lg text-sm border border-purple-100 hover:bg-purple-100 transition-colors">
                             📷 View Photo Link
                           </a>
                         )}
                         {o.stlFileLink && (
                           <a href={o.stlFileLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 font-semibold rounded-lg text-sm border border-indigo-100 hover:bg-indigo-100 transition-colors">
                             📄 Download STL
                           </a>
                         )}
                         {o.referenceImageLink && (
                           <a href={o.referenceImageLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 bg-rose-50 text-rose-700 font-semibold rounded-lg text-sm border border-rose-100 hover:bg-rose-100 transition-colors">
                             🖼️ Reference Image
                           </a>
                         )}
                       </div>
                    </div>
                  </div>
                );
               })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Status Modal */}
      <AnimatePresence>
        {editingOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setEditingOrder(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-display font-bold text-gray-900 mb-2">Update Status</h2>
              <p className="text-sm text-gray-500 mb-6 font-mono">ID: {editingOrder.id}</p>
              
              <div className="space-y-4">
                <div className="relative">
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none appearance-none font-medium">
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ArrowDownTrayIcon className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setEditingOrder(null)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors">Cancel</button>
                  <button onClick={handleStatusUpdate} className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium shadow-sm transition-colors">Update Status</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                 <TrashIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-display font-bold text-gray-900 mb-2">Delete Custom Order?</h3>
              <p className="text-sm text-gray-500 mb-8">Are you sure you want to delete this custom order? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium shadow-sm transition-colors">Yes, Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
