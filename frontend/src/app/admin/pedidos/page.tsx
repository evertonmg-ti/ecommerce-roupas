import { AdminFeedback } from "@/components/admin-feedback";
import { getAdminOrders } from "@/lib/admin-api";
import { currency } from "@/lib/utils";
import { updateOrderStatusAction } from "./actions";

const statusOptions = [
  { value: "PENDING", label: "Pendente" },
  { value: "PAID", label: "Pago" },
  { value: "SHIPPED", label: "Enviado" },
  { value: "DELIVERED", label: "Entregue" },
  { value: "CANCELED", label: "Cancelado" }
];

type AdminOrdersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminOrdersPage({
  searchParams
}: AdminOrdersPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const activeStatus =
    typeof params?.status === "string" && params.status !== "ALL"
      ? params.status
      : undefined;
  const search =
    typeof params?.search === "string" && params.search.trim()
      ? params.search.trim()
      : undefined;
  const page =
    typeof params?.page === "string" && Number(params.page) > 0
      ? Number(params.page)
      : 1;
  const orderList = await getAdminOrders({
    status: activeStatus,
    search,
    page,
    pageSize: 12
  }).catch(() => null);
  const orders = orderList?.items ?? [];
  const baseParams = new URLSearchParams();

  if (activeStatus) {
    baseParams.set("status", activeStatus);
  }

  if (search) {
    baseParams.set("search", search);
  }

  const basePath = `/admin/pedidos${baseParams.toString() ? `?${baseParams.toString()}` : ""}`;

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Operacao</p>
        <h1 className="mt-3 font-display text-4xl">Pedidos</h1>
        <p className="mt-3 max-w-2xl text-espresso/70">
          Acompanhe os pedidos recebidos, confira os itens e atualize o status da
          operacao conforme a loja evolui.
        </p>
      </div>

      <AdminFeedback searchParams={params} />

      <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
        <form className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="space-y-2 text-sm sm:min-w-72">
            <span>Buscar pedido, cliente, email ou cupom</span>
            <input
              name="search"
              defaultValue={search}
              placeholder="Ex.: ana, pedido, desconto10"
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span>Filtrar por status</span>
            <select
              name="status"
              defaultValue={activeStatus ?? "ALL"}
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none sm:min-w-56"
            >
              <option value="ALL">Todos</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button className="rounded-full bg-espresso px-5 py-3 text-sand">
            Aplicar filtro
          </button>
        </form>
      </section>

      {orders.length > 0 ? (
        <section className="space-y-4">
          {orders.map((order) => (
            <article
              key={order.id}
              className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft"
            >
              <div className="flex flex-col gap-3 border-b border-espresso/10 pb-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="font-display text-3xl">{order.customerName}</p>
                  <p className="mt-1 text-sm text-espresso/60">
                    {order.customerEmail} - Pedido em {order.createdAt}
                  </p>
                  <p className="mt-3 text-sm text-espresso/70">
                    Codigo: <span className="font-mono text-xs">{order.id}</span>
                  </p>
                </div>

                <div className="flex flex-col items-start gap-3 lg:items-end">
                  <span className="rounded-full bg-moss/10 px-3 py-1 text-xs text-moss">
                    {order.status}
                  </span>
                  <p className="font-display text-3xl">{currency(order.total)}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
                    Itens do pedido
                  </p>
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="mt-1 text-sm text-espresso/60">
                              {item.category} - {item.quantity} x {currency(item.unitPrice)}
                            </p>
                          </div>
                          <p className="text-sm font-medium">
                            {currency(item.unitPrice * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[1.5rem] border border-espresso/10 bg-white/60 p-4 text-sm text-espresso/70">
                    <p>
                      <strong>Pagamento:</strong> {order.paymentMethod}
                    </p>
                    <p className="mt-2">
                      <strong>Entrega:</strong> {order.shippingMethod}
                    </p>
                    <p className="mt-2">
                      <strong>Endereco:</strong> {order.shippingAddress}
                      {order.shippingAddress2 ? `, ${order.shippingAddress2}` : ""} -{" "}
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
                          <strong>Status mock:</strong> {order.paymentMock.status}
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
                      </div>
                    ) : null}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-espresso/10 pt-4">
                      <span>Subtotal: {currency(order.subtotal)}</span>
                      <span>Frete: {currency(order.shippingCost)}</span>
                      <strong>Total: {currency(order.total)}</strong>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
                    Atualizar status
                  </p>
                  <form action={updateOrderStatusAction} className="mt-5 space-y-4">
                    <input type="hidden" name="id" value={order.id} />
                    <input
                      type="hidden"
                      name="returnTo"
                      value={`${basePath}${basePath.includes("?") ? "&" : "?"}page=${orderList?.page ?? 1}`}
                    />
                    <label className="space-y-2 text-sm">
                      <span>Status atual</span>
                      <select
                        name="status"
                        defaultValue={order.status}
                        className="w-full rounded-2xl border border-espresso/15 bg-white px-4 py-3 outline-none"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button className="rounded-full bg-espresso px-5 py-3 text-sand">
                      Salvar status
                    </button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 text-sm text-espresso/70 shadow-soft">
          Nenhum pedido registrado ainda. Assim que o checkout receber compras, elas
          aparecerao aqui para acompanhamento da operacao.
        </div>
      )}

      {orderList && orderList.totalPages > 1 ? (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-espresso/10 bg-white/80 p-5 shadow-soft">
          <p className="text-sm text-espresso/70">
            Pagina {orderList.page} de {orderList.totalPages} - {orderList.total} pedidos
          </p>
          <div className="flex items-center gap-3">
            {orderList.page > 1 ? (
              <a
                href={`${basePath}${basePath.includes("?") ? "&" : "?"}page=${orderList.page - 1}`}
                className="rounded-full border border-espresso/15 px-4 py-2 text-sm"
              >
                Anterior
              </a>
            ) : null}
            {orderList.page < orderList.totalPages ? (
              <a
                href={`${basePath}${basePath.includes("?") ? "&" : "?"}page=${orderList.page + 1}`}
                className="rounded-full border border-espresso/15 px-4 py-2 text-sm"
              >
                Proxima
              </a>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
