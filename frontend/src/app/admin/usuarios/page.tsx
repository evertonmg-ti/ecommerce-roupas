import { getAdminUsers } from "@/lib/admin-api";

export default async function AdminUsersPage() {
  const users = await getAdminUsers().catch(() => null);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Gestao</p>
        <h1 className="mt-3 font-display text-4xl">Usuarios</h1>
        <p className="mt-3 text-espresso/70">
          Lista preparada para controle de acesso, papeis e status de clientes.
        </p>
      </div>
      {users ? (
        <div className="grid gap-4 md:grid-cols-2">
          {users.map((user) => (
            <article
              key={user.id}
              className="rounded-[2rem] border border-espresso/10 bg-white/80 p-5 shadow-soft"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-espresso/60">{user.email}</p>
                </div>
                <span className="rounded-full bg-moss/10 px-3 py-1 text-xs text-moss">
                  {user.status}
                </span>
              </div>
              <p className="mt-4 text-sm uppercase tracking-[0.2em] text-terracotta">
                {user.role}
              </p>
              <p className="mt-2 text-sm text-espresso/55">Criado em {user.createdAt}</p>
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
