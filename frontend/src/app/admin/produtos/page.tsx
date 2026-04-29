import { AdminFeedback } from "@/components/admin-feedback";
import { getAdminCategories, getAdminProducts } from "@/lib/admin-api";
import { currency } from "@/lib/utils";
import {
  adjustProductStockAction,
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
  const search =
    typeof params?.search === "string" && params.search.trim()
      ? params.search.trim()
      : undefined;
  const activeStatus =
    typeof params?.status === "string" && params.status !== "ALL"
      ? params.status
      : undefined;
  const page =
    typeof params?.page === "string" && Number(params.page) > 0
      ? Number(params.page)
      : 1;
  const [productList, categories] = await Promise.all([
    getAdminProducts({
      search,
      status: activeStatus,
      page,
      pageSize: 10
    }).catch(() => null),
    getAdminCategories().catch(() => [])
  ]);
  const products = productList?.items ?? [];
  const baseParams = new URLSearchParams();

  if (search) {
    baseParams.set("search", search);
  }

  if (activeStatus) {
    baseParams.set("status", activeStatus);
  }

  const basePath = `/admin/produtos${baseParams.toString() ? `?${baseParams.toString()}` : ""}`;

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
        <form className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="space-y-2 text-sm sm:min-w-72">
            <span>Buscar por nome, slug ou categoria</span>
            <input
              name="search"
              defaultValue={search}
              placeholder="Ex.: camiseta, studio, vestidos"
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span>Status</span>
            <select
              name="status"
              defaultValue={activeStatus ?? "ALL"}
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none sm:min-w-56"
            >
              <option value="ALL">Todos</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button className="rounded-full bg-espresso px-5 py-3 text-sand">
            Aplicar filtro
          </button>
        </form>
      </section>

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
              <span>Custo unitario</span>
              <input
                name="costPrice"
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

      {productList ? (
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
                    {product.slug} - {product.category} - {currency(product.price)}
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
                  <span>Custo unitario</span>
                  <input
                    name="costPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={product.costPrice}
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

              <form
                action={adjustProductStockAction}
                className="mt-4 grid gap-3 rounded-[1.5rem] border border-espresso/10 bg-sand/30 p-4 md:grid-cols-[1fr_160px_1fr_auto]"
              >
                <input type="hidden" name="id" value={product.id} />
                <label className="space-y-2 text-sm">
                  <span>Motivo do ajuste</span>
                  <input
                    name="reason"
                    minLength={3}
                    className="w-full rounded-2xl border border-espresso/15 bg-white px-4 py-3 outline-none"
                    placeholder="Reposicao, inventario, avaria..."
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span>Delta</span>
                  <input
                    name="quantityDelta"
                    type="number"
                    required
                    className="w-full rounded-2xl border border-espresso/15 bg-white px-4 py-3 outline-none"
                    placeholder="Ex.: 5 ou -2"
                  />
                </label>
                <div className="self-end text-sm text-espresso/65">
                  Estoque atual: <strong>{product.stock}</strong>
                </div>
                <div className="self-end">
                  <button className="rounded-full border border-espresso/15 px-5 py-3 text-sm">
                    Ajustar estoque
                  </button>
                </div>
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

      {productList && productList.totalPages > 1 ? (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-espresso/10 bg-white/80 p-5 shadow-soft">
          <p className="text-sm text-espresso/70">
            Pagina {productList.page} de {productList.totalPages} - {productList.total} produtos
          </p>
          <div className="flex items-center gap-3">
            {productList.page > 1 ? (
              <a
                href={`${basePath}${basePath.includes("?") ? "&" : "?"}page=${productList.page - 1}`}
                className="rounded-full border border-espresso/15 px-4 py-2 text-sm"
              >
                Anterior
              </a>
            ) : null}
            {productList.page < productList.totalPages ? (
              <a
                href={`${basePath}${basePath.includes("?") ? "&" : "?"}page=${productList.page + 1}`}
                className="rounded-full border border-espresso/15 px-4 py-2 text-sm"
              >
                Proxima
              </a>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
