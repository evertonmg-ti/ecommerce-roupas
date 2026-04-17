import Link from "next/link";
import { UserRound } from "lucide-react";
import { CartButton } from "@/components/cart-button";
import { getAdminSession } from "@/lib/auth";
import { logoutAction } from "@/app/login/actions";

export async function Header() {
  const session = await getAdminSession();

  return (
    <header className="sticky top-0 z-30 border-b border-espresso/10 bg-sand/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-display text-2xl font-semibold tracking-wide">
          Maison Aurea
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link href="/">Inicio</Link>
          <Link href="/produtos">Colecao</Link>
          <Link href="/admin">Admin</Link>
        </nav>
        <div className="flex items-center gap-3">
          {session?.role === "ADMIN" ? (
            <form action={logoutAction} className="flex items-center gap-3">
              <Link
                href="/admin"
                className="rounded-full border border-espresso/15 px-4 py-2 text-sm hover:border-terracotta"
              >
                {session.name ?? "Admin"}
              </Link>
              <button className="rounded-full border border-espresso/15 px-4 py-2 text-sm hover:border-terracotta">
                Sair
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-espresso/15 p-2 hover:border-terracotta"
            >
              <UserRound className="h-5 w-5" />
            </Link>
          )}
          <CartButton />
        </div>
      </div>
    </header>
  );
}
