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
  const orders = await getAdminOrders().catch(() => null);

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

      {orders && orders.length > 0 ? (
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
                </div>

                <div className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
                    Atualizar status
                  </p>
                  <form action={updateOrderStatusAction} className="mt-5 space-y-4">
                    <input type="hidden" name="id" value={order.id} />
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
    </div>
  );
}
