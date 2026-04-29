import { AdminFeedback } from "@/components/admin-feedback";
import { getAdminInventoryMovements } from "@/lib/admin-api";

type AdminInventoryPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const movementLabels: Record<string, string> = {
  INITIAL: "Carga inicial",
  MANUAL_ADJUSTMENT: "Ajuste manual",
  ORDER_RESERVATION: "Reserva por pedido",
  ORDER_CANCELLATION: "Devolucao por cancelamento"
};

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminInventoryPage({
  searchParams
}: AdminInventoryPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const search = getParam(params?.search)?.trim() || undefined;
  const activeType =
    typeof params?.type === "string" && params.type !== "ALL" ? params.type : undefined;
  const page =
    typeof params?.page === "string" && Number(params.page) > 0
      ? Number(params.page)
      : 1;

  const movementList = await getAdminInventoryMovements({
    search,
    type: activeType,
    page,
    pageSize: 20
  }).catch(() => null);

  const baseParams = new URLSearchParams();

  if (search) {
    baseParams.set("search", search);
  }

  if (activeType) {
    baseParams.set("type", activeType);
  }

  const basePath = `/admin/estoque${baseParams.toString() ? `?${baseParams.toString()}` : ""}`;

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Operacao</p>
        <h1 className="mt-3 font-display text-4xl">Movimentacoes de estoque</h1>
        <p className="mt-3 max-w-2xl text-espresso/70">
          Trilha cronologica de entradas, saidas, reservas e ajustes manuais do inventario.
        </p>
      </div>

      <AdminFeedback searchParams={params} />

      <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
        <form className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="space-y-2 text-sm sm:min-w-72">
            <span>Buscar por produto, pedido, email ou motivo</span>
            <input
              name="search"
              defaultValue={search}
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
              placeholder="camiseta, pedido, reposicao..."
            />
          </label>
          <label className="space-y-2 text-sm">
            <span>Tipo</span>
            <select
              name="type"
              defaultValue={activeType ?? "ALL"}
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none sm:min-w-64"
            >
              <option value="ALL">Todos</option>
              {Object.entries(movementLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button className="rounded-full bg-espresso px-5 py-3 text-sand">
            Aplicar filtro
          </button>
        </form>
      </section>

      {movementList ? (
        <>
          <section className="space-y-4">
            {movementList.items.map((movement) => {
              const isPositive = movement.quantityDelta > 0;

              return (
                <article
                  key={movement.id}
                  className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-display text-2xl">{movement.productName}</p>
                      <p className="mt-1 text-sm text-espresso/60">
                        {movement.category} - {movement.productSlug}
                      </p>
                      <p className="mt-3 text-sm text-espresso/70">
                        {movementLabels[movement.type] ?? movement.type}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-display text-3xl ${
                          isPositive ? "text-moss" : "text-terracotta"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {movement.quantityDelta}
                      </p>
                      <p className="mt-1 text-sm text-espresso/60">{movement.createdAt}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-4">
                    <div className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4">
                      <p className="text-sm text-espresso/55">Antes</p>
                      <p className="mt-2 font-display text-3xl">{movement.previousStock}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4">
                      <p className="text-sm text-espresso/55">Depois</p>
                      <p className="mt-2 font-display text-3xl">{movement.nextStock}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4">
                      <p className="text-sm text-espresso/55">Operador</p>
                      <p className="mt-2 text-sm text-espresso/75">
                        {movement.actorName ?? movement.actorEmail ?? "Sistema"}
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4">
                      <p className="text-sm text-espresso/55">Pedido</p>
                      <p className="mt-2 text-sm text-espresso/75">
                        {movement.orderId
                          ? `${movement.orderId} - ${movement.orderCustomerName ?? "Cliente"}`
                          : "Sem pedido vinculado"}
                      </p>
                    </div>
                  </div>

                  {movement.reason ? (
                    <div className="mt-4 rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4 text-sm text-espresso/70">
                      {movement.reason}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </section>

          {movementList.totalPages > 1 ? (
            <section className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-espresso/10 bg-white/80 p-5 shadow-soft">
              <p className="text-sm text-espresso/70">
                Pagina {movementList.page} de {movementList.totalPages} - {movementList.total} movimentacoes
              </p>
              <div className="flex items-center gap-3">
                {movementList.page > 1 ? (
                  <a
                    href={`${basePath}${basePath.includes("?") ? "&" : "?"}page=${movementList.page - 1}`}
                    className="rounded-full border border-espresso/15 px-4 py-2 text-sm"
                  >
                    Anterior
                  </a>
                ) : null}
                {movementList.page < movementList.totalPages ? (
                  <a
                    href={`${basePath}${basePath.includes("?") ? "&" : "?"}page=${movementList.page + 1}`}
                    className="rounded-full border border-espresso/15 px-4 py-2 text-sm"
                  >
                    Proxima
                  </a>
                ) : null}
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <div className="rounded-[2rem] border border-terracotta/20 bg-white/80 p-6 text-sm text-espresso/70 shadow-soft">
          Nao foi possivel carregar a trilha de estoque. Faca login novamente para renovar a sessao.
        </div>
      )}
    </div>
  );
}
