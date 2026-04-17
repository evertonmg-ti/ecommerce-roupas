import { ProductCard } from "@/components/product-card";
import { fallbackProducts } from "@/lib/data";
import { getPublicProducts } from "@/lib/public-products";

export default async function ProductsPage() {
  const products = await getPublicProducts().catch(() => fallbackProducts);

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
      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
