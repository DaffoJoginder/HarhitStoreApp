"use client";

import { useState, useEffect } from "react";
import { categoryAPI, productAPI } from "@/lib/api";

export default function AdminProductsPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    brand: "",
    description: "",
    category_id: "",
    subcategory_id: "",
    unit: "pc",
    quantity_per_unit: 1,
    is_vegetarian: true,
    expiry_date: "",

    // B2C
    b2c_mrp: "",
    b2c_selling_price: "",
    b2c_min_quantity: "1",
    b2c_max_quantity: "10",

    // B2B
    b2b_base_price: "",
    b2b_min_order_qty: "1",
    b2b_max_order_qty: "100",

    // Stock
    total_stock: "",
    b2c_reserved_stock: "",
    b2b_reserved_stock: "",
  });

  const [productImages, setProductImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    // Cleanup previews on unmount
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setProductImages((prev) => [...prev, ...newFiles]);

      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setProductImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getCategories();
      setCategories(response.data.categories);
    } catch (err) {
      console.error("Failed to fetch categories");
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const catId = e.target.value;
    setFormData({ ...formData, category_id: catId, subcategory_id: "" });
    if (catId) {
      const category = categories.find((c) => c.id === catId);
      setSubcategories(category?.subcategories || []);
    } else {
      setSubcategories([]);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    // Keep as string to handle decimals and empty states correctly
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.checked });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, String((formData as any)[key]));
      });

      productImages.forEach((file) => {
        data.append("images", file);
      });

      await productAPI.createProduct(data);
      setSuccess("Product created successfully!");
      // Reset critical fields or form
      setFormData({
        ...formData,
        sku: "",
        name: "",
        quantity_per_unit: 1,
        total_stock: "",
        b2c_mrp: "",
        b2c_selling_price: "",
        b2b_base_price: "",
      });
      setProductImages([]);
      setImagePreviews([]); // Clear previews
      window.scrollTo(0, 0);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create product");
      window.scrollTo(0, 0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Add New Product
        </h1>

        {success && (
          <div className="bg-green-100 text-green-700 p-4 rounded mb-6">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Details */}
          <section>
            <h2 className="text-xl font-semibold mb-4 pb-2 border-b">
              Basic Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  SKU <span className="text-red-500">*</span>
                </label>
                <input
                  name="sku"
                  type="text"
                  required
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-2 text-gray-900"
                  value={formData.sku}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-2 text-gray-900"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Brand <span className="text-red-500">*</span>
                </label>
                <input
                  name="brand"
                  type="text"
                  required
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-2 text-gray-900"
                  value={formData.brand}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Vegetarian
                </label>
                <div className="mt-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      name="is_vegetarian"
                      className="form-checkbox"
                      checked={formData.is_vegetarian}
                      onChange={handleCheckboxChange}
                    />
                    <span className="ml-2">Yes</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-2 text-gray-900"
                value={formData.description}
                onChange={handleChange}
              ></textarea>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Product Images
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Select multiple images. They will be appended.
              </p>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                  {imagePreviews.map((src, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={src}
                        alt={`Preview ${index}`}
                        className="h-24 w-full object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Categorization */}
          <section>
            <h2 className="text-xl font-semibold mb-4 pb-2 border-b">
              Categorization
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category_id"
                  required
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-2 text-gray-900"
                  value={formData.category_id}
                  onChange={handleCategoryChange}
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Subcategory <span className="text-red-500">*</span>
                </label>
                <select
                  name="subcategory_id"
                  required
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-2 text-gray-900"
                  value={formData.subcategory_id}
                  onChange={handleChange}
                  disabled={!formData.category_id}
                >
                  <option value="">Select Subcategory</option>
                  {subcategories.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Unit & Stock */}
          <section>
            <h2 className="text-xl font-semibold mb-4 pb-2 border-b">
              Unit & Inventory
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Unit Type
                </label>
                <select
                  name="unit"
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-2 text-gray-900"
                  value={formData.unit}
                  onChange={handleChange}
                >
                  <option value="pc">Piece</option>
                  <option value="kg">Kg</option>
                  <option value="ltr">Liter</option>
                  <option value="g">Gram</option>
                  <option value="ml">Ml</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Qty Per Unit
                </label>
                <input
                  name="quantity_per_unit"
                  type="number"
                  step={formData.unit === "pc" ? "1" : "0.01"}
                  min="0"
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-2 text-gray-900"
                  value={formData.quantity_per_unit}
                  onChange={handleChange}
                  onKeyDown={(e) => {
                    if (formData.unit === "pc" && e.key === ".") {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Total Stock <span className="text-red-500">*</span>
                </label>
                <input
                  name="total_stock"
                  type="number"
                  required
                  min="0"
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-2 text-gray-900"
                  value={formData.total_stock}
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          {/* B2C Pricing */}
          <section>
            <h2 className="text-xl font-semibold mb-4 pb-2 border-b text-blue-600">
              B2C Pricing (Shop for Home)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  MRP <span className="text-red-500">*</span>
                </label>
                <input
                  name="b2c_mrp"
                  type="number"
                  step="0.01"
                  required
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-2 text-gray-900"
                  value={formData.b2c_mrp}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Selling Price <span className="text-red-500">*</span>
                </label>
                <input
                  name="b2c_selling_price"
                  type="number"
                  step="0.01"
                  required
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-2 text-gray-900"
                  value={formData.b2c_selling_price}
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          {/* B2B Pricing */}
          <section>
            <h2 className="text-xl font-semibold mb-4 pb-2 border-b text-green-600">
              B2B Pricing (Business Account)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  B2B Base Price <span className="text-red-500">*</span>
                </label>
                <input
                  name="b2b_base_price"
                  type="number"
                  step="0.01"
                  required
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-2 text-gray-900"
                  value={formData.b2b_base_price}
                  onChange={handleChange}
                  help-text="Must be lower than B2C Selling Price"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Min Order Qty <span className="text-red-500">*</span>
                </label>
                <input
                  name="b2b_min_order_qty"
                  type="number"
                  required
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-2 text-gray-900"
                  value={formData.b2b_min_order_qty}
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              } focus:outline-none`}
            >
              {loading ? "Creating Product..." : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
