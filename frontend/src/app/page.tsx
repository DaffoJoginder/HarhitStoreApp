import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to Instamart
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your one-stop solution for B2B & B2C grocery shopping
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* B2C Card */}
          <Link href="/b2c">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                  Shop for Home
                </h2>
                <p className="text-gray-600 mb-4">
                  Quick delivery for your daily grocery needs
                </p>
                <ul className="text-left text-sm text-gray-500 space-y-2">
                  <li>✓ Retail pricing</li>
                  <li>✓ Quick delivery (15-30 mins)</li>
                  <li>✓ Small quantities</li>
                  <li>✓ COD payment</li>
                </ul>
              </div>
            </div>
          </Link>

          {/* B2B Card */}
          <Link href="/b2b">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                  Business Account
                </h2>
                <p className="text-gray-600 mb-4">
                  Bulk ordering with wholesale pricing
                </p>
                <ul className="text-left text-sm text-gray-500 space-y-2">
                  <li>✓ Wholesale pricing with tiers</li>
                  <li>✓ Bulk ordering</li>
                  <li>✓ Credit terms (30 days)</li>
                  <li>✓ Multi-location delivery</li>
                </ul>
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-12 text-center">
          <Link href="/admin" className="text-gray-600 hover:text-gray-800 underline">
            Admin Panel
          </Link>
        </div>
      </div>
    </main>
  )
}

