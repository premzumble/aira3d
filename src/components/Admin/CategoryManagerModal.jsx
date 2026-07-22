import { useState } from 'react';
import { motion } from 'framer-motion';

export default function CategoryManagerModal({ categories, onClose, onAdd, onDelete }) {
  const [newCategory, setNewCategory] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (newCategory.trim()) {
      onAdd(newCategory.trim());
      setNewCategory('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="bg-white dark:bg-gray-50 rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-900">Manage Categories</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 text-2xl">✕</button>
        </div>
        <form onSubmit={handleAdd} className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="New category name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
          <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm">Add</button>
        </form>
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
          {categories.map((cat) => (
            <div key={cat} className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
              <span className="text-sm text-gray-900">{cat}</span>
              <button
                onClick={() => onDelete(cat)}
                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
