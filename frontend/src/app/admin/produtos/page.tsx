import { AdminFeedback } from "@/components/admin-feedback";
import { AdminProductFormFields } from "@/components/admin-product-form-fields";
import { getAdminCategories, getAdminProducts } from "@/lib/admin-api";
import { currency } from "@/lib/utils";
import {
  adjustProductStockAction,
  bulkUpdateProductStatusAction,
  createProductAction,
  duplicateProductAction,
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

function buildPageHref(basePath: string, page: number) {
  return `${basePath}${basePath.includes("?") ? "&" : "?"}page=${page}`;
}

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
        <p className="mt-3 max-w-3xl text-espresso/70">
          Cadastre com miniaturas, upload real de imagem, editor visual de variacoes e
          acoes em lote sem perder os detalhes completos do catalogo.
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

          <button className="rounded-full bg-espresso px-5 py-3 text-sand">
            Importar catalogo
          </button>
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

          <button className="rounded-full bg-espresso px-5 py-3 text-sand">
            Importar estoque
          </button>
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
        <div className="border-b border-espresso/10 pb-5">
          <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Novo produto</p>
          <h2 className="mt-2 font-display text-3xl">Cadastro profissional</h2>
          <p className="mt-3 max-w-3xl text-sm text-espresso/70">
            Use upload real da imagem principal, miniaturas, galeria rapida e editor visual
            para variacoes. O payload continua compativel com tudo o que ja existe no
            backend.
          </p>
        </div>

        {categories.length > 0 ? (
          <form action={createProductAction} className="mt-6 space-y-5">
            <AdminProductFormFields
              categories={categories}
              statusOptions={statusOptions}
            />
            <button className="rounded-full bg-espresso px-5 py-3 text-sand">
              Salvar produto
            </button>
          </form>
        ) : (
          <div className="mt-6 rounded-2xl border border-terracotta/20 bg-sand p-4 text-sm text-espresso/70">
            Nenhuma categoria disponivel. Cadastre ao menos uma categoria na base
            antes de criar produtos.
          </div>
        )}
      </section>

      {productList ? (
        <section className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
          <div className="flex flex-col gap-4 border-b border-espresso/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
                Acoes em lote
              </p>
              <h2 className="mt-2 font-display text-3xl">Listagem clean com detalhes</h2>
              <p className="mt-3 max-w-3xl text-sm text-espresso/70">
                Selecione varios itens pela listagem principal e altere o status de uma vez.
                Ao abrir um card, voce continua com acesso a toda a configuracao do produto.
              </p>
            </div>
          </div>

          <form
            id="bulk-products-form"
            action={bulkUpdateProductStatusAction}
            className="mt-5 flex flex-col gap-4 rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4 lg:flex-row lg:items-end"
          >
            <label className="space-y-2 text-sm lg:min-w-56">
              <span>Novo status para os selecionados</span>
              <select
                name="status"
                defaultValue="ACTIVE"
                className="w-full rounded-2xl border border-espresso/15 bg-white px-4 py-3 outline-none"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button className="rounded-full bg-espresso px-5 py-3 text-sand">
              Atualizar status dos selecionados
            </button>
            <p className="text-sm text-espresso/60">
              Marque os produtos direto na grade abaixo para aplicar a acao.
            </p>
          </form>

          <div className="mt-6 space-y-4">
            {products.map((product) => (
              <div key={product.id} className="relative">
                <input
                  form="bulk-products-form"
                  type="checkbox"
                  name="selectedIds"
                  value={product.id}
                  className="absolute left-5 top-5 z-10 h-5 w-5 rounded border border-espresso/20"
                  aria-label={`Selecionar ${product.name}`}
                />

                <details className="group rounded-[2rem] border border-espresso/10 bg-white/80 shadow-soft">
                  <summary className="list-none cursor-pointer p-5 pl-14 sm:p-6 sm:pl-16">
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
                        <p className="mt-2 font-display text-3xl">
                          {currency(product.price)}
                        </p>
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
                        <p className="mt-2 font-display text-3xl">
                          {product.variants.length}
                        </p>
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

                    <form action={updateProductAction} className="mt-6 space-y-5">
                      <input type="hidden" name="id" value={product.id} />
                      <AdminProductFormFields
                        categories={categories}
                        statusOptions={statusOptions}
                        product={product}
                      />
                      <button className="rounded-full bg-espresso px-5 py-3 text-sand">
                        Atualizar produto
                      </button>
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

                      <div className="self-start">
                        <div className="flex flex-col gap-3">
                          <form action={duplicateProductAction}>
                            <input type="hidden" name="id" value={product.id} />
                            <button className="rounded-full border border-espresso/15 px-5 py-3 text-sm">
                              Duplicar produto
                            </button>
                          </form>

                          <form action={deleteProductAction}>
                            <input type="hidden" name="id" value={product.id} />
                            <button className="rounded-full border border-red-300 px-5 py-3 text-sm text-red-700">
                              Excluir produto
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            ))}
          </div>
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
                href={buildPageHref(basePath, productList.page - 1)}
                className="rounded-full border border-espresso/15 px-4 py-2 text-sm"
              >
                Anterior
              </a>
            ) : null}
            {productList.page < productList.totalPages ? (
              <a
                href={buildPageHref(basePath, productList.page + 1)}
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
