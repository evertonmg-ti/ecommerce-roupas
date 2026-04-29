import { getAdminDashboardMetrics } from "@/lib/admin-api";

export default async function AdminDashboardPage() {
  const dashboard = await getAdminDashboardMetrics().catch(() => null);
  const metrics = dashboard?.metrics;
  const recentOrders = dashboard?.recentOrders ?? [];
  const commerceHighlights = dashboard?.commerceHighlights ?? [];
  const funnelHighlights = dashboard?.funnelHighlights ?? [];
  const targetHighlights = dashboard?.targetHighlights ?? [];
  const forecastHighlights = dashboard?.forecastHighlights ?? [];
  const revenueCurve = dashboard?.revenueCurve ?? [];
  const executiveAlerts = dashboard?.executiveAlerts ?? [];
  const predictiveAlerts = dashboard?.predictiveAlerts ?? [];
  const stockCoverage = dashboard?.stockCoverage ?? [];
  const replenishmentByCategory = dashboard?.replenishmentByCategory ?? [];
  const purchaseSuggestions = dashboard?.purchaseSuggestions ?? [];
  const monthlyPurchasePlan = dashboard?.monthlyPurchasePlan ?? [];
  const purchasePlanSummary = dashboard?.purchasePlanSummary ?? [];
  const budgetScenarios = dashboard?.budgetScenarios ?? [];
  const customerHighlights = dashboard?.customerHighlights ?? [];
  const customerCohorts = dashboard?.customerCohorts ?? [];
  const topRecurringCustomers = dashboard?.topRecurringCustomers ?? [];
  const lowStockItems = dashboard?.lowStockItems ?? [];
  const inventoryHighlights = dashboard?.inventoryHighlights ?? [];
  const profitabilityByProduct = dashboard?.profitabilityByProduct ?? [];
  const profitabilityByCategory = dashboard?.profitabilityByCategory ?? [];
  const lowMarginProducts = dashboard?.lowMarginProducts ?? [];

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
        <>
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

          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
              <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
                Comercial
              </p>
              <h2 className="mt-2 font-display text-3xl">Indicadores de conversao</h2>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {commerceHighlights.map((item) => (
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
                Estoque critico
              </p>
              <h2 className="mt-2 font-display text-3xl">Reposicao recomendada</h2>

              {lowStockItems.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {lowStockItems.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4"
                    >
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="mt-1 text-sm text-espresso/60">{product.category}</p>
                      </div>
                      <span className="rounded-full bg-terracotta/10 px-3 py-1 text-xs text-terracotta">
                        {product.stock} em estoque
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4 text-sm text-espresso/70">
                  Nenhum produto esta em nivel critico de estoque.
                </div>
              )}
            </section>
          </div>

          <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
              Funil comercial
            </p>
            <h2 className="mt-2 font-display text-3xl">Saude da conversao</h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {funnelHighlights.map((item) => (
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

          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
              <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
                Meta vs realizado
              </p>
              <h2 className="mt-2 font-display text-3xl">Ritmo comercial</h2>

              <div className="mt-6 grid gap-4">
                {targetHighlights.map((item) => (
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
                Curva de receita
              </p>
              <h2 className="mt-2 font-display text-3xl">Ultimos 14 dias</h2>

              {revenueCurve.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {revenueCurve.map((point) => {
                    const maxRevenue = Math.max(...revenueCurve.map((item) => item.revenue), 1);
                    const width = `${Math.max(6, Math.round((point.revenue / maxRevenue) * 100))}%`;

                    return (
                      <div key={point.date} className="space-y-2">
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <span className="text-espresso/65">{point.label}</span>
                          <span className="font-medium">
                            {point.revenue.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL"
                            })}
                          </span>
                        </div>
                        <div className="h-3 rounded-full bg-sand">
                          <div
                            className="h-3 rounded-full bg-terracotta"
                            style={{ width }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-6 rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4 text-sm text-espresso/70">
                  Ainda nao ha receita suficiente para montar a curva recente.
                </div>
              )}
            </section>
          </div>

          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
              <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
                Previsao
              </p>
              <h2 className="mt-2 font-display text-3xl">Receita projetada</h2>

              <div className="mt-6 grid gap-4">
                {forecastHighlights.map((item) => (
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
                Cobertura de estoque
              </p>
              <h2 className="mt-2 font-display text-3xl">Risco de ruptura</h2>

              {stockCoverage.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {stockCoverage.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="mt-1 text-sm text-espresso/60">{item.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {item.coverageDays !== undefined
                              ? `${Math.round(item.coverageDays)} dias`
                              : "Sem previsao"}
                          </p>
                          <p className="mt-1 text-sm text-espresso/60">
                            {item.currentStock} em estoque
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-espresso/65">
                        {item.quantitySold30d} un. vendidas em 30d /{" "}
                        {item.averageDailySales.toFixed(1)} un./dia /{" "}
                        {item.revenue30d.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL"
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4 text-sm text-espresso/70">
                  Ainda nao ha giro suficiente para prever cobertura de estoque.
                </div>
              )}
            </section>
          </div>

          <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
              Alertas executivos
            </p>
            <h2 className="mt-2 font-display text-3xl">Pontos de atencao</h2>

            {executiveAlerts.length > 0 ? (
              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                {executiveAlerts.map((alert, index) => (
                  <article
                    key={`${alert.type}-${index}`}
                    className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.25em] text-terracotta">
                      {alert.level}
                    </p>
                    <p className="mt-3 font-medium">{alert.message}</p>
                    <p className="mt-2 text-sm text-espresso/65">{alert.detail}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4 text-sm text-espresso/70">
                Nenhum alerta executivo ativo neste momento.
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
              Alertas preditivos
            </p>
            <h2 className="mt-2 font-display text-3xl">Riscos antecipados</h2>

            {predictiveAlerts.length > 0 ? (
              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                {predictiveAlerts.map((alert, index) => (
                  <article
                    key={`${alert.type}-${index}`}
                    className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.25em] text-terracotta">
                      {alert.level}
                    </p>
                    <p className="mt-3 font-medium">{alert.message}</p>
                    <p className="mt-2 text-sm text-espresso/65">{alert.detail}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4 text-sm text-espresso/70">
                Nenhum risco preditivo relevante identificado no momento.
              </div>
            )}
          </section>

          <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
              <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
                Reposicao por categoria
              </p>
              <h2 className="mt-2 font-display text-3xl">Prioridades de compra</h2>

              {replenishmentByCategory.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {replenishmentByCategory.map((item) => (
                    <div
                      key={item.category}
                      className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{item.category}</p>
                          <p className="mt-1 text-sm text-espresso/60">
                            {item.productsAtRisk} produtos com risco de reposicao
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{item.totalSuggestedUnits} un. sugeridas</p>
                          <p className="mt-1 text-sm text-terracotta">{item.priority}</p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-espresso/65">
                        Estoque atual de {item.totalCurrentStock} un.
                        {item.averageCoverageDays !== undefined
                          ? ` / cobertura media de ${Math.round(item.averageCoverageDays)} dias`
                          : ""}
                        {item.projectedCoverageDays !== undefined
                          ? ` / cobertura projetada de ${Math.round(item.projectedCoverageDays)} dias`
                          : ""}
                      </p>
                      <p className="mt-2 text-sm text-moss">
                        Orcamento sugerido de{" "}
                        {item.estimatedPurchaseCost.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL"
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4 text-sm text-espresso/70">
                  Nenhuma categoria exige reposicao preventiva neste momento.
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
              <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
                Sugestao de compra
              </p>
              <h2 className="mt-2 font-display text-3xl">Pedido sugerido por SKU</h2>

              {purchaseSuggestions.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {purchaseSuggestions.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="mt-1 text-sm text-espresso/60">{item.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{item.suggestedQuantity} un. sugeridas</p>
                          <p className="mt-1 text-sm text-terracotta">{item.priority}</p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-espresso/65">
                        Estoque atual {item.currentStock} / alvo de {item.targetCoverageDays} dias /
                        giro de {item.averageDailySales.toFixed(1)} un./dia
                        {item.coverageDays !== undefined
                          ? ` / cobertura atual ${Math.round(item.coverageDays)} dias`
                          : ""}
                        {item.projectedCoverageDays !== undefined
                          ? ` / cobertura apos compra ${Math.round(item.projectedCoverageDays)} dias`
                          : ""}
                      </p>
                      <p className="mt-2 text-sm text-moss">
                        Investimento estimado de{" "}
                        {item.estimatedPurchaseCost.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL"
                        })}
                        {item.addedCoverageDays !== undefined
                          ? ` para ganhar cerca de ${Math.round(item.addedCoverageDays)} dias de cobertura`
                          : ""}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4 text-sm text-espresso/70">
                  Nenhum SKU exige compra sugerida com base no giro recente.
                </div>
              )}
            </section>
          </div>

          <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
              Plano mensal
            </p>
            <h2 className="mt-2 font-display text-3xl">Resumo de compra sugerida</h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {purchasePlanSummary.map((item) => (
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

          <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
              <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
                Plano consolidado
              </p>
              <h2 className="mt-2 font-display text-3xl">Compra mensal por categoria</h2>

              {monthlyPurchasePlan.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {monthlyPurchasePlan.map((item) => (
                    <div
                      key={item.category}
                      className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{item.category}</p>
                          <p className="mt-1 text-sm text-espresso/60">
                            {item.productsAtRisk} SKUs / {item.totalSuggestedUnits} un. sugeridas
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {item.estimatedPurchaseCost.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL"
                            })}
                          </p>
                          <p className="mt-1 text-sm text-terracotta">
                            {item.priority} / {Math.round(item.budgetShare)}% do budget
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-espresso/65">
                        {item.averageCoverageDays !== undefined
                          ? `Cobertura media atual ${Math.round(item.averageCoverageDays)} dias`
                          : "Cobertura media atual indisponivel"}
                        {item.projectedCoverageDays !== undefined
                          ? ` / cobertura projetada ${Math.round(item.projectedCoverageDays)} dias`
                          : ""}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4 text-sm text-espresso/70">
                  Ainda nao ha categorias suficientes para montar um plano mensal de compra.
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
              <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
                Simulacao de budget
              </p>
              <h2 className="mt-2 font-display text-3xl">Cenarios de orcamento</h2>

              {budgetScenarios.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {budgetScenarios.map((scenario) => (
                    <div
                      key={scenario.name}
                      className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{scenario.name}</p>
                          <p className="mt-1 text-sm text-espresso/60">{scenario.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {scenario.investment.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL"
                            })}
                          </p>
                          <p className="mt-1 text-sm text-moss">
                            {scenario.coveredItems}/{scenario.totalItems} SKUs
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-espresso/65">
                        {scenario.suggestedUnits} un. / {Math.round(scenario.coverageShare)}% do
                        plano / ganho medio de {Math.round(scenario.averageCoverageGain)} dias
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4 text-sm text-espresso/70">
                  Ainda nao ha dados suficientes para simular cenarios de orcamento.
                </div>
              )}
            </section>
          </div>

          <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
              Recorrencia
            </p>
            <h2 className="mt-2 font-display text-3xl">Saude da base de clientes</h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {customerHighlights.map((item) => (
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

          <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
              <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
                Cohort
              </p>
              <h2 className="mt-2 font-display text-3xl">Aquisicao e recompra</h2>

              {customerCohorts.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {customerCohorts.map((cohort) => (
                    <div
                      key={cohort.month}
                      className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{cohort.label}</p>
                          <p className="mt-1 text-sm text-espresso/60">
                            {cohort.acquiredCustomers} clientes adquiridos
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-moss">
                            {Math.round(cohort.retentionRate)}% recompra
                          </p>
                          <p className="mt-1 text-sm text-espresso/60">
                            {cohort.repeatCustomers} clientes voltaram
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4 text-sm text-espresso/70">
                  Ainda nao ha historico suficiente para montar cohorts.
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
              <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
                Recorrencia
              </p>
              <h2 className="mt-2 font-display text-3xl">Clientes mais recorrentes</h2>

              {topRecurringCustomers.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {topRecurringCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="mt-1 text-sm text-espresso/60">{customer.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{customer.ordersCount} pedidos</p>
                          <p className="mt-1 text-sm text-moss">
                            {customer.revenue.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL"
                            })}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-espresso/65">
                        Primeiro pedido em {customer.firstOrderAt} - ultimo em {customer.lastOrderAt}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4 text-sm text-espresso/70">
                  Ainda nao ha clientes recorrentes suficientes para ranking.
                </div>
              )}
            </section>
          </div>

          <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
                  Pedidos recentes
                </p>
                <h2 className="mt-2 font-display text-3xl">Ultimas movimentacoes</h2>
              </div>
            </div>

            {recentOrders.length > 0 ? (
              <div className="mt-6 space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col gap-2 rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">{order.customerName}</p>
                      <p className="mt-1 text-sm text-espresso/60">
                        {order.customerEmail} - {order.createdAt}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="rounded-full bg-moss/10 px-3 py-1 text-xs text-moss">
                        {order.status}
                      </span>
                      <p className="font-medium">{order.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4 text-sm text-espresso/70">
                Ainda nao ha pedidos recentes para exibir.
              </div>
            )}
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
              <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
                Rentabilidade
              </p>
              <h2 className="mt-2 font-display text-3xl">Produtos mais lucrativos</h2>

              {profitabilityByProduct.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {profitabilityByProduct.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="mt-1 text-sm text-espresso/60">{item.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {item.grossProfit.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL"
                            })}
                          </p>
                          <p className="mt-1 text-sm text-moss">
                            {Math.round(item.marginRate)}% de margem
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-espresso/65">
                        {item.quantitySold} unidades -{" "}
                        {item.revenue.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL"
                        })}{" "}
                        de receita
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4 text-sm text-espresso/70">
                  Ainda nao ha base suficiente para calcular lucro por produto.
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
              <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
                Rentabilidade
              </p>
              <h2 className="mt-2 font-display text-3xl">Categorias mais lucrativas</h2>

              {profitabilityByCategory.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {profitabilityByCategory.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="mt-1 text-sm text-espresso/60">
                            {item.quantitySold} unidades vendidas
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {item.grossProfit.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL"
                            })}
                          </p>
                          <p className="mt-1 text-sm text-moss">
                            {Math.round(item.marginRate)}% de margem
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-espresso/65">
                        Receita de{" "}
                        {item.revenue.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL"
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4 text-sm text-espresso/70">
                  Ainda nao ha base suficiente para calcular lucro por categoria.
                </div>
              )}
            </section>
          </div>

          <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
              Margem baixa
            </p>
            <h2 className="mt-2 font-display text-3xl">Produtos abaixo do piso</h2>

            {lowMarginProducts.length > 0 ? (
              <div className="mt-6 space-y-3">
                {lowMarginProducts.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="mt-1 text-sm text-espresso/60">{item.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-terracotta">
                          {Math.round(item.marginRate)}% de margem
                        </p>
                        <p className="mt-1 text-sm text-espresso/60">
                          {item.quantitySold} unidades
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-espresso/65">
                      Receita de{" "}
                      {item.revenue.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL"
                      })}{" "}
                      com lucro bruto de{" "}
                      {item.grossProfit.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL"
                      })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4 text-sm text-espresso/70">
                Nenhum produto abaixo da margem minima configurada.
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
                  Estoque
                </p>
                <h2 className="mt-2 font-display text-3xl">Ultimos movimentos</h2>
              </div>
            </div>

            {inventoryHighlights.length > 0 ? (
              <div className="mt-6 space-y-3">
                {inventoryHighlights.map((movement) => (
                  <div
                    key={movement.id}
                    className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{movement.productName}</p>
                        <p className="mt-1 text-sm text-espresso/60">
                          {movement.category} - {movement.type}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-display text-2xl ${
                            movement.quantityDelta > 0 ? "text-moss" : "text-terracotta"
                          }`}
                        >
                          {movement.quantityDelta > 0 ? "+" : ""}
                          {movement.quantityDelta}
                        </p>
                        <p className="text-sm text-espresso/60">{movement.createdAt}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-espresso/65">
                      {movement.previousStock} para {movement.nextStock}
                      {movement.actorName ? ` - por ${movement.actorName}` : ""}
                      {movement.orderId ? ` - pedido ${movement.orderId}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4 text-sm text-espresso/70">
                Ainda nao ha movimentacoes de estoque registradas.
              </div>
            )}
          </section>
        </>
      ) : (
        <div className="rounded-[2rem] border border-terracotta/20 bg-white/80 p-6 text-sm text-espresso/70 shadow-soft">
          Nao foi possivel carregar o resumo administrativo. Faca login novamente
          para renovar a sessao do painel.
        </div>
      )}
    </div>
  );
}
