import { CustomerCenterClient } from "@/components/customer-center-client";
import { lookupCustomerOrders } from "@/lib/admin-api";

type CustomerCenterPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CustomerCenterPage({
  searchParams
}: CustomerCenterPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const email = getParamValue(params?.email)?.trim();
  const orders = email ? await lookupCustomerOrders(email).catch(() => []) : [];

  return <CustomerCenterClient initialEmail={email} orders={orders} />;
}
