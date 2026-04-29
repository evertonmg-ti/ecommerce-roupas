import type { Metadata } from "next";
import { CartProvider } from "@/components/cart-provider";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { WishlistProvider } from "@/components/wishlist-provider";
import { getCustomerSession } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maison Aurea",
  description: "E-commerce de moda com painel administrativo"
};

export default async function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const customerSession = await getCustomerSession();

  return (
    <html lang="pt-BR">
      <body>
        <CartProvider isCustomerAuthenticated={Boolean(customerSession?.token)}>
          <WishlistProvider>
            <Header />
            <main>{children}</main>
            <Footer />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
