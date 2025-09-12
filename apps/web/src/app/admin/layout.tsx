// apps/web/src/app/admin/layout.tsx
import type { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-2">
          <h1 className="text-xl font-bold">UNL-BB Admin</h1>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}