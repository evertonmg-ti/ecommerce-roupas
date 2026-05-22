import { AdminFeedback } from "@/components/admin-feedback";
import { getAdminCategories, getAdminProducts } from "@/lib/admin-api";
import { currency } from "@/lib/utils";
import {
  adjustProductStockAction,
  createProductAction,
  deleteProductAction,
  importProductsCatalogAction,
  importStockCatalogAction,
  updateProductAction
} from "./actions";

const statusOptions = [
  { value: "DRAFT", label: "Rascunho" },
  { value: "ACTIVE", label: "Ativo" },
  { value: "ARCHIVED", label: "Arquivado" }
];

const productFallbackImage =
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab";

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
  const activeProductsCount =
    productList?.items.filter((product) => product.status === "ACTIVE").length ?? 0;
  const lowStockCount =
    productList?.items.filter((product) => product.stock > 0 && product.stock <= 5).length ?? 0;
  const productsWithVariantsCount =
    productList?.items.filter((product) => product.variants.length > 0).length ?? 0;

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

      {productList ? (
        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.75rem] border border-espresso/10 bg-white/80 p-5 shadow-soft">
            <p className="text-sm text-espresso/55">Produtos ativos nesta pagina</p>
            <p className="mt-2 font-display text-4xl">{activeProductsCount}</p>
            <p className="mt-2 text-sm text-espresso/65">
              Itens prontos para venda imediata
            </p>
          </article>
          <article className="rounded-[1.75rem] border border-espresso/10 bg-white/80 p-5 shadow-soft">
            <p className="text-sm text-espresso/55">Estoque baixo</p>
            <p className="mt-2 font-display text-4xl">{lowStockCount}</p>
            <p className="mt-2 text-sm text-espresso/65">
              Produtos com 5 unidades ou menos
            </p>
          </article>
          <article className="rounded-[1.75rem] border border-espresso/10 bg-white/80 p-5 shadow-soft">
            <p className="text-sm text-espresso/55">Com variacoes</p>
            <p className="mt-2 font-display text-4xl">{productsWithVariantsCount}</p>
            <p className="mt-2 text-sm text-espresso/65">
              Itens com grade de cor, tamanho ou SKU
            </p>
          </article>
        </section>
      ) : null}

      <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
        <div className="flex flex-col gap-4 border-b border-espresso/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
              Catalogo em lote
            </p>
            <h2 className="mt-2 font-display text-3xl">Importar e exportar CSV</h2>
            <p className="mt-3 max-w-3xl text-sm text-espresso/70">
              Use uma linha por produto ou por variacao. Cabecalho esperado:
              <br />
              <span className="font-mono text-xs">
                name,slug,description,price,costPrice,compareAt,stock,status,categorySlug,categoryName,imageUrl,variantSku,variantColor,variantSize,variantLabel,variantPrice,variantCompareAt,variantStock,variantImage,variantIsDefault
              </span>
            </p>
          </div>
          <a
            href="/api/admin/products/export"
            className="inline-flex rounded-full border border-espresso/15 px-5 py-3 text-sm"
          >
            Baixar catalogo atual
          </a>
        </div>

        <form action={importProductsCatalogAction} className="mt-5 space-y-4">
          <label className="block space-y-2 text-sm">
            <span>Conteudo CSV</span>
            <textarea
              name="csvContent"
              required
              minLength={10}
              rows={10}
              className="w-full rounded-[1.5rem] border border-espresso/15 bg-sand px-4 py-4 font-mono text-sm outline-none"
              placeholder={'"name","slug","description","price","costPrice","compareAt","stock","status","categorySlug","categoryName","imageUrl","variantSku","variantColor","variantSize","variantLabel","variantPrice","variantCompareAt","variantStock","variantImage","variantIsDefault"'}
            />
          </label>

          <label className="flex items-center gap-3 text-sm text-espresso/75">
            <input
              type="checkbox"
              name="overwriteExisting"
              className="h-4 w-4 rounded border border-espresso/20"
            />
            Sobrescrever produtos existentes quando o slug ja existir
          </label>

          <div className="flex flex-wrap gap-3">
            <button className="rounded-full bg-espresso px-5 py-3 text-sand">
              Importar catalogo
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
        <div className="flex flex-col gap-4 border-b border-espresso/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
              Estoque em lote
            </p>
            <h2 className="mt-2 font-display text-3xl">Importar e exportar estoque</h2>
            <p className="mt-3 max-w-3xl text-sm text-espresso/70">
              Ajuste produtos simples por <span className="font-mono">productSlug</span> e
              variacoes por <span className="font-mono">variantSku</span>. Informe
              <span className="font-mono"> newStock</span> ou
              <span className="font-mono"> quantityDelta</span>.
            </p>
          </div>
          <a
            href="/api/admin/products/stock-export"
            className="inline-flex rounded-full border border-espresso/15 px-5 py-3 text-sm"
          >
            Baixar estoque atual
          </a>
        </div>

        <form action={importStockCatalogAction} className="mt-5 space-y-4">
          <label className="block space-y-2 text-sm">
            <span>Conteudo CSV de estoque</span>
            <textarea
              name="csvContent"
              required
              minLength={10}
              rows={8}
              className="w-full rounded-[1.5rem] border border-espresso/15 bg-sand px-4 py-4 font-mono text-sm outline-none"
              placeholder={'"productSlug","productName","categoryName","variantSku","variantLabel","currentStock","newStock","quantityDelta","reason"'}
            />
          </label>

          <div className="rounded-[1.5rem] border border-espresso/10 bg-sand/40 p-4 text-xs text-espresso/70">
            Exemplo para produto simples:
            <br />
            <span className="font-mono">
              "camiseta-studio","","","","","12","20","","Inventario mensal"
            </span>
            <br />
            Exemplo para variacao:
            <br />
            <span className="font-mono">
              "camiseta-studio","","","CAMI-PRETA-M","","8","","-2","Avaria"
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="rounded-full bg-espresso px-5 py-3 text-sand">
              Importar estoque
            </button>
          </div>
        </form>
      </section>

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

            <label className="space-y-2 text-sm md:col-span-2">
              <span>Variacoes</span>
              <textarea
                name="variants"
                rows={5}
                className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 font-mono text-sm outline-none"
                placeholder="SKU|Cor|Tamanho|Label|Preco|CompareAt|Estoque|Imagem|default"
              />
              <p className="text-xs text-espresso/60">
                Uma variacao por linha. Exemplo:
                <br />
                CAMI-PRETA-M|Preto|M|Preto / M|89.90||8||default
              </p>
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
            <details
              key={product.id}
              className="group rounded-[2rem] border border-espresso/10 bg-white/80 shadow-soft"
            >
              <summary className="list-none cursor-pointer p-5 sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <img
                      src={`${product.imageUrl ?? productFallbackImage}?auto=format&fit=crop&w=320&q=80`}
                      alt={product.name}
                      className="h-24 w-20 rounded-[1.25rem] border border-espresso/10 object-cover"
                    />
                    <div className="space-y-3">
                      <div>
                        <p className="font-display text-3xl">{product.name}</p>
                        <p className="mt-1 text-sm text-espresso/60">
                          {product.slug} - {product.category}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-sand px-3 py-1 text-espresso/75">
                          {currency(product.price)}
                        </span>
                        <span className="rounded-full bg-sand px-3 py-1 text-espresso/75">
                          Estoque {product.stock}
                        </span>
                        <span className="rounded-full bg-sand px-3 py-1 text-espresso/75">
                          {product.variants.length > 0
                            ? `${product.variants.length} variacoes`
                            : "Produto simples"}
                        </span>
                        {product.compareAt ? (
                          <span className="rounded-full bg-terracotta/10 px-3 py-1 text-terracotta">
                            De {currency(product.compareAt)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        product.status === "ACTIVE"
                          ? "bg-moss/10 text-moss"
                          : product.status === "ARCHIVED"
                            ? "bg-espresso/10 text-espresso/70"
                            : "bg-terracotta/10 text-terracotta"
                      }`}
                    >
                      {product.status}
                    </span>
                    <a
                      href={`/produtos/${product.slug}`}
                      className="rounded-full border border-espresso/15 px-4 py-2 text-sm"
                    >
                      Ver vitrine
                    </a>
                    <span className="rounded-full border border-espresso/15 px-4 py-2 text-sm text-espresso/65 group-open:hidden">
                      Abrir detalhes
                    </span>
                    <span className="hidden rounded-full border border-espresso/15 px-4 py-2 text-sm text-espresso/65 group-open:inline-flex">
                      Fechar detalhes
                    </span>
                  </div>
                </div>
              </summary>

              <div className="border-t border-espresso/10 px-5 pb-5 pt-5 sm:px-6 sm:pb-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <article className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-terracotta">
                      Preco
                    </p>
                    <p className="mt-2 font-display text-3xl">{currency(product.price)}</p>
                    <p className="mt-2 text-sm text-espresso/60">
                      Custo {currency(product.costPrice)}
                    </p>
                  </article>
                  <article className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-terracotta">
                      Estoque
                    </p>
                    <p className="mt-2 font-display text-3xl">{product.stock}</p>
                    <p className="mt-2 text-sm text-espresso/60">
                      {product.stock <= 5 ? "Pedindo reposicao" : "Saudavel"}
                    </p>
                  </article>
                  <article className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-terracotta">
                      Grade
                    </p>
                    <p className="mt-2 font-display text-3xl">{product.variants.length}</p>
                    <p className="mt-2 text-sm text-espresso/60">
                      {product.variants.length > 0
                        ? "Variacoes cadastradas"
                        : "Sem variacoes"}
                    </p>
                  </article>
                  <article className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-terracotta">
                      Categoria
                    </p>
                    <p className="mt-2 font-display text-2xl">{product.category}</p>
                    <p className="mt-2 text-sm text-espresso/60">
                      Status {product.status}
                    </p>
                  </article>
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-terracotta">
                    Resumo rapido
                  </p>
                  <p className="mt-3 text-sm leading-7 text-espresso/70">
                    {product.description}
                  </p>
                  {product.variants.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {product.variants.slice(0, 8).map((variant) => (
                        <span
                          key={variant.id}
                          className="rounded-full border border-espresso/10 bg-white px-3 py-1 text-xs text-espresso/70"
                        >
                          {variant.optionLabel} - {variant.stock} un.
                        </span>
                      ))}
                    </div>
                  ) : null}
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

                  <label className="space-y-2 text-sm md:col-span-2">
                    <span>Variacoes</span>
                    <textarea
                      name="variants"
                      rows={6}
                      defaultValue={product.variants
                        .map(
                          (variant) =>
                            [
                              variant.sku,
                              variant.color ?? "",
                              variant.size ?? "",
                              variant.optionLabel,
                              variant.priceOverride ?? "",
                              variant.compareAtOverride ?? "",
                              variant.stock,
                              variant.imageUrl ?? "",
                              variant.isDefault ? "default" : ""
                            ].join("|")
                        )
                        .join("\n")}
                      className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 font-mono text-sm outline-none"
                      placeholder="SKU|Cor|Tamanho|Label|Preco|CompareAt|Estoque|Imagem|default"
                    />
                    <p className="text-xs text-espresso/60">
                      Se preencher, o estoque do produto passa a ser calculado pela soma das
                      variacoes.
                    </p>
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

                <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_auto]">
                  <form
                    action={adjustProductStockAction}
                    className="grid gap-3 rounded-[1.5rem] border border-espresso/10 bg-sand/30 p-4 md:grid-cols-[1fr_160px_1fr_auto]"
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

                  <form action={deleteProductAction} className="self-start">
                    <input type="hidden" name="id" value={product.id} />
                    <button className="rounded-full border border-red-300 px-5 py-3 text-sm text-red-700">
                      Excluir produto
                    </button>
                  </form>
                </div>
              </div>
            </details>
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
