import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function ProductFormModal({ product, categories, onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: '',
    category: categories[0] || '',
    price: '',
    description: '',
    imageUrl: '',
    material: '',
    size: '',
    customizationType: 'none',
    weight: '',
    length: '',
    width: '',
    height: '',
    sku: '',
    stock: ''
  });

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        category: product.category || categories[0] || '',
        price: product.price || '',
        description: product.description || '',
        imageUrl: product.imageUrl || '',
        material: product.material || '',
        size: product.size || '',
        customizationType: product.customizationType || 'none',
        weight: product.weight || '',
        length: product.length || '',
        width: product.width || '',
        height: product.height || '',
        sku: product.sku || '',
        stock: product.stock !== undefined ? product.stock : ''
      });
    }
  }, [product, categories]);

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      price: parseFloat(form.price),
      weight: parseFloat(form.weight) || 0,
      length: parseFloat(form.length) || 0,
      width: parseFloat(form.width) || 0,
      height: parseFloat(form.height) || 0,
      stock: parseInt(form.stock, 10) || 0
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="bg-white dark:bg-gray-50 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 border-b pb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-900">
            {product ? 'Edit Product' : 'Add Product'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 text-2xl">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Information */}
          <div>
            <h3 className="font-semibold text-gray-800 border-b pb-2 mb-4">General Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => handleInputChange('stock', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none h-20"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL <span className="text-gray-400">(Optional)</span></label>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Shipping & Inventory (Shiprocket) */}
          <div>
            <h3 className="font-semibold text-gray-800 border-b pb-2 mb-4">Shipping Details (Required for Shiprocket)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="e.g. NP-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Length (cm) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.length}
                  onChange={(e) => handleInputChange('length', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Width (cm) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.width}
                  onChange={(e) => handleInputChange('width', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Customization Details */}
          <div>
            <h3 className="font-semibold text-gray-800 border-b pb-2 mb-4">Material & Customization</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                <input
                  type="text"
                  value={form.material}
                  onChange={(e) => handleInputChange('material', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                <input
                  type="text"
                  value={form.size}
                  onChange={(e) => handleInputChange('size', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customization Required</label>
                <select
                  value={form.customizationType}
                  onChange={(e) => handleInputChange('customizationType', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option value="none">No Customization</option>
                  <option value="name">Name Printing (Name Plates)</option>
                  <option value="license">License Plate Number</option>
                  <option value="photo">Photo Upload (Photo Frames)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors"
            >
              {product ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
