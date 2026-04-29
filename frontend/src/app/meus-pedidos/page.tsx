import Link from "next/link";
import { ReorderOrderButton } from "@/components/reorder-order-button";
import { lookupCustomerOrders } from "@/lib/admin-api";
import { currency } from "@/lib/utils";
import { cancelOrderAction, confirmMockPaymentAction } from "./actions";

type CustomerOrdersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function renderTimeline(order: {
  createdAt: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  canceledAt?: string;
}) {
  const steps = [
    { label: "Pedido criado", value: order.createdAt },
    { label: "Pagamento confirmado", value: order.paidAt },
    { label: "Pedido enviado", value: order.shippedAt },
    { label: "Pedido entregue", value: order.deliveredAt },
    { label: "Pedido cancelado", value: order.canceledAt }
  ].filter((step) => step.value);

  return (
    <div className="mt-4 grid gap-2 rounded-[1rem] border border-espresso/10 bg-sand/35 p-4 text-xs text-espresso/70">
      {steps.map((step) => (
        <p key={step.label}>
          <strong>{step.label}:</strong>{" "}
          {step.value === order.createdAt
            ? order.createdAt
            : new Date(step.value as string).toLocaleString("pt-BR")}
        </p>
      ))}
    </div>
  );
}

export default async function CustomerOrdersPage({
  searchParams
}: CustomerOrdersPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const email = getParamValue(params?.email)?.trim();
  const success = getParamValue(params?.success);
  const error = getParamValue(params?.error);
  const orders = email ? await lookupCustomerOrders(email).catch(() => null) : null;
  const totalOrders = orders?.length ?? 0;
  const totalSpent = orders?.reduce((sum, order) => sum + order.total, 0) ?? 0;
  const lastOrder = orders?.[0];

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-8 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Acompanhamento</p>
        <h1 className="mt-4 font-display text-5xl">Meus pedidos</h1>
        <p className="mt-4 max-w-2xl text-espresso/70">
          Consulte os pedidos usando o email informado no checkout.
        </p>

        <form className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="flex-1 space-y-2 text-sm">
            <span>Email do pedido</span>
            <input
              name="email"
              type="email"
              required
              defaultValue={email ?? ""}
              className="w-full rounded-[1.5rem] border border-espresso/15 bg-sand px-4 py-3"
              placeholder="cliente@email.com"
            />
          </label>
          <button className="rounded-full bg-espresso px-6 py-3 text-sand">
            Buscar pedidos
          </button>
        </form>
        <div className="mt-4">
          <Link
            href={email ? `/cliente?email=${encodeURIComponent(email)}` : "/cliente"}
            className="inline-flex rounded-full border border-espresso/15 px-5 py-3 text-sm"
          >
            Abrir centro do cliente
          </Link>
        </div>

        {orders && orders.length > 0 ? (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4">
              <p className="text-sm text-espresso/55">Pedidos encontrados</p>
              <p className="mt-2 font-display text-3xl">{totalOrders}</p>
            </div>
            <div className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4">
              <p className="text-sm text-espresso/55">Total comprado</p>
              <p className="mt-2 font-display text-3xl">{currency(totalSpent)}</p>
            </div>
            <div className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4">
              <p className="text-sm text-espresso/55">Ultimo pedido</p>
              <p className="mt-2 font-display text-3xl">{lastOrder?.createdAt ?? "-"}</p>
            </div>
          </div>
        ) : null}

        {email && orders && orders.length === 0 ? (
          <div className="mt-8 rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4 text-sm text-espresso/70">
            Nenhum pedido foi encontrado para este email.
          </div>
        ) : null}

        {success === "payment_confirmed" ? (
          <div className="mt-8 rounded-[1.5rem] border border-moss/20 bg-moss/10 p-4 text-sm text-moss">
            Pagamento mock confirmado. O pedido foi atualizado para pago.
          </div>
        ) : null}

        {success === "order_canceled" ? (
          <div className="mt-8 rounded-[1.5rem] border border-moss/20 bg-moss/10 p-4 text-sm text-moss">
            Pedido cancelado com sucesso e estoque devolvido automaticamente.
          </div>
        ) : null}

        {error === "payment_failed" ? (
          <div className="mt-8 rounded-[1.5rem] border border-terracotta/20 bg-terracotta/10 p-4 text-sm text-terracotta">
            Nao foi possivel confirmar o pagamento mock. Revise o pedido e tente novamente.
          </div>
        ) : null}

        {error === "cancel_failed" ? (
          <div className="mt-8 rounded-[1.5rem] border border-terracotta/20 bg-terracotta/10 p-4 text-sm text-terracotta">
            Nao foi possivel cancelar o pedido. Ele pode ja ter avancado para envio.
          </div>
        ) : null}

        {orders && orders.length > 0 ? (
          <div className="mt-8 space-y-4">
            {orders.map((order) => (
              <article
                key={order.id}
                className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-5"
              >
                <div className="flex flex-col gap-3 border-b border-espresso/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-display text-2xl">Pedido {order.id}</p>
                    <p className="mt-1 text-sm text-espresso/60">
                      Registrado em {order.createdAt}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="rounded-full bg-moss/10 px-3 py-1 text-xs text-moss">
                      {order.status}
                    </span>
                    <p className="font-medium">{currency(order.total)}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-start justify-between gap-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="mt-1 text-espresso/60">
                          {item.category} - {item.quantity} x {currency(item.unitPrice)}
                        </p>
                      </div>
                      <p className="font-medium">
                        {currency(item.quantity * item.unitPrice)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-[1.25rem] border border-espresso/10 bg-white/50 p-4 text-sm text-espresso/70">
                  <div className="mb-4 flex flex-wrap gap-3">
                    <ReorderOrderButton
                      items={order.items.map((item) => ({
                        id: item.productId,
                        name: item.name,
                        slug: item.slug,
                        category: item.category,
                        unitPrice: item.unitPrice,
                        quantity: item.quantity,
                        imageUrl: item.imageUrl
                      }))}
                    />
                    <Link
                      href="/favoritos"
                      className="rounded-full border border-espresso/15 px-5 py-3 text-sm"
                    >
                      Ver favoritos
                    </Link>
                  </div>
                  {order.recipientName ? (
                    <p>
                      <strong>Destinatario:</strong> {order.recipientName}
                    </p>
                  ) : null}
                  {order.customerDocument ? (
                    <p className="mt-2">
                      <strong>Documento:</strong> {order.customerDocument}
                    </p>
                  ) : null}
                  {order.customerPhone ? (
                    <p className="mt-2">
                      <strong>Telefone:</strong> {order.customerPhone}
                    </p>
                  ) : null}
                  <p>
                    <strong>Pagamento:</strong> {order.paymentMethod}
                  </p>
                  <p className="mt-2">
                    <strong>Entrega:</strong> {order.shippingMethod}
                  </p>
                  {order.trackingCode ? (
                    <p className="mt-2">
                      <strong>Rastreio:</strong> {order.trackingCode}
                    </p>
                  ) : null}
                  <p className="mt-2">
                    <strong>Endereco:</strong> {order.shippingAddress}
                    {order.shippingNumber ? `, ${order.shippingNumber}` : ""}
                    {order.shippingAddress2 ? `, ${order.shippingAddress2}` : ""}
                    {order.shippingNeighborhood ? ` - ${order.shippingNeighborhood}` : ""} -{" "}
                    {order.shippingCity}/{order.shippingState} - CEP {order.shippingPostalCode}
                  </p>
                  {order.notes ? (
                    <p className="mt-2">
                      <strong>Observacoes:</strong> {order.notes}
                    </p>
                  ) : null}
                  {order.paymentMock ? (
                    <div className="mt-4 rounded-[1rem] border border-espresso/10 bg-sand/35 p-4">
                      <p>
                        <strong>Status do pagamento:</strong> {order.paymentMock.status}
                      </p>
                      <p className="mt-2">
                        <strong>Referencia:</strong> {order.paymentMock.reference}
                      </p>
                      <p className="mt-2">{order.paymentMock.instructions}</p>
                      {order.paymentMock.expiresAt ? (
                        <p className="mt-2">
                          <strong>Validade:</strong>{" "}
                          {new Date(order.paymentMock.expiresAt).toLocaleString("pt-BR")}
                        </p>
                      ) : null}
                      {order.paymentMock.copyPasteCode ? (
                        <p className="mt-2 break-all">
                          <strong>PIX:</strong> {order.paymentMock.copyPasteCode}
                        </p>
                      ) : null}
                      {order.paymentMock.digitableLine ? (
                        <p className="mt-2 break-all">
                          <strong>Boleto:</strong> {order.paymentMock.digitableLine}
                        </p>
                      ) : null}
                      {order.paymentMock.authorizationCode ? (
                        <p className="mt-2">
                          <strong>Autorizacao:</strong> {order.paymentMock.authorizationCode}
                          {order.paymentMock.cardBrand
                            ? ` - ${order.paymentMock.cardBrand}`
                            : ""}
                          {order.paymentMock.installments
                            ? ` - ${order.paymentMock.installments}`
                            : ""}
                        </p>
                      ) : null}
                      {order.status === "PENDING" && email ? (
                        <div className="mt-4 flex flex-wrap gap-3">
                          <form action={confirmMockPaymentAction}>
                            <input type="hidden" name="orderId" value={order.id} />
                            <input type="hidden" name="email" value={email} />
                            <button className="rounded-full bg-espresso px-5 py-3 text-sm text-sand">
                              Simular pagamento
                            </button>
                          </form>
                          <form action={cancelOrderAction}>
                            <input type="hidden" name="orderId" value={order.id} />
                            <input type="hidden" name="email" value={email} />
                            <button className="rounded-full border border-terracotta/25 px-5 py-3 text-sm text-terracotta">
                              Cancelar pedido
                            </button>
                          </form>
                        </div>
                      ) : null}
                      {order.status === "PAID" && email ? (
                        <form action={cancelOrderAction} className="mt-4">
                          <input type="hidden" name="orderId" value={order.id} />
                          <input type="hidden" name="email" value={email} />
                          <button className="rounded-full border border-terracotta/25 px-5 py-3 text-sm text-terracotta">
                            Cancelar pedido
                          </button>
                        </form>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-espresso/10 pt-4">
                    <span>Subtotal: {currency(order.subtotal)}</span>
                    <span>Frete: {currency(order.shippingCost)}</span>
                      <strong>Total: {currency(order.total)}</strong>
                  </div>
                  {renderTimeline(order)}
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
