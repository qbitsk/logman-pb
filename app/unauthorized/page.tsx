import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/20 mb-4">
          <ShieldX className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Access Denied</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          You don&apos;t have permission to view this page.
        </p>
        <Link href="/dashboard" className="btn-primary">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
