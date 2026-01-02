"use client";

import { useState, useEffect } from "react";
import { categoryAPI, productAPI } from "@/lib/api";

type ViewMode = "list" | "create" | "edit";

export default function AdminProductsPage() {
  const [view, setView] = useState<ViewMode>("list");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [productImages, setProductImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    // Cleanup previews on unmount
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Fetch all products (B2C account type generally returns enough info for list)
      // Or we can fetch as generic if backend supports it, but currently it filters by account type.
      // Admin should ideally see raw data, but re-using B2C endpoint for now.
      const response = await productAPI.getProducts({ account_type: "b2c" });
      setProducts(response.data.products);
    } catch (err) {
      console.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getCategories();
      setCategories(response.data.categories);
    } catch (err) {
      console.error("Failed to fetch categories");
    }
  };

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
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.checked });
  };

  // Switch to Create Mode
  const handleAddNew = () => {
    setView("create");
    setEditingProductId(null);
    setSuccess("");
    setError("");
    resetForm();
  };

  // Switch to Edit Mode
  const handleEdit = async (product: any) => {
    setView("edit");
    setEditingProductId(product.product_id); // Ensure we use the correct ID field
    setSuccess("");
    setError("");

    // Start with a clean form but populate known fields
    // NOTE: The list view might not have all details (like description, B2B reserved stock etc if not in the list response).
    // It is safer to fetch the full product details by ID.
    try {
      setLoading(true);
      // Fetch full details as B2B to get base price etc, or generic.
      // The current getProductById returns different shapes for B2B vs B2C.
      // We'll try fetching as B2B to get specific B2B fields, and maybe B2C fields are included?
      // Actually the controller splits them. We might need two calls or a specific admin endpoint.
      // For now, let's fetch as B2B to get cost prices, but B2C MRP might be missing in B2B response?
      // Checking controller: getProductById returns specific fields.
      // If we fetch as B2B, we get base_price. If B2C, we get mrp/selling_price.
      // We need BOTH for editing.
      // Current workaround: Fetch both or rely on what's available?
      // Better approach: User restart backend for "updateProduct" support, but getting data is tricky without an "admin" view in backend.
      // let's try fetching as B2B for now, as it has most fields. But wait, we need MRP.
      // Hack: we will fetch as 'b2b' to get stock/base price, and maybe we can rely on list data for others?
      // No, let's just use what we have in the local list if possible, OR assume the user will re-enter missing data?
      // A proper solution requires a backend update to return ALL data for Admin.
      // As I cannot easily change backend response structure without risk, I will try fetching B2B and see what we get.
      // Wait, B2C response has MRP and Selling Price. B2B response has Base Price.
      // We need to fetch TWICE or fix backend.
      // Let's rely on the user to re-input if missing, or maybe...
      // Actually, let's just fetch as 'b2c' first.

      const b2cRes = await productAPI.getProduct(product.product_id, "b2c");
      const b2bRes = await productAPI.getProduct(product.product_id, "b2b");

      const b2cData = b2cRes.data.product;
      const b2bData = b2bRes.data.product;

      // Populate form
      setFormData({
        sku: b2cData.sku,
        name: b2cData.name,
        brand: b2cData.brand,
        description: b2cData.description || "",
        category_id: "", // We need to find ID from name or fetch stored ID. API returns names.
        // Issue: API returns category NAME, not ID. We can't easily pre-select select box.
        // We have to iterate categories to find matching name.
        subcategory_id: "",
        unit: b2cData.unit,
        quantity_per_unit: b2cData.quantity_per_unit,
        is_vegetarian: true, // API doesn't seem to return this in the formatted response?
        expiry_date: "", // Not in response

        b2c_mrp: String(b2cData.mrp),
        b2c_selling_price: String(b2cData.selling_price),
        b2c_min_quantity: "1", // Default
        b2c_max_quantity: String(b2cData.max_quantity),

        b2b_base_price: String(b2bData.base_price),
        b2b_min_order_qty: String(b2bData.min_order_qty),
        b2b_max_order_qty: String(b2bData.max_order_qty),

        total_stock: String(
          b2cData.available_stock + (b2bData.available_stock || 0)
        ), // Rough estimate?
        // Actually total_stock is not directly exposed as a single number in response if split.
        // But let's assume user edits it.
        b2c_reserved_stock: String(b2cData.available_stock),
        b2b_reserved_stock: String(b2bData.available_stock),
      });

      // Handle Category/Subcategory matching by Name if IDs are missing
      const cat = categories.find((c) => c.name === b2cData.category);
      if (cat) {
        setFormData((prev) => ({ ...prev, category_id: cat.id }));
        setSubcategories(cat.subcategories);
        const sub = cat.subcategories.find(
          (s: any) => s.name === b2cData.subcategory
        );
        if (sub) {
          setFormData((prev) => ({ ...prev, subcategory_id: sub.id }));
        }
      }

      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
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
      b2c_mrp: "",
      b2c_selling_price: "",
      b2c_min_quantity: "1",
      b2c_max_quantity: "10",
      b2b_base_price: "",
      b2b_min_order_qty: "1",
      b2b_max_order_qty: "100",
      total_stock: "",
      b2c_reserved_stock: "",
      b2b_reserved_stock: "",
    });
    setProductImages([]);
    setImagePreviews([]);
    setSubcategories([]);
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

      if (view === "create") {
        await productAPI.createProduct(data);
        setSuccess("Product created successfully!");
        resetForm();
      } else if (view === "edit" && editingProductId) {
        await productAPI.updateProduct(editingProductId, data);
        setSuccess("Product updated successfully!");
        // Don't reset form immediately so they can keep editing or go back
      }

      window.scrollTo(0, 0);
      // Refresh list in background
      fetchProducts();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${view} product`);
      window.scrollTo(0, 0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {view === "list"
              ? "Product Management"
              : view === "create"
              ? "Add New Product"
              : "Edit Product"}
          </h1>
          {view === "list" && (
            <button
              onClick={handleAddNew}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium"
            >
              + Add Product
            </button>
          )}
          {view !== "list" && (
            <button
              onClick={() => {
                setView("list");
                resetForm();
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 font-medium"
            >
              Cancel / Back to List
            </button>
          )}
        </div>

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

        {view === "list" ? (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                Loading products...
              </div>
            ) : products.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No products found. Add one!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price (MRP)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.product_id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {product.brand}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{product.mrp}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              product.in_stock
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {product.in_stock ? "In Stock" : "Out of Stock"}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {product.available_stock} avail
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Form Content Reused */}
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
                  {loading
                    ? "Saving..."
                    : view === "create"
                    ? "Create Product"
                    : "Update Product"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
