import { ProductCard } from "@/components/product-card";
import { fallbackProducts } from "@/lib/data";
import { getPublicCategories, getPublicProducts } from "@/lib/public-products";

const sortOptions = [
  { value: "newest", label: "Mais recentes" },
  { value: "price_asc", label: "Menor preco" },
  { value: "price_desc", label: "Maior preco" },
  { value: "name_asc", label: "Nome A-Z" }
];

type ProductsPageProps = {
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

function filterFallbackProducts(filters: {
  search?: string;
  category?: string;
  sort?: string;
}) {
  const search = filters.search?.toLowerCase();
  const category = filters.category?.toLowerCase();

  return fallbackProducts
    .filter((product) => {
      const matchesSearch = search
        ? `${product.name} ${product.description}`.toLowerCase().includes(search)
        : true;
      const matchesCategory = category
        ? slugify(product.category) === category
        : true;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (filters.sort) {
        case "price_asc":
          return a.price - b.price;
        case "price_desc":
          return b.price - a.price;
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "newest":
        default:
          return 0;
      }
    });
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const filters = {
    search: getParamValue(params?.search)?.trim(),
    category: getParamValue(params?.category)?.trim(),
    sort: getParamValue(params?.sort)?.trim() || "newest"
  };
  const [products, categories] = await Promise.all([
    getPublicProducts(filters).catch(() => filterFallbackProducts(filters)),
    getPublicCategories().catch(() => [])
  ]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Catalogo</p>
        <h1 className="mt-3 font-display text-5xl">Produtos</h1>
        <p className="mt-4 text-espresso/70">
          Estrutura preparada para listar produtos vindos da API com filtros por categoria,
          busca e ordenacao.
        </p>
      </div>

      <form className="mt-8 grid gap-4 rounded-[2rem] border border-espresso/10 bg-white/75 p-5 shadow-soft md:grid-cols-[1.2fr_0.8fr_0.8fr_auto] md:items-end">
        <label className="space-y-2 text-sm">
          <span className="text-espresso/70">Buscar</span>
          <input
            name="search"
            defaultValue={filters.search ?? ""}
            className="w-full rounded-[1.5rem] border border-espresso/15 bg-sand px-4 py-3 outline-none"
            placeholder="camiseta, vestido, linho..."
          />
        </label>

        <label className="space-y-2 text-sm">
          <span className="text-espresso/70">Categoria</span>
          <select
            name="category"
            defaultValue={filters.category ?? ""}
            className="w-full rounded-[1.5rem] border border-espresso/15 bg-sand px-4 py-3 outline-none"
          >
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm">
          <span className="text-espresso/70">Ordenar</span>
          <select
            name="sort"
            defaultValue={filters.sort}
            className="w-full rounded-[1.5rem] border border-espresso/15 bg-sand px-4 py-3 outline-none"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button className="rounded-full bg-espresso px-6 py-3 text-sand">
          Filtrar
        </button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-espresso/60">
        <p>
          {products.length} {products.length === 1 ? "produto encontrado" : "produtos encontrados"}
        </p>
        {(filters.search || filters.category || filters.sort !== "newest") ? (
          <a href="/produtos" className="rounded-full border border-espresso/15 px-4 py-2">
            Limpar filtros
          </a>
        ) : null}
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {products.length > 0 ? (
          products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <div className="rounded-[2rem] border border-espresso/10 bg-white/75 p-6 text-sm text-espresso/70 shadow-soft md:col-span-2 xl:col-span-3">
            Nenhum produto encontrado para os filtros atuais.
          </div>
        )}
      </div>
    </section>
  );
}
