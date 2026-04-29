type OrderEmailItem = {
  name: string;
  quantity: number;
  unitPrice: number;
};

export type OrderEmailPayload = {
  orderId: string;
  customerName: string;
  customerEmail: string;
  status: string;
  createdAt: Date | string;
  total: number;
  subtotal: number;
  shippingCost: number;
  paymentMethod: string;
  shippingMethod: string;
  trackingCode?: string;
  notes?: string;
  shippingAddress: string;
  shippingNumber?: string;
  shippingAddress2?: string;
  shippingNeighborhood?: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  items: OrderEmailItem[];
  storeUrl?: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString("pt-BR");
}

function formatAddress(payload: OrderEmailPayload) {
  return [
    payload.shippingAddress,
    payload.shippingNumber,
    payload.shippingAddress2,
    payload.shippingNeighborhood,
    `${payload.shippingCity}/${payload.shippingState}`,
    `CEP ${payload.shippingPostalCode}`
  ]
    .filter(Boolean)
    .join(", ");
}

function renderItemsText(items: OrderEmailItem[]) {
  return items
    .map((item) => `- ${item.name} | ${item.quantity} x ${formatCurrency(item.unitPrice)}`)
    .join("\n");
}

function renderItemsHtml(items: OrderEmailItem[]) {
  return items
    .map(
      (item) =>
        `<li style="margin-bottom:8px;">${item.name} - ${item.quantity} x ${formatCurrency(item.unitPrice)}</li>`
    )
    .join("");
}

function renderOrdersLink(storeUrl?: string, email?: string) {
  if (!storeUrl || !email) {
    return undefined;
  }

  const sanitizedBase = storeUrl.replace(/\/+$/, "");
  return `${sanitizedBase}/meus-pedidos?email=${encodeURIComponent(email)}`;
}

export function buildOrderCreatedEmail(payload: OrderEmailPayload) {
  const ordersLink = renderOrdersLink(payload.storeUrl, payload.customerEmail);
  const subject = `Pedido recebido - ${payload.orderId}`;
  const text = [
    `Ola, ${payload.customerName}.`,
    "",
    `Recebemos o seu pedido ${payload.orderId} em ${formatDate(payload.createdAt)}.`,
    `Status atual: ${payload.status}`,
    `Pagamento: ${payload.paymentMethod}`,
    `Entrega: ${payload.shippingMethod}`,
    `Endereco: ${formatAddress(payload)}`,
    "",
    "Itens do pedido:",
    renderItemsText(payload.items),
    "",
    `Subtotal: ${formatCurrency(payload.subtotal)}`,
    `Frete: ${formatCurrency(payload.shippingCost)}`,
    `Total: ${formatCurrency(payload.total)}`,
    payload.notes ? `Observacoes: ${payload.notes}` : undefined,
    ordersLink ? `Acompanhe em: ${ordersLink}` : undefined
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;color:#2d241d;line-height:1.6;">
      <h2>Pedido recebido</h2>
      <p>Ola, <strong>${payload.customerName}</strong>.</p>
      <p>Recebemos o seu pedido <strong>${payload.orderId}</strong> em ${formatDate(payload.createdAt)}.</p>
      <p><strong>Status:</strong> ${payload.status}<br />
      <strong>Pagamento:</strong> ${payload.paymentMethod}<br />
      <strong>Entrega:</strong> ${payload.shippingMethod}</p>
      <p><strong>Endereco:</strong> ${formatAddress(payload)}</p>
      <h3>Itens</h3>
      <ul>${renderItemsHtml(payload.items)}</ul>
      <p><strong>Subtotal:</strong> ${formatCurrency(payload.subtotal)}<br />
      <strong>Frete:</strong> ${formatCurrency(payload.shippingCost)}<br />
      <strong>Total:</strong> ${formatCurrency(payload.total)}</p>
      ${payload.notes ? `<p><strong>Observacoes:</strong> ${payload.notes}</p>` : ""}
      ${ordersLink ? `<p><a href="${ordersLink}">Acompanhar pedido</a></p>` : ""}
    </div>
  `;

  return { subject, text, html };
}

export function buildOrderStatusEmail(payload: OrderEmailPayload) {
  const ordersLink = renderOrdersLink(payload.storeUrl, payload.customerEmail);
  const subject = `Atualizacao do pedido - ${payload.orderId}`;
  const trackingLine = payload.trackingCode
    ? `Codigo de rastreio: ${payload.trackingCode}`
    : undefined;
  const text = [
    `Ola, ${payload.customerName}.`,
    "",
    `O pedido ${payload.orderId} foi atualizado.`,
    `Novo status: ${payload.status}`,
    trackingLine,
    `Pagamento: ${payload.paymentMethod}`,
    `Entrega: ${payload.shippingMethod}`,
    `Total do pedido: ${formatCurrency(payload.total)}`,
    ordersLink ? `Acompanhe em: ${ordersLink}` : undefined
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;color:#2d241d;line-height:1.6;">
      <h2>Status do pedido atualizado</h2>
      <p>Ola, <strong>${payload.customerName}</strong>.</p>
      <p>O pedido <strong>${payload.orderId}</strong> foi atualizado.</p>
      <p><strong>Novo status:</strong> ${payload.status}</p>
      ${payload.trackingCode ? `<p><strong>Codigo de rastreio:</strong> ${payload.trackingCode}</p>` : ""}
      <p><strong>Total:</strong> ${formatCurrency(payload.total)}</p>
      ${ordersLink ? `<p><a href="${ordersLink}">Acompanhar pedido</a></p>` : ""}
    </div>
  `;

  return { subject, text, html };
}

export function buildAdminOrderCreatedEmail(payload: OrderEmailPayload) {
  const subject = `Novo pedido recebido - ${payload.orderId}`;
  const text = [
    `Novo pedido: ${payload.orderId}`,
    `Cliente: ${payload.customerName} <${payload.customerEmail}>`,
    `Criado em: ${formatDate(payload.createdAt)}`,
    `Total: ${formatCurrency(payload.total)}`,
    `Pagamento: ${payload.paymentMethod}`,
    `Entrega: ${payload.shippingMethod}`,
    `Endereco: ${formatAddress(payload)}`,
    "",
    "Itens:",
    renderItemsText(payload.items)
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;color:#2d241d;line-height:1.6;">
      <h2>Novo pedido recebido</h2>
      <p><strong>Pedido:</strong> ${payload.orderId}</p>
      <p><strong>Cliente:</strong> ${payload.customerName} &lt;${payload.customerEmail}&gt;</p>
      <p><strong>Total:</strong> ${formatCurrency(payload.total)}</p>
      <p><strong>Pagamento:</strong> ${payload.paymentMethod}<br />
      <strong>Entrega:</strong> ${payload.shippingMethod}</p>
      <p><strong>Endereco:</strong> ${formatAddress(payload)}</p>
      <ul>${renderItemsHtml(payload.items)}</ul>
    </div>
  `;

  return { subject, text, html };
}
