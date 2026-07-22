import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc, db } from '../../firebase/index.js';
import { motion, AnimatePresence } from 'framer-motion';

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

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-900">Custom Orders</h1>
        <span className="text-sm text-gray-400">{orders.length} total</span>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white dark:bg-gray-50 rounded-xl shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">📐</div>
          <p className="text-gray-400 text-lg">No custom orders yet</p>
          <p className="text-sm text-gray-400 mt-2">Custom orders from customers will appear here</p>
        </div>
      ) : (
      <div className="bg-white dark:bg-gray-50 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Product Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Details</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
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
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{order.fullName || 'N/A'}</p>
                        <p className="text-xs text-gray-400">{order.email || ''}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">{order.mobileNumber || 'N/A'}</td>
                    <td className="px-4 py-3">{order.productType || 'N/A'}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate" dangerouslySetInnerHTML={{ __html: detailText }} title={detailText.replace(/<[^>]*>/g, '')} />
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>{order.status || 'Pending'}</span>
                    </td>
                     <td className="px-4 py-3">
                       <div className="flex items-center gap-1 flex-wrap">
                         {order.mobileNumber && (
                           <a href={`https://wa.me/91${order.mobileNumber}`} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">WhatsApp</a>
                         )}
                         <button onClick={() => setSelectedOrder(order)} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">View</button>
                         <button onClick={() => { setEditingOrder(order); setNewStatus(order.status || 'Pending'); }} className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200">Status</button>
                         <button onClick={() => setDeleteConfirm(order.id)} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">Del</button>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-gray-50 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-900">Custom Order Details</h2>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-900 text-2xl">✕</button>
               </div>
               {(() => {
                const o = selectedOrder;
                const date = o.createdAt ? new Date(o.createdAt.seconds * 1000).toLocaleString() : 'N/A';
                return (
                  <div className="space-y-4">
                    {o.mobileNumber && (
                      <a href={`https://wa.me/91${o.mobileNumber}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 mb-4">
                        💬 Chat on WhatsApp with {o.fullName}
                      </a>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div><p className="text-xs text-gray-400">Order ID</p><p className="font-mono font-semibold text-gray-900">{o.id?.substring(0, 12) || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-400">Date</p><p className="font-semibold text-gray-900">{date}</p></div>
                      <div><p className="text-xs text-gray-400">Customer</p><p className="font-semibold text-gray-900">{o.fullName || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-400">Phone</p><p className="font-semibold text-gray-900">{o.mobileNumber || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-400">Email</p><p className="font-semibold text-gray-900">{o.email || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-400">Product Type</p><p className="font-semibold text-gray-900">{o.productType || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-400">Quantity</p><p className="font-semibold text-gray-900">{o.quantity || 1}</p></div>
                      <div><p className="text-xs text-gray-400">Status</p><span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${o.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : o.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{o.status || 'Pending'}</span></div>
                      <div className="col-span-2"><p className="text-xs text-gray-400">Address</p><p className="font-semibold text-gray-900">{[o.address, o.city, o.state, o.pinCode].filter(Boolean).join(', ') || 'N/A'}</p></div>
                      {o.description && <><div className="col-span-2"><p className="text-xs text-gray-400">Description</p><p className="font-semibold text-gray-900">{o.description}</p></div></>}
                      {o.namePlateText && <div className="col-span-2 bg-orange-50 rounded-lg p-3"><p className="text-xs text-orange-600 font-medium">Name to Print:</p><p className="text-lg font-bold text-gray-900">{o.namePlateText}</p></div>}
                      {o.licensePlateNumber && <div className="col-span-2 bg-blue-50 rounded-lg p-3"><p className="text-xs text-blue-600 font-medium">License Plate Number:</p><p className="text-lg font-bold text-gray-900 font-mono">{o.licensePlateNumber}</p></div>}
                      {o.photoFrameDriveLink && <div className="col-span-2"><p className="text-xs text-gray-400">Photo Link</p><a href={o.photoFrameDriveLink} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">📷 {o.photoFrameDriveLink.substring(0, 50)}...</a></div>}
                      {o.stlFileLink && <div className="col-span-2"><p className="text-xs text-gray-400">STL File Link</p><a href={o.stlFileLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">📄 {o.stlFileLink.substring(0, 50)}...</a></div>}
                      {o.referenceImageLink && <div className="col-span-2"><p className="text-xs text-gray-400">Reference Image Link</p><a href={o.referenceImageLink} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">🖼️ {o.referenceImageLink.substring(0, 50)}...</a></div>}
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditingOrder(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-gray-50 rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Update Status</h2>
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-300 bg-white dark:bg-gray-50 text-gray-900 mb-4">
                {['Pending', 'Processing', 'Completed', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="flex gap-3">
                <button onClick={handleStatusUpdate} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">Update</button>
                <button onClick={() => setEditingOrder(null)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-gray-50 rounded-xl shadow-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-900 mb-2">Confirm Delete</h3>
              <p className="text-sm text-gray-600 dark:text-gray-800 mb-6">Are you sure you want to delete this custom order?</p>
              <div className="flex gap-3">
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2 bg-red-600 text-gray-800 rounded-lg hover:bg-red-700">Delete</button>
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-100 text-gray-900 dark:text-gray-900 rounded-lg hover:bg-gray-300">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
