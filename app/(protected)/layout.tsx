import { Sidebar } from "@/components/layout/Sidebar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <Sidebar />
      <main className="flex-1 min-w-0 p-4 pt-16 sm:p-6 md:p-8 md:pt-8 max-w-5xl">{children}</main>
    </div>
  );
}
