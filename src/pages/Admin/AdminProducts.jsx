import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { AnimatePresence, motion } from 'framer-motion';
import ProductsTable from '../../components/Admin/ProductsTable';
import ProductFormModal from '../../components/Admin/ProductFormModal';
import CategoryManagerModal from '../../components/Admin/CategoryManagerModal';
import { PlusIcon, TagIcon, TrashIcon } from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';

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
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Products Management</h1>
          <p className="text-gray-500 mt-1">Manage your catalog, add new products, and organize categories.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="secondary"
            onClick={() => setShowCatModal(true)}
          >
            <TagIcon className="w-4 h-4 mr-2" />
            Categories
          </Button>
          <Button
            onClick={openAddModal}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Product
          </Button>
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
              <h3 className="text-xl font-display font-bold text-gray-900 mb-2">Delete Product?</h3>
              <p className="text-sm text-gray-500 mb-8">This action cannot be undone. This will permanently remove the product from the database.</p>
              
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="flex-1 justify-center">
                  Cancel
                </Button>
                <Button onClick={() => handleDeleteProduct(deleteConfirm)} className="flex-1 justify-center bg-red-600 hover:bg-red-700 text-white shadow-red-500/20">
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
