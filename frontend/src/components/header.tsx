import Link from "next/link";
import { UserRound } from "lucide-react";
import { customerLogoutAction } from "@/app/entrar/actions";
import { CartButton } from "@/components/cart-button";
import { FavoritesButton } from "@/components/favorites-button";
import { getAdminSession, getCustomerSession } from "@/lib/auth";
import { logoutAction } from "@/app/login/actions";

export async function Header() {
  const session = await getAdminSession();
  const customerSession = await getCustomerSession();
  const accountHref = customerSession ? "/conta" : "/cliente";

  return (
    <header className="sticky top-0 z-30 border-b border-espresso/10 bg-sand/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-display text-2xl font-semibold tracking-wide">
          Maison Aurea
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link href="/">Inicio</Link>
          <Link href="/produtos">Colecao</Link>
          <Link href={accountHref}>Cliente</Link>
          <Link href="/favoritos">Favoritos</Link>
          <Link href="/meus-pedidos">Pedidos</Link>
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
          ) : customerSession ? (
            <form action={customerLogoutAction} className="flex items-center gap-3">
              <Link
                href="/conta"
                className="rounded-full border border-espresso/15 px-4 py-2 text-sm hover:border-terracotta"
              >
                {customerSession.name ?? "Minha conta"}
              </Link>
              <button className="rounded-full border border-espresso/15 px-4 py-2 text-sm hover:border-terracotta">
                Sair
              </button>
            </form>
          ) : (
            <Link
              href="/entrar"
              className="rounded-full border border-espresso/15 p-2 hover:border-terracotta"
            >
              <UserRound className="h-5 w-5" />
            </Link>
          )}
          <FavoritesButton />
          <CartButton />
        </div>
      </div>
    </header>
  );
}
