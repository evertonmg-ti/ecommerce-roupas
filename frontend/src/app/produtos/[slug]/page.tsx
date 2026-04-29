import Image from "next/image";
import { ProductBundleSuggestions } from "@/components/product-bundle-suggestions";
import { ProductPurchaseActions } from "@/components/product-purchase-actions";
import { ProductCard } from "@/components/product-card";
import { fallbackProducts } from "@/lib/data";
import { getPublicProductBySlug, getRelatedProducts } from "@/lib/public-products";
import { currency } from "@/lib/utils";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductDetailsPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product =
    (await getPublicProductBySlug(slug).catch(() => null)) ??
    fallbackProducts.find((item) => item.slug === slug);

  if (!product) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-8 shadow-soft">
          <h1 className="font-display text-4xl">Produto nao encontrado</h1>
          <p className="mt-3 text-espresso/70">
            A rota esta pronta para buscar detalhes reais da API.
          </p>
        </div>
      </section>
    );
  }

  const relatedProducts = await getRelatedProducts(product)
    .catch(() =>
      fallbackProducts
        .filter(
          (item) =>
            item.slug !== product.slug &&
            (item.categorySlug === product.categorySlug ||
              item.category === product.category)
        )
        .slice(0, 3)
    );
  const categoryHref = product.categorySlug
    ? `/produtos?category=${product.categorySlug}`
    : "/produtos";

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="grid gap-10 lg:grid-cols-2">
        <div className="relative min-h-[520px] overflow-hidden rounded-[2rem] border border-espresso/10 bg-white/70 shadow-soft">
          <Image
            src={`${product.imageUrl ?? fallbackProducts[0]?.imageUrl}?auto=format&fit=crop&w=1200&q=80`}
            alt={product.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-8 shadow-soft">
          <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
            {product.category}
          </p>
          <h1 className="mt-4 font-display text-5xl">{product.name}</h1>
          <p className="mt-5 text-lg leading-8 text-espresso/70">{product.description}</p>
          <div className="mt-8 flex items-end gap-4">
            <p className="font-display text-4xl">{currency(product.price)}</p>
            {product.compareAt ? (
              <p className="pb-1 text-lg text-espresso/45 line-through">
                {currency(product.compareAt)}
              </p>
            ) : null}
          </div>
          <p className="mt-4 text-sm text-moss">
            Estoque disponivel: {product.stock} unidades
          </p>
          <ProductPurchaseActions
            product={{
              id: product.id,
              productId: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              imageUrl: product.imageUrl,
              category: product.category,
              stock: product.stock,
              variants: product.variants
            }}
          />
        </div>
      </section>

      <ProductBundleSuggestions
        mainProduct={product}
        relatedProducts={relatedProducts}
      />

      <section className="mt-14">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
              Combine com
            </p>
            <h2 className="mt-3 font-display text-4xl">Produtos relacionados</h2>
          </div>
          <a
            href={categoryHref}
            className="inline-flex rounded-full border border-espresso/15 px-5 py-3 text-sm"
          >
            Ver categoria
          </a>
        </div>

        {relatedProducts.length > 0 ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-[2rem] border border-espresso/10 bg-white/75 p-6 text-sm text-espresso/70 shadow-soft">
            Ainda nao ha outros produtos ativos nesta categoria.
          </div>
        )}
      </section>
    </div>
  );
}
