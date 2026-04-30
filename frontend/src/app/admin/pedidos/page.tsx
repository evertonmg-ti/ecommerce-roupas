import { AdminFeedback } from "@/components/admin-feedback";
import { getAdminOrders } from "@/lib/admin-api";
import { currency } from "@/lib/utils";
import {
  updateOrderStatusAction,
  updateReturnRequestStatusAction
} from "./actions";

const statusOptions = [
  { value: "PENDING", label: "Pendente" },
  { value: "PAID", label: "Pago" },
  { value: "SHIPPED", label: "Enviado" },
  { value: "DELIVERED", label: "Entregue" },
  { value: "CANCELED", label: "Cancelado" }
];

const returnRequestStatusLabels: Record<string, string> = {
  REQUESTED: "Solicitada",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
  RECEIVED: "Recebida",
  COMPLETED: "Concluida"
};

const returnRequestTypeLabels: Record<string, string> = {
  EXCHANGE: "Troca",
  REFUND: "Devolucao"
};

const returnFinancialStatusLabels: Record<string, string> = {
  NOT_APPLICABLE: "Nao se aplica",
  PENDING: "Pendente",
  REFUNDED: "Reembolsado",
  STORE_CREDIT_ISSUED: "Vale-troca emitido"
};

function getReturnRequestTransitionOptions(status: string) {
  const keepCurrent = {
    value: status,
    label: "Salvar dados sem mudar status"
  };

  switch (status) {
    case "REQUESTED":
      return [
        keepCurrent,
        { value: "APPROVED", label: "Aprovar" },
        { value: "REJECTED", label: "Rejeitar" }
      ];
    case "APPROVED":
      return [
        keepCurrent,
        { value: "RECEIVED", label: "Marcar recebimento" },
        { value: "REJECTED", label: "Rejeitar" }
      ];
    case "RECEIVED":
      return [keepCurrent, { value: "COMPLETED", label: "Concluir" }];
    default:
      return [keepCurrent];
  }
}

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
                    {order.trackingCode ? (
                      <p className="mt-2">
                        <strong>Rastreio:</strong> {order.trackingCode}
                      </p>
                    ) : null}
                    <p className="mt-2">
                      <strong>Entrega:</strong> {order.shippingMethod}
                    </p>
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
                    <div className="mt-4 grid gap-2 rounded-[1rem] border border-espresso/10 bg-sand/35 p-4 text-xs text-espresso/70">
                      <p>
                        <strong>Criado em:</strong> {order.createdAt}
                      </p>
                      {order.paidAt ? (
                        <p>
                          <strong>Pago em:</strong>{" "}
                          {new Date(order.paidAt).toLocaleString("pt-BR")}
                        </p>
                      ) : null}
                      {order.shippedAt ? (
                        <p>
                          <strong>Enviado em:</strong>{" "}
                          {new Date(order.shippedAt).toLocaleString("pt-BR")}
                        </p>
                      ) : null}
                      {order.deliveredAt ? (
                        <p>
                          <strong>Entregue em:</strong>{" "}
                          {new Date(order.deliveredAt).toLocaleString("pt-BR")}
                        </p>
                      ) : null}
                      {order.canceledAt ? (
                        <p>
                          <strong>Cancelado em:</strong>{" "}
                          {new Date(order.canceledAt).toLocaleString("pt-BR")}
                        </p>
                      ) : null}
                    </div>

                    {order.returnRequests.length > 0 ? (
                      <div className="mt-4 rounded-[1rem] border border-espresso/10 bg-sand/35 p-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
                          Trocas e devolucoes
                        </p>
                        <div className="mt-4 space-y-4">
                          {order.returnRequests.map((request) => {
                            const transitionOptions = getReturnRequestTransitionOptions(
                              request.status
                            );

                            return (
                              <div
                                key={request.id}
                                className="rounded-[1rem] border border-espresso/10 bg-white/70 p-4"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <p className="font-medium">
                                      {returnRequestTypeLabels[request.type] ?? request.type}
                                    </p>
                                    <p className="mt-1 text-xs text-espresso/60">
                                      Solicitada em {request.createdAt}
                                    </p>
                                  </div>
                                  <span className="rounded-full bg-moss/10 px-3 py-1 text-xs text-moss">
                                    {returnRequestStatusLabels[request.status] ?? request.status}
                                  </span>
                                </div>

                                <div className="mt-3 space-y-2 text-sm text-espresso/70">
                                  <p>
                                    <strong>Motivo:</strong> {request.reason}
                                  </p>
                                  {request.details ? (
                                    <p>
                                      <strong>Detalhes:</strong> {request.details}
                                    </p>
                                  ) : null}
                                  {request.reverseLogisticsCode ? (
                                    <p>
                                      <strong>Codigo de postagem:</strong>{" "}
                                      {request.reverseLogisticsCode}
                                    </p>
                                  ) : null}
                                  {request.reverseShippingLabel ? (
                                    <p>
                                      <strong>Etiqueta/Referencia:</strong>{" "}
                                      {request.reverseShippingLabel}
                                    </p>
                                  ) : null}
                                  {request.returnDestinationAddress ? (
                                    <p>
                                      <strong>Endereco de devolucao:</strong>{" "}
                                      {request.returnDestinationAddress}
                                    </p>
                                  ) : null}
                                  {request.reverseInstructions ? (
                                    <p>
                                      <strong>Instrucoes:</strong>{" "}
                                      {request.reverseInstructions}
                                    </p>
                                  ) : null}
                                  {request.reverseDeadlineAt ? (
                                    <p>
                                      <strong>Prazo logistica reversa:</strong>{" "}
                                      {request.reverseDeadlineAt}
                                    </p>
                                  ) : null}
                                  {request.financialStatus ? (
                                    <p>
                                      <strong>Status financeiro:</strong>{" "}
                                      {returnFinancialStatusLabels[request.financialStatus] ??
                                        request.financialStatus}
                                    </p>
                                  ) : null}
                                  {request.refundAmount > 0 ? (
                                    <p>
                                      <strong>Reembolso:</strong>{" "}
                                      {currency(request.refundAmount)}
                                    </p>
                                  ) : null}
                                  {request.storeCreditAmount > 0 ? (
                                    <p>
                                      <strong>Vale-troca:</strong>{" "}
                                      {currency(request.storeCreditAmount)}
                                    </p>
                                  ) : null}
                                  {request.receivedAt ? (
                                    <p>
                                      <strong>Recebido em:</strong> {request.receivedAt}
                                    </p>
                                  ) : null}
                                  {request.completedAt ? (
                                    <p>
                                      <strong>Concluido em:</strong> {request.completedAt}
                                    </p>
                                  ) : null}
                                  {request.restockedAt ? (
                                    <p>
                                      <strong>Reentrada em estoque:</strong>{" "}
                                      {request.restockedAt}
                                    </p>
                                  ) : null}
                                  {request.restockNote ? (
                                    <p>
                                      <strong>Nota de reentrada:</strong>{" "}
                                      {request.restockNote}
                                    </p>
                                  ) : null}
                                  {request.resolutionNote ? (
                                    <p>
                                      <strong>Observacao interna:</strong>{" "}
                                      {request.resolutionNote}
                                    </p>
                                  ) : null}
                                  {request.selectedItems.length > 0 ? (
                                    <div>
                                      <strong>Itens selecionados:</strong>
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {request.selectedItems.map((selectedItem) => {
                                          const matchedItem = order.items.find(
                                            (item) => item.id === selectedItem.orderItemId
                                          );

                                          return (
                                            <span
                                              key={selectedItem.orderItemId}
                                              className="rounded-full border border-espresso/10 bg-sand px-3 py-1 text-xs"
                                            >
                                              {matchedItem?.name ?? "Item"}{" "}
                                              {selectedItem.variantLabel
                                                ? `- ${selectedItem.variantLabel}`
                                                : ""}{" "}
                                              x {selectedItem.quantity}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ) : null}
                                  <p className="text-xs text-espresso/55">
                                    Ultima atualizacao em {request.updatedAt}
                                  </p>
                                </div>

                                {transitionOptions.length > 0 ? (
                                  <form
                                    action={updateReturnRequestStatusAction}
                                    className="mt-4 space-y-3 border-t border-espresso/10 pt-4"
                                  >
                                    <input type="hidden" name="orderId" value={order.id} />
                                    <input type="hidden" name="requestId" value={request.id} />
                                    <input
                                      type="hidden"
                                      name="returnTo"
                                      value={`${basePath}${basePath.includes("?") ? "&" : "?"}page=${orderList?.page ?? 1}`}
                                    />
                                    <label className="space-y-2 text-sm">
                                      <span>Atualizar solicitacao</span>
                                      <select
                                        name="status"
                                        defaultValue={transitionOptions[0]?.value}
                                        className="w-full rounded-2xl border border-espresso/15 bg-white px-4 py-3 outline-none"
                                      >
                                        {transitionOptions.map((option) => (
                                          <option key={option.value} value={option.value}>
                                            {option.label}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                    <label className="space-y-2 text-sm">
                                      <span>Observacao</span>
                                      <textarea
                                        name="resolutionNote"
                                        rows={3}
                                        defaultValue={request.resolutionNote ?? ""}
                                        placeholder="Ex.: item recebido no CD e validado pela operacao."
                                        className="w-full rounded-2xl border border-espresso/15 bg-white px-4 py-3 outline-none"
                                      />
                                    </label>
                                    <div className="grid gap-3 md:grid-cols-2">
                                      <label className="space-y-2 text-sm">
                                        <span>Codigo de postagem</span>
                                        <input
                                          name="reverseLogisticsCode"
                                          defaultValue={request.reverseLogisticsCode ?? ""}
                                          className="w-full rounded-2xl border border-espresso/15 bg-white px-4 py-3 outline-none"
                                        />
                                      </label>
                                      <label className="space-y-2 text-sm">
                                        <span>Etiqueta/Referencia</span>
                                        <input
                                          name="reverseShippingLabel"
                                          defaultValue={request.reverseShippingLabel ?? ""}
                                          className="w-full rounded-2xl border border-espresso/15 bg-white px-4 py-3 outline-none"
                                        />
                                      </label>
                                    </div>
                                    <label className="space-y-2 text-sm">
                                      <span>Endereco de devolucao</span>
                                      <textarea
                                        name="returnDestinationAddress"
                                        rows={2}
                                        defaultValue={request.returnDestinationAddress ?? ""}
                                        className="w-full rounded-2xl border border-espresso/15 bg-white px-4 py-3 outline-none"
                                      />
                                    </label>
                                    <label className="space-y-2 text-sm">
                                      <span>Instrucoes para o cliente</span>
                                      <textarea
                                        name="reverseInstructions"
                                        rows={3}
                                        defaultValue={request.reverseInstructions ?? ""}
                                        className="w-full rounded-2xl border border-espresso/15 bg-white px-4 py-3 outline-none"
                                      />
                                    </label>
                                    <div className="grid gap-3 md:grid-cols-2">
                                      <label className="space-y-2 text-sm">
                                        <span>Prazo da devolucao</span>
                                        <input
                                          type="datetime-local"
                                          name="reverseDeadlineAt"
                                          defaultValue={request.reverseDeadlineAt ?? ""}
                                          className="w-full rounded-2xl border border-espresso/15 bg-white px-4 py-3 outline-none"
                                        />
                                      </label>
                                      <label className="space-y-2 text-sm">
                                        <span>Status financeiro</span>
                                        <select
                                          name="financialStatus"
                                          defaultValue={
                                            request.financialStatus ??
                                            (request.type === "REFUND"
                                              ? "PENDING"
                                              : "NOT_APPLICABLE")
                                          }
                                          className="w-full rounded-2xl border border-espresso/15 bg-white px-4 py-3 outline-none"
                                        >
                                          <option value="NOT_APPLICABLE">Nao se aplica</option>
                                          <option value="PENDING">Pendente</option>
                                          <option value="REFUNDED">Reembolsado</option>
                                          <option value="STORE_CREDIT_ISSUED">
                                            Vale-troca emitido
                                          </option>
                                        </select>
                                      </label>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2">
                                      <label className="space-y-2 text-sm">
                                        <span>Valor de reembolso</span>
                                        <input
                                          type="number"
                                          name="refundAmount"
                                          step="0.01"
                                          min="0"
                                          defaultValue={request.refundAmount}
                                          className="w-full rounded-2xl border border-espresso/15 bg-white px-4 py-3 outline-none"
                                        />
                                      </label>
                                      <label className="space-y-2 text-sm">
                                        <span>Valor de vale-troca</span>
                                        <input
                                          type="number"
                                          name="storeCreditAmount"
                                          step="0.01"
                                          min="0"
                                          defaultValue={request.storeCreditAmount}
                                          className="w-full rounded-2xl border border-espresso/15 bg-white px-4 py-3 outline-none"
                                        />
                                      </label>
                                    </div>
                                    <label className="flex items-center gap-2 text-sm text-espresso/70">
                                      <input
                                        type="checkbox"
                                        name="restockItems"
                                        defaultChecked={request.restockItems}
                                      />
                                      Reintegrar item ao estoque ao marcar recebimento
                                    </label>
                                    <label className="space-y-2 text-sm">
                                      <span>Nota de reentrada / descarte</span>
                                      <textarea
                                        name="restockNote"
                                        rows={2}
                                        defaultValue={request.restockNote ?? ""}
                                        placeholder="Ex.: item conferido, sem avaria, reentrada liberada."
                                        className="w-full rounded-2xl border border-espresso/15 bg-white px-4 py-3 outline-none"
                                      />
                                    </label>
                                    <button className="rounded-full bg-espresso px-5 py-3 text-sand">
                                      Salvar solicitacao
                                    </button>
                                  </form>
                                ) : (
                                  <p className="mt-4 text-xs text-espresso/55">
                                    Esta solicitacao ja chegou a um estado final no fluxo
                                    administrativo.
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
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
                    <label className="space-y-2 text-sm">
                      <span>Codigo de rastreio</span>
                      <input
                        name="trackingCode"
                        defaultValue={order.trackingCode ?? ""}
                        placeholder="Opcional"
                        className="w-full rounded-2xl border border-espresso/15 bg-white px-4 py-3 outline-none"
                      />
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
