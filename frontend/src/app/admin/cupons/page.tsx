import { AdminFeedback } from "@/components/admin-feedback";
import { getAdminCoupons } from "@/lib/admin-api";
import {
  createCouponAction,
  deleteCouponAction,
  updateCouponAction
} from "./actions";

const couponTypeOptions = [
  { value: "PERCENTAGE", label: "Percentual" },
  { value: "FIXED", label: "Valor fixo" }
];

type AdminCouponsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminCouponsPage({
  searchParams
}: AdminCouponsPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const coupons = await getAdminCoupons().catch(() => null);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Promocoes</p>
        <h1 className="mt-3 font-display text-4xl">Cupons</h1>
        <p className="mt-3 max-w-2xl text-espresso/70">
          Crie cupons fixos ou percentuais para campanhas, primeira compra e incentivo
          de conversao no checkout.
        </p>
      </div>

      <AdminFeedback searchParams={params} />

      <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Novo cupom</p>
        <h2 className="mt-2 font-display text-3xl">Cadastrar cupom</h2>

        <form action={createCouponAction} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span>Codigo</span>
            <input
              name="code"
              required
              minLength={3}
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 uppercase outline-none"
              placeholder="BEMVINDO10"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span>Tipo</span>
            <select
              name="type"
              defaultValue="PERCENTAGE"
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
            >
              {couponTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span>Valor</span>
            <input
              name="value"
              type="number"
              required
              min="0.01"
              step="0.01"
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span>Subtotal minimo</span>
            <input
              name="minSubtotal"
              type="number"
              min="0"
              step="0.01"
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span>Limite de uso</span>
            <input
              name="usageLimit"
              type="number"
              min="1"
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span>Status</span>
            <select
              name="active"
              defaultValue="true"
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
            >
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span>Inicio</span>
            <input
              name="startsAt"
              type="datetime-local"
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span>Expiracao</span>
            <input
              name="expiresAt"
              type="datetime-local"
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
            />
          </label>
          <label className="space-y-2 text-sm md:col-span-2">
            <span>Descricao</span>
            <textarea
              name="description"
              rows={3}
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
              placeholder="Campanha de primeira compra."
            />
          </label>
          <div className="md:col-span-2">
            <button className="rounded-full bg-espresso px-5 py-3 text-sand">
              Salvar cupom
            </button>
          </div>
        </form>
      </section>

      {coupons ? (
        <section className="space-y-4">
          {coupons.map((coupon) => (
            <article
              key={coupon.id}
              className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-espresso/10 pb-4">
                <div>
                  <p className="font-display text-3xl">{coupon.code}</p>
                  <p className="mt-1 text-sm text-espresso/60">
                    {coupon.description ?? "Sem descricao"} - usados {coupon.usedCount}x
                  </p>
                </div>
                <span className="rounded-full bg-moss/10 px-3 py-1 text-xs text-moss">
                  {coupon.active ? "ATIVO" : "INATIVO"}
                </span>
              </div>

              <form action={updateCouponAction} className="mt-6 grid gap-4 md:grid-cols-2">
                <input type="hidden" name="id" value={coupon.id} />
                <label className="space-y-2 text-sm">
                  <span>Codigo</span>
                  <input
                    name="code"
                    defaultValue={coupon.code}
                    required
                    className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 uppercase outline-none"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span>Tipo</span>
                  <select
                    name="type"
                    defaultValue={coupon.type}
                    className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                  >
                    {couponTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm">
                  <span>Valor</span>
                  <input
                    name="value"
                    type="number"
                    step="0.01"
                    min="0.01"
                    defaultValue={coupon.value}
                    className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span>Subtotal minimo</span>
                  <input
                    name="minSubtotal"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={coupon.minSubtotal}
                    className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span>Limite de uso</span>
                  <input
                    name="usageLimit"
                    type="number"
                    min="1"
                    defaultValue={coupon.usageLimit ?? ""}
                    className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span>Status</span>
                  <select
                    name="active"
                    defaultValue={coupon.active ? "true" : "false"}
                    className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm">
                  <span>Inicio</span>
                  <input
                    name="startsAt"
                    type="datetime-local"
                    defaultValue={coupon.startsAt?.slice(0, 16) ?? ""}
                    className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span>Expiracao</span>
                  <input
                    name="expiresAt"
                    type="datetime-local"
                    defaultValue={coupon.expiresAt?.slice(0, 16) ?? ""}
                    className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                  />
                </label>
                <label className="space-y-2 text-sm md:col-span-2">
                  <span>Descricao</span>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={coupon.description ?? ""}
                    className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                  />
                </label>
                <div className="md:col-span-2">
                  <button className="rounded-full bg-espresso px-5 py-3 text-sand">
                    Atualizar cupom
                  </button>
                </div>
              </form>

              <form action={deleteCouponAction} className="mt-4">
                <input type="hidden" name="id" value={coupon.id} />
                <button className="rounded-full border border-red-300 px-5 py-3 text-sm text-red-700">
                  Excluir cupom
                </button>
              </form>
            </article>
          ))}
        </section>
      ) : (
        <div className="rounded-[2rem] border border-terracotta/20 bg-white/80 p-6 text-sm text-espresso/70 shadow-soft">
          Nao foi possivel carregar os cupons do painel. Faca login novamente para
          renovar a sessao administrativa.
        </div>
      )}
    </div>
  );
}
