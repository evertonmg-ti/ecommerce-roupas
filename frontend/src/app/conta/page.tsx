import Link from "next/link";
import { redirect } from "next/navigation";
import { customerLogoutAction } from "@/app/entrar/actions";
import { ReorderOrderButton } from "@/components/reorder-order-button";
import { requireCustomerSession } from "@/lib/auth";
import {
  getCurrentCustomerAccount,
  getCurrentCustomerOrders
} from "@/lib/customer-api";
import { currency } from "@/lib/utils";
import {
  createCustomerAddressAction,
  deleteCustomerAddressAction,
  updateCustomerAddressAction,
  updateCustomerProfileAction
} from "./actions";

type CustomerAccountPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CustomerAccountPage({
  searchParams
}: CustomerAccountPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const success = getParamValue(params?.success);
  const error = getParamValue(params?.error);

  await requireCustomerSession();
  const [account, orders] = await Promise.all([
    getCurrentCustomerAccount(),
    getCurrentCustomerOrders()
  ]).catch(() => redirect("/entrar"));

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-8 shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Minha conta</p>
              <h1 className="mt-4 font-display text-5xl">Conta autenticada</h1>
              <p className="mt-4 max-w-2xl text-espresso/70">
                Gerencie seu cadastro, seus enderecos e acompanhe seu historico de compras.
              </p>
            </div>
            <form action={customerLogoutAction}>
              <button className="rounded-full border border-espresso/15 px-5 py-3 text-sm">
                Sair da conta
              </button>
            </form>
          </div>
        </div>

        {success ? (
          <div className="rounded-[1.5rem] border border-moss/20 bg-moss/10 p-4 text-sm text-moss">
            Operacao concluida com sucesso.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[1.5rem] border border-terracotta/20 bg-terracotta/10 p-4 text-sm text-terracotta">
            Nao foi possivel concluir a operacao solicitada.
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
              <p className="text-xs uppercase tracking-[0.25em] text-terracotta">
                Perfil
              </p>
              <p className="mt-3 text-sm text-espresso/65">
                Seu carrinho autenticado agora sincroniza automaticamente entre dispositivos
                enquanto esta sessao estiver ativa.
              </p>
              <form action={updateCustomerProfileAction} className="mt-6 space-y-4">
                <label className="block space-y-2 text-sm">
                  <span>Nome</span>
                  <input
                    name="name"
                    required
                    defaultValue={account.name}
                    className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3"
                  />
                </label>
                <label className="block space-y-2 text-sm">
                  <span>Email</span>
                  <input
                    name="email"
                    type="email"
                    required
                    defaultValue={account.email}
                    className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3"
                  />
                </label>
                <label className="block space-y-2 text-sm">
                  <span>Nova senha</span>
                  <input
                    name="password"
                    type="password"
                    minLength={6}
                    className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3"
                    placeholder="Preencha so se quiser trocar"
                  />
                </label>
                <button className="rounded-full bg-espresso px-5 py-3 text-sm text-sand">
                  Salvar perfil
                </button>
              </form>
            </div>

            <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
              <p className="text-xs uppercase tracking-[0.25em] text-terracotta">
                Novo endereco
              </p>
              <form action={createCustomerAddressAction} className="mt-6 grid gap-4 md:grid-cols-2">
                <input
                  name="label"
                  required
                  placeholder="Casa, trabalho..."
                  className="rounded-2xl border border-espresso/15 bg-sand px-4 py-3 text-sm"
                />
                <input
                  name="recipientName"
                  required
                  placeholder="Destinatario"
                  className="rounded-2xl border border-espresso/15 bg-sand px-4 py-3 text-sm"
                />
                <input
                  name="customerDocument"
                  placeholder="CPF/CNPJ"
                  className="rounded-2xl border border-espresso/15 bg-sand px-4 py-3 text-sm"
                />
                <input
                  name="customerPhone"
                  placeholder="Telefone"
                  className="rounded-2xl border border-espresso/15 bg-sand px-4 py-3 text-sm"
                />
                <input
                  name="shippingAddress"
                  required
                  placeholder="Endereco"
                  className="rounded-2xl border border-espresso/15 bg-sand px-4 py-3 text-sm md:col-span-2"
                />
                <input
                  name="shippingNumber"
                  required
                  placeholder="Numero"
                  className="rounded-2xl border border-espresso/15 bg-sand px-4 py-3 text-sm"
                />
                <input
                  name="shippingAddress2"
                  placeholder="Complemento"
                  className="rounded-2xl border border-espresso/15 bg-sand px-4 py-3 text-sm"
                />
                <input
                  name="shippingNeighborhood"
                  required
                  placeholder="Bairro"
                  className="rounded-2xl border border-espresso/15 bg-sand px-4 py-3 text-sm"
                />
                <input
                  name="shippingCity"
                  required
                  placeholder="Cidade"
                  className="rounded-2xl border border-espresso/15 bg-sand px-4 py-3 text-sm"
                />
                <input
                  name="shippingState"
                  required
                  maxLength={2}
                  placeholder="UF"
                  className="rounded-2xl border border-espresso/15 bg-sand px-4 py-3 text-sm uppercase"
                />
                <input
                  name="shippingPostalCode"
                  required
                  placeholder="CEP"
                  className="rounded-2xl border border-espresso/15 bg-sand px-4 py-3 text-sm"
                />
                <label className="flex items-center gap-2 text-sm md:col-span-2">
                  <input type="checkbox" name="isDefault" />
                  Definir como endereco principal
                </label>
                <button className="rounded-full bg-espresso px-5 py-3 text-sm text-sand md:col-span-2">
                  Adicionar endereco
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-terracotta">
                    Enderecos
                  </p>
                  <h2 className="mt-2 font-display text-3xl">Livro de enderecos</h2>
                </div>
                <span className="rounded-full border border-espresso/15 px-4 py-2 text-sm">
                  {account.addresses.length} salvo(s)
                </span>
              </div>
              <div className="mt-6 space-y-4">
                {account.addresses.length === 0 ? (
                  <p className="text-sm text-espresso/65">
                    Nenhum endereco salvo ainda.
                  </p>
                ) : (
                  account.addresses.map((address) => (
                    <form
                      key={address.id}
                      action={updateCustomerAddressAction}
                      className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4"
                    >
                      <input type="hidden" name="addressId" value={address.id} />
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <p className="font-medium">
                          {address.label} {address.isDefault ? "- Principal" : ""}
                        </p>
                        <div className="flex gap-3">
                          <label className="flex items-center gap-2 text-xs">
                            <input type="checkbox" name="isDefault" defaultChecked={address.isDefault} />
                            Principal
                          </label>
                          <button
                            formAction={deleteCustomerAddressAction}
                            className="rounded-full border border-terracotta/20 px-3 py-1 text-xs text-terracotta"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <input name="label" defaultValue={address.label} className="rounded-2xl border border-espresso/15 bg-white px-4 py-3 text-sm" />
                        <input name="recipientName" defaultValue={address.recipientName} className="rounded-2xl border border-espresso/15 bg-white px-4 py-3 text-sm" />
                        <input name="customerDocument" defaultValue={address.customerDocument} className="rounded-2xl border border-espresso/15 bg-white px-4 py-3 text-sm" />
                        <input name="customerPhone" defaultValue={address.customerPhone} className="rounded-2xl border border-espresso/15 bg-white px-4 py-3 text-sm" />
                        <input name="shippingAddress" defaultValue={address.shippingAddress} className="rounded-2xl border border-espresso/15 bg-white px-4 py-3 text-sm md:col-span-2" />
                        <input name="shippingNumber" defaultValue={address.shippingNumber} className="rounded-2xl border border-espresso/15 bg-white px-4 py-3 text-sm" />
                        <input name="shippingAddress2" defaultValue={address.shippingAddress2} className="rounded-2xl border border-espresso/15 bg-white px-4 py-3 text-sm" />
                        <input name="shippingNeighborhood" defaultValue={address.shippingNeighborhood} className="rounded-2xl border border-espresso/15 bg-white px-4 py-3 text-sm" />
                        <input name="shippingCity" defaultValue={address.shippingCity} className="rounded-2xl border border-espresso/15 bg-white px-4 py-3 text-sm" />
                        <input name="shippingState" defaultValue={address.shippingState} className="rounded-2xl border border-espresso/15 bg-white px-4 py-3 text-sm uppercase" />
                        <input name="shippingPostalCode" defaultValue={address.shippingPostalCode} className="rounded-2xl border border-espresso/15 bg-white px-4 py-3 text-sm" />
                      </div>
                      <button className="mt-4 rounded-full border border-espresso/15 px-5 py-3 text-sm">
                        Salvar endereco
                      </button>
                    </form>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-terracotta">
                    Historico
                  </p>
                  <h2 className="mt-2 font-display text-3xl">Pedidos autenticados</h2>
                </div>
                <Link
                  href={`/meus-pedidos?email=${encodeURIComponent(account.email)}`}
                  className="rounded-full border border-espresso/15 px-4 py-2 text-sm"
                >
                  Ver modo publico
                </Link>
              </div>
              <div className="mt-6 space-y-4">
                {orders.length === 0 ? (
                  <p className="text-sm text-espresso/65">Nenhum pedido encontrado.</p>
                ) : (
                  orders.slice(0, 5).map((order) => (
                    <article
                      key={order.id}
                      className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-medium">Pedido {order.id}</p>
                          <p className="mt-1 text-sm text-espresso/65">
                            {order.createdAt} - {order.paymentMethod} - {order.shippingMethod}
                          </p>
                          {order.trackingCode ? (
                            <p className="mt-1 text-sm text-espresso/65">
                              Rastreio: {order.trackingCode}
                            </p>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <p className="rounded-full bg-moss/10 px-3 py-1 text-xs text-moss">
                            {order.status}
                          </p>
                          <p className="mt-2 font-medium">{currency(order.total)}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <ReorderOrderButton items={order.items} />
                        <Link
                          href={`/meus-pedidos?email=${encodeURIComponent(account.email)}`}
                          className="rounded-full border border-espresso/15 px-5 py-3 text-sm"
                        >
                          Ver timeline completa
                        </Link>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
