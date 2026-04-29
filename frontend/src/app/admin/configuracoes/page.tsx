import { AdminFeedback } from "@/components/admin-feedback";
import { getAdminSettings } from "@/lib/admin-api";
import { updateSettingsAction } from "./actions";

type AdminSettingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminSettingsPage({
  searchParams
}: AdminSettingsPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const settings = await getAdminSettings().catch(() => null);

  if (!settings) {
    return (
      <div className="rounded-[2rem] border border-terracotta/20 bg-white/80 p-6 text-sm text-espresso/70 shadow-soft">
        Nao foi possivel carregar as configuracoes do sistema. Faca login novamente
        para renovar a sessao administrativa.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Configuracoes</p>
        <h1 className="mt-3 font-display text-4xl">Loja e email</h1>
        <p className="mt-3 max-w-2xl text-espresso/70">
          Centralize no painel as configuracoes operacionais da loja e do envio de
          emails transacionais, sem depender de edicao manual no backend.
        </p>
      </div>

      <AdminFeedback searchParams={params} />

      <form action={updateSettingsAction} className="space-y-6">
        <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
          <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Loja</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span>Nome da loja</span>
              <input
                name="storeName"
                required
                defaultValue={settings.storeName}
                className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span>URL publica</span>
              <input
                name="storeUrl"
                type="url"
                required
                defaultValue={settings.storeUrl}
                className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
              />
            </label>
            <label className="space-y-2 text-sm md:col-span-2">
              <span>Email de suporte</span>
              <input
                name="supportEmail"
                type="email"
                defaultValue={settings.supportEmail ?? ""}
                className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
              />
            </label>
          </div>
        </section>

        <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
                Email transacional
              </p>
              <p className="mt-2 text-sm text-espresso/70">
                Configure envio de pedido recebido e atualizacao de status direto pelo painel.
              </p>
            </div>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="emailEnabled"
                defaultChecked={settings.emailEnabled}
                className="h-4 w-4"
              />
              Ativar envio real
            </label>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span>Remetente</span>
              <input
                name="emailFrom"
                required
                defaultValue={settings.emailFrom}
                className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                placeholder="Maison Aurea <no-reply@seudominio.com>"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span>Responder para</span>
              <input
                name="emailReplyTo"
                type="email"
                defaultValue={settings.emailReplyTo ?? ""}
                className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
              />
            </label>
            <label className="space-y-2 text-sm md:col-span-2">
              <span>Inbox operacional de pedidos</span>
              <input
                name="emailOrdersTo"
                type="email"
                defaultValue={settings.emailOrdersTo ?? ""}
                className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                placeholder="operacao@seudominio.com"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span>SMTP host</span>
              <input
                name="smtpHost"
                defaultValue={settings.smtpHost ?? ""}
                className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span>SMTP porta</span>
              <input
                name="smtpPort"
                type="number"
                min="1"
                max="65535"
                defaultValue={settings.smtpPort}
                className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span>SMTP usuario</span>
              <input
                name="smtpUser"
                defaultValue={settings.smtpUser ?? ""}
                className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span>SMTP senha</span>
              <input
                name="smtpPass"
                type="password"
                defaultValue={settings.smtpPass ?? ""}
                className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
              />
            </label>
            <label className="flex items-center gap-3 text-sm md:col-span-2">
              <input
                type="checkbox"
                name="smtpSecure"
                defaultChecked={settings.smtpSecure}
                className="h-4 w-4"
              />
              Usar conexao segura (SSL/TLS)
            </label>
          </div>
        </section>

        <div>
          <button className="rounded-full bg-espresso px-6 py-3 text-sand">
            Salvar configuracoes
          </button>
        </div>
      </form>
    </div>
  );
}
