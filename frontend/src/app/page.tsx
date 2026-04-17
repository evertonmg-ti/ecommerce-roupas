import { ArrowRight, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { fallbackProducts } from "@/lib/data";
import { getFeaturedProducts } from "@/lib/public-products";

const pillars = [
  {
    icon: Sparkles,
    title: "Curadoria premium",
    description: "Colecoes com foco em estilo, margem e giro de estoque."
  },
  {
    icon: Truck,
    title: "Operacao agil",
    description: "Base pronta para frete, pedidos e acompanhamento."
  },
  {
    icon: ShieldCheck,
    title: "Administracao centralizada",
    description: "Painel para produtos, usuarios e visao de indicadores."
  }
];

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts().catch(() => fallbackProducts);

  return (
    <div className="pb-16">
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-20">
        <div className="space-y-8">
          <span className="inline-flex rounded-full border border-terracotta/20 bg-white/50 px-4 py-2 text-xs uppercase tracking-[0.3em] text-terracotta">
            Nova temporada
          </span>
          <div className="space-y-5">
            <h1 className="max-w-2xl font-display text-5xl leading-tight sm:text-6xl">
              Loja de roupas completa, rapida e pronta para escalar.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-espresso/70">
              Uma base moderna para vitrine, carrinho, autenticacao e painel administrativo
              com codigo organizado e foco em performance.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <a
              href="/produtos"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-espresso px-6 py-3 text-sand"
            >
              Explorar colecao
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/admin"
              className="inline-flex items-center justify-center rounded-full border border-espresso/15 px-6 py-3"
            >
              Acessar painel
            </a>
          </div>
        </div>
        <div className="rounded-[2rem] border border-white/50 bg-[linear-gradient(145deg,#b85c38,#2b2118)] p-8 text-sand shadow-soft">
          <p className="text-sm uppercase tracking-[0.25em] text-sand/70">Destaques</p>
          <div className="mt-10 space-y-8">
            <div>
              <p className="font-display text-5xl">+180</p>
              <p className="mt-2 text-sand/70">pedidos mensais processados na base demo</p>
            </div>
            <div>
              <p className="font-display text-5xl">3x</p>
              <p className="mt-2 text-sand/70">separacao clara entre frontend, backend e dados</p>
            </div>
            <div>
              <p className="font-display text-5xl">100%</p>
              <p className="mt-2 text-sand/70">layout responsivo pensado para mobile e desktop</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-3 lg:px-8">
        {pillars.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <article
              key={pillar.title}
              className="rounded-[2rem] border border-espresso/10 bg-white/65 p-6 shadow-soft"
            >
              <Icon className="h-8 w-8 text-terracotta" />
              <h2 className="mt-5 font-display text-3xl">{pillar.title}</h2>
              <p className="mt-3 text-sm leading-7 text-espresso/70">
                {pillar.description}
              </p>
            </article>
          );
        })}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
              Produtos em destaque
            </p>
            <h2 className="mt-3 font-display text-4xl">Colecao inicial</h2>
          </div>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
