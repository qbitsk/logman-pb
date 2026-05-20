import { Sidebar } from "@/components/layout/Sidebar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh overflow-x-hidden">
      <Sidebar />
      <main className="flex-1 min-w-0 p-4 pt-16 md:p-5 lg:p-8 max-w-5xl">{children}</main>
    </div>
  );
}
