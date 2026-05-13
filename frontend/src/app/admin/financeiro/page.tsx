import { AdminFeedback } from "@/components/admin-feedback";
import { getAdminCustomerCredits, getAdminDashboardMetrics } from "@/lib/admin-api";
import { currency } from "@/lib/utils";
import { adjustCustomerCreditAction } from "./actions";

type AdminFinancePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const creditLabels: Record<string, string> = {
  RETURN_STORE_CREDIT: "Vale-troca emitido",
  ORDER_STORE_CREDIT_USAGE: "Uso no checkout",
  ORDER_CANCELLATION_REVERSAL: "Credito devolvido por cancelamento",
  RETURN_REFUND_RECORDED: "Reembolso registrado",
  MANUAL_CREDIT: "Ajuste manual"
};

export default async function AdminFinancePage({
  searchParams
}: AdminFinancePageProps) {
  const params = searchParams ? await searchParams : undefined;
  const search = typeof params?.search === "string" ? params.search.trim().toLowerCase() : "";
  const balanceFilter =
    typeof params?.balance === "string" ? params.balance.trim().toLowerCase() : "";
  const accounts = await getAdminCustomerCredits().catch(() => null);
  const dashboard = await getAdminDashboardMetrics().catch(() => null);
  const financialHighlights = dashboard?.financialHighlights ?? [];
  const creditReconciliation = dashboard?.creditReconciliation ?? [];
  const financialAlerts = dashboard?.financialAlerts ?? [];
  const recentFinancialTransactions = dashboard?.recentFinancialTransactions ?? [];
  const pendingFinancialCases = dashboard?.pendingFinancialCases ?? [];
  const filteredAccounts = accounts?.filter((account) => {
    const matchesSearch =
      !search ||
      account.name.toLowerCase().includes(search) ||
      account.email.toLowerCase().includes(search);

    if (!matchesSearch) {
      return false;
    }

    if (balanceFilter === "positive") {
      return account.walletBalance > 0;
    }

    if (balanceFilter === "zero") {
      return account.walletBalance === 0;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Financeiro</p>
        <h1 className="mt-3 font-display text-4xl">Carteira e creditos</h1>
        <p className="mt-3 text-espresso/70">
          Acompanhe o saldo dos clientes, o extrato de vale-troca e ajuste a carteira
          quando a operacao precisar corrigir ou conceder credito.
        </p>
      </div>

      <AdminFeedback searchParams={params} />

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
          <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
            Visao financeira
          </p>
          <h2 className="mt-2 font-display text-3xl">Carteira e consumo</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {financialHighlights.map((item) => (
              <article
                key={item.label}
                className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4"
              >
                <p className="text-sm text-espresso/55">{item.label}</p>
                <p className="mt-2 font-display text-3xl">{item.value}</p>
                <p className="mt-2 text-sm text-moss">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
          <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
            Conciliacao
          </p>
          <h2 className="mt-2 font-display text-3xl">Pendencias do pos-venda</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {creditReconciliation.map((item) => (
              <article
                key={item.label}
                className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4"
              >
                <p className="text-sm text-espresso/55">{item.label}</p>
                <p className="mt-2 font-display text-3xl">{item.value}</p>
                <p className="mt-2 text-sm text-moss">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
          <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
            Alertas operacionais
          </p>
          <h2 className="mt-2 font-display text-3xl">Fila de atencao</h2>

          {financialAlerts.length > 0 ? (
            <div className="mt-6 space-y-3">
              {financialAlerts.map((alert, index) => (
                <article
                  key={`${alert.type}-${index}`}
                  className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      <p className="mt-2 text-sm text-espresso/65">{alert.detail}</p>
                    </div>
                    <span className="rounded-full bg-terracotta/10 px-3 py-1 text-xs text-terracotta">
                      {alert.level}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4 text-sm text-espresso/65">
              Nenhum alerta financeiro ativo neste momento.
            </div>
          )}
        </section>

        <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
                Casos para fechar
              </p>
              <h2 className="mt-2 font-display text-3xl">Conciliacao pendente</h2>
            </div>
            <a
              href="/admin/devolucoes"
              className="rounded-full border border-espresso/15 px-4 py-2 text-sm"
            >
              Abrir devolucoes
            </a>
          </div>

          {pendingFinancialCases.length > 0 ? (
            <div className="mt-6 space-y-3">
              {pendingFinancialCases.map((request) => (
                <div
                  key={request.id}
                  className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{request.customerName}</p>
                      <p className="mt-1 text-sm text-espresso/60">
                        {request.customerEmail} - pedido {request.orderId}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-terracotta">{request.priority}</p>
                      <p className="mt-1 text-sm text-espresso/60">{request.slaLabel}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-espresso/65">
                    {request.type} - {request.status} - financeiro {request.financialStatus}
                  </p>
                  <p className="mt-2 text-sm text-moss">
                    Valor de {currency(request.financialAmount)}
                  </p>
                  <p className="mt-2 text-sm text-espresso/60">{request.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4 text-sm text-espresso/65">
              Nenhum caso financeiro pendente exige conciliacao agora.
            </div>
          )}
        </section>
      </div>

      <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
          Extrato operacional
        </p>
        <h2 className="mt-2 font-display text-3xl">Ultimas movimentacoes</h2>

        {recentFinancialTransactions.length > 0 ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {recentFinancialTransactions.map((transaction) => (
              <article
                key={transaction.id}
                className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{transaction.customerName}</p>
                    <p className="mt-1 text-sm text-espresso/60">
                      {transaction.customerEmail}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-medium ${
                        transaction.balanceAfter >= transaction.balanceBefore
                          ? "text-moss"
                          : "text-terracotta"
                      }`}
                    >
                      {transaction.balanceAfter >= transaction.balanceBefore ? "+" : "-"}
                      {currency(transaction.amount)}
                    </p>
                    <p className="mt-1 text-sm text-espresso/55">{transaction.createdAt}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-espresso/65">{transaction.description}</p>
                <p className="mt-2 text-sm text-moss">
                  Saldo {currency(transaction.balanceBefore)} para{" "}
                  {currency(transaction.balanceAfter)}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4 text-sm text-espresso/65">
            Ainda nao ha movimentacoes recentes suficientes para acompanhamento.
          </div>
        )}
      </section>

      <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
              Carteiras
            </p>
            <h2 className="mt-2 font-display text-3xl">Clientes e saldo</h2>
          </div>

          <form className="flex flex-wrap gap-3">
            <input
              type="search"
              name="search"
              defaultValue={search}
              placeholder="Buscar cliente ou email"
              className="rounded-full border border-espresso/15 bg-sand px-4 py-2 text-sm outline-none"
            />
            <select
              name="balance"
              defaultValue={balanceFilter}
              className="rounded-full border border-espresso/15 bg-sand px-4 py-2 text-sm outline-none"
            >
              <option value="">Todos os saldos</option>
              <option value="positive">Com saldo</option>
              <option value="zero">Sem saldo</option>
            </select>
            <button className="rounded-full border border-espresso/15 px-4 py-2 text-sm">
              Filtrar
            </button>
          </form>
        </div>
      </section>

      {filteredAccounts ? (
        <div className="space-y-4">
          {filteredAccounts.length > 0 ? (
            filteredAccounts.map((account) => (
              <article
                key={account.id}
                className="rounded-[2rem] border border-espresso/10 bg-white/80 p-5 shadow-soft"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-espresso/10 pb-4">
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <p className="text-sm text-espresso/60">{account.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-espresso/55">Saldo atual</p>
                    <p className="mt-1 font-display text-3xl text-moss">
                      {currency(account.walletBalance)}
                    </p>
                  </div>
                </div>

                <form
                  action={adjustCustomerCreditAction}
                  className="mt-6 grid gap-4 md:grid-cols-[0.6fr_0.8fr_auto]"
                >
                  <input type="hidden" name="userId" value={account.id} />
                  <label className="space-y-2 text-sm">
                    <span>Valor do ajuste</span>
                    <input
                      name="amount"
                      type="number"
                      step="0.01"
                      required
                      className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                      placeholder="Use negativo para debitar"
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span>Observacao</span>
                    <input
                      name="description"
                      minLength={3}
                      className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                      placeholder="Ex.: ajuste operacional de pos-venda"
                    />
                  </label>
                  <div className="flex items-end">
                    <button className="rounded-full bg-espresso px-5 py-3 text-sand">
                      Aplicar ajuste
                    </button>
                  </div>
                </form>

                <div className="mt-6 space-y-3">
                  <p className="text-xs uppercase tracking-[0.25em] text-terracotta">
                    Extrato recente
                  </p>
                  {account.creditTransactions.length > 0 ? (
                    account.creditTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">
                              {creditLabels[transaction.type] ?? transaction.type}
                            </p>
                            <p className="mt-1 text-sm text-espresso/60">
                              {transaction.description}
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`font-medium ${
                                transaction.balanceAfter >= transaction.balanceBefore
                                  ? "text-moss"
                                  : "text-terracotta"
                              }`}
                            >
                              {transaction.balanceAfter >= transaction.balanceBefore ? "+" : "-"}
                              {currency(transaction.amount)}
                            </p>
                            <p className="mt-1 text-sm text-espresso/55">
                              {transaction.createdAt}
                            </p>
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-espresso/65">
                          Saldo {currency(transaction.balanceBefore)} para{" "}
                          {currency(transaction.balanceAfter)}
                          {transaction.orderId ? ` - pedido ${transaction.orderId}` : ""}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4 text-sm text-espresso/65">
                      Nenhuma movimentacao financeira registrada para esta conta.
                    </div>
                  )}
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 text-sm text-espresso/65 shadow-soft">
              Nenhuma carteira encontrada para os filtros atuais.
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-[2rem] border border-terracotta/20 bg-white/80 p-6 text-sm text-espresso/70 shadow-soft">
          Nao foi possivel carregar a carteira dos clientes. Faca login novamente
          para renovar a sessao administrativa.
        </div>
      )}
    </div>
  );
}
