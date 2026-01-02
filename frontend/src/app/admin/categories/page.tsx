"use client";

import { useState, useEffect } from "react";
import { categoryAPI } from "@/lib/api";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create Category State
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [categoryImage, setCategoryImage] = useState<File | null>(null);

  // Create Subcategory State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [newSubcategoryDesc, setNewSubcategoryDesc] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getCategories();
      setCategories(response.data.categories);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch categories");
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", newCategoryName);
      formData.append("description", newCategoryDesc);
      if (categoryImage) {
        formData.append("image", categoryImage);
      }

      await categoryAPI.createCategory(formData);
      setNewCategoryName("");
      setNewCategoryDesc("");
      setCategoryImage(null);
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create category");
    }
  };

  const handleCreateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryId) return;

    try {
      await categoryAPI.createSubcategory(selectedCategoryId, {
        name: newSubcategoryName,
        description: newSubcategoryDesc,
      });
      setNewSubcategoryName("");
      setNewSubcategoryDesc("");
      fetchCategories(); // Refresh to show new subcategory
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create subcategory");
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Category Management
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-8">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Create Category Form */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Create Category</h2>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-gray-900"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-gray-900"
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setCategoryImage(e.target.files ? e.target.files[0] : null)
                  }
                  className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                Create Category
              </button>
            </form>
          </div>

          {/* Create Subcategory Form */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Create Subcategory</h2>
            <form onSubmit={handleCreateSubcategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Select Parent Category <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-gray-900"
                  value={selectedCategoryId || ""}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-gray-900"
                  value={newSubcategoryName}
                  onChange={(e) => setNewSubcategoryName(e.target.value)}
                  disabled={!selectedCategoryId}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-gray-900"
                  value={newSubcategoryDesc}
                  onChange={(e) => setNewSubcategoryDesc(e.target.value)}
                  disabled={!selectedCategoryId}
                />
              </div>
              <button
                type="submit"
                className={`w-full py-2 px-4 rounded text-white ${
                  !selectedCategoryId
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
                disabled={!selectedCategoryId}
              >
                Create Subcategory
              </button>
            </form>
          </div>
        </div>

        {/* Existing Categories List */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6 text-black">
            Existing Categories
          </h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {categories.map((category) => (
                <li key={category.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {category.name}
                      </h3>
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      {category.description || "No description"}
                    </div>
                    {/* Subcategories */}
                    {category.subcategories &&
                      category.subcategories.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Subcategories
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {category.subcategories.map((sub: any) => (
                              <span
                                key={sub.id}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-gray-100 text-gray-800"
                              >
                                {sub.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
