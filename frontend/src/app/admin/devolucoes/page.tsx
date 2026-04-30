import { AdminFeedback } from "@/components/admin-feedback";
import { getAdminReturnRequests } from "@/lib/admin-api";
import { currency } from "@/lib/utils";
import { updateReturnRequestStatusAction } from "../pedidos/actions";

const statusLabels: Record<string, string> = {
  REQUESTED: "Solicitada",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
  RECEIVED: "Recebida",
  COMPLETED: "Concluida"
};

const typeLabels: Record<string, string> = {
  EXCHANGE: "Troca",
  REFUND: "Devolucao"
};

const financialStatusLabels: Record<string, string> = {
  NOT_APPLICABLE: "Nao se aplica",
  PENDING: "Pendente",
  REFUNDED: "Reembolsado",
  STORE_CREDIT_ISSUED: "Vale-troca emitido"
};

const priorityClasses: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700",
  HIGH: "bg-terracotta/10 text-terracotta",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-moss/10 text-moss"
};

function getTransitionOptions(status: string) {
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
      return [{ value: status, label: "Sem acao adicional" }];
  }
}

type AdminReturnsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminReturnsPage({
  searchParams
}: AdminReturnsPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const activeStatus =
    typeof params?.status === "string" && params.status !== "ALL"
      ? params.status
      : undefined;
  const activeType =
    typeof params?.type === "string" && params.type !== "ALL" ? params.type : undefined;
  const activeFinancialStatus =
    typeof params?.financialStatus === "string" && params.financialStatus !== "ALL"
      ? params.financialStatus
      : undefined;
  const activePriority =
    typeof params?.priority === "string" && params.priority !== "ALL"
      ? params.priority
      : undefined;
  const search =
    typeof params?.search === "string" && params.search.trim()
      ? params.search.trim()
      : undefined;
  const page =
    typeof params?.page === "string" && Number(params.page) > 0
      ? Number(params.page)
      : 1;

  const list = await getAdminReturnRequests({
    status: activeStatus,
    type: activeType,
    financialStatus: activeFinancialStatus,
    priority: activePriority,
    search,
    page,
    pageSize: 12
  }).catch(() => null);
  const requests = list?.items ?? [];

  const baseParams = new URLSearchParams();

  if (activeStatus) {
    baseParams.set("status", activeStatus);
  }

  if (activeType) {
    baseParams.set("type", activeType);
  }

  if (activeFinancialStatus) {
    baseParams.set("financialStatus", activeFinancialStatus);
  }

  if (activePriority) {
    baseParams.set("priority", activePriority);
  }

  if (search) {
    baseParams.set("search", search);
  }

  const basePath = `/admin/devolucoes${baseParams.toString() ? `?${baseParams.toString()}` : ""}`;

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
          Pos-venda
        </p>
        <h1 className="mt-3 font-display text-4xl">Fila de devolucoes e trocas</h1>
        <p className="mt-3 max-w-2xl text-espresso/70">
          Operacao dedicada para tratar solicitacoes com prioridade, prazo e
          desdobramento logistico/financeiro.
        </p>
      </div>

      <AdminFeedback searchParams={params} />

      {list ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <article className="rounded-[1.5rem] border border-espresso/10 bg-white/80 p-5 shadow-soft">
            <p className="text-sm text-espresso/55">Em andamento</p>
            <p className="mt-2 font-display text-4xl">{list.summary.openCount}</p>
            <p className="mt-2 text-sm text-moss">Fila operacional aberta</p>
          </article>
          <article className="rounded-[1.5rem] border border-espresso/10 bg-white/80 p-5 shadow-soft">
            <p className="text-sm text-espresso/55">Criticas</p>
            <p className="mt-2 font-display text-4xl">{list.summary.criticalCount}</p>
            <p className="mt-2 text-sm text-terracotta">Prioridade maxima</p>
          </article>
          <article className="rounded-[1.5rem] border border-espresso/10 bg-white/80 p-5 shadow-soft">
            <p className="text-sm text-espresso/55">Reembolso pendente</p>
            <p className="mt-2 font-display text-4xl">{list.summary.refundPendingCount}</p>
            <p className="mt-2 text-sm text-espresso/65">Aguardando decisao financeira</p>
          </article>
          <article className="rounded-[1.5rem] border border-espresso/10 bg-white/80 p-5 shadow-soft">
            <p className="text-sm text-espresso/55">Aguardando recebimento</p>
            <p className="mt-2 font-display text-4xl">{list.summary.awaitingReceiptCount}</p>
            <p className="mt-2 text-sm text-espresso/65">Logistica reversa em curso</p>
          </article>
          <article className="rounded-[1.5rem] border border-espresso/10 bg-white/80 p-5 shadow-soft">
            <p className="text-sm text-espresso/55">Fora do prazo</p>
            <p className="mt-2 font-display text-4xl">{list.summary.overdueCount}</p>
            <p className="mt-2 text-sm text-terracotta">Casos com SLA estourado</p>
          </article>
        </section>
      ) : null}

      <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
        <form className="grid gap-4 xl:grid-cols-[1.35fr_0.68fr_0.68fr_0.82fr_0.68fr_auto] xl:items-end">
          <label className="space-y-2 text-sm">
            <span>Buscar por cliente, email, pedido ou motivo</span>
            <input
              name="search"
              defaultValue={search}
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
              placeholder="Ex.: pedido, email, tamanho incorreto"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span>Status</span>
            <select
              name="status"
              defaultValue={activeStatus ?? "ALL"}
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
            >
              <option value="ALL">Todos</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span>Tipo</span>
            <select
              name="type"
              defaultValue={activeType ?? "ALL"}
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
            >
              <option value="ALL">Todos</option>
              {Object.entries(typeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span>Prioridade</span>
            <select
              name="priority"
              defaultValue={activePriority ?? "ALL"}
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
            >
              <option value="ALL">Todas</option>
              <option value="CRITICAL">Critica</option>
              <option value="HIGH">Alta</option>
              <option value="MEDIUM">Media</option>
              <option value="LOW">Baixa</option>
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span>Financeiro</span>
            <select
              name="financialStatus"
              defaultValue={activeFinancialStatus ?? "ALL"}
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
            >
              <option value="ALL">Todos</option>
              <option value="NOT_APPLICABLE">Nao se aplica</option>
              <option value="PENDING">Pendente</option>
              <option value="REFUNDED">Reembolsado</option>
              <option value="STORE_CREDIT_ISSUED">Vale-troca emitido</option>
            </select>
          </label>
          <button className="rounded-full bg-espresso px-5 py-3 text-sand">
            Filtrar
          </button>
        </form>
      </section>

      {requests.length > 0 ? (
        <section className="space-y-4">
          {requests.map((request) => {
            const transitionOptions = getTransitionOptions(request.status);

            return (
              <article
                key={request.id}
                className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft"
              >
                <div className="flex flex-col gap-4 border-b border-espresso/10 pb-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-display text-3xl">
                        {typeLabels[request.type] ?? request.type}
                      </p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${
                          priorityClasses[request.priority] ?? "bg-sand text-espresso"
                        }`}
                      >
                        {request.priority}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-espresso/60">
                      {request.customerName} - {request.customerEmail}
                    </p>
                    <p className="mt-1 text-sm text-espresso/60">
                      Pedido {request.orderId} - {request.orderStatus} - criada em{" "}
                      {request.createdAt}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs">
                      <a
                        href={`/admin/pedidos?search=${encodeURIComponent(request.orderId)}`}
                        className="rounded-full border border-espresso/15 px-3 py-1"
                      >
                        Ver pedido
                      </a>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 lg:items-end">
                    <span className="rounded-full bg-moss/10 px-3 py-1 text-xs text-moss">
                      {statusLabels[request.status] ?? request.status}
                    </span>
                    <p className="text-sm text-espresso/65">{request.slaLabel}</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="space-y-4">
                    <div className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4 text-sm text-espresso/70">
                      <p>
                        <strong>Motivo:</strong> {request.reason}
                      </p>
                      {request.details ? (
                        <p className="mt-2">
                          <strong>Detalhes:</strong> {request.details}
                        </p>
                      ) : null}
                      {request.resolutionNote ? (
                        <p className="mt-2">
                          <strong>Observacao interna:</strong> {request.resolutionNote}
                        </p>
                      ) : null}
                      <div className="mt-4 grid gap-2 text-xs text-espresso/60">
                        <p>
                          <strong>Status financeiro:</strong>{" "}
                          {financialStatusLabels[request.financialStatus ?? "NOT_APPLICABLE"] ??
                            request.financialStatus}
                        </p>
                        {request.refundAmount > 0 ? (
                          <p>
                            <strong>Reembolso:</strong> {currency(request.refundAmount)}
                          </p>
                        ) : null}
                        {request.storeCreditAmount > 0 ? (
                          <p>
                            <strong>Vale-troca:</strong>{" "}
                            {currency(request.storeCreditAmount)}
                          </p>
                        ) : null}
                        {request.reverseDeadlineAt ? (
                          <p>
                            <strong>Prazo logistica reversa:</strong>{" "}
                            {request.reverseDeadlineAt.replace("T", " ")}
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
                            <strong>Reentrada em estoque:</strong> {request.restockedAt}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4 text-sm text-espresso/70">
                      <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
                        Itens envolvidos
                      </p>
                      <div className="mt-3 space-y-2">
                        {request.selectedItems.map((item) => (
                          <div
                            key={item.orderItemId}
                            className="rounded-[1rem] border border-espresso/10 bg-white/60 p-3"
                          >
                            <p className="font-medium text-espresso">
                              {item.productName}
                              {item.variantLabel ? ` - ${item.variantLabel}` : ""}
                            </p>
                            <p className="mt-1 text-xs text-espresso/60">
                              {item.categoryName} - {item.quantity} unidade(s)
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4 text-sm text-espresso/70">
                      <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
                        Logistica reversa
                      </p>
                      <div className="mt-3 grid gap-2 text-sm">
                        {request.reverseLogisticsCode ? (
                          <p>
                            <strong>Codigo:</strong> {request.reverseLogisticsCode}
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
                            <strong>Endereco:</strong>{" "}
                            {request.returnDestinationAddress}
                          </p>
                        ) : null}
                        {request.reverseInstructions ? (
                          <p>
                            <strong>Instrucoes:</strong> {request.reverseInstructions}
                          </p>
                        ) : null}
                        {request.restockNote ? (
                          <p>
                            <strong>Nota operacional:</strong> {request.restockNote}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-5">
                    <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
                      Tratar solicitacao
                    </p>
                    <form action={updateReturnRequestStatusAction} className="mt-5 space-y-4">
                      <input type="hidden" name="orderId" value={request.orderId} />
                      <input type="hidden" name="requestId" value={request.id} />
                      <input
                        type="hidden"
                        name="returnTo"
                        value={`${basePath}${basePath.includes("?") ? "&" : "?"}page=${list?.page ?? 1}`}
                      />
                      <label className="space-y-2 text-sm">
                        <span>Acao</span>
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
                        <span>Instrucoes</span>
                        <textarea
                          name="reverseInstructions"
                          rows={3}
                          defaultValue={request.reverseInstructions ?? ""}
                          className="w-full rounded-2xl border border-espresso/15 bg-white px-4 py-3 outline-none"
                        />
                      </label>
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="space-y-2 text-sm">
                          <span>Prazo</span>
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
                            <option value="STORE_CREDIT_ISSUED">Vale-troca emitido</option>
                          </select>
                        </label>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="space-y-2 text-sm">
                          <span>Reembolso</span>
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
                          <span>Vale-troca</span>
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
                        <span>Nota operacional</span>
                        <textarea
                          name="restockNote"
                          rows={2}
                          defaultValue={request.restockNote ?? ""}
                          className="w-full rounded-2xl border border-espresso/15 bg-white px-4 py-3 outline-none"
                        />
                      </label>
                      <button className="rounded-full bg-espresso px-5 py-3 text-sand">
                        Salvar tratamento
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 text-sm text-espresso/70 shadow-soft">
          Nenhuma solicitacao encontrada com os filtros atuais.
        </div>
      )}

      {list && list.totalPages > 1 ? (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-espresso/10 bg-white/80 p-5 shadow-soft">
          <p className="text-sm text-espresso/70">
            Pagina {list.page} de {list.totalPages} - {list.total} solicitacoes
          </p>
          <div className="flex items-center gap-3">
            {list.page > 1 ? (
              <a
                href={`${basePath}${basePath.includes("?") ? "&" : "?"}page=${list.page - 1}`}
                className="rounded-full border border-espresso/15 px-4 py-2 text-sm"
              >
                Anterior
              </a>
            ) : null}
            {list.page < list.totalPages ? (
              <a
                href={`${basePath}${basePath.includes("?") ? "&" : "?"}page=${list.page + 1}`}
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
