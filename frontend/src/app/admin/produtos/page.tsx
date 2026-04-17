import { AdminFeedback } from "@/components/admin-feedback";
import { getAdminCategories, getAdminProducts } from "@/lib/admin-api";
import { currency } from "@/lib/utils";
import {
  createProductAction,
  deleteProductAction,
  updateProductAction
} from "./actions";

const statusOptions = [
  { value: "DRAFT", label: "Rascunho" },
  { value: "ACTIVE", label: "Ativo" },
  { value: "ARCHIVED", label: "Arquivado" }
];

type AdminProductsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminProductsPage({
  searchParams
}: AdminProductsPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const [products, categories] = await Promise.all([
    getAdminProducts().catch(() => null),
    getAdminCategories().catch(() => [])
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Gestao</p>
        <h1 className="mt-3 font-display text-4xl">Produtos</h1>
        <p className="mt-3 max-w-2xl text-espresso/70">
          Cadastre, atualize e remova produtos usando os dados reais da API
          administrativa.
        </p>
      </div>

      <AdminFeedback searchParams={params} />

      <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
              Novo produto
            </p>
            <h2 className="mt-2 font-display text-3xl">Cadastrar item</h2>
          </div>
        </div>

        {categories.length > 0 ? (
          <form action={createProductAction} className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span>Nome</span>
              <input
                name="name"
                required
                minLength={3}
                className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                placeholder="Camiseta Studio"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span>Slug</span>
              <input
                name="slug"
                className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                placeholder="camiseta-studio"
              />
            </label>

            <label className="space-y-2 text-sm md:col-span-2">
              <span>Descricao</span>
              <textarea
                name="description"
                required
                minLength={12}
                rows={4}
                className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                placeholder="Descreva o produto para a vitrine."
              />
            </label>

            <label className="space-y-2 text-sm">
              <span>Preco</span>
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                required
                className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span>Preco de comparacao</span>
              <input
                name="compareAt"
                type="number"
                step="0.01"
                min="0"
                className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span>Estoque</span>
              <input
                name="stock"
                type="number"
                min="0"
                required
                className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span>Status</span>
              <select
                name="status"
                defaultValue="DRAFT"
                className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span>Categoria</span>
              <select
                name="categoryId"
                required
                className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span>Imagem</span>
              <input
                name="imageUrl"
                type="url"
                className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                placeholder="https://..."
              />
            </label>

            <div className="md:col-span-2">
              <button className="rounded-full bg-espresso px-5 py-3 text-sand">
                Salvar produto
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6 rounded-2xl border border-terracotta/20 bg-sand p-4 text-sm text-espresso/70">
            Nenhuma categoria disponivel. Cadastre ao menos uma categoria na base
            antes de criar produtos.
          </div>
        )}
      </section>

      {products ? (
        <section className="space-y-4">
          {products.map((product) => (
            <article
              key={product.id}
              className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft"
            >
              <div className="flex flex-col gap-3 border-b border-espresso/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-display text-3xl">{product.name}</p>
                  <p className="mt-1 text-sm text-espresso/60">
                    {product.slug} • {product.category} • {currency(product.price)}
                  </p>
                </div>
                <span className="rounded-full bg-moss/10 px-3 py-1 text-xs text-moss">
                  {product.status}
                </span>
              </div>

              <form action={updateProductAction} className="mt-6 grid gap-4 md:grid-cols-2">
                <input type="hidden" name="id" value={product.id} />

                <label className="space-y-2 text-sm">
                  <span>Nome</span>
                  <input
                    name="name"
                    defaultValue={product.name}
                    required
                    minLength={3}
                    className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span>Slug</span>
                  <input
                    name="slug"
                    defaultValue={product.slug}
                    className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                  />
                </label>

                <label className="space-y-2 text-sm md:col-span-2">
                  <span>Descricao</span>
                  <textarea
                    name="description"
                    defaultValue={product.description}
                    required
                    minLength={12}
                    rows={4}
                    className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span>Preco</span>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={product.price}
                    required
                    className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span>Preco de comparacao</span>
                  <input
                    name="compareAt"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={product.compareAt ?? ""}
                    className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span>Estoque</span>
                  <input
                    name="stock"
                    type="number"
                    min="0"
                    defaultValue={product.stock}
                    required
                    className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span>Status</span>
                  <select
                    name="status"
                    defaultValue={product.status}
                    className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm">
                  <span>Categoria</span>
                  <select
                    name="categoryId"
                    defaultValue={product.categoryId}
                    required
                    className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm">
                  <span>Imagem</span>
                  <input
                    name="imageUrl"
                    type="url"
                    defaultValue={product.imageUrl ?? ""}
                    className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                    placeholder="https://..."
                  />
                </label>

                <div className="flex flex-col gap-3 md:col-span-2 md:flex-row">
                  <button className="rounded-full bg-espresso px-5 py-3 text-sand">
                    Atualizar produto
                  </button>
                </div>
              </form>

              <form action={deleteProductAction} className="mt-4">
                <input type="hidden" name="id" value={product.id} />
                <button className="rounded-full border border-red-300 px-5 py-3 text-sm text-red-700">
                  Excluir produto
                </button>
              </form>
            </article>
          ))}
        </section>
      ) : (
        <div className="rounded-[2rem] border border-terracotta/20 bg-white/80 p-6 text-sm text-espresso/70 shadow-soft">
          Nao foi possivel carregar os produtos do painel. Faca login novamente
          para renovar a sessao administrativa.
        </div>
      )}
    </div>
  );
}
