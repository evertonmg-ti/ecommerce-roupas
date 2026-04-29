import Link from "next/link";
import {
  getAdminAbandonedCarts,
  getAdminBackInStockSubscriptions
} from "@/lib/admin-api";
import { currency } from "@/lib/utils";

export default async function AdminEngagementPage() {
  const [abandonedCarts, subscriptions] = await Promise.all([
    getAdminAbandonedCarts().catch(() => []),
    getAdminBackInStockSubscriptions().catch(() => [])
  ]);

  const activeAbandonedCarts = abandonedCarts.filter((cart) => !cart.recoveredAt);
  const recoveredCarts = abandonedCarts.filter((cart) => cart.recoveredAt);
  const activeSubscriptions = subscriptions.filter((subscription) => subscription.active);
  const notifiedSubscriptions = subscriptions.filter((subscription) => !subscription.active);

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-8 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Engajamento</p>
        <h1 className="mt-4 font-display text-5xl">Recuperacao e interesse</h1>
        <p className="mt-4 max-w-3xl text-espresso/70">
          Acompanhe quem abandonou o carrinho, quem voltou a comprar e quais produtos
          concentram pedidos de aviso de volta ao estoque.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.5rem] border border-espresso/10 bg-white/75 p-5 shadow-soft">
          <p className="text-sm text-espresso/55">Carrinhos ativos</p>
          <p className="mt-2 font-display text-3xl">{activeAbandonedCarts.length}</p>
          <p className="mt-2 text-sm text-espresso/65">Aguardando recuperacao</p>
        </div>
        <div className="rounded-[1.5rem] border border-espresso/10 bg-white/75 p-5 shadow-soft">
          <p className="text-sm text-espresso/55">Carrinhos recuperados</p>
          <p className="mt-2 font-display text-3xl">{recoveredCarts.length}</p>
          <p className="mt-2 text-sm text-espresso/65">Ja convertidos em compra</p>
        </div>
        <div className="rounded-[1.5rem] border border-espresso/10 bg-white/75 p-5 shadow-soft">
          <p className="text-sm text-espresso/55">Avise-me ativos</p>
          <p className="mt-2 font-display text-3xl">{activeSubscriptions.length}</p>
          <p className="mt-2 text-sm text-espresso/65">Clientes esperando reposicao</p>
        </div>
        <div className="rounded-[1.5rem] border border-espresso/10 bg-white/75 p-5 shadow-soft">
          <p className="text-sm text-espresso/55">Avisos enviados</p>
          <p className="mt-2 font-display text-3xl">{notifiedSubscriptions.length}</p>
          <p className="mt-2 text-sm text-espresso/65">Ja notificados por email</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-terracotta">
                Carrinhos abandonados
              </p>
              <h2 className="mt-2 font-display text-3xl">Recuperacao comercial</h2>
            </div>
          </div>

          {abandonedCarts.length === 0 ? (
            <p className="mt-6 text-sm text-espresso/65">
              Nenhum carrinho abandonado foi salvo ainda.
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              {abandonedCarts.map((cart) => (
                <article
                  key={cart.id}
                  className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium">
                        {cart.customerName || "Cliente"} - {cart.email}
                      </p>
                      <p className="mt-1 text-sm text-espresso/65">
                        {cart.itemsQuantity} item(ns) em {cart.itemsCount} SKU(s)
                      </p>
                      <p className="mt-1 text-sm text-espresso/65">
                        Atualizado em {cart.updatedAt}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`rounded-full px-3 py-1 text-xs ${
                          cart.recoveredAt
                            ? "bg-moss/10 text-moss"
                            : "bg-terracotta/10 text-terracotta"
                        }`}
                      >
                        {cart.recoveredAt ? "Recuperado" : "Ativo"}
                      </p>
                      <p className="mt-2 font-medium">{currency(cart.estimatedTotal)}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {cart.items.slice(0, 3).map((item) => (
                      <Link
                        key={item.id}
                        href={`/produtos/${item.productSlug}`}
                        className="rounded-full border border-espresso/15 px-3 py-2 text-xs"
                      >
                        {item.productName} x{item.quantity}
                      </Link>
                    ))}
                    {cart.items.length > 3 ? (
                      <span className="rounded-full border border-espresso/15 px-3 py-2 text-xs text-espresso/65">
                        +{cart.items.length - 3} itens
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-espresso/65">
                    <span>
                      Ultimo email: {cart.lastEmailSentAt ?? "Ainda nao enviado"}
                    </span>
                    <Link
                      href={`/checkout?cart=${cart.token}`}
                      className="rounded-full border border-espresso/15 px-4 py-2"
                    >
                      Link de recuperacao
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
          <p className="text-xs uppercase tracking-[0.25em] text-terracotta">
            Avise-me
          </p>
          <h2 className="mt-2 font-display text-3xl">Interesse por reposicao</h2>

          {subscriptions.length === 0 ? (
            <p className="mt-6 text-sm text-espresso/65">
              Nenhuma inscricao de volta ao estoque foi registrada ainda.
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              {subscriptions.map((subscription) => (
                <article
                  key={subscription.id}
                  className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{subscription.product.name}</p>
                      <p className="mt-1 text-sm text-espresso/65">
                        {subscription.product.categoryName} - estoque atual{" "}
                        {subscription.product.stock}
                      </p>
                      <p className="mt-1 text-sm text-espresso/65">{subscription.email}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        subscription.active
                          ? "bg-terracotta/10 text-terracotta"
                          : "bg-moss/10 text-moss"
                      }`}
                    >
                      {subscription.active ? "Aguardando" : "Notificado"}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-espresso/65">
                    <span>Criado em {subscription.createdAt}</span>
                    <span>
                      {subscription.notifiedAt
                        ? `Avisado em ${subscription.notifiedAt}`
                        : "Sem envio ainda"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
