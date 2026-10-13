import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  WrenchScrewdriverIcon,
  TrashIcon,
  EyeIcon,
  PencilSquareIcon,
  XMarkIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  ArchiveBoxIcon,
  CalendarIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';

export default function AdminCustomOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Custom status history tracking states
  const [adminNote, setAdminNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [copiedText, setCopiedText] = useState('');
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // All, Pending, Under Review, etc.
  const [sortOrder, setSortOrder] = useState('Newest');

  useEffect(() => { 
    fetchCustomOrders(); 
  }, []);

  const fetchCustomOrders = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'customOrders'));
      const data = snapshot.docs.map(d => ({ 
        id: d.id, 
        status: d.data().status || 'New',
        statusHistory: d.data().statusHistory || [],
        internalNotes: d.data().internalNotes || '',
        ...d.data() 
      }));
      setOrders(data);
    } catch (error) {
      console.error('Error fetching custom orders:', error);
      toast.error('Failed to fetch custom orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!editingOrder || !newStatus) return;
    
    // Construct new history event
    const historyEvent = {
      status: newStatus,
      timestamp: new Date().toISOString(),
      updatedBy: 'Admin',
      note: `Status updated to ${newStatus}`
    };

    const updatedHistory = [...(editingOrder.statusHistory || []), historyEvent];

    try {
      await updateDoc(doc(db, 'customOrders', editingOrder.id), { 
        status: newStatus, 
        statusHistory: updatedHistory,
        updatedAt: new Date().toISOString() 
      });
      
      setOrders(prev => prev.map(o => o.id === editingOrder.id ? { 
        ...o, 
        status: newStatus,
        statusHistory: updatedHistory
      } : o));
      
      if (selectedOrder?.id === editingOrder.id) {
        setSelectedOrder(prev => ({ 
          ...prev, 
          status: newStatus,
          statusHistory: updatedHistory
        }));
      }

      toast.success(`Order status updated to ${newStatus}`);
      setEditingOrder(null);
      setNewStatus('');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleSaveInternalNote = async () => {
    if (!selectedOrder) return;
    setSavingNote(true);
    try {
      await updateDoc(doc(db, 'customOrders', selectedOrder.id), { 
        internalNotes: adminNote,
        updatedAt: new Date().toISOString() 
      });
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, internalNotes: adminNote } : o));
      setSelectedOrder(prev => ({ ...prev, internalNotes: adminNote }));
      toast.success('Internal notes saved');
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    } finally {
      setSavingNote(false);
    }
  };

  const handleDelete = async (orderId) => {
    try {
      await deleteDoc(doc(db, 'customOrders', orderId));
      setOrders(prev => prev.filter(o => o.id !== orderId));
      setDeleteConfirm(null);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
      toast.success('Custom order deleted');
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    }
  };

  const getTimestampMs = (val) => {
    if (!val) return 0;
    if (typeof val.toMillis === 'function') return val.toMillis();
    if (typeof val.toDate === 'function') return val.toDate().getTime();
    if (val.seconds) return val.seconds * 1000;
    return new Date(val).getTime();
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  // Pre-filled custom templates
  const getWhatsAppLink = (name, orderId, phone) => {
    const cleanPhone = (phone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const text = `Hello ${name || 'Customer'},\n\nWe have reviewed your custom order request.\n\nReference ID: CUSTOM-${orderId.slice(0, 8).toUpperCase()}\n\nOur team is currently evaluating your requirements.\nWe will contact you shortly regarding pricing and production.\n\nThank you for choosing Aira3D.\n\nRegards,\nAira3D Team`;
    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
  };

  const getEmailLink = (name, email, orderId, productType) => {
    const subject = `Update on Custom Order: CUSTOM-${orderId.slice(0, 8).toUpperCase()}`;
    const body = `Hello ${name || 'Customer'},\n\nThank you for choosing Aira3D.\n\nWe are writing to provide an update regarding your custom order request for "${productType || '3D Printing Service'}" (Reference ID: CUSTOM-${orderId.slice(0, 8).toUpperCase()}).\n\n[Write your quotation/updates details here]\n\nRegards,\nAira3D Team\nwww.aira3d.com`;
    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const statuses = [
    'New',
    'Under Review',
    'Quotation Sent',
    'Waiting For Customer',
    'Approved',
    'In Production',
    'Completed',
    'Cancelled'
  ];

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5";
    const s = status || 'New';
    
    switch (s) {
      case 'Completed':
        return <span className={`${baseClasses} bg-green-50 text-green-700 border-green-200`}><CheckCircleIcon className="w-3.5 h-3.5" /> {s}</span>;
      case 'In Production':
      case 'Processing':
      case 'Approved':
        return <span className={`${baseClasses} bg-indigo-50 text-indigo-700 border-indigo-200`}><ClockIcon className="w-3.5 h-3.5 animate-spin" /> {s}</span>;
      case 'Under Review':
      case 'Quotation Sent':
      case 'Waiting For Customer':
        return <span className={`${baseClasses} bg-blue-50 text-blue-700 border-blue-200`}><ClockIcon className="w-3.5 h-3.5" /> {s}</span>;
      case 'New':
        return <span className={`${baseClasses} bg-yellow-50 text-yellow-700 border-yellow-200 animate-pulse`}><ClockIcon className="w-3.5 h-3.5" /> {s}</span>;
      case 'Cancelled':
        return <span className={`${baseClasses} bg-red-50 text-red-700 border-red-200`}><XMarkIcon className="w-3.5 h-3.5" /> {s}</span>;
      default:
        return <span className={`${baseClasses} bg-gray-50 text-gray-700 border-gray-200`}>{s}</span>;
    }
  };

  // Filter and sort computation
  const filteredOrders = orders
    .filter(order => {
      const searchStr = `${order.fullName || ''} ${order.email || ''} ${order.mobileNumber || ''} ${order.productType || ''} ${order.id || ''}`.toLowerCase();
      const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const timeA = getTimestampMs(a.createdAt);
      const timeB = getTimestampMs(b.createdAt);
      return sortOrder === 'Newest' ? timeB - timeA : timeA - timeB;
    });

  return (
    <div className="space-y-8 pb-10">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Custom Fabrication Orders</h1>
          <p className="text-gray-500 mt-1">Manage unique fabrication requests, quotations, and custom 3D printing orders.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchCustomOrders} 
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:text-orange-600 transition-colors shadow-sm text-sm font-medium"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Refresh
          </button>
          <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold">{filteredOrders.length} orders listed</span>
        </div>
      </div>

      {/* Filter and Search Box */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="w-full lg:w-96">
          <Input 
            icon={MagnifyingGlassIcon}
            placeholder="Search customer, phone, material, product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-3 w-full lg:w-auto items-center justify-end">
          {/* Status Selection Panel */}
          <div className="overflow-x-auto max-w-full p-1 bg-gray-100/80 rounded-xl flex gap-1 scrollbar-none">
            {['All', 'New', 'Under Review', 'Quotation Sent', 'Waiting For Customer', 'Approved', 'In Production', 'Completed', 'Cancelled'].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                  statusFilter === f 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <select 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-white outline-none focus:border-orange-500 text-gray-700"
          >
            <option value="Newest">Newest First</option>
            <option value="Oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-16 text-center">
          <WrenchScrewdriverIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">No custom orders found.</p>
          <p className="text-gray-400 mt-1">Adjust your filters or query params.</p>
        </div>
      ) : (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-gray-50/80 sticky top-0 z-10 border-b border-gray-100 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Customer Details</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Job Specifications</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Status</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Submission Date</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.map((order, index) => {
                const dateVal = order.createdAt;
                const dateMs = getTimestampMs(dateVal);
                
                // Formulate preview display
                const specs = [];
                if (order.material) specs.push(order.material);
                if (order.dimensions) specs.push(order.dimensions);
                if (order.color) specs.push(order.color);
                
                return (
                  <tr key={order.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-gray-900">{order.fullName || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{order.email || ''}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">CUSTOM-{order.id.slice(0, 8).toUpperCase()}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="px-2.5 py-0.5 text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100 rounded-md">
                          {order.productType || 'N/A'}
                        </span>
                        <p className="text-xs text-gray-500 mt-1 max-w-[200px] truncate">{order.description || 'No description provided'}</p>
                        {specs.length > 0 && (
                          <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-wide">{specs.join(' • ')}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-semibold font-mono text-xs">
                      {dateMs ? new Date(dateMs).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Action */}
                        <button 
                          onClick={() => { setSelectedOrder(order); setAdminNote(order.internalNotes || ''); }} 
                          className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="View Order File Specifications"
                        >
                           <EyeIcon className="w-5 h-5" />
                        </button>
                        
                        {/* Edit status */}
                        <button 
                          onClick={() => { setEditingOrder(order); setNewStatus(order.status || 'New'); }} 
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Change Workflow State"
                        >
                           <PencilSquareIcon className="w-5 h-5" />
                        </button>

                        {/* WhatsApp redirect */}
                        {order.mobileNumber && (
                          <a 
                            href={getWhatsAppLink(order.fullName, order.id, order.mobileNumber)} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Prefilled WhatsApp Update"
                          >
                            <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" />
                          </a>
                        )}

                        {/* Email Reply */}
                        {order.email && (
                          <a 
                            href={getEmailLink(order.fullName, order.email, order.id, order.productType)} 
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Quotation Email Template"
                          >
                            <EnvelopeIcon className="w-5 h-5" />
                          </a>
                        )}

                        {/* Delete Order */}
                        <button 
                          onClick={() => setDeleteConfirm(order.id)} 
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Custom order"
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

      {/* View Details Side Drawer */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-end"
            onClick={() => setSelectedOrder(null)}
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
                  <h2 className="text-xl font-display font-bold text-gray-900">Custom Order Details</h2>
                  <p className="text-xs text-gray-500 font-mono mt-1">Ref: CUSTOM-{selectedOrder.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                {/* Status Header */}
                <div className="flex items-center gap-3">
                  {getStatusBadge(selectedOrder.status)}
                  <span className="text-xs font-semibold text-gray-400 font-mono">
                    Created on {selectedOrder.createdAt ? new Date(getTimestampMs(selectedOrder.createdAt)).toLocaleString() : 'N/A'}
                  </span>
                </div>

                {/* Customer Section */}
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-3.5 text-sm">
                  <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Customer Information</h3>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Full Name:</span>
                    <span className="font-semibold text-gray-900">{selectedOrder.fullName || 'N/A'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Email Address:</span>
                    <div className="flex items-center gap-1">
                      <a href={`mailto:${selectedOrder.email}`} className="font-bold text-blue-600 hover:underline">{selectedOrder.email || 'N/A'}</a>
                      <button onClick={() => copyToClipboard(selectedOrder.email, 'email')} className="text-gray-400 hover:text-gray-700">
                        {copiedText === 'email' ? <ClipboardDocumentCheckIcon className="w-4 h-4 text-green-500" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Mobile Number:</span>
                    <div className="flex items-center gap-1">
                      <a href={`tel:${selectedOrder.mobileNumber}`} className="font-bold text-gray-900 hover:underline">{selectedOrder.mobileNumber || 'N/A'}</a>
                      <button onClick={() => copyToClipboard(selectedOrder.mobileNumber, 'phone')} className="text-gray-400 hover:text-gray-700">
                        {copiedText === 'phone' ? <ClipboardDocumentCheckIcon className="w-4 h-4 text-green-500" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-gray-500 block mb-1">Delivery Address:</span>
                    <span className="font-medium text-gray-900 leading-relaxed block bg-white p-3 rounded-lg border border-gray-100">
                      {[selectedOrder.address, selectedOrder.city, selectedOrder.state, selectedOrder.pinCode].filter(Boolean).join(', ') || 'Address not provided'}
                    </span>
                  </div>
                </div>

                {/* Job Specifications */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4 text-sm">
                  <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Project Specifications</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-400 text-xs uppercase font-bold block mb-0.5">Product Type</span>
                      <span className="font-semibold text-gray-900">{selectedOrder.productType || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs uppercase font-bold block mb-0.5">Quantity Required</span>
                      <span className="font-semibold text-gray-900">{selectedOrder.quantity || 1} units</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs uppercase font-bold block mb-0.5">Request ID</span>
                      <span className="font-semibold text-gray-900 font-mono text-xs">{selectedOrder.orderId || selectedOrder.id}</span>
                    </div>
                    {(selectedOrder.budget || selectedOrder.estimatedBudget) && (
                      <div>
                        <span className="text-gray-400 text-xs uppercase font-bold block mb-0.5">Estimated Budget</span>
                        <span className="font-semibold text-gray-900">{selectedOrder.budget || selectedOrder.estimatedBudget}</span>
                      </div>
                    )}
                    {selectedOrder.material && (
                      <div>
                        <span className="text-gray-400 text-xs uppercase font-bold block mb-0.5">Material</span>
                        <span className="font-semibold text-gray-900">{selectedOrder.material}</span>
                      </div>
                    )}
                    {selectedOrder.color && (
                      <div>
                        <span className="text-gray-400 text-xs uppercase font-bold block mb-0.5">Color Preference</span>
                        <span className="font-semibold text-gray-900 capitalize">{selectedOrder.color}</span>
                      </div>
                    )}
                    {selectedOrder.dimensions && (
                      <div>
                        <span className="text-gray-400 text-xs uppercase font-bold block mb-0.5">Dimensions</span>
                        <span className="font-semibold text-gray-900">{selectedOrder.dimensions}</span>
                      </div>
                    )}
                    {selectedOrder.deadline && (
                      <div>
                        <span className="text-gray-400 text-xs uppercase font-bold block mb-0.5">Estimated Deadline</span>
                        <span className="font-semibold text-gray-900">{selectedOrder.deadline}</span>
                      </div>
                    )}
                  </div>

                  {selectedOrder.description && (
                    <div className="pt-2 border-t border-gray-100">
                      <span className="text-gray-400 text-xs uppercase font-bold block mb-1">Detailed Description</span>
                      <p className="bg-gray-50 p-4 rounded-xl text-gray-700 leading-relaxed font-medium border border-gray-100">{selectedOrder.description}</p>
                    </div>
                  )}

                  {selectedOrder.additionalMessage && (
                    <div className="pt-2 border-t border-gray-100">
                      <span className="text-gray-400 text-xs uppercase font-bold block mb-1">Special Notes / Message</span>
                      <p className="bg-gray-50 p-4 rounded-xl text-gray-700 leading-relaxed font-medium border border-gray-100">{selectedOrder.additionalMessage}</p>
                    </div>
                  )}

                  {selectedOrder.namePlateText && (
                    <div className="bg-orange-50/50 p-4 border border-orange-100 rounded-xl">
                      <span className="text-orange-800 text-xs uppercase font-bold block mb-0.5">Nameplate Text Content</span>
                      <span className="text-xl font-bold text-orange-950 font-display">{selectedOrder.namePlateText}</span>
                    </div>
                  )}

                  {selectedOrder.licensePlateNumber && (
                    <div className="bg-blue-50/50 p-4 border border-blue-100 rounded-xl">
                      <span className="text-blue-800 text-xs uppercase font-bold block mb-0.5">Vehicle License Number</span>
                      <span className="text-2xl font-bold text-blue-950 font-mono tracking-wider">{selectedOrder.licensePlateNumber}</span>
                    </div>
                  )}
                </div>

                {/* Uploaded File Assets */}
                {(selectedOrder.stlFileLink || selectedOrder.referenceImageLink || selectedOrder.photoFrameDriveLink) && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3.5 text-sm">
                    <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Uploaded CAD / Files</h3>
                    
                    <div className="flex flex-col gap-2">
                      {selectedOrder.stlFileLink && (
                        <a 
                          href={selectedOrder.stlFileLink} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center gap-2 p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-100 font-bold transition-all"
                        >
                          <DocumentArrowDownIcon className="w-5 h-5" /> Download STL 3D Model File
                        </a>
                      )}
                      
                      {selectedOrder.referenceImageLink && (
                        <a 
                          href={selectedOrder.referenceImageLink} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center gap-2 p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl border border-purple-100 font-bold transition-all"
                        >
                          <EyeIcon className="w-5 h-5" /> View Reference Image Link
                        </a>
                      )}

                      {selectedOrder.photoFrameDriveLink && (
                        <a 
                          href={selectedOrder.photoFrameDriveLink} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center gap-2 p-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-100 font-bold transition-all"
                        >
                          <EyeIcon className="w-5 h-5" /> Open Google Drive Photo Link
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Internal Admin Notes */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
                  <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Staff Internal Notes</h3>
                  <textarea
                    rows="3"
                    className="w-full text-sm p-3 rounded-xl border border-gray-200 bg-gray-50/50 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    placeholder="Staff private notations..."
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveInternalNote}
                      disabled={savingNote}
                      className="px-4 py-2 text-xs font-bold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50"
                    >
                      {savingNote ? 'Saving...' : 'Save Internal Note'}
                    </button>
                  </div>
                </div>

                {/* Status History Timeline */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Status History Log</h3>
                  
                  {selectedOrder.statusHistory?.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No status history updates recorded yet.</p>
                  ) : (
                    <div className="relative border-l-2 border-gray-100 pl-4 ml-1 space-y-4 text-xs">
                      {selectedOrder.statusHistory?.map((h, i) => (
                        <div key={i} className="relative">
                          {/* Timeline dot */}
                          <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-orange-500 ring-4 ring-white" />
                          <div className="flex justify-between">
                            <span className="font-bold text-gray-800">{h.status}</span>
                            <span className="text-gray-400 font-mono">
                              {h.timestamp ? new Date(h.timestamp).toLocaleString() : ''}
                            </span>
                          </div>
                          <p className="text-gray-500 mt-0.5">{h.note}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Shortcuts */}
                <div className="grid grid-cols-2 gap-3.5 pt-2">
                  <a 
                    href={getWhatsAppLink(selectedOrder.fullName, selectedOrder.id, selectedOrder.mobileNumber)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition-all text-sm"
                  >
                    <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" /> WhatsApp Team
                  </a>
                  
                  <a 
                    href={getEmailLink(selectedOrder.fullName, selectedOrder.email, selectedOrder.id, selectedOrder.productType)} 
                    className="flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all text-sm"
                  >
                    <EnvelopeIcon className="w-5 h-5" /> Send Quotation
                  </a>
                </div>
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
              <h2 className="text-xl font-display font-bold text-gray-900 mb-2">Change State</h2>
              <p className="text-xs text-gray-500 mb-6 font-mono">Order ID: CUSTOM-{editingOrder.id.slice(0, 8).toUpperCase()}</p>
              
              <div className="space-y-4">
                <div className="relative">
                  <select 
                    value={newStatus} 
                    onChange={(e) => setNewStatus(e.target.value)} 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none font-medium"
                  >
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setEditingOrder(null)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors">Cancel</button>
                  <button onClick={handleStatusUpdate} className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium shadow-sm transition-colors">Update State</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                 <TrashIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-display font-bold text-gray-900 mb-2">Delete Custom Request?</h3>
              <p className="text-sm text-gray-500 mb-8">Are you sure you want to permanently delete this custom request? This action cannot be undone.</p>
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
