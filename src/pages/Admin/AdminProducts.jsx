import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, db, query, orderBy, where } from '../../firebase/index.js';
import { AnimatePresence, motion } from 'framer-motion';
import ProductsTable from '../../components/Admin/ProductsTable';
import ProductFormModal from '../../components/Admin/ProductFormModal';
import CategoryManagerModal from '../../components/Admin/CategoryManagerModal';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([
    'Name Plates', 'License Plates', 'Photo Frames', 'Ganesh Models',
    'Krishna Models', 'Chiranjiva Models', 'Home Decor', 'Kitchen Products',
    'Phone Stands', 'Robotic Chess', 'Electronics', 'Statues',
    'Office Decor', 'Gifts', 'Customized Products'
  ]);
  const [loading, setLoading] = useState(true);
  
  const [showFormModal, setShowFormModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchCategories = async () => {
    try {
      const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      const cats = snapshot.docs.map(d => d.data().name);
      if (cats.length > 0) setCategories(cats);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNextProductId = async () => {
    const snapshot = await getDocs(collection(db, 'products'));
    const ids = snapshot.docs
      .map(d => d.data().productId)
      .filter(Boolean)
      .map(pid => parseInt(pid.replace('PROD-', ''), 10))
      .filter(n => !isNaN(n));
    const maxNum = ids.length ? Math.max(...ids) : 0;
    return `PROD-${String(maxNum + 1).padStart(3, '0')}`;
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const handleAddCategory = async (catName) => {
    if (categories.includes(catName)) return;
    try {
      await addDoc(collection(db, 'categories'), { name: catName, createdAt: serverTimestamp() });
      setCategories(prev => [...prev, catName].sort());
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleDeleteCategory = async (catName) => {
    if (!confirm(`Delete category "${catName}"? Products in this category will keep their category value.`)) return;
    try {
      const q = query(collection(db, 'categories'), where('name', '==', catName));
      const snapshot = await getDocs(q);
      const promises = snapshot.docs.map(d => deleteDoc(doc(db, 'categories', d.id)));
      await Promise.all(promises);
      setCategories(prev => prev.filter(c => c !== catName));
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleSaveProduct = async (productData) => {
    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
      } else {
        const productId = await getNextProductId();
        await addDoc(collection(db, 'products'), { ...productData, productId, createdAt: serverTimestamp() });
      }
      setShowFormModal(false);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await deleteDoc(doc(db, 'products', productId));
      setProducts(prev => prev.filter(p => p.id !== productId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setShowFormModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setShowFormModal(true);
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-900">Products Management</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCatModal(true)}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
          >
            🏷️ Manage Categories
          </button>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium shadow-sm shadow-orange-500/20"
          >
            + Add Product
          </button>
        </div>
      </div>

      <ProductsTable
        products={products}
        onEdit={openEditModal}
        onDelete={setDeleteConfirm}
      />

      <AnimatePresence>
        {showFormModal && (
          <ProductFormModal
            product={editingProduct}
            categories={categories}
            onClose={() => setShowFormModal(false)}
            onSubmit={handleSaveProduct}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCatModal && (
          <CategoryManagerModal
            categories={categories}
            onClose={() => setShowCatModal(false)}
            onAdd={handleAddCategory}
            onDelete={handleDeleteCategory}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white dark:bg-gray-50 rounded-xl shadow-2xl p-6 w-full max-w-sm"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-900 mb-2">Confirm Delete</h3>
              <p className="text-sm text-gray-600 dark:text-gray-800 mb-6">Are you sure you want to delete this product? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDeleteProduct(deleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >Delete</button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300"
                >Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
