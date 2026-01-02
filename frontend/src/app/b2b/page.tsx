export default function B2BPage() {
  return (
    <div className="min-h-screen bg-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Business Account
          </h1>
          <p className="text-xl text-gray-600">
            Bulk ordering with wholesale pricing
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Wholesale Pricing</h3>
            <p className="text-gray-600">Get the best rates for bulk orders.</p>
          </div>
          {/* Feature 2 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Credit Terms</h3>
            <p className="text-gray-600">
              Flexible payment options including 30-day credit.
            </p>
          </div>
          {/* Feature 3 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Priority Support</h3>
            <p className="text-gray-600">
              Dedicated account manager for your business.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
