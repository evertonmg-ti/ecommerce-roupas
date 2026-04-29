import { getAdminAuditLogs, getAdminEventLogs } from "@/lib/admin-api";

type AdminEventsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminEventsPage({
  searchParams
}: AdminEventsPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const eventSearch = getParamValue(params?.eventSearch)?.trim();
  const auditSearch = getParamValue(params?.auditSearch)?.trim();
  const eventLevel =
    getParamValue(params?.eventLevel)?.trim() &&
    getParamValue(params?.eventLevel) !== "ALL"
      ? getParamValue(params?.eventLevel)
      : undefined;
  const eventPage = Number(getParamValue(params?.eventPage) ?? "1") || 1;
  const auditPage = Number(getParamValue(params?.auditPage) ?? "1") || 1;
  const eventQueryBase = new URLSearchParams();
  const auditQueryBase = new URLSearchParams();

  if (eventSearch) {
    eventQueryBase.set("eventSearch", eventSearch);
  }

  if (eventLevel) {
    eventQueryBase.set("eventLevel", eventLevel);
  }

  if (auditSearch) {
    auditQueryBase.set("auditSearch", auditSearch);
  }

  const [events, auditLogs] = await Promise.all([
    getAdminEventLogs({
      search: eventSearch,
      level: eventLevel,
      page: eventPage,
      pageSize: 15
    }).catch(() => null),
    getAdminAuditLogs({
      search: auditSearch,
      page: auditPage,
      pageSize: 15
    }).catch(() => null)
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Observabilidade</p>
        <h1 className="mt-3 font-display text-4xl">Eventos e auditoria</h1>
        <p className="mt-3 max-w-2xl text-espresso/70">
          Acompanhe trilha de eventos operacionais e as acoes administrativas
          realizadas no painel.
        </p>
      </div>

      <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Eventos do sistema</p>
            <h2 className="mt-2 font-display text-3xl">Timeline operacional</h2>
          </div>
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="space-y-2 text-sm">
              <span>Buscar</span>
              <input
                name="eventSearch"
                defaultValue={eventSearch}
                className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none sm:min-w-72"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span>Nivel</span>
              <select
                name="eventLevel"
                defaultValue={eventLevel ?? "ALL"}
                className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none sm:min-w-40"
              >
                <option value="ALL">Todos</option>
                <option value="INFO">INFO</option>
                <option value="WARN">WARN</option>
                <option value="ERROR">ERROR</option>
                <option value="SECURITY">SECURITY</option>
              </select>
            </label>
            <button className="rounded-full bg-espresso px-5 py-3 text-sand">
              Filtrar
            </button>
          </form>
        </div>

        <div className="mt-6 space-y-3">
          {events?.items.length ? (
            events.items.map((event) => (
              <article
                key={event.id}
                className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{event.message}</p>
                    <p className="mt-1 text-sm text-espresso/60">
                      {event.type} - {event.source}
                    </p>
                    {event.metadata ? (
                      <pre className="mt-3 overflow-x-auto rounded-2xl bg-white/60 p-3 text-xs text-espresso/70">
                        {JSON.stringify(event.metadata, null, 2)}
                      </pre>
                    ) : null}
                  </div>
                  <div className="text-right text-sm text-espresso/60">
                    <p>{event.level}</p>
                    <p>{event.createdAt}</p>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="text-sm text-espresso/60">Nenhum evento encontrado.</p>
          )}
        </div>

        {events && events.totalPages > 1 ? (
          <div className="mt-6 flex flex-wrap gap-3">
            {eventPage > 1 ? (
              <a
                href={`?${new URLSearchParams({
                  ...Object.fromEntries(eventQueryBase.entries()),
                  eventPage: String(eventPage - 1),
                  auditSearch: auditSearch ?? "",
                  auditPage: String(auditPage)
                }).toString()}`}
                className="rounded-full border border-espresso/15 px-4 py-2 text-sm"
              >
                Pagina anterior
              </a>
            ) : null}
            <span className="px-2 py-2 text-sm text-espresso/60">
              Pagina {events.page} de {events.totalPages}
            </span>
            {eventPage < events.totalPages ? (
              <a
                href={`?${new URLSearchParams({
                  ...Object.fromEntries(eventQueryBase.entries()),
                  eventPage: String(eventPage + 1),
                  auditSearch: auditSearch ?? "",
                  auditPage: String(auditPage)
                }).toString()}`}
                className="rounded-full border border-espresso/15 px-4 py-2 text-sm"
              >
                Proxima pagina
              </a>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Auditoria</p>
            <h2 className="mt-2 font-display text-3xl">Acoes do painel</h2>
          </div>
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="space-y-2 text-sm">
              <span>Buscar</span>
              <input
                name="auditSearch"
                defaultValue={auditSearch}
                className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none sm:min-w-72"
              />
            </label>
            <button className="rounded-full bg-espresso px-5 py-3 text-sand">
              Filtrar
            </button>
          </form>
        </div>

        <div className="mt-6 space-y-3">
          {auditLogs?.items.length ? (
            auditLogs.items.map((entry) => (
              <article
                key={entry.id}
                className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{entry.action}</p>
                    <p className="mt-1 text-sm text-espresso/60">
                      {entry.actorName ?? entry.actorEmail ?? "Administrador"} -{" "}
                      {entry.method} - {entry.path}
                    </p>
                    <p className="mt-1 text-xs text-espresso/50">
                      {entry.entityType ?? "recurso"} {entry.entityId ? `#${entry.entityId}` : ""}
                      {entry.statusCode ? ` - status ${entry.statusCode}` : ""}
                      {entry.ipAddress ? ` - IP ${entry.ipAddress}` : ""}
                    </p>
                  </div>
                  <div className="text-right text-sm text-espresso/60">
                    <p>{entry.actorRole ?? "ADMIN"}</p>
                    <p>{entry.createdAt}</p>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="text-sm text-espresso/60">Nenhuma acao auditada encontrada.</p>
          )}
        </div>

        {auditLogs && auditLogs.totalPages > 1 ? (
          <div className="mt-6 flex flex-wrap gap-3">
            {auditPage > 1 ? (
              <a
                href={`?${new URLSearchParams({
                  eventSearch: eventSearch ?? "",
                  eventLevel: eventLevel ?? "",
                  eventPage: String(eventPage),
                  ...Object.fromEntries(auditQueryBase.entries()),
                  auditPage: String(auditPage - 1)
                }).toString()}`}
                className="rounded-full border border-espresso/15 px-4 py-2 text-sm"
              >
                Pagina anterior
              </a>
            ) : null}
            <span className="px-2 py-2 text-sm text-espresso/60">
              Pagina {auditLogs.page} de {auditLogs.totalPages}
            </span>
            {auditPage < auditLogs.totalPages ? (
              <a
                href={`?${new URLSearchParams({
                  eventSearch: eventSearch ?? "",
                  eventLevel: eventLevel ?? "",
                  eventPage: String(eventPage),
                  ...Object.fromEntries(auditQueryBase.entries()),
                  auditPage: String(auditPage + 1)
                }).toString()}`}
                className="rounded-full border border-espresso/15 px-4 py-2 text-sm"
              >
                Proxima pagina
              </a>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
