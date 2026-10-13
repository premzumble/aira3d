import { useState, useEffect } from 'react';
import { collection, getDocs, query, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  EnvelopeIcon, 
  EnvelopeOpenIcon,
  ArrowPathIcon, 
  TrashIcon, 
  ExclamationTriangleIcon, 
  ChatBubbleLeftRightIcon,
  EyeIcon,
  ArchiveBoxIcon,
  PhoneIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  FunnelIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import Input from '../../components/ui/Input';

export default function AdminContact() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [error, setError] = useState('');
  
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // All, Read, Unread, Archived
  const [sortOrder, setSortOrder] = useState('Newest'); // Newest, Oldest
  const [copiedText, setCopiedText] = useState('');
  
  // Note edit state
  const [adminNote, setAdminNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const getTimestampMs = (val) => {
    if (!val) return 0;
    if (typeof val.toMillis === 'function') return val.toMillis();
    if (typeof val.toDate === 'function') return val.toDate().getTime();
    if (typeof val === 'number') return val;
    if (val.seconds) return val.seconds * 1000;
    return new Date(val).getTime();
  };

  const fetchMessages = async () => {
    setLoading(true);
    setError('');
    try {
      const q = query(collection(db, 'contactMessages'));
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(d => ({ 
        id: d.id, 
        status: d.data().status || 'unread', // default to 'unread'
        notes: d.data().notes || '',
        ...d.data() 
      }));
      setMessages(docs);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Cannot load contact messages. Check Firestore rules are deployed.');
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleDelete = async (messageId) => {
    try {
      await deleteDoc(doc(db, 'contactMessages', messageId));
      setMessages(prev => prev.filter(m => m.id !== messageId));
      setDeleteConfirm(null);
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const updateMessageStatus = async (messageId, newStatus) => {
    try {
      const msgRef = doc(db, 'contactMessages', messageId);
      await updateDoc(msgRef, { status: newStatus });
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: newStatus } : m));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(prev => ({ ...prev, status: newStatus }));
      }
      toast.success(`Message marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleSaveNote = async () => {
    if (!selectedMessage) return;
    setSavingNote(true);
    try {
      const msgRef = doc(db, 'contactMessages', selectedMessage.id);
      await updateDoc(msgRef, { notes: adminNote });
      setMessages(prev => prev.map(m => m.id === selectedMessage.id ? { ...m, notes: adminNote } : m));
      setSelectedMessage(prev => ({ ...prev, notes: adminNote }));
      toast.success('Notes saved');
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    } finally {
      setSavingNote(false);
    }
  };

  const handleOpenDetails = (msg) => {
    setSelectedMessage(msg);
    setAdminNote(msg.notes || '');
    // Automatically mark as read if it is unread
    if (msg.status === 'unread') {
      updateMessageStatus(msg.id, 'read');
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  // Pre-filled template links
  const getWhatsAppLink = (name, phone) => {
    const cleanPhone = (phone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const text = `Hello ${name || 'Customer'},\n\nThank you for contacting Aira3D.\n\nWe received your inquiry regarding your 3D printing requirement.\nOur team has reviewed your request and we'd be happy to assist you.\n\nPlease let us know if you have any additional details.\n\nRegards,\nAira3D Team`;
    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
  };

  const getEmailLink = (name, email, subject) => {
    const mailSubject = `Inquiry regarding: ${subject || 'Aira3D Services'}`;
    const body = `Hello ${name || 'Customer'},\n\nThank you for reaching out to Aira3D.\n\nWe have received your message regarding "${subject || 'your inquiry'}".\n\n[Write your reply here]\n\nRegards,\nAira3D Team\nwww.aira3d.com`;
    return `mailto:${email}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(body)}`;
  };

  // Filtered and Sorted messages
  const filteredMessages = messages
    .filter(msg => {
      const searchStr = `${msg.name || ''} ${msg.email || ''} ${msg.subject || ''} ${msg.message || ''}`.toLowerCase();
      const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
      
      const matchesFilter = 
        statusFilter === 'All' ? true :
        statusFilter === 'Unread' ? msg.status === 'unread' :
        statusFilter === 'Read' ? msg.status === 'read' :
        statusFilter === 'Archived' ? msg.status === 'archived' : true;
        
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const timeA = getTimestampMs(a.date || a.createdAt);
      const timeB = getTimestampMs(b.date || b.createdAt);
      return sortOrder === 'Newest' ? timeB - timeA : timeA - timeB;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Inquiries & Contacts</h1>
          <p className="text-gray-500 mt-1">Review, reply, and track messages from your website visitors.</p>
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-500 font-medium px-2 py-1 bg-red-50 rounded-md border border-red-100">{error}</span>}
          <button 
            onClick={fetchMessages} 
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:text-orange-600 transition-colors shadow-sm text-sm font-medium"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Refresh
          </button>
          <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold">{filteredMessages.length} visible</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
            <span>{error}</span>
          </div>
          <button onClick={fetchMessages} className="underline font-medium hover:text-red-800">Try again</button>
        </div>
      )}

      {/* Search and Filters Segment */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-80">
          <Input 
            icon={MagnifyingGlassIcon}
            placeholder="Search name, email, message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto items-center justify-end">
          {/* Status Filters */}
          <div className="flex bg-gray-100/80 p-1 rounded-xl">
            {['All', 'Unread', 'Read', 'Archived'].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  statusFilter === f 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
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

      {/* Messages Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredMessages.length === 0 ? (
          <div className="p-16 text-center">
            <BookOpenIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">No contact messages found.</p>
            <p className="text-gray-400 mt-1">Try resetting the status filter or search parameters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-gray-50/80 sticky top-0 z-10 border-b border-gray-100 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Sender</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Subject & Message</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Status</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Date</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredMessages.map((msg, index) => {
                  const dateVal = msg.date || msg.createdAt;
                  const dateMs = getTimestampMs(dateVal);
                  return (
                    <motion.tr
                      key={msg.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className={`hover:bg-gray-50/80 transition-colors group ${
                        msg.status === 'unread' ? 'bg-orange-50/10 font-medium' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                             msg.status === 'unread' 
                               ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                               : 'bg-gray-100 text-gray-600'
                           }`}>
                              {(msg.name || 'U').charAt(0).toUpperCase()}
                           </div>
                           <div>
                              <p className={`text-gray-900 ${msg.status === 'unread' ? 'font-bold' : 'font-semibold'}`}>
                                {msg.name || 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-500">{msg.email || 'N/A'}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="max-w-[320px] truncate">
                           <p className="text-gray-900 font-bold text-sm">{msg.subject || 'No Subject'}</p>
                           <p className="text-xs text-gray-500 truncate mt-0.5">{msg.message || 'N/A'}</p>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                          msg.status === 'unread' 
                            ? 'bg-orange-50 text-orange-700 border-orange-200 animate-pulse'
                            : msg.status === 'read'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}>
                          {msg.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-semibold font-mono text-xs">
                        {dateMs ? new Date(dateMs).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Details */}
                          <button
                            onClick={() => handleOpenDetails(msg)}
                            className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="View In Detail"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          
                          {/* Toggle Read status */}
                          <button
                            onClick={() => updateMessageStatus(msg.id, msg.status === 'unread' ? 'read' : 'unread')}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title={msg.status === 'unread' ? "Mark as Read" : "Mark as Unread"}
                          >
                            {msg.status === 'unread' ? (
                              <EnvelopeOpenIcon className="w-5 h-5" />
                            ) : (
                              <EnvelopeIcon className="w-5 h-5" />
                            )}
                          </button>
                          
                          {/* Archive message */}
                          {msg.status !== 'archived' && (
                            <button
                              onClick={() => updateMessageStatus(msg.id, 'archived')}
                              className="p-2 text-gray-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Archive Inquiry"
                            >
                              <ArchiveBoxIcon className="w-5 h-5" />
                            </button>
                          )}
                          
                          {/* Delete */}
                          <button
                            onClick={() => setDeleteConfirm(msg.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Message"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Side Panel/Modal */}
      <AnimatePresence>
        {selectedMessage && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-end"
            onClick={() => setSelectedMessage(null)}
          >
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-display font-bold text-gray-900">Message Details</h2>
                  <p className="text-xs text-gray-500 font-mono mt-1">Ref: CON-{selectedMessage.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <button 
                  onClick={() => setSelectedMessage(null)} 
                  className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                {/* Status indicator row */}
                <div className="flex gap-2">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full border capitalize ${
                    selectedMessage.status === 'unread' 
                      ? 'bg-orange-50 text-orange-700 border-orange-200' 
                      : 'bg-green-50 text-green-700 border-green-200'
                  }`}>
                    {selectedMessage.status}
                  </span>
                  <span className="px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full border border-gray-200">
                    Host: Firebase Edge
                  </span>
                </div>

                {/* Contact Information Segment */}
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-3.5 text-sm">
                  <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Sender Details</h3>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Name:</span> 
                    <span className="font-semibold text-gray-900">{selectedMessage.name || 'N/A'}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Email:</span> 
                    <div className="flex items-center gap-1.5">
                      <a href={`mailto:${selectedMessage.email}`} className="font-bold text-blue-600 hover:underline">{selectedMessage.email || 'N/A'}</a>
                      <button 
                        onClick={() => copyToClipboard(selectedMessage.email, 'email')}
                        className="text-gray-400 hover:text-gray-700"
                        title="Copy Email"
                      >
                        {copiedText === 'email' ? <ClipboardDocumentCheckIcon className="w-4 h-4 text-green-500" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Phone:</span> 
                    <div className="flex items-center gap-1.5">
                      <a href={`tel:${selectedMessage.phone}`} className="font-bold text-gray-900 hover:underline">{selectedMessage.phone || 'N/A'}</a>
                      {selectedMessage.phone && (
                        <button 
                          onClick={() => copyToClipboard(selectedMessage.phone, 'phone')}
                          className="text-gray-400 hover:text-gray-700"
                          title="Copy Phone"
                        >
                          {copiedText === 'phone' ? <ClipboardDocumentCheckIcon className="w-4 h-4 text-green-500" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Submitted:</span> 
                    <span className="font-semibold text-gray-900">
                      {getTimestampMs(selectedMessage.date || selectedMessage.createdAt) 
                        ? new Date(getTimestampMs(selectedMessage.date || selectedMessage.createdAt)).toLocaleString()
                        : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Message Body */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
                  <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Subject & Message</h3>
                  <div className="border-b border-gray-100 pb-2">
                    <p className="text-sm font-bold text-gray-900">{selectedMessage.subject || 'No Subject'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line font-medium bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
                      {selectedMessage.message || 'No message content.'}
                    </p>
                  </div>
                </div>

                {/* Internal Admin Notes */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
                  <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Internal Admin Notes</h3>
                  <textarea
                    rows="3"
                    className="w-full text-sm p-3 rounded-xl border border-gray-200 bg-gray-50/50 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    placeholder="Add private staff notes here..."
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveNote}
                      disabled={savingNote}
                      className="px-4 py-2 text-xs font-bold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50"
                    >
                      {savingNote ? 'Saving...' : 'Save Notes'}
                    </button>
                  </div>
                </div>

                {/* Dedicated Communication Shortcuts */}
                <div className="grid grid-cols-2 gap-3.5">
                  <a
                    href={getWhatsAppLink(selectedMessage.name, selectedMessage.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-500/10 transition-all text-sm"
                  >
                    <ChatBubbleLeftRightIcon className="w-5 h-5" /> WhatsApp Team
                  </a>
                  <a
                    href={getEmailLink(selectedMessage.name, selectedMessage.email, selectedMessage.subject)}
                    className="flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/10 transition-all text-sm"
                  >
                    <EnvelopeIcon className="w-5 h-5" /> Reply Email
                  </a>
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
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                 <TrashIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-display font-bold text-gray-900 mb-2">Delete Message?</h3>
              <p className="text-sm text-gray-500 mb-8">Are you sure you want to delete this message? This cannot be undone.</p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium shadow-sm transition-colors"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
