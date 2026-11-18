import Link from "next/link";
import { AlertCircle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4 py-12">
      <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h2 className="text-3xl font-black text-gray-900 mb-2">404 - Page Not Found</h2>
      <p className="text-gray-600 max-w-md mb-6 text-sm">
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0F766E] text-white hover:bg-[#115E59] font-medium text-sm transition-colors shadow-sm"
      >
        <Home className="w-4 h-4" />
        Return to Homepage
      </Link>
    </div>
  );
}
