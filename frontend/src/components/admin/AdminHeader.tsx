"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const isActive = (path: string) => {
    return pathname === path
      ? "bg-gray-900 text-white"
      : "text-gray-300 hover:bg-gray-700 hover:text-white";
  };

  return (
    <nav className="bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/admin" className="text-white font-bold text-xl">
                Admin Panel
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  href="/admin"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${isActive(
                    "/admin"
                  )}`}
                >
                  Dashboard
                </Link>

                <Link
                  href="/admin/categories"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${isActive(
                    "/admin/categories"
                  )}`}
                >
                  Categories
                </Link>

                <Link
                  href="/admin/products"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${isActive(
                    "/admin/products"
                  )}`}
                >
                  Products
                </Link>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <button
                onClick={handleLogout}
                className="bg-gray-800 p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
              >
                <span className="sr-only">Logout</span>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
