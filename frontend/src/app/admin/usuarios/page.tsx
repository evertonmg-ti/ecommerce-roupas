import { getAdminUsers } from "@/lib/admin-api";
import { createUserAction, updateUserAction } from "./actions";

const roleOptions = [
  { value: "ADMIN", label: "Administrador" },
  { value: "CUSTOMER", label: "Cliente" }
];

export default async function AdminUsersPage() {
  const users = await getAdminUsers().catch(() => null);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Gestao</p>
        <h1 className="mt-3 font-display text-4xl">Usuarios</h1>
        <p className="mt-3 text-espresso/70">
          Cadastre administradores e clientes com acesso controlado por papel.
        </p>
      </div>

      <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Novo usuario</p>
        <h2 className="mt-2 font-display text-3xl">Criar conta</h2>

        <form action={createUserAction} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span>Nome</span>
            <input
              name="name"
              required
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
              placeholder="Ana Martins"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span>Email</span>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
              placeholder="ana@fashionstore.com"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span>Senha</span>
            <input
              name="password"
              type="password"
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
              placeholder="Minimo de 6 caracteres"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span>Papel</span>
            <select
              name="role"
              defaultValue="CUSTOMER"
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="md:col-span-2">
            <button className="rounded-full bg-espresso px-5 py-3 text-sand">
              Salvar usuario
            </button>
          </div>
        </form>
      </section>

      {users ? (
        <div className="space-y-4">
          {users.map((user) => (
            <article
              key={user.id}
              className="rounded-[2rem] border border-espresso/10 bg-white/80 p-5 shadow-soft"
            >
              <div className="flex items-start justify-between gap-4 border-b border-espresso/10 pb-4">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-espresso/60">{user.email}</p>
                </div>
                <span className="rounded-full bg-moss/10 px-3 py-1 text-xs text-moss">
                  {user.role}
                </span>
              </div>

              <form action={updateUserAction} className="mt-6 grid gap-4 md:grid-cols-2">
                <input type="hidden" name="id" value={user.id} />

                <label className="space-y-2 text-sm">
                  <span>Nome</span>
                  <input
                    name="name"
                    defaultValue={user.name}
                    required
                    className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span>Email</span>
                  <input
                    name="email"
                    type="email"
                    defaultValue={user.email}
                    required
                    className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span>Nova senha</span>
                  <input
                    name="password"
                    type="password"
                    className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                    placeholder="Preencha apenas para trocar"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span>Papel</span>
                  <select
                    name="role"
                    defaultValue={user.role}
                    className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                  >
                    {roleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="md:col-span-2 flex items-center justify-between gap-4">
                  <p className="text-sm text-espresso/55">Criado em {user.createdAt}</p>
                  <button className="rounded-full bg-espresso px-5 py-3 text-sand">
                    Atualizar usuario
                  </button>
                </div>
              </form>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[2rem] border border-terracotta/20 bg-white/80 p-6 text-sm text-espresso/70 shadow-soft">
          Nao foi possivel carregar os usuarios do painel. Faca login novamente
          para renovar a sessao administrativa.
        </div>
      )}
    </div>
  );
}
