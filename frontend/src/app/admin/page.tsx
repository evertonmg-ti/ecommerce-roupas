import { getAdminDashboardMetrics } from "@/lib/admin-api";

export default async function AdminDashboardPage() {
  const metrics = await getAdminDashboardMetrics().catch(() => null);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Visao geral</p>
        <h1 className="mt-3 font-display text-4xl">Dashboard administrativo</h1>
        <p className="mt-3 max-w-2xl text-espresso/70">
          Area preparada para consumir os indicadores da API e apoiar a operacao da loja.
        </p>
      </div>

      {metrics ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((item) => (
            <article
              key={item.label}
              className="rounded-[2rem] border border-espresso/10 bg-white/75 p-5 shadow-soft"
            >
              <p className="text-sm text-espresso/55">{item.label}</p>
              <p className="mt-3 font-display text-4xl">{item.value}</p>
              <p className="mt-2 text-sm text-moss">{item.detail}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[2rem] border border-terracotta/20 bg-white/80 p-6 text-sm text-espresso/70 shadow-soft">
          Nao foi possivel carregar o resumo administrativo. Faca login novamente
          para renovar a sessao do painel.
        </div>
      )}
    </div>
  );
}
