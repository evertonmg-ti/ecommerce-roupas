import { Suspense } from "react";
import { CheckoutClient } from "@/components/checkout-client";

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-8 shadow-soft">
            <p className="text-sm text-espresso/70">Carregando checkout...</p>
          </div>
        </section>
      }
    >
      <CheckoutClient />
    </Suspense>
  );
}
