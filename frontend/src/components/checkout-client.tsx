"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { validateCoupon } from "@/lib/public-coupons";
import { calculateShippingQuote } from "@/lib/public-shipping";
import { currency } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const shippingOptions = [
  { value: "STANDARD", label: "Entrega padrao" },
  { value: "EXPRESS", label: "Entrega expressa" },
  { value: "PICKUP", label: "Retirada na loja" }
];
const paymentOptions = [
  { value: "PIX", label: "PIX" },
  { value: "CREDIT_CARD", label: "Cartao de credito" },
  { value: "BOLETO", label: "Boleto" }
];

type CheckoutState =
  | { type: "idle" }
  | { type: "submitting" }
  | { type: "success"; orderId: string }
  | { type: "error"; message: string };

export function CheckoutClient() {
  const { items, clearCart, totalPrice } = useCart();
  const [state, setState] = useState<CheckoutState>({ type: "idle" });
  const [shippingMethod, setShippingMethod] = useState("STANDARD");
  const [shippingPostalCode, setShippingPostalCode] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponState, setCouponState] = useState<{
    status: "idle" | "applied" | "error";
    code?: string;
    message?: string;
    discountAmount: number;
  }>({ status: "idle", discountAmount: 0 });
  const [shippingQuoteState, setShippingQuoteState] = useState<{
    status: "idle" | "loading" | "ready" | "error";
    shippingCost: number;
    estimatedDays?: string;
    regionLabel?: string;
    freeShippingApplied?: boolean;
    message?: string;
  }>({
    status: "idle",
    shippingCost: 0
  });
  const shippingCost = shippingQuoteState.shippingCost;
  const grandTotal = Math.max(0, totalPrice - couponState.discountAmount + shippingCost);

  const canSubmit = useMemo(
    () => items.length > 0 && state.type !== "submitting",
    [items.length, state.type]
  );

  useEffect(() => {
    if (items.length === 0) {
      setShippingQuoteState({
        status: "idle",
        shippingCost: 0
      });
      return;
    }

    if (shippingMethod === "PICKUP") {
      setShippingQuoteState({
        status: "ready",
        shippingCost: 0,
        estimatedDays: "Disponivel em ate 1 dia util",
        regionLabel: "Retirada local",
        freeShippingApplied: true
      });
      return;
    }

    const sanitizedPostalCode = shippingPostalCode.replace(/\D/g, "");

    if (sanitizedPostalCode.length !== 8) {
      setShippingQuoteState({
        status: "idle",
        shippingCost: 0
      });
      return;
    }

    let active = true;
    setShippingQuoteState((current) => ({
      ...current,
      status: "loading",
      message: undefined
    }));

    const timeoutId = setTimeout(async () => {
      try {
        const quote = await calculateShippingQuote(
          shippingMethod,
          sanitizedPostalCode,
          totalPrice
        );

        if (!active) {
          return;
        }

        setShippingQuoteState({
          status: "ready",
          shippingCost: quote.shippingCost,
          estimatedDays: quote.estimatedDays,
          regionLabel: quote.regionLabel,
          freeShippingApplied: quote.freeShippingApplied
        });
      } catch (error) {
        if (!active) {
          return;
        }

        setShippingQuoteState({
          status: "error",
          shippingCost: 0,
          message:
            error instanceof Error
              ? error.message
              : "Nao foi possivel calcular o frete."
        });
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [items.length, shippingMethod, shippingPostalCode, totalPrice]);

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
    const paymentMethod = String(formData.get("paymentMethod") ?? "").trim();
    const shippingMethodValue = String(formData.get("shippingMethod") ?? "").trim();
    const shippingAddress = String(formData.get("shippingAddress") ?? "").trim();
    const shippingAddress2 = String(formData.get("shippingAddress2") ?? "").trim();
    const shippingCity = String(formData.get("shippingCity") ?? "").trim();
    const shippingState = String(formData.get("shippingState") ?? "").trim();
    const shippingPostalCode = String(formData.get("shippingPostalCode") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();

    if (
      !customerName ||
      !customerEmail ||
      !paymentMethod ||
      !shippingMethodValue ||
      !shippingAddress ||
      !shippingCity ||
      !shippingState ||
      !shippingPostalCode
    ) {
      setState({
        type: "error",
        message: "Preencha os dados de cliente, entrega e pagamento para concluir."
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
          paymentMethod,
          shippingMethod: shippingMethodValue,
          shippingAddress,
          shippingAddress2: shippingAddress2 || undefined,
          shippingCity,
          shippingState,
          shippingPostalCode,
          notes: notes || undefined,
          couponCode: couponState.status === "applied" ? couponState.code : undefined,
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
      setShippingMethod("STANDARD");
      setShippingPostalCode("");
      setCouponCode("");
      setCouponState({ status: "idle", discountAmount: 0 });
      setShippingQuoteState({
        status: "idle",
        shippingCost: 0
      });
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

  async function handleApplyCoupon() {
    const code = couponCode.trim().toUpperCase();

    if (!code) {
      setCouponState({
        status: "error",
        message: "Informe um codigo de cupom para aplicar.",
        discountAmount: 0
      });
      return;
    }

    try {
      const result = await validateCoupon(code, totalPrice, shippingCost);
      setCouponState({
        status: "applied",
        code: result.code,
        message: result.description ?? "Cupom aplicado com sucesso.",
        discountAmount: result.discountAmount
      });
    } catch (error) {
      setCouponState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel validar o cupom.",
        discountAmount: 0
      });
    }
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:px-8">
      <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-8 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Checkout</p>
        <h1 className="mt-4 font-display text-5xl">Concluir pedido</h1>
        <p className="mt-4 max-w-2xl text-espresso/70">
          Finalize a compra com dados do cliente, entrega e forma de pagamento. O
          pedido cria ou reaproveita o cadastro do comprador na base.
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

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="text-espresso/70">Forma de pagamento</span>
              <select
                name="paymentMethod"
                required
                defaultValue="PIX"
                className="w-full rounded-[1.5rem] border border-espresso/15 bg-transparent px-4 py-3"
              >
                {paymentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="text-espresso/70">Frete</span>
              <select
                name="shippingMethod"
                required
                value={shippingMethod}
                onChange={(event) => setShippingMethod(event.target.value)}
                className="w-full rounded-[1.5rem] border border-espresso/15 bg-transparent px-4 py-3"
              >
                {shippingOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm md:col-span-2">
              <span className="text-espresso/70">Endereco</span>
              <input
                name="shippingAddress"
                required
                minLength={5}
                className="w-full rounded-[1.5rem] border border-espresso/15 bg-transparent px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm md:col-span-2">
              <span className="text-espresso/70">Complemento</span>
              <input
                name="shippingAddress2"
                className="w-full rounded-[1.5rem] border border-espresso/15 bg-transparent px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-espresso/70">Cidade</span>
              <input
                name="shippingCity"
                required
                minLength={2}
                className="w-full rounded-[1.5rem] border border-espresso/15 bg-transparent px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-espresso/70">Estado</span>
              <input
                name="shippingState"
                required
                minLength={2}
                maxLength={2}
                className="w-full rounded-[1.5rem] border border-espresso/15 bg-transparent px-4 py-3 uppercase"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-espresso/70">CEP</span>
              <input
                name="shippingPostalCode"
                required
                minLength={8}
                value={shippingPostalCode}
                onChange={(event) => setShippingPostalCode(event.target.value)}
                className="w-full rounded-[1.5rem] border border-espresso/15 bg-transparent px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm md:col-span-2">
              <span className="text-espresso/70">Observacoes</span>
              <textarea
                name="notes"
                rows={3}
                className="w-full rounded-[1.5rem] border border-espresso/15 bg-transparent px-4 py-3"
                placeholder="Ponto de referencia, horario de entrega, etc."
              />
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
            <label className="space-y-2 text-sm">
              <span className="text-espresso/70">Cupom de desconto</span>
              <input
                value={couponCode}
                onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                className="w-full rounded-[1.5rem] border border-espresso/15 bg-transparent px-4 py-3 uppercase"
                placeholder="BEMVINDO10"
              />
            </label>
            <button
              type="button"
              onClick={handleApplyCoupon}
              className="rounded-full border border-espresso/15 px-6 py-3 text-sm"
            >
              Aplicar cupom
            </button>
          </div>

          {couponState.status !== "idle" ? (
            <div
              className={`rounded-[1.5rem] border p-4 text-sm ${
                couponState.status === "applied"
                  ? "border-moss/20 bg-moss/10 text-moss"
                  : "border-terracotta/20 bg-terracotta/10 text-terracotta"
              }`}
            >
              {couponState.message}
            </div>
          ) : null}

          <div className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4 text-sm text-espresso/70">
            {shippingQuoteState.status === "loading" ? (
              <p>Calculando frete para o CEP informado...</p>
            ) : shippingQuoteState.status === "error" ? (
              <p>{shippingQuoteState.message}</p>
            ) : shippingQuoteState.status === "ready" ? (
              <div className="space-y-1">
                <p>
                  <strong>Frete calculado:</strong> {currency(shippingQuoteState.shippingCost)}
                </p>
                <p>
                  <strong>Prazo estimado:</strong> {shippingQuoteState.estimatedDays}
                </p>
                <p>
                  <strong>Regiao:</strong> {shippingQuoteState.regionLabel}
                </p>
                {shippingQuoteState.freeShippingApplied ? (
                  <p>Seu pedido entrou em regra de frete gratis para esta opcao.</p>
                ) : null}
              </div>
            ) : (
              <p>Informe o CEP para consultar frete e prazo antes de finalizar.</p>
            )}
          </div>

          <div className="rounded-[1.5rem] border border-dashed border-espresso/15 bg-sand/35 p-4 text-sm text-espresso/65">
            O pagamento ainda esta em modo demonstracao, mas o pedido agora registra
            entrega, frete calculado e forma de pagamento para preparar a operacao real.
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
          <div className="mb-4 flex items-center justify-between gap-4 text-sm text-espresso/70">
            <span>Subtotal</span>
            <span>{currency(totalPrice)}</span>
          </div>
          <div className="mb-4 flex items-center justify-between gap-4 text-sm text-espresso/70">
            <span>Desconto</span>
            <span>- {currency(couponState.discountAmount)}</span>
          </div>
          <div className="mb-4 flex items-center justify-between gap-4 text-sm text-espresso/70">
            <span>Frete</span>
            <span>
              {shippingQuoteState.status === "loading"
                ? "Calculando..."
                : currency(shippingCost)}
            </span>
          </div>
          <div className="flex items-end justify-between gap-4">
            <span className="text-sm text-espresso/70">Total</span>
            <span className="font-display text-4xl">{currency(grandTotal)}</span>
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
