type AdminFeedbackProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const messages: Record<string, string> = {
  product_created: "Produto criado com sucesso.",
  product_updated: "Produto atualizado com sucesso.",
  product_deleted: "Produto excluido com sucesso.",
  category_created: "Categoria criada com sucesso.",
  category_updated: "Categoria atualizada com sucesso.",
  category_deleted: "Categoria excluida com sucesso.",
  user_created: "Usuario criado com sucesso.",
  user_updated: "Usuario atualizado com sucesso.",
  user_deleted: "Usuario excluido com sucesso.",
  order_updated: "Status do pedido atualizado com sucesso.",
  slug_conflict: "Ja existe um cadastro com este slug. Escolha outro identificador.",
  email_conflict: "Ja existe um usuario com este email.",
  category_has_products:
    "Nao e possivel excluir a categoria porque ela possui produtos vinculados.",
  user_has_orders:
    "Nao e possivel excluir o usuario porque existem pedidos vinculados.",
  insufficient_stock:
    "Nao ha estoque suficiente para concluir esta operacao com os itens escolhidos.",
  resource_not_found: "O registro informado nao foi encontrado.",
  generic_error: "Nao foi possivel concluir a operacao. Revise os dados e tente novamente."
};

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function AdminFeedback({ searchParams }: AdminFeedbackProps) {
  const success = getParamValue(searchParams?.success);
  const error = getParamValue(searchParams?.error);

  if (success && messages[success]) {
    return (
      <div className="rounded-[2rem] border border-moss/20 bg-white/85 p-4 text-sm text-moss shadow-soft">
        {messages[success]}
      </div>
    );
  }

  if (error && messages[error]) {
    return (
      <div className="rounded-[2rem] border border-red-200 bg-white/85 p-4 text-sm text-red-700 shadow-soft">
        {messages[error]}
      </div>
    );
  }

  return null;
}
