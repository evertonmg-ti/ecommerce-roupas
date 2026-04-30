import { Suspense } from "react";
import { CheckoutClient } from "@/components/checkout-client";
import { getCustomerSession } from "@/lib/auth";
import { getCurrentCustomerAccount } from "@/lib/customer-api";

export default async function CheckoutPage() {
  const customerSession = await getCustomerSession();
  const initialCustomerData = customerSession
    ? await getCurrentCustomerAccount()
        .then((account) => {
          const preferredShippingMethod =
            account.preferredShippingMethod ?? "STANDARD";
          const defaultAddress =
            (preferredShippingMethod === "EXPRESS"
              ? account.addresses.find((address) => address.favoriteForExpress)
              : preferredShippingMethod === "PICKUP"
                ? account.addresses.find((address) => address.favoriteForPickup)
                : account.addresses.find((address) => address.favoriteForStandard)) ??
            account.addresses.find((address) => address.isDefault);

          return {
            name: account.name,
            email: account.email,
            walletBalance: account.walletBalance,
            preferredPaymentMethod: account.preferredPaymentMethod,
            preferredShippingMethod: account.preferredShippingMethod,
            addresses: account.addresses,
            defaultAddress
          };
        })
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
