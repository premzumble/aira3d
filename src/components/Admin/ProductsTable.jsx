import { formatPrice } from '../../utils/formatHelpers.js';

export default function ProductsTable({ products, onEdit, onDelete }) {
  if (products.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-50 rounded-xl shadow-sm overflow-hidden">
        <p className="p-6 text-center text-gray-400">No products found</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-50 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-800 uppercase">Image</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-800 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-800 uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-800 uppercase">Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-800 uppercase">Stock</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-800 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-100 flex items-center justify-center text-gray-400">📦</div>
                  )}
                </td>
                <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-900">{product.name}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-900">{product.category}</td>
                <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-900">{formatPrice(product.price || 0)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(product)}
                      className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                    >Edit</button>
                    <button
                      onClick={() => onDelete(product.id)}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
