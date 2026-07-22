import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, db } from '../../firebase/index.js';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES } from '../../utils/constants.js';

export default function AdminGallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [form, setForm] = useState({
    title: '',
    category: CATEGORIES[0],
    description: '',
    imageUrl: '',
    beforeImageUrl: '',
  });

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'gallery'));
      setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Error fetching gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'gallery'), {
        ...form,
        createdAt: new Date().toISOString(),
      });
      setShowModal(false);
      setForm({ title: '', category: CATEGORIES[0], description: '', imageUrl: '', beforeImageUrl: '' });
      fetchGallery();
    } catch (error) {
      console.error('Error adding gallery item:', error);
    }
  };

  const handleDelete = async (itemId) => {
    try {
      await deleteDoc(doc(db, 'gallery', itemId));
      setItems(prev => prev.filter(i => i.id !== itemId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting gallery item:', error);
    }
  };

  const filteredItems = categoryFilter === 'All'
    ? items
    : items.filter(item => item.category === categoryFilter);

  const allCategories = [...new Set(items.map(i => i.category).filter(Boolean))];

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-900">Gallery Management</h1>
        <button
          onClick={() => { setShowModal(true); setForm({ title: '', category: CATEGORIES[0], description: '', imageUrl: '', beforeImageUrl: '' }); }}
          className="px-4 py-2 bg-orange-600 text-gray-800 rounded-lg hover:bg-orange-700 text-sm font-medium"
        >
          + Add to Gallery
        </button>
      </div>

      {allCategories.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setCategoryFilter('All')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${
              categoryFilter === 'All' ? 'bg-orange-600 text-gray-800' : 'bg-gray-100 dark:bg-gray-50 text-gray-700 dark:text-gray-900 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >All</button>
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                categoryFilter === cat ? 'bg-orange-600 text-gray-800' : 'bg-gray-100 dark:bg-gray-50 text-gray-700 dark:text-gray-900 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >{cat}</button>
          ))}
        </div>
      )}

      {filteredItems.length === 0 ? (
        <p className="p-8 text-center text-gray-400">No gallery items found</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-50 rounded-xl shadow-sm overflow-hidden group relative"
            >
              <div className="relative aspect-square">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title || item.category}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=No+Image'; }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-100 flex items-center justify-center text-gray-400">🖼️</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <p className="text-gray-800 font-semibold text-sm">{item.title || item.category}</p>
                  {item.description && <p className="text-gray-200 text-xs mt-1 line-clamp-2">{item.description}</p>}
                </div>
                <button
                  onClick={() => setDeleteConfirm(item.id)}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-gray-800 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >✕</button>
              </div>
              <div className="p-3">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-900">{item.title || 'Untitled'}</p>
                <p className="text-xs text-gray-400 dark:text-gray-800">{item.category}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white dark:bg-gray-50 rounded-xl shadow-2xl p-6 w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-900">Add to Gallery</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-900 text-2xl">✕</button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-900 mb-1">Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-300 bg-white dark:bg-gray-50 text-gray-900 dark:text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-900 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-300 bg-white dark:bg-gray-50 text-gray-900 dark:text-gray-900"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-900 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-300 bg-white dark:bg-gray-50 text-gray-900 dark:text-gray-900 h-20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-900 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={form.imageUrl}
                    onChange={(e) => setForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-300 bg-white dark:bg-gray-50 text-gray-900 dark:text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-900 mb-1">Before Image URL (Optional)</label>
                  <input
                    type="url"
                    value={form.beforeImageUrl}
                    onChange={(e) => setForm(prev => ({ ...prev, beforeImageUrl: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-300 bg-white dark:bg-gray-50 text-gray-900 dark:text-gray-900"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-300 text-gray-800 font-semibold rounded-lg hover:opacity-90"
                >Add to Gallery</button>
              </form>
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
            className="fixed inset-0 bg-white/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white dark:bg-gray-50 rounded-xl shadow-2xl p-6 w-full max-w-sm"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-900 mb-2">Confirm Delete</h3>
              <p className="text-sm text-gray-600 dark:text-gray-800 mb-6">Are you sure?</p>
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









