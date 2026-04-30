import { AdminFeedback } from "@/components/admin-feedback";
import { getAdminCustomerCredits } from "@/lib/admin-api";
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
  const accounts = await getAdminCustomerCredits().catch(() => null);

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

      {accounts ? (
        <div className="space-y-4">
          {accounts.map((account) => (
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
          ))}
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
