import { useState, useEffect } from 'react';
import { collection, getDocs, query, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { EnvelopeIcon, ArrowPathIcon, TrashIcon, ExclamationTriangleIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

export default function AdminContact() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState('');

  const getTimestampMs = (val) => {
    if (!val) return 0;
    if (typeof val.toMillis === 'function') return val.toMillis();
    if (typeof val.toDate === 'function') return val.toDate().getTime();
    if (typeof val === 'number') return val;
    return new Date(val).getTime();
  };

  const fetchMessages = async () => {
    setLoading(true);
    setError('');
    try {
      const q = query(collection(db, 'contactMessages'));
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => getTimestampMs(b.date || b.createdAt) - getTimestampMs(a.date || a.createdAt));
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
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
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
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Contact Messages</h1>
          <p className="text-gray-500 mt-1">Review inquiries and messages from customers.</p>
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
          <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold">{messages.length} total</span>
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

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {messages.length === 0 ? (
          <div className="p-12 text-center">
            <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">No messages found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-gray-50/80 sticky top-0 z-10 border-b border-gray-100 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-500">Sender</th>
                  <th className="px-6 py-4 font-semibold text-gray-500">Message</th>
                  <th className="px-6 py-4 font-semibold text-gray-500">Date</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {messages.map((msg, index) => {
                  const dateVal = msg.date || msg.createdAt;
                  const dateMs = getTimestampMs(dateVal);
                  return (
                    <motion.tr
                      key={msg.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50/80 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center">
                              <EnvelopeIcon className="w-5 h-5" />
                           </div>
                           <div>
                              <p className="font-semibold text-gray-900">{msg.name || 'Unknown'}</p>
                              <a href={`mailto:${msg.email}`} className="text-xs text-blue-600 hover:underline">{msg.email || 'N/A'}</a>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="max-w-[400px] truncate text-gray-600" title={msg.message || ''}>
                           {msg.message || 'N/A'}
                         </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-medium">
                        {dateMs ? new Date(dateMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setDeleteConfirm(msg.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip-trigger"
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
              className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center"
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









