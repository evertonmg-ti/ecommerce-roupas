import { getAdminCategories } from "@/lib/admin-api";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction
} from "./actions";

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories().catch(() => null);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Gestao</p>
        <h1 className="mt-3 font-display text-4xl">Categorias</h1>
        <p className="mt-3 max-w-2xl text-espresso/70">
          Organize o catalogo por colecoes e reaproveite essas categorias no cadastro
          de produtos.
        </p>
      </div>

      <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Nova categoria</p>
        <h2 className="mt-2 font-display text-3xl">Cadastrar categoria</h2>

        <form action={createCategoryAction} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span>Nome</span>
            <input
              name="name"
              required
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
              placeholder="Camisetas"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span>Slug</span>
            <input
              name="slug"
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
              placeholder="camisetas"
            />
          </label>

          <label className="space-y-2 text-sm md:col-span-2">
            <span>Descricao</span>
            <textarea
              name="description"
              rows={3}
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
              placeholder="Categoria para camisetas basicas e premium."
            />
          </label>

          <div className="md:col-span-2">
            <button className="rounded-full bg-espresso px-5 py-3 text-sand">
              Salvar categoria
            </button>
          </div>
        </form>
      </section>

      {categories ? (
        <section className="space-y-4">
          {categories.map((category) => (
            <article
              key={category.id}
              className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft"
            >
              <div className="border-b border-espresso/10 pb-4">
                <p className="font-display text-3xl">{category.name}</p>
                <p className="mt-1 text-sm text-espresso/60">{category.slug}</p>
              </div>

              <form action={updateCategoryAction} className="mt-6 grid gap-4 md:grid-cols-2">
                <input type="hidden" name="id" value={category.id} />

                <label className="space-y-2 text-sm">
                  <span>Nome</span>
                  <input
                    name="name"
                    defaultValue={category.name}
                    required
                    className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span>Slug</span>
                  <input
                    name="slug"
                    defaultValue={category.slug}
                    className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                  />
                </label>

                <label className="space-y-2 text-sm md:col-span-2">
                  <span>Descricao</span>
                  <textarea
                    name="description"
                    defaultValue={category.description ?? ""}
                    rows={3}
                    className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                  />
                </label>

                <div className="md:col-span-2 flex flex-col gap-3 md:flex-row">
                  <button className="rounded-full bg-espresso px-5 py-3 text-sand">
                    Atualizar categoria
                  </button>
                </div>
              </form>

              <form action={deleteCategoryAction} className="mt-4">
                <input type="hidden" name="id" value={category.id} />
                <button className="rounded-full border border-red-300 px-5 py-3 text-sm text-red-700">
                  Excluir categoria
                </button>
              </form>
            </article>
          ))}
        </section>
      ) : (
        <div className="rounded-[2rem] border border-terracotta/20 bg-white/80 p-6 text-sm text-espresso/70 shadow-soft">
          Nao foi possivel carregar as categorias do painel. Faca login novamente
          para renovar a sessao administrativa.
        </div>
      )}
    </div>
  );
}
