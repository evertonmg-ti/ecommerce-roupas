"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { currency } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

type CheckoutState =
  | { type: "idle" }
  | { type: "submitting" }
  | { type: "success"; orderId: string }
  | { type: "error"; message: string };

export function CheckoutClient() {
  const { items, clearCart, totalPrice } = useCart();
  const [state, setState] = useState<CheckoutState>({ type: "idle" });

  const canSubmit = useMemo(() => items.length > 0 && state.type !== "submitting", [items.length, state.type]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    if (items.length === 0) {
      setState({
        type: "error",
        message: "Adicione produtos ao carrinho antes de finalizar."
      });
      return;
    }

    const formData = new FormData(event.currentTarget);
    const customerName = String(formData.get("customerName") ?? "").trim();
    const customerEmail = String(formData.get("customerEmail") ?? "").trim();

    if (!customerName || !customerEmail) {
      setState({
        type: "error",
        message: "Informe nome e email para concluir o pedido."
      });
      return;
    }

    setState({ type: "submitting" });

    try {
      const response = await fetch(`${API_URL}/orders/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customerName,
          customerEmail,
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity
          }))
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { message?: string | string[] }
          | null;
        const message = Array.isArray(payload?.message)
          ? payload.message[0]
          : payload?.message;

        throw new Error(message ?? "Nao foi possivel concluir o pedido.");
      }

      const data = (await response.json()) as { id: string };
      clearCart();
      setState({ type: "success", orderId: data.id });
      form.reset();
    } catch (error) {
      setState({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel concluir o pedido."
      });
    }
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:px-8">
      <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-8 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Checkout</p>
        <h1 className="mt-4 font-display text-5xl">Concluir pedido</h1>
        <p className="mt-4 max-w-2xl text-espresso/70">
          Finalize a compra com os dados do cliente. Nesta primeira versao, o pedido
          ja cria ou reaproveita o cadastro do comprador na base.
        </p>

        {state.type === "success" ? (
          <div className="mt-8 rounded-[1.5rem] border border-moss/20 bg-moss/10 p-5 text-sm text-moss">
            Pedido concluido com sucesso. Codigo: <strong>{state.orderId}</strong>.
          </div>
        ) : null}

        {state.type === "error" ? (
          <div className="mt-8 rounded-[1.5rem] border border-terracotta/20 bg-terracotta/10 p-5 text-sm text-terracotta">
            {state.message}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="text-espresso/70">Nome completo</span>
              <input
                name="customerName"
                required
                minLength={3}
                className="w-full rounded-[1.5rem] border border-espresso/15 bg-transparent px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-espresso/70">Email</span>
              <input
                name="customerEmail"
                type="email"
                required
                className="w-full rounded-[1.5rem] border border-espresso/15 bg-transparent px-4 py-3"
              />
            </label>
          </div>

          <div className="rounded-[1.5rem] border border-dashed border-espresso/15 bg-sand/35 p-4 text-sm text-espresso/65">
            Pagamento e frete ainda estao em modo inicial. Nesta fase, o checkout
            registra o pedido, reserva o estoque e permite evoluir o fluxo comercial.
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-full bg-espresso px-6 py-3 text-sand disabled:cursor-not-allowed disabled:opacity-50"
          >
            {state.type === "submitting" ? "Processando pedido..." : "Finalizar pedido"}
          </button>
        </form>
      </div>

      <aside className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Resumo do pedido</p>
        <div className="mt-6 space-y-4">
          {items.length === 0 ? (
            <div className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4 text-sm text-espresso/70">
              Seu carrinho esta vazio. Volte ao catalogo para adicionar produtos.
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 text-sm">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="mt-1 text-espresso/60">
                    {item.quantity} x {currency(item.price)}
                  </p>
                </div>
                <p className="font-medium">{currency(item.price * item.quantity)}</p>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 border-t border-espresso/10 pt-6">
          <div className="flex items-end justify-between gap-4">
            <span className="text-sm text-espresso/70">Total</span>
            <span className="font-display text-4xl">{currency(totalPrice)}</span>
          </div>
        </div>

        <Link
          href="/carrinho"
          className="mt-6 inline-flex rounded-full border border-espresso/15 px-5 py-3 text-sm"
        >
          Voltar ao carrinho
        </Link>
      </aside>
    </section>
  );
}
