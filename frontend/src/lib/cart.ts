export type CartItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl?: string;
  category: string;
  stock: number;
  quantity: number;
};

export type CartProductInput = Omit<CartItem, "quantity">;

export function clampCartQuantity(quantity: number, stock: number) {
  if (!Number.isFinite(quantity)) {
    return 1;
  }

  return Math.max(1, Math.min(Math.trunc(quantity), Math.max(stock, 1)));
}

export function getCartTotals(items: CartItem[]) {
  return items.reduce(
    (acc, item) => {
      acc.items += item.quantity;
      acc.total += item.price * item.quantity;
      return acc;
    },
    { items: 0, total: 0 }
  );
}
