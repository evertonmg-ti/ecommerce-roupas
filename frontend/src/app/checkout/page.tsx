import { Suspense } from "react";
import { CheckoutClient } from "@/components/checkout-client";
import { getCustomerSession } from "@/lib/auth";
import { getCurrentCustomerAccount } from "@/lib/customer-api";

export default async function CheckoutPage() {
  const customerSession = await getCustomerSession();
  const initialCustomerData = customerSession
    ? await getCurrentCustomerAccount()
        .then((account) => ({
          name: account.name,
          email: account.email,
          addresses: account.addresses,
          defaultAddress: account.addresses.find((address) => address.isDefault)
        }))
        .catch(() => null)
    : null;

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
      <CheckoutClient initialCustomerData={initialCustomerData ?? undefined} />
    </Suspense>
  );
}
