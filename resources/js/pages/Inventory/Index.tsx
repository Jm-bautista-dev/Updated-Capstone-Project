import { Head, usePage } from '@inertiajs/react';
import { router } from '@inertiajs/core';
import AppLayout from '@/layouts/app-layout';
import { useState } from 'react';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import { FiEdit2, FiTrash2, FiPackage, FiAlertCircle, FiShoppingCart } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'inventory', href: dashboard().url },
];

type Product = {
  id: number;
  name: string;
  price: number | string | null;
  stock: number | null;
};

export default function InventoryIndex() {
  const props = usePage().props as any;
  const inventory: Product[] = props.inventory || [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editProductData, setEditProductData] = useState<Product | null>(null);
  const [deleteProductData, setDeleteProductData] = useState<Product | null>(null);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [initialStock, setInitialStock] = useState('');

  // --- Calculations for top cards ---
  const totalProducts = inventory.length;
  const lowStock = inventory.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 5).length;
  const outOfStock = inventory.filter(p => (p.stock || 0) === 0).length;

  // --- Open Add / Edit Modal ---
  const openAddModal = () => {
    setName('');
    setPrice('');
    setInitialStock('');
    setEditProductData(null);
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditProductData(product);
    setName(product.name);
    setPrice(String(product.price || 0));
    setInitialStock(String(product.stock || 0));
    setModalOpen(true);
  };

  // --- Save Product (Add or Edit) ---
  const saveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editProductData) {
      router.put(`/inventory/${editProductData.id}`, {
        name,
        price: parseFloat(price) || 0,
        stock: parseInt(initialStock) || 0,
      });
    } else {
      router.post('/inventory', {
        name,
        price: parseFloat(price) || 0,
        initial_stock: parseInt(initialStock) || 0,
      });
    }
    setModalOpen(false);
  };

  // --- Open Delete Modal ---
  const openDeleteModal = (product: Product) => {
    setDeleteProductData(product);
  };

  const confirmDelete = () => {
    if (deleteProductData) {
      router.delete(`/inventory/${deleteProductData.id}`);
      setDeleteProductData(null);
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Inventory" />

      {/* --- Summary Cards --- */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {[
          { title: 'Total Products', value: totalProducts, icon: <FiShoppingCart size={24} /> },
          { title: 'Low Stock', value: lowStock, icon: <FiAlertCircle size={24} /> },
          { title: 'Out of Stock', value: outOfStock, icon: <FiPackage size={24} /> },
        ].map((card, idx) => (
          <motion.div
            key={idx}
            whileHover={{ scale: 1.05, boxShadow: '0 8px 20px rgba(0,0,0,0.12)' }}
            className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-gray-800 cursor-pointer transition-all"
          >
            <div>
              <p className="text-gray-500 dark:text-gray-400">{card.title}</p>
              <p className="text-2xl font-bold">{card.value}</p>
            </div>
            <div className="text-blue-500">{card.icon}</div>
          </motion.div>
        ))}
      </div>

      {/* --- Add Product Button --- */}
        <div className="mb-6">
        <button
            onClick={openAddModal}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-all text-sm inline-flex items-center gap-1"
        >
            Add Product
        </button>
        </div>


      {/* --- Inventory Grid --- */}
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        {inventory.length === 0 ? (
          <p className="col-span-3 text-center text-gray-500 dark:text-gray-400">
            No products found.
          </p>
        ) : (
          inventory.map((product) => {
            const priceNumber = Number(product.price) || 0;
            const stockNumber = Number(product.stock) || 0;
            return (
              <motion.div
                key={product.id}
                whileHover={{ scale: 1.02, boxShadow: '0 8px 20px rgba(0,0,0,0.12)' }}
                className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col justify-between bg-white dark:bg-gray-800"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{product.name}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(product)}
                      className="text-blue-500 hover:text-blue-700 text-lg"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      onClick={() => openDeleteModal(product)}
                      className="text-red-500 hover:text-red-700 text-lg"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                  Price: ₱{priceNumber.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Stock: {stockNumber}
                </p>
                {stockNumber <= 5 && stockNumber > 0 && (
                  <p className="mt-2 text-red-500 font-semibold text-sm">Low stock!</p>
                )}
                {stockNumber === 0 && (
                  <p className="mt-2 text-red-600 font-semibold text-sm">Out of stock!</p>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* --- Add / Edit Product Modal --- */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          >
            <motion.div
              className="bg-white dark:bg-gray-800 p-6 rounded-xl w-96 shadow-lg relative"
              initial={{ y: -50, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -50, opacity: 0, scale: 0.8 }}
            >
              <h2 className="text-lg font-bold mb-4">{editProductData ? 'Edit Product' : 'Add Product'}</h2>
              <form className="flex flex-col gap-3" onSubmit={saveProduct}>
                <input
                  type="text"
                  placeholder="Product Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border p-2 rounded-md"
                  required
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="border p-2 rounded-md"
                  required
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={initialStock}
                  onChange={(e) => setInitialStock(e.target.value)}
                  className="border p-2 rounded-md"
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-3 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition"
                  >
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Delete Confirmation Modal --- */}
      <AnimatePresence>
        {deleteProductData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          >
            <motion.div
              className="bg-white dark:bg-gray-800 p-6 rounded-xl w-80 shadow-lg"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <h2 className="text-lg font-bold mb-4">Delete Product</h2>
              <p className="mb-4">
                Are you sure you want to delete <strong>{deleteProductData.name}</strong>?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteProductData(null)}
                  className="px-3 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  Back
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-3 py-1 rounded-md bg-red-500 text-white hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
