import Link from "next/link";
import { redirect } from "next/navigation";
import { customerLogoutAction } from "@/app/entrar/actions";
import { CustomerReturnRequestForm } from "@/components/customer-return-request-form";
import { ReorderOrderButton } from "@/components/reorder-order-button";
import { TimelineCommentForm } from "@/components/timeline-comment-form";
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

const returnFinancialStatusLabels: Record<string, string> = {
  NOT_APPLICABLE: "Nao se aplica",
  PENDING: "Pendente",
  REFUNDED: "Reembolsado",
  STORE_CREDIT_ISSUED: "Vale-troca emitido"
};

const creditTransactionLabels: Record<string, string> = {
  RETURN_STORE_CREDIT: "Vale-troca emitido",
  ORDER_STORE_CREDIT_USAGE: "Uso de credito no checkout",
  ORDER_CANCELLATION_REVERSAL: "Credito devolvido por cancelamento",
  RETURN_REFUND_RECORDED: "Reembolso financeiro registrado",
  MANUAL_CREDIT: "Ajuste manual",
  PROMOTIONAL_CREDIT: "Credito promocional emitido",
  PROMOTIONAL_CREDIT_USAGE: "Uso de credito promocional"
};

const activeReturnRequestStatuses = ["REQUESTED", "APPROVED", "RECEIVED"] as const;

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
            {success === "return_request_created"
              ? "Solicitacao de devolucao/troca enviada com sucesso."
              : success === "return_request_comment_created"
                ? "Comentario enviado para a equipe com sucesso."
              : "Operacao concluida com sucesso."}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[1.5rem] border border-terracotta/20 bg-terracotta/10 p-4 text-sm text-terracotta">
            {error === "return_request_failed"
              ? "Nao foi possivel criar a solicitacao de devolucao/troca."
              : error === "return_request_comment_failed"
                ? "Nao foi possivel enviar seu comentario para a solicitacao."
              : "Nao foi possivel concluir a operacao solicitada."}
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
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block space-y-2 text-sm">
                    <span>Pagamento preferido</span>
                    <select
                      name="preferredPaymentMethod"
                      defaultValue={account.preferredPaymentMethod ?? "PIX"}
                      className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3"
                    >
                      <option value="PIX">PIX</option>
                      <option value="CREDIT_CARD">Cartao de credito</option>
                      <option value="BOLETO">Boleto</option>
                    </select>
                  </label>
                  <label className="block space-y-2 text-sm">
                    <span>Frete preferido</span>
                    <select
                      name="preferredShippingMethod"
                      defaultValue={account.preferredShippingMethod ?? "STANDARD"}
                      className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3"
                    >
                      <option value="STANDARD">Entrega padrao</option>
                      <option value="EXPRESS">Entrega expressa</option>
                      <option value="PICKUP">Retirada na loja</option>
                    </select>
                  </label>
                </div>
                <button className="rounded-full bg-espresso px-5 py-3 text-sm text-sand">
                  Salvar perfil
                </button>
              </form>
            </div>

            <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
              <p className="text-xs uppercase tracking-[0.25em] text-terracotta">
                Carteira
              </p>
              <h2 className="mt-2 font-display text-3xl">Credito em conta</h2>
              <p className="mt-3 text-sm text-espresso/65">
                Use esse saldo no checkout e acompanhe a movimentacao financeira do seu
                pos-venda.
              </p>
              <div className="mt-5 rounded-[1.5rem] border border-moss/20 bg-moss/10 p-5">
                <p className="text-sm text-espresso/60">Saldo total disponivel</p>
                <p className="mt-2 font-display text-4xl text-moss">
                  {currency(account.totalCreditBalance)}
                </p>
                <p className="mt-2 text-sm text-espresso/65">
                  Carteira padrao: {currency(account.walletBalance)} | Promocional:{" "}
                  {currency(account.promotionalCreditBalance)}
                </p>
              </div>
              {account.promotionalCreditGrants.length > 0 ? (
                <div className="mt-5 space-y-3">
                  <p className="text-xs uppercase tracking-[0.25em] text-terracotta">
                    Creditos promocionais com validade
                  </p>
                  {account.promotionalCreditGrants.map((grant) => (
                    <div
                      key={grant.id}
                      className="rounded-[1.25rem] border border-espresso/10 bg-sand/35 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{grant.description}</p>
                          <p className="mt-1 text-sm text-espresso/60">
                            Expira em {grant.expiresAt}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-terracotta">
                            {currency(grant.remainingAmount)}
                          </p>
                          <p className="mt-1 text-xs text-espresso/55">
                            de {currency(grant.initialAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="mt-5 space-y-3">
                {account.creditTransactions.length === 0 ? (
                  <div className="rounded-[1.25rem] border border-espresso/10 bg-sand/35 p-4 text-sm text-espresso/65">
                    Nenhuma movimentacao financeira registrada ainda.
                  </div>
                ) : (
                  account.creditTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="rounded-[1.25rem] border border-espresso/10 bg-sand/35 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">
                            {creditTransactionLabels[transaction.type] ?? transaction.type}
                          </p>
                          <p className="mt-1 text-sm text-espresso/60">
                            {transaction.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-medium ${
                              transaction.balanceAfter >= transaction.balanceBefore
                                ? "text-moss"
                                : "text-terracotta"
                            }`}
                          >
                            {transaction.balanceAfter >= transaction.balanceBefore ? "+" : "-"}
                            {currency(transaction.amount)}
                          </p>
                          <p className="mt-1 text-xs text-espresso/55">
                            {transaction.createdAt}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-espresso/65">
                        Saldo: {currency(transaction.balanceBefore)} para{" "}
                        {currency(transaction.balanceAfter)}
                        {transaction.orderId ? ` - pedido ${transaction.orderId}` : ""}
                      </p>
                    </div>
                  ))
                )}
              </div>
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
                <div className="md:col-span-2 grid gap-2 rounded-[1.25rem] border border-espresso/10 bg-white/40 p-4 text-sm">
                  <p className="text-espresso/65">Marcar como favorito para:</p>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="favoriteForStandard" />
                    Entrega padrao
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="favoriteForExpress" />
                    Entrega expressa
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="favoriteForPickup" />
                    Retirada na loja
                  </label>
                </div>
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
                      <div className="mt-4 grid gap-2 rounded-[1.25rem] border border-espresso/10 bg-white/50 p-4 text-sm">
                        <p className="text-espresso/65">Favorito por contexto</p>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="favoriteForStandard"
                            defaultChecked={address.favoriteForStandard}
                          />
                          Entrega padrao
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="favoriteForExpress"
                            defaultChecked={address.favoriteForExpress}
                          />
                          Entrega expressa
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="favoriteForPickup"
                            defaultChecked={address.favoriteForPickup}
                          />
                          Retirada na loja
                        </label>
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
                  <p className="mt-2 text-sm text-espresso/65">
                    A recompra daqui leva seus itens direto ao checkout com o endereco
                    principal da conta como ponto de partida.
                  </p>
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
                          {order.storeCreditApplied > 0 ? (
                            <p className="mt-1 text-sm text-moss">
                              Credito usado: {currency(order.storeCreditApplied)}
                            </p>
                          ) : null}
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
                        <ReorderOrderButton
                          items={order.items}
                          redirectToCheckout
                          label="Comprar novamente agora"
                        />
                        <Link
                          href={`/meus-pedidos?email=${encodeURIComponent(account.email)}`}
                          className="rounded-full border border-espresso/15 px-5 py-3 text-sm"
                        >
                          Ver timeline completa
                        </Link>
                      </div>
                      {order.returnRequests.length > 0 ? (
                        <div className="mt-4 rounded-[1.25rem] border border-espresso/10 bg-white/50 p-4">
                          <p className="text-sm font-medium">Solicitacoes deste pedido</p>
                          <div className="mt-3 space-y-3 text-sm text-espresso/70">
                            {order.returnRequests.map((request) => (
                              <div
                                key={request.id}
                                className="rounded-[1rem] border border-espresso/10 bg-sand/35 p-3"
                              >
                                <p>
                                  <strong>{request.type === "EXCHANGE" ? "Troca" : "Devolucao"}</strong>{" "}
                                  - {request.status}
                                </p>
                                <p className="mt-1">
                                  <strong>Motivo:</strong> {request.reason}
                                </p>
                                {request.details ? (
                                  <p className="mt-1">
                                    <strong>Detalhes:</strong> {request.details}
                                  </p>
                                ) : null}
                                {request.reverseLogisticsCode ? (
                                  <p className="mt-1">
                                    <strong>Codigo de postagem:</strong>{" "}
                                    {request.reverseLogisticsCode}
                                  </p>
                                ) : null}
                                {request.reverseShippingLabel ? (
                                  <p className="mt-1">
                                    <strong>Etiqueta/Referencia:</strong>{" "}
                                    {request.reverseShippingLabel}
                                  </p>
                                ) : null}
                                {request.returnDestinationAddress ? (
                                  <p className="mt-1">
                                    <strong>Endereco de devolucao:</strong>{" "}
                                    {request.returnDestinationAddress}
                                  </p>
                                ) : null}
                                {request.reverseInstructions ? (
                                  <p className="mt-1">
                                    <strong>Instrucoes:</strong> {request.reverseInstructions}
                                  </p>
                                ) : null}
                                {request.reverseDeadlineAt ? (
                                  <p className="mt-1">
                                    <strong>Prazo para envio:</strong>{" "}
                                    {request.reverseDeadlineAt}
                                  </p>
                                ) : null}
                                {request.financialStatus ? (
                                  <p className="mt-1">
                                    <strong>Status financeiro:</strong>{" "}
                                    {returnFinancialStatusLabels[request.financialStatus] ??
                                      request.financialStatus}
                                  </p>
                                ) : null}
                                {request.refundAmount > 0 ? (
                                  <p className="mt-1">
                                    <strong>Reembolso previsto:</strong>{" "}
                                    {currency(request.refundAmount)}
                                  </p>
                                ) : null}
                                {request.storeCreditAmount > 0 ? (
                                  <p className="mt-1">
                                    <strong>Vale-troca previsto:</strong>{" "}
                                    {currency(request.storeCreditAmount)}
                                  </p>
                                ) : null}
                                {request.restockedAt ? (
                                  <p className="mt-1">
                                    <strong>Item reintegrado ao estoque em:</strong>{" "}
                                    {request.restockedAt}
                                  </p>
                                ) : null}
                                {request.resolutionNote ? (
                                  <p className="mt-1">
                                    <strong>Resposta:</strong> {request.resolutionNote}
                                  </p>
                                ) : null}
                                {request.attachments.length > 0 ? (
                                  <div className="mt-4 rounded-[0.9rem] border border-espresso/10 bg-white/60 p-3">
                                    <p className="text-xs uppercase tracking-[0.22em] text-terracotta">
                                      Anexos enviados
                                    </p>
                                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                      {request.attachments.map((attachment) => (
                                        <div
                                          key={attachment.id}
                                          className="rounded-[0.9rem] border border-espresso/10 bg-sand/35 p-3"
                                        >
                                          {attachment.mimeType.startsWith("image/") ? (
                                            <img
                                              src={attachment.dataUrl}
                                              alt={attachment.fileName}
                                              className="mb-3 h-32 w-full rounded-xl object-cover"
                                            />
                                          ) : null}
                                          <p className="font-medium text-espresso">
                                            {attachment.fileName}
                                          </p>
                                          <p className="mt-1 text-xs text-espresso/55">
                                            {attachment.createdAt}
                                          </p>
                                          <a
                                            href={attachment.dataUrl}
                                            download={attachment.fileName}
                                            className="mt-3 inline-flex rounded-full border border-espresso/15 px-3 py-2 text-xs"
                                          >
                                            Baixar anexo
                                          </a>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                                {request.timelineEvents.length > 0 ? (
                                  <div className="mt-4 rounded-[0.9rem] border border-espresso/10 bg-white/60 p-3">
                                    <p className="text-xs uppercase tracking-[0.22em] text-terracotta">
                                      Timeline da solicitacao
                                    </p>
                                    <div className="mt-3 space-y-3">
                                      {request.timelineEvents.map((event) => (
                                        <div
                                          key={event.id}
                                          className="border-l-2 border-espresso/10 pl-3"
                                        >
                                          <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className="font-medium text-espresso">
                                              {event.title}
                                            </p>
                                            <p className="text-xs text-espresso/55">
                                              {event.createdAt}
                                            </p>
                                          </div>
                                          {event.description ? (
                                            <p className="mt-1 text-sm text-espresso/65">
                                              {event.description}
                                            </p>
                                          ) : null}
                                          {event.attachments.length > 0 ? (
                                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                              {event.attachments.map((attachment) => (
                                                <div
                                                  key={attachment.id}
                                                  className="rounded-[0.9rem] border border-espresso/10 bg-white/70 p-3"
                                                >
                                                  {attachment.mimeType.startsWith("image/") ? (
                                                    <img
                                                      src={attachment.dataUrl}
                                                      alt={attachment.fileName}
                                                      className="mb-3 h-24 w-full rounded-xl object-cover"
                                                    />
                                                  ) : null}
                                                  <p className="text-sm font-medium text-espresso">
                                                    {attachment.fileName}
                                                  </p>
                                                  <a
                                                    href={attachment.dataUrl}
                                                    download={attachment.fileName}
                                                    className="mt-3 inline-flex rounded-full border border-espresso/15 px-3 py-2 text-xs"
                                                  >
                                                    Baixar anexo
                                                  </a>
                                                </div>
                                              ))}
                                            </div>
                                          ) : null}
                                          <p className="mt-1 text-xs text-espresso/55">
                                            {event.actorName ?? event.actorEmail ?? "Sistema"}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                                {activeReturnRequestStatuses.includes(request.status as (typeof activeReturnRequestStatuses)[number]) ? (
                                  <div className="mt-4 rounded-[0.9rem] border border-espresso/10 bg-white/60 p-3">
                                    <TimelineCommentForm
                                      endpoint="/api/customer/return-request-comments"
                                      payload={{ orderId: order.id, requestId: request.id }}
                                      label="Enviar comentario para a equipe"
                                      placeholder="Adicione contexto, atualizacoes ou duvidas sobre esta solicitacao."
                                      submitLabel="Enviar comentario"
                                      successRedirect="/conta?success=return_request_comment_created"
                                      errorRedirect="/conta?error=return_request_comment_failed"
                                    />
                                  </div>
                                ) : null}
                                <p className="mt-1 text-xs text-espresso/60">
                                  Atualizado em {request.updatedAt}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {order.status === "DELIVERED" &&
                      !order.returnRequests.some((request) =>
                        activeReturnRequestStatuses.includes(
                          request.status as (typeof activeReturnRequestStatuses)[number]
                        )
                      ) ? (
                        <CustomerReturnRequestForm
                          orderId={order.id}
                          items={order.items.map((item) => ({
                            id: item.id,
                            name: item.name,
                            variantLabel: item.variantLabel
                          }))}
                        />
                      ) : null}
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
