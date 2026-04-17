import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/data";
import { currency } from "@/lib/utils";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl =
    product.imageUrl ??
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab";

  return (
    <article className="overflow-hidden rounded-[2rem] border border-espresso/10 bg-white/75 shadow-soft">
      <div className="relative h-72">
        <Image
          src={`${imageUrl}?auto=format&fit=crop&w=900&q=80`}
          alt={product.name}
          fill
          className="object-cover"
        />
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
        <Link
          href={`/produtos/${product.slug}`}
          className="inline-flex rounded-full bg-espresso px-4 py-2 text-sm text-sand"
        >
          Ver produto
        </Link>
      </div>
    </article>
  );
}
