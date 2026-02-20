import { Head, usePage } from '@inertiajs/react';
import { router } from '@inertiajs/core';
import { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

type Category = {
  id: number;
  name: string;
  description: string;
  product_count: number;
};

export default function CategoriesIndex() {
  const props = usePage().props as any;
  const categories: Category[] = props.categories || [];
  const allCategories: Category[] = props.allCategories || [];
  const selectedCategoryProp: number | null = props.selectedCategory ?? null;

  const [modalOpen, setModalOpen] = useState(false);
  const [editCategoryData, setEditCategoryData] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [filterCategory, setFilterCategory] = useState<number | null>(selectedCategoryProp);

  // Keep filterCategory in sync if backend updates selectedCategory
  useEffect(() => {
    setFilterCategory(selectedCategoryProp);
  }, [selectedCategoryProp]);

  // Open Add / Edit Modal
  const openAddModal = () => {
    setName('');
    setDescription('');
    setEditCategoryData(null);
    setModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditCategoryData(category);
    setName(category.name);
    setDescription(category.description);
    setModalOpen(true);
  };

  // Save Category
  const saveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (editCategoryData) {
      router.put(`/categories/${editCategoryData.id}`, { name, description });
    } else {
      router.post('/categories', { name, description });
    }
    setModalOpen(false);
  };

  // Delete Category
  const confirmDelete = (category: Category) => {
    if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
      router.delete(`/categories/${category.id}`);
    }
  };

  // Handle filter change
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilterCategory(value ? Number(value) : null); // update state
    router.get('/categories', { filter_category: value || null }, { preserveState: true });
  };

  return (
    <AppLayout breadcrumbs={[{ title: 'Categories', href: '/categories' }]}>
      <Head title="Categories" />

      {/* --- Overview Card --- */}
      <div className="mb-6">
        <motion.div className="flex justify-between items-center p-4 border rounded-lg bg-white dark:bg-gray-800">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Total Categories</p>
            <p className="text-2xl font-bold">{categories.length}</p>
          </div>
        </motion.div>
      </div>

      {/* --- Controls --- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <select
          value={filterCategory || ''}
          onChange={handleFilterChange}
          className="border p-2 rounded-md"
        >
          <option value="">All Categories</option>
          {allCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-all"
        >
          <FiPlus /> Add Category
        </button>
      </div>

      {/* --- Categories List (Vertical) --- */}
      <div className="flex flex-col gap-3">
        {categories.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No categories found.</p>
        ) : (
          categories.map((category) => (
            <motion.div
              key={category.id}
              whileHover={{ scale: 1.02, boxShadow: '0 8px 20px rgba(0,0,0,0.12)' }}
              className="flex justify-between items-center p-4 border rounded-lg bg-white dark:bg-gray-800"
            >
              <div>
                <p className="font-bold text-lg">{category.name}</p>
                <p className="text-gray-500">{category.description || '-'}</p>
                <p className="text-sm text-gray-400">Products: {category.product_count}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEditModal(category)} className="text-blue-500 hover:text-blue-700">
                  <FiEdit2 />
                </button>
                <button onClick={() => confirmDelete(category)} className="text-red-500 hover:text-red-700">
                  <FiTrash2 />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* --- Add / Edit Modal --- */}
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
              <h2 className="text-lg font-bold mb-4">
                {editCategoryData ? 'Edit Category' : 'Add Category'}
              </h2>
              <form className="flex flex-col gap-3" onSubmit={saveCategory}>
                <input
                  type="text"
                  placeholder="Category Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border p-2 rounded-md"
                  required
                />
                <textarea
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
    </AppLayout>
  );
}
