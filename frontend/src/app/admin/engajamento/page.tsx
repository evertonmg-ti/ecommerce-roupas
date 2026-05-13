import Link from "next/link";
import { AdminFeedback } from "@/components/admin-feedback";
import {
  getAdminAbandonedCarts,
  getAdminBackInStockSubscriptions,
  getAdminCustomerSegments,
  getAdminDormantWalletCustomers
} from "@/lib/admin-api";
import { currency } from "@/lib/utils";
import {
  resendAbandonedCartReminderAction,
  sendSegmentCampaignAction,
  sendWalletReminderAction,
  triggerAbandonedCartCampaignAction,
  triggerWalletReminderCampaignAction
} from "./actions";

type AdminEngagementPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminEngagementPage({
  searchParams
}: AdminEngagementPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const [abandonedCarts, subscriptions, dormantWalletCustomers, customerSegments] =
    await Promise.all([
      getAdminAbandonedCarts().catch(() => []),
      getAdminBackInStockSubscriptions().catch(() => []),
      getAdminDormantWalletCustomers().catch(() => []),
      getAdminCustomerSegments().catch(() => ({
        categories: [],
        summary: {
          noOrdersCount: 0,
          recentBuyers30dCount: 0,
          inactive60dCount: 0
        }
      }))
    ]);

  const activeAbandonedCarts = abandonedCarts.filter((cart) => !cart.recoveredAt);
  const recoveredCarts = abandonedCarts.filter((cart) => cart.recoveredAt);
  const activeSubscriptions = subscriptions.filter((subscription) => subscription.active);
  const notifiedSubscriptions = subscriptions.filter((subscription) => !subscription.active);
  const dormantWalletTotal = dormantWalletCustomers.reduce(
    (sum, customer) => sum + customer.walletBalance,
    0
  );

  return (
    <section className="space-y-6">
      <AdminFeedback searchParams={params} />
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
        <div className="rounded-[1.5rem] border border-espresso/10 bg-white/75 p-5 shadow-soft">
          <p className="text-sm text-espresso/55">Clientes com saldo parado</p>
          <p className="mt-2 font-display text-3xl">{dormantWalletCustomers.length}</p>
          <p className="mt-2 text-sm text-espresso/65">
            {currency(dormantWalletTotal)} aguardando reativacao
          </p>
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
            <div className="flex flex-wrap gap-2">
              <form action={triggerAbandonedCartCampaignAction}>
                <input type="hidden" name="stage" value="SECOND_TOUCH" />
                <button className="rounded-full border border-espresso/15 px-4 py-2 text-sm">
                  Disparar 2o toque
                </button>
              </form>
              <form action={triggerAbandonedCartCampaignAction}>
                <input type="hidden" name="stage" value="THIRD_TOUCH" />
                <button className="rounded-full border border-espresso/15 px-4 py-2 text-sm">
                  Disparar 3o toque
                </button>
              </form>
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
                      <p className="mt-1 text-sm text-espresso/65">
                        Toques enviados: {cart.reminderCount} - estagio {cart.recoveryStage}
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
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/checkout?cart=${cart.token}`}
                        className="rounded-full border border-espresso/15 px-4 py-2"
                      >
                        Link de recuperacao
                      </Link>
                      {!cart.recoveredAt ? (
                        <form action={resendAbandonedCartReminderAction}>
                          <input type="hidden" name="id" value={cart.id} />
                          <button className="rounded-full border border-espresso/15 px-4 py-2">
                            Reenviar email
                          </button>
                        </form>
                      ) : null}
                    </div>
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

      <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.25em] text-terracotta">
          Reativacao de credito
        </p>
        <h2 className="mt-2 font-display text-3xl">Clientes com saldo parado</h2>
        <p className="mt-3 max-w-3xl text-sm text-espresso/65">
          Reative clientes que ainda possuem credito em carteira, mas estao sem interacao
          recente. O email leva o cliente de volta para a conta autenticada.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <form action={triggerWalletReminderCampaignAction}>
            <input type="hidden" name="segment" value="DORMANT_7_DAYS" />
            <button className="rounded-full border border-espresso/15 px-4 py-2 text-sm">
              Campanha 7+ dias
            </button>
          </form>
          <form action={triggerWalletReminderCampaignAction}>
            <input type="hidden" name="segment" value="DORMANT_30_DAYS" />
            <button className="rounded-full border border-espresso/15 px-4 py-2 text-sm">
              Campanha 30+ dias
            </button>
          </form>
        </div>

        {dormantWalletCustomers.length === 0 ? (
          <p className="mt-6 text-sm text-espresso/65">
            Nenhum cliente com saldo parado foi identificado no momento.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {dormantWalletCustomers.map((customer) => (
              <article
                key={customer.id}
                className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium">
                      {customer.name} - {customer.email}
                    </p>
                    <p className="mt-1 text-sm text-espresso/65">
                      Sem interacao relevante ha {customer.dormantDays} dia(s)
                    </p>
                    <p className="mt-1 text-sm text-espresso/65">
                      Ultima interacao: {customer.lastInteractionAt}
                    </p>
                    <p className="mt-1 text-sm text-espresso/65">
                      Ultima campanha: {customer.lastWalletReminderSentAt ?? "Ainda nao enviada"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{currency(customer.walletBalance)}</p>
                    <p className="mt-1 text-xs text-espresso/55">Saldo em carteira</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm text-espresso/65">
                  <div className="rounded-[1rem] border border-espresso/10 bg-white/60 p-3">
                    <p className="font-medium text-espresso">Ultimo pedido</p>
                    {customer.lastOrder ? (
                      <>
                        <p className="mt-1">{customer.lastOrder.id}</p>
                        <p className="mt-1">
                          {customer.lastOrder.createdAt} - {customer.lastOrder.status}
                        </p>
                        <p className="mt-1">{currency(customer.lastOrder.total)}</p>
                      </>
                    ) : (
                      <p className="mt-1">Sem pedido recente registrado.</p>
                    )}
                  </div>
                  <div className="rounded-[1rem] border border-espresso/10 bg-white/60 p-3">
                    <p className="font-medium text-espresso">Ultimo movimento de credito</p>
                    {customer.lastCreditTransaction ? (
                      <>
                        <p className="mt-1">{customer.lastCreditTransaction.createdAt}</p>
                        <p className="mt-1">{customer.lastCreditTransaction.description}</p>
                      </>
                    ) : (
                      <p className="mt-1">Sem movimentacao recente de credito.</p>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <form action={sendWalletReminderAction}>
                    <input type="hidden" name="userId" value={customer.id} />
                    <button className="rounded-full border border-espresso/15 px-4 py-2 text-sm">
                      Enviar campanha de credito
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.25em] text-terracotta">
          Campanhas segmentadas
        </p>
        <h2 className="mt-2 font-display text-3xl">CRM comercial</h2>
        <p className="mt-3 max-w-3xl text-sm text-espresso/65">
          Dispare campanhas manuais por comportamento ou por colecao comprada para
          acelerar recompra e descoberta.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4">
            <p className="text-sm text-espresso/55">Sem pedidos</p>
            <p className="mt-2 font-display text-3xl">
              {customerSegments.summary.noOrdersCount}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4">
            <p className="text-sm text-espresso/55">Compradores 30d</p>
            <p className="mt-2 font-display text-3xl">
              {customerSegments.summary.recentBuyers30dCount}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4">
            <p className="text-sm text-espresso/55">Inativos 60d</p>
            <p className="mt-2 font-display text-3xl">
              {customerSegments.summary.inactive60dCount}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4">
            <p className="text-sm text-espresso/55">Colecoes acionaveis</p>
            <p className="mt-2 font-display text-3xl">{customerSegments.categories.length}</p>
          </div>
        </div>

        <form action={sendSegmentCampaignAction} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span>Segmento</span>
            <select
              name="segment"
              defaultValue="RECENT_BUYERS_30_DAYS"
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
            >
              <option value="RECENT_BUYERS_30_DAYS">Compradores recentes 30d</option>
              <option value="INACTIVE_60_DAYS">Clientes inativos 60d</option>
              <option value="NO_ORDERS">Clientes sem pedidos</option>
              <option value="CATEGORY">Clientes por colecao comprada</option>
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span>Colecao</span>
            <select
              name="categorySlug"
              defaultValue=""
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
            >
              <option value="">Nao usar colecao</option>
              {customerSegments.categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name} - {category.customersCount} clientes
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm md:col-span-2">
            <span>Assunto</span>
            <input
              name="subject"
              required
              minLength={3}
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
              placeholder="Novidades selecionadas para voce"
            />
          </label>

          <label className="space-y-2 text-sm md:col-span-2">
            <span>Mensagem</span>
            <textarea
              name="message"
              required
              minLength={10}
              rows={5}
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
              placeholder="Preparamos uma selecao com alto potencial de recompra e novidades para o seu perfil."
            />
          </label>

          <div className="md:col-span-2">
            <button className="rounded-full border border-espresso/15 px-5 py-3 text-sm">
              Disparar campanha segmentada
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
