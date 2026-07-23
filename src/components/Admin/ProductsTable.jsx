import { formatPrice } from '../../utils/formatHelpers.js';
import { PencilSquareIcon, TrashIcon, ArchiveBoxXMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import Badge from '../ui/Badge';

export default function ProductsTable({ products, onEdit, onDelete }) {
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
        <ArchiveBoxXMarkIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-900 text-lg font-bold">No products found in catalog.</p>
        <p className="text-gray-500 mt-1">Add some products to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-gray-50/80 sticky top-0 z-10 border-b border-gray-100 backdrop-blur-sm">
            <tr>
              <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Image</th>
              <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Name</th>
              <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Category</th>
              <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Price</th>
              <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Stock</th>
              <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50/80 transition-colors group">
                <td className="px-6 py-4">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-xl object-cover border border-gray-200 shadow-sm" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
                       <PhotoIcon className="w-6 h-6" />
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 font-bold text-gray-900">{product.name}</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 rounded-md">
                    {product.category}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-gray-900">{formatPrice(product.price || 0)}</td>
                <td className="px-6 py-4">
                  {product.stock > 0 ? (
                    <Badge variant="success" className="flex items-center gap-1.5 w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      {product.stock} in stock
                    </Badge>
                  ) : (
                    <Badge variant="danger" className="flex items-center gap-1.5 w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                      Out of Stock
                    </Badge>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(product)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors tooltip-trigger"
                      title="Edit Product"
                    >
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onDelete(product.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip-trigger"
                      title="Delete Product"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
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
