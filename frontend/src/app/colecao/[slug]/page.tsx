import type { Metadata } from "next";
import { CatalogSearchAutocomplete } from "@/components/catalog-search-autocomplete";
import { ProductCard } from "@/components/product-card";
import { fallbackProducts } from "@/lib/data";
import {
  getPublicCategoryBySlug,
  getPublicCategories,
  getPublicProducts
} from "@/lib/public-products";

const sortOptions = [
  { value: "newest", label: "Mais recentes" },
  { value: "price_asc", label: "Menor preco" },
  { value: "price_desc", label: "Maior preco" },
  { value: "name_asc", label: "Nome A-Z" }
];

type CategoryCollectionPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function generateMetadata({
  params
}: CategoryCollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getPublicCategoryBySlug(slug).catch(() => null);
  const title = category?.name ?? "Colecao";
  const description =
    category?.description ??
    `Explore os produtos da colecao ${title} com curadoria premium da Maison Aurea.`;

  return {
    title: `${title} | Maison Aurea`,
    description,
    openGraph: {
      title: `${title} | Maison Aurea`,
      description
    }
  };
}

export default async function CategoryCollectionPage({
  params,
  searchParams
}: CategoryCollectionPageProps) {
  const { slug } = await params;
  const rawParams = searchParams ? await searchParams : undefined;
  const search = getParamValue(rawParams?.search)?.trim();
  const sort = getParamValue(rawParams?.sort)?.trim() || "newest";
  const availability = getParamValue(rawParams?.availability)?.trim();
  const saleOnly = getParamValue(rawParams?.saleOnly)?.trim();
  const minPrice = getParamValue(rawParams?.minPrice)?.trim();
  const maxPrice = getParamValue(rawParams?.maxPrice)?.trim();

  const [category, categories, products] = await Promise.all([
    getPublicCategoryBySlug(slug).catch(() => null),
    getPublicCategories().catch(() => []),
    getPublicProducts({
      category: slug,
      search,
      sort,
      availability,
      saleOnly,
      minPrice,
      maxPrice
    }).catch(() =>
      fallbackProducts.filter((product) => {
        const matchesCategory = product.categorySlug === slugify(slug);
        const matchesSearch = search
          ? `${product.name} ${product.description}`.toLowerCase().includes(search.toLowerCase())
          : true;

        return matchesCategory && matchesSearch;
      })
    )
  ]);

  const activeCategory = category ?? categories.find((item) => item.slug === slug) ?? null;
  const title = activeCategory?.name ?? "Colecao";
  const description =
    activeCategory?.description ??
    "Selecao curada com foco em design, acabamento premium e compra mais objetiva.";
  const searchSuggestions = Array.from(
    new Set(
      [
        ...products.map((product) => product.name),
        ...products.map((product) => product.category)
      ].filter(Boolean)
    )
  ).slice(0, 12);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-7 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Colecao</p>
        <h1 className="mt-3 font-display text-5xl">{title}</h1>
        <p className="mt-4 max-w-3xl text-espresso/70">{description}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/produtos" className="rounded-full border border-espresso/15 px-4 py-2 text-sm">
            Ver todo o catalogo
          </a>
          {categories.slice(0, 6).map((item) => (
            <a
              key={item.id}
              href={`/colecao/${item.slug}`}
              className={`rounded-full px-4 py-2 text-sm ${
                item.slug === slug
                  ? "bg-espresso text-sand"
                  : "border border-espresso/15"
              }`}
            >
              {item.name}
            </a>
          ))}
        </div>
      </div>

      <form className="mt-8 grid gap-4 rounded-[2rem] border border-espresso/10 bg-white/75 p-5 shadow-soft md:grid-cols-2 xl:grid-cols-[1.1fr_0.8fr_0.9fr_0.9fr_0.8fr_auto] xl:items-end">
        <label className="space-y-2 text-sm">
          <span className="text-espresso/70">Buscar nesta colecao</span>
          <CatalogSearchAutocomplete
            defaultValue={search ?? ""}
            suggestions={searchSuggestions}
            placeholder="Produto, tecido, modelagem..."
          />
        </label>

        <label className="space-y-2 text-sm">
          <span className="text-espresso/70">Ordenar</span>
          <select
            name="sort"
            defaultValue={sort}
            className="w-full rounded-[1.5rem] border border-espresso/15 bg-sand px-4 py-3 outline-none"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
            <option value="discount_desc">Maior desconto</option>
          </select>
        </label>

        <label className="space-y-2 text-sm">
          <span className="text-espresso/70">Preco minimo</span>
          <input
            name="minPrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={minPrice ?? ""}
            className="w-full rounded-[1.5rem] border border-espresso/15 bg-sand px-4 py-3 outline-none"
          />
        </label>

        <label className="space-y-2 text-sm">
          <span className="text-espresso/70">Preco maximo</span>
          <input
            name="maxPrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={maxPrice ?? ""}
            className="w-full rounded-[1.5rem] border border-espresso/15 bg-sand px-4 py-3 outline-none"
          />
        </label>

        <div className="space-y-3 rounded-[1.5rem] border border-espresso/10 bg-sand/55 px-4 py-3 text-sm">
          <label className="flex items-center gap-3 text-espresso/70">
            <input
              type="checkbox"
              name="saleOnly"
              value="true"
              defaultChecked={saleOnly === "true"}
              className="h-4 w-4 rounded border border-espresso/20"
            />
            Apenas em promocao
          </label>
          <label className="flex items-center gap-3 text-espresso/70">
            <input
              type="checkbox"
              name="availability"
              value="in_stock"
              defaultChecked={availability === "in_stock"}
              className="h-4 w-4 rounded border border-espresso/20"
            />
            Somente com estoque
          </label>
        </div>

        <button className="rounded-full bg-espresso px-6 py-3 text-sand">
          Atualizar colecao
        </button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-espresso/60">
        <p>
          {products.length} {products.length === 1 ? "produto nesta colecao" : "produtos nesta colecao"}
        </p>
        {(search || sort !== "newest" || minPrice || maxPrice || availability === "in_stock" || saleOnly === "true") ? (
          <a href={`/colecao/${slug}`} className="rounded-full border border-espresso/15 px-4 py-2">
            Limpar filtros
          </a>
        ) : null}
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {products.length > 0 ? (
          products.map((product) => <ProductCard key={product.id} product={product} />)
        ) : (
          <div className="rounded-[2rem] border border-espresso/10 bg-white/75 p-6 text-sm text-espresso/70 shadow-soft md:col-span-2 xl:col-span-3">
            Ainda nao ha produtos ativos nesta colecao com os filtros atuais.
          </div>
        )}
      </div>
    </section>
  );
}
