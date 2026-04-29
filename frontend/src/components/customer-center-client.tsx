"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ReorderOrderButton } from "@/components/reorder-order-button";
import { useCart } from "@/components/cart-provider";
import { useWishlist } from "@/components/wishlist-provider";
import {
  CHECKOUT_PROFILE_STORAGE_KEY,
  CheckoutProfile,
  emptyCheckoutProfile
} from "@/lib/checkout-profile";
import { currency } from "@/lib/utils";

type CustomerCenterOrder = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  paymentMethod: string;
  shippingMethod: string;
  trackingCode?: string;
  items: Array<{
    id: string;
    productId: string;
    variantId?: string;
    sku?: string;
    variantLabel?: string;
    name: string;
    slug: string;
    category: string;
    quantity: number;
    unitPrice: number;
    imageUrl?: string;
  }>;
};

type CustomerCenterClientProps = {
  initialEmail?: string;
  orders: CustomerCenterOrder[];
};

export function CustomerCenterClient({
  initialEmail,
  orders
}: CustomerCenterClientProps) {
  const { items: cartItems, totalItems, totalPrice } = useCart();
  const { items: favorites, totalItems: totalFavorites } = useWishlist();
  const [profile, setProfile] = useState<CheckoutProfile>(emptyCheckoutProfile);

  useEffect(() => {
    const stored = window.localStorage.getItem(CHECKOUT_PROFILE_STORAGE_KEY);

    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as Partial<CheckoutProfile>;
      setProfile({
        ...emptyCheckoutProfile,
        ...parsed
      });
    } catch {
      window.localStorage.removeItem(CHECKOUT_PROFILE_STORAGE_KEY);
    }
  }, []);

  const customerEmail = initialEmail ?? profile.customerEmail.trim();
  const lastOrder = orders[0];
  const totalSpent = useMemo(
    () => orders.reduce((sum, order) => sum + order.total, 0),
    [orders]
  );

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-8 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
              Centro do cliente
            </p>
            <h1 className="mt-4 font-display text-5xl">Sua jornada de compra</h1>
            <p className="mt-4 max-w-2xl text-espresso/70">
              Retome checkout, acompanhe pedidos, revise favoritos e acelere novas
              compras em um unico lugar.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 px-5 py-4 text-sm text-espresso/70">
            <p>
              <strong>Cliente:</strong> {profile.customerName || "Nao identificado"}
            </p>
            <p className="mt-1">
              <strong>Email:</strong> {customerEmail || "Informe no checkout para acompanhar"}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-5">
            <p className="text-sm text-espresso/55">Carrinho ativo</p>
            <p className="mt-2 font-display text-3xl">{totalItems}</p>
            <p className="mt-2 text-sm text-espresso/65">
              {totalItems > 0 ? currency(totalPrice) : "Nenhum item no momento"}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-5">
            <p className="text-sm text-espresso/55">Favoritos salvos</p>
            <p className="mt-2 font-display text-3xl">{totalFavorites}</p>
            <p className="mt-2 text-sm text-espresso/65">
              {totalFavorites > 0
                ? "Itens prontos para revisitar"
                : "Monte sua shortlist"}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-5">
            <p className="text-sm text-espresso/55">Pedidos encontrados</p>
            <p className="mt-2 font-display text-3xl">{orders.length}</p>
            <p className="mt-2 text-sm text-espresso/65">
              {orders.length > 0 ? `Ultimo: ${lastOrder?.createdAt}` : "Sem historico ainda"}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-5">
            <p className="text-sm text-espresso/55">Total comprado</p>
            <p className="mt-2 font-display text-3xl">{currency(totalSpent)}</p>
            <p className="mt-2 text-sm text-espresso/65">
              Baseado no email consultado
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-terracotta">
              Acoes rapidas
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={cartItems.length > 0 ? "/checkout" : "/produtos"}
                className="rounded-full bg-espresso px-5 py-3 text-sm text-sand"
              >
                {cartItems.length > 0 ? "Retomar checkout" : "Explorar produtos"}
              </Link>
              <Link
                href="/carrinho"
                className="rounded-full border border-espresso/15 px-5 py-3 text-sm"
              >
                Ver carrinho
              </Link>
              <Link
                href="/favoritos"
                className="rounded-full border border-espresso/15 px-5 py-3 text-sm"
              >
                Revisar favoritos
              </Link>
              <Link
                href={
                  customerEmail
                    ? `/meus-pedidos?email=${encodeURIComponent(customerEmail)}`
                    : "/meus-pedidos"
                }
                className="rounded-full border border-espresso/15 px-5 py-3 text-sm"
              >
                Acompanhar pedidos
              </Link>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-5 text-sm text-espresso/70">
            <p className="text-xs uppercase tracking-[0.25em] text-terracotta">
              Dados lembrados
            </p>
            <div className="mt-4 space-y-2">
              <p>
                <strong>Entrega:</strong>{" "}
                {profile.shippingAddress
                  ? `${profile.shippingAddress}, ${profile.shippingNumber || "s/n"}`
                  : "Ainda nao informado"}
              </p>
              <p>
                <strong>Cidade:</strong>{" "}
                {profile.shippingCity
                  ? `${profile.shippingCity}/${profile.shippingState || "--"}`
                  : "Nao informado"}
              </p>
              <p>
                <strong>Pagamento preferido:</strong>{" "}
                {profile.paymentMethod || "PIX"}
              </p>
            </div>
          </div>
        </div>

        {favorites.length > 0 ? (
          <div className="mt-8 rounded-[1.5rem] border border-espresso/10 bg-white/50 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-terracotta">
                  Favoritos recentes
                </p>
                <h2 className="mt-2 font-display text-3xl">Sua shortlist</h2>
              </div>
              <Link
                href="/favoritos"
                className="rounded-full border border-espresso/15 px-4 py-2 text-sm"
              >
                Ver lista completa
              </Link>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {favorites.slice(0, 3).map((item) => (
                <article
                  key={item.id}
                  className="rounded-[1.25rem] border border-espresso/10 bg-sand/35 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-terracotta">
                    {item.category}
                  </p>
                  <p className="mt-2 font-medium">{item.name}</p>
                  <p className="mt-2 text-sm text-espresso/65">{currency(item.price)}</p>
                  <Link
                    href={`/produtos/${item.slug}`}
                    className="mt-4 inline-flex rounded-full border border-espresso/15 px-4 py-2 text-sm"
                  >
                    Ver produto
                  </Link>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {orders.length > 0 ? (
          <div className="mt-8 rounded-[1.5rem] border border-espresso/10 bg-white/50 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-terracotta">
                  Historico
                </p>
                <h2 className="mt-2 font-display text-3xl">Pedidos recentes</h2>
              </div>
              <Link
                href={`/meus-pedidos?email=${encodeURIComponent(customerEmail)}`}
                className="rounded-full border border-espresso/15 px-4 py-2 text-sm"
              >
                Ver detalhes
              </Link>
            </div>
            <div className="mt-5 space-y-4">
              {orders.slice(0, 3).map((order) => (
                <article
                  key={order.id}
                  className="rounded-[1.25rem] border border-espresso/10 bg-sand/35 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium">Pedido {order.id}</p>
                      <p className="mt-1 text-sm text-espresso/65">
                        {order.createdAt} - {order.paymentMethod} - {order.shippingMethod}
                      </p>
                      {order.trackingCode ? (
                        <p className="mt-1 text-sm text-espresso/65">
                          Rastreio: {order.trackingCode}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="rounded-full bg-moss/10 px-3 py-1 text-xs text-moss">
                        {order.status}
                      </p>
                      <p className="mt-2 font-medium">{currency(order.total)}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <ReorderOrderButton items={order.items} />
                    <Link
                      href={`/meus-pedidos?email=${encodeURIComponent(customerEmail)}`}
                      className="rounded-full border border-espresso/15 px-5 py-3 text-sm"
                    >
                      Ver pedido completo
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-5 text-sm text-espresso/70">
            {customerEmail
              ? "Ainda nao encontramos pedidos para este email. Assim que a primeira compra for concluida, seu historico aparecera aqui."
              : "Informe um email no checkout ou use a pagina de pedidos para consultar seu historico."}
          </div>
        )}
      </div>
    </section>
  );
}
