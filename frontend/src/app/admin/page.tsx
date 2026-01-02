export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Admin Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2">Category Management</h3>
            <p className="text-gray-600 mb-4">
              Add or edit categories and subcategories.
            </p>
            <a
              href="/admin/categories"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Manage Categories &rarr;
            </a>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2">Product Management</h3>
            <p className="text-gray-600 mb-4">
              Add new products, manage pricing and inventory.
            </p>
            <a
              href="/admin/products"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Manage Products &rarr;
            </a>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2">Orders</h3>
            <p className="text-gray-600 mb-4">
              View and manage B2B and B2C orders.
            </p>
            <span className="text-gray-400">Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}
