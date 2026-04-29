import Image from "next/image";
import { ProductCardActions } from "@/components/product-card-actions";
import { Product } from "@/lib/data";
import { currency } from "@/lib/utils";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl =
    product.imageUrl ??
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab";
  const discountPercent = product.compareAt
    ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100)
    : 0;
  const unavailable = product.stock < 1;
  const lowStock = !unavailable && product.stock <= 5;

  return (
    <article className="overflow-hidden rounded-[2rem] border border-espresso/10 bg-white/75 shadow-soft">
      <div className="relative h-72">
        <Image
          src={`${imageUrl}?auto=format&fit=crop&w=900&q=80`}
          alt={product.name}
          fill
          className="object-cover"
        />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {discountPercent > 0 ? (
            <span className="rounded-full bg-terracotta px-3 py-1 text-xs text-sand">
              -{discountPercent}%
            </span>
          ) : null}
          {unavailable ? (
            <span className="rounded-full bg-espresso px-3 py-1 text-xs text-sand">
              Indisponivel
            </span>
          ) : lowStock ? (
            <span className="rounded-full bg-sand px-3 py-1 text-xs text-terracotta">
              Ultimas {product.stock}
            </span>
          ) : null}
        </div>
      </div>
      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-terracotta">
              {product.category}
            </p>
            <h3 className="mt-2 font-display text-2xl">{product.name}</h3>
          </div>
          <div className="text-right">
            <p className="font-semibold">{currency(product.price)}</p>
            {product.compareAt ? (
              <p className="text-sm text-espresso/45 line-through">
                {currency(product.compareAt)}
              </p>
            ) : null}
          </div>
        </div>
        <p className="text-sm leading-6 text-espresso/70">{product.description}</p>
        <ProductCardActions
          product={{
            id: product.id,
            productId: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            compareAt: product.compareAt,
            imageUrl: product.imageUrl,
            category: product.category,
            stock: product.stock
          }}
        />
      </div>
    </article>
  );
}
