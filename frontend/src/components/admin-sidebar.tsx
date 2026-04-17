import Link from "next/link";
import { LayoutDashboard, Package, Users } from "lucide-react";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users }
];

export function AdminSidebar() {
  return (
    <aside className="rounded-[2rem] border border-espresso/10 bg-white/75 p-5 shadow-soft">
      <p className="font-display text-2xl">Painel</p>
      <nav className="mt-6 space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm hover:bg-sand"
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
