import { lookupCustomerOrders } from "@/lib/admin-api";
import { currency } from "@/lib/utils";

type CustomerOrdersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CustomerOrdersPage({
  searchParams
}: CustomerOrdersPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const email = getParamValue(params?.email)?.trim();
  const orders = email ? await lookupCustomerOrders(email).catch(() => null) : null;

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

        {email && orders && orders.length === 0 ? (
          <div className="mt-8 rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4 text-sm text-espresso/70">
            Nenhum pedido foi encontrado para este email.
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
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
