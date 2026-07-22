import { useState, useEffect } from 'react';
import { collection, getDocs, query, deleteDoc, doc, db } from '../../firebase/index.js';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

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
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-900">Contact Messages</h1>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-500">{error}</span>}
          <button onClick={fetchMessages} className="text-sm text-orange-600 hover:text-orange-700 font-medium">Refresh</button>
          <span className="text-sm text-gray-400">{messages.length} total</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error} <button onClick={fetchMessages} className="underline font-medium">Try again</button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-50 rounded-xl shadow-sm overflow-hidden">
        {messages.length === 0 ? (
          <p className="p-6 text-center text-gray-400">No messages found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-800 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-800 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-800 uppercase">Message</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-800 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-800 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {messages.map((msg, index) => {
                  const dateVal = msg.date || msg.createdAt;
                  const dateMs = getTimestampMs(dateVal);
                  return (
                    <motion.tr
                      key={msg.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-900">{msg.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-900">{msg.email || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-900 max-w-[300px] truncate" title={msg.message || ''}>
                        {msg.message || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 dark:text-gray-800">
                        {dateMs ? new Date(dateMs).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setDeleteConfirm(msg.id)}
                          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >Delete</button>
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
            className="fixed inset-0 bg-white/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white dark:bg-gray-50 rounded-xl shadow-2xl p-6 w-full max-w-sm"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-900 mb-2">Confirm Delete</h3>
              <p className="text-sm text-gray-600 dark:text-gray-800 mb-6">Are you sure you want to delete this message?</p>
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









