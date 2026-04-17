import { AdminSidebar } from "@/components/admin-sidebar";
import { requireAdminSession } from "@/lib/auth";

export default async function AdminLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  await requireAdminSession();

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
      <AdminSidebar />
      <div>{children}</div>
    </section>
  );
}
