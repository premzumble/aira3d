import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES } from '../../utils/constants.js';
import { 
  PhotoIcon, 
  PlusIcon, 
  TrashIcon, 
  XMarkIcon,
  FunnelIcon,
  DocumentPlusIcon
} from '@heroicons/react/24/outline';

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
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Gallery Management</h1>
          <p className="text-gray-500 mt-1">Manage showcase portfolio and product images.</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setForm({ title: '', category: CATEGORIES[0], description: '', imageUrl: '', beforeImageUrl: '' }); }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all shadow-sm font-semibold text-sm group"
        >
          <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          Add to Gallery
        </button>
      </div>

      {allCategories.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 pr-4 border-r border-gray-100 text-gray-400">
             <FunnelIcon className="w-5 h-5" />
             <span className="text-sm font-medium">Filter:</span>
          </div>
          <button
            onClick={() => setCategoryFilter('All')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              categoryFilter === 'All' 
                ? 'bg-orange-100 text-orange-700' 
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
            }`}
          >All</button>
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                categoryFilter === cat 
                  ? 'bg-orange-100 text-orange-700' 
                  : 'bg-transparent text-gray-600 hover:bg-gray-100'
              }`}
            >{cat}</button>
          ))}
        </div>
      )}

      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
          <PhotoIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">No gallery items found.</p>
          <p className="text-gray-400 mt-1">Click "Add to Gallery" to create your first portfolio piece.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group relative flex flex-col h-full hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title || item.category}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=No+Image'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                     <PhotoIcon className="w-12 h-12" />
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-5">
                  <p className="text-white font-semibold text-lg drop-shadow-md">{item.title || item.category}</p>
                  {item.description && <p className="text-gray-200 text-sm mt-1 line-clamp-2 drop-shadow-md">{item.description}</p>}
                </div>

                <button
                  onClick={() => setDeleteConfirm(item.id)}
                  className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm text-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:scale-110 shadow-sm"
                  title="Delete Item"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 bg-white flex-1 flex flex-col justify-between">
                <div>
                   <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.title || 'Untitled Project'}</p>
                   <span className="inline-block mt-2 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-md">
                     {item.category}
                   </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 sm:p-6"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                      <DocumentPlusIcon className="w-5 h-5" />
                   </div>
                   <h2 className="text-xl font-display font-bold text-gray-900">Add to Gallery</h2>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto scrollbar-thin">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Project Title</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                      placeholder="e.g. Custom Mechanical Keyboard Case"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all appearance-none"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all h-24 resize-none"
                      placeholder="Brief details about the project..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Main Image URL</label>
                    <input
                      type="url"
                      value={form.imageUrl}
                      onChange={(e) => setForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center justify-between">
                       <span>Before Image URL</span>
                       <span className="text-xs text-gray-400 font-normal">Optional</span>
                    </label>
                    <input
                      type="url"
                      value={form.beforeImageUrl}
                      onChange={(e) => setForm(prev => ({ ...prev, beforeImageUrl: e.target.value }))}
                      placeholder="https://example.com/before.jpg"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                 <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    type="button"
                    className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
                  >
                    Save to Gallery
                  </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
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
              <h3 className="text-xl font-display font-bold text-gray-900 mb-2">Delete Item?</h3>
              <p className="text-sm text-gray-500 mb-8">Are you sure you want to remove this item from the gallery?</p>
              
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
